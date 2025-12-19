using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public OrdersController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // POST: api/Orders/checkout
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            // 1. Validate cơ bản
            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new { message = "Giỏ hàng trống." });
            }

            // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu (Lỗi ở bước nào là rollback hết)
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // ---------------------------------------------------------
                // BƯỚC 1: KIỂM TRA TỒN KHO (FINAL CHECK) & TÍNH TỔNG TIỀN HÀNG
                // ---------------------------------------------------------
                decimal subTotal = 0;
                var orderDetailsList = new List<TblOrderDetail>();

                foreach (var item in request.Items)
                {
                    var product = await _context.TblProducts.FindAsync(item.ProductId);

                    if (product == null)
                    {
                        return BadRequest(new { message = $"Sản phẩm ID {item.ProductId} không tồn tại." });
                    }

                    // Kiểm tra tồn kho (Đây là chỗ gây ra lỗi hiện tại của bạn)
                    if (product.StockQuantity < item.Quantity)
                    {
                        return BadRequest(new { message = $"Sản phẩm '{product.ProductName}' không đủ hàng. Còn lại: {product.StockQuantity}." });
                    }

                    if (product.IsActive != true || product.IsDeleted == true)
                    {
                        return BadRequest(new { message = $"Sản phẩm '{product.ProductName}' đã ngừng kinh doanh." });
                    }

                    // Lấy giá bán hiện tại (Ưu tiên giá Sale nếu có)
                    decimal price = product.SalePrice ?? product.OriginalPrice;

                    subTotal += price * item.Quantity;

                    // Chuẩn bị dữ liệu chi tiết đơn hàng
                    orderDetailsList.Add(new TblOrderDetail
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        PriceAtTime = price, // Giá bán tại thời điểm mua
                        CostPrice = product.OriginalPrice // Giá gốc (để tính lãi lỗ sau này)
                    });

                    // TRỪ TỒN KHO NGAY LẬP TỨC
                    product.StockQuantity -= item.Quantity;
                }

                // ---------------------------------------------------------
                // BƯỚC 2: TÍNH PHÍ VẬN CHUYỂN (Logic 2.2.2.2)
                // ---------------------------------------------------------
                decimal shippingFee = CalculateShippingFee(request.Province);

                // ---------------------------------------------------------
                // BƯỚC 3: ÁP DỤNG VOUCHER (Logic 2.2.2.3)
                // ---------------------------------------------------------
                decimal discountAmount = 0;
                int? voucherId = null;

                if (!string.IsNullOrEmpty(request.VoucherCode))
                {
                    var voucher = await _context.TblVouchers
                        .FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive == true);

                    if (voucher == null) return BadRequest(new { message = "Mã giảm giá không tồn tại." });

                    if (DateTime.Now < voucher.StartDate || DateTime.Now > voucher.EndDate)
                        return BadRequest("Mã giảm giá đã hết hạn.");

                    if (voucher.UsageLimit.HasValue && voucher.UsageCount >= voucher.UsageLimit)
                        return BadRequest("Mã giảm giá đã hết lượt sử dụng.");

                    if (subTotal < (voucher.MinOrderValue ?? 0))
                        return BadRequest($"Đơn hàng chưa đạt giá trị tối thiểu {voucher.MinOrderValue:N0}đ để dùng mã này.");

                    // Tính tiền giảm
                    if (voucher.DiscountType == "PERCENT") // Giảm theo %
                    {
                        discountAmount = subTotal * (voucher.DiscountValue / 100);
                        // Kiểm tra giảm tối đa
                        if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount)
                        {
                            discountAmount = voucher.MaxDiscountAmount.Value;
                        }
                    }
                    else // Giảm tiền mặt (FIXED)
                    {
                        discountAmount = voucher.DiscountValue;
                    }

                    // Cập nhật lượt dùng voucher
                    voucher.UsageCount = (voucher.UsageCount ?? 0) + 1;
                    voucherId = voucher.VoucherId;
                }

                // ---------------------------------------------------------
                // BƯỚC 4: TẠO ĐƠN HÀNG (Logic 2.2.2.5)
                // ---------------------------------------------------------
                decimal totalAmount = subTotal + shippingFee - discountAmount;
                if (totalAmount < 0) totalAmount = 0;

                var order = new TblOrder
                {
                    UserId = request.UserId, // Null nếu khách vãng lai
                    OrderDate = DateTime.Now,
                    RecipientName = request.RecipientName,
                    RecipientPhone = request.RecipientPhone,
                    ShippingAddress = request.ShippingAddress + ", " + request.District + ", " + request.Province,

                    SubTotal = subTotal,
                    ShippingFee = shippingFee,
                    DiscountAmount = discountAmount,
                    TotalAmount = totalAmount,

                    VoucherId = voucherId,
                    Note = request.Note,

                    // Trạng thái ban đầu
                    OrderStatus = "Pending", // Chờ xác nhận
                    PaymentStatus = "Unpaid" // Chưa thanh toán
                };

                _context.TblOrders.Add(order);
                await _context.SaveChangesAsync(); // Lưu để lấy OrderId

                // Lưu chi tiết đơn hàng
                foreach (var detail in orderDetailsList)
                {
                    detail.OrderId = order.OrderId;
                    _context.TblOrderDetails.Add(detail);
                }

                // ---------------------------------------------------------
                // BƯỚC 5: DỌN DẸP GIỎ HÀNG (Nếu là thành viên)
                // ---------------------------------------------------------
                if (request.UserId.HasValue)
                {
                    var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == request.UserId);
                    if (cart != null)
                    {
                        var cartItemsToRemove = _context.TblCartItems.Where(ci => ci.CartId == cart.CartId);
                        _context.TblCartItems.RemoveRange(cartItemsToRemove);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Trả về kết quả
                return Ok(new
                {
                    Message = "Đặt hàng thành công",
                    OrderId = order.OrderId,
                    TotalAmount = totalAmount,
                    PaymentMethod = request.PaymentMethod
                    // Ở phần sau: Nếu PaymentMethod = "PAYOS", Frontend sẽ dùng OrderId này để gọi API lấy mã QR
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Lỗi server: " + ex.Message);
            }
        }

        // Hàm phụ trợ tính phí ship (Logic 2.2.2.2)
        private decimal CalculateShippingFee(string province)
        {
            // Logic đơn giản demo. Thực tế có thể lưu bảng cấu hình phí ship trong DB.
            if (string.IsNullOrEmpty(province)) return 5000; // Mặc định

            string p = province.ToLower();
            if (p.Contains("hồ chí minh") || p.Contains("sài gòn"))
            {
                return 3000; // Nội thành (Giả sử Shop ở HCM)
            }
            // Các tỉnh lân cận
            if (p.Contains("bình dương") || p.Contains("đồng nai") || p.Contains("long an"))
            {
                return 4000;
            }

            return 5000; // Các tỉnh còn lại
        }

        // API phụ: Validate Voucher (Để Frontend gọi check trước khi bấm Đặt hàng - Logic 2.2.2.3)
        [HttpGet("validate-voucher")]
        public async Task<IActionResult> ValidateVoucher(string code, decimal orderValue)
        {
            var voucher = await _context.TblVouchers
                       .FirstOrDefaultAsync(v => v.Code == code && v.IsActive == true);

            if (voucher == null) return BadRequest("Mã không tồn tại.");
            if (DateTime.Now < voucher.StartDate || DateTime.Now > voucher.EndDate) return BadRequest("Mã hết hạn.");
            if (voucher.UsageLimit.HasValue && voucher.UsageCount >= voucher.UsageLimit) return BadRequest("Mã hết lượt dùng.");
            if (orderValue < (voucher.MinOrderValue ?? 0)) return BadRequest($"Đơn hàng cần tối thiểu {voucher.MinOrderValue:N0}đ.");

            // Tính thử số tiền giảm
            decimal discount = 0;
            if (voucher.DiscountType == "PERCENT")
            {
                discount = orderValue * (voucher.DiscountValue / 100);
                if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount)
                    discount = voucher.MaxDiscountAmount.Value;
            }
            else
            {
                discount = voucher.DiscountValue;
            }

            return Ok(new
            {
                Valid = true,
                DiscountAmount = discount,
                Code = code
            });
        }
        [HttpGet("admin/list")]
        public async Task<IActionResult> GetOrdersAdmin(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null, // Tìm theo Tên, SĐT, Mã đơn
            [FromQuery] string? status = null, // Filter theo trạng thái
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var query = _context.TblOrders.AsQueryable();

            // Lọc theo từ khóa (Mã đơn OR Tên OR SĐT)
            if (!string.IsNullOrEmpty(search))
            {
                // Thử parse search sang int để tìm theo ID
                bool isNumber = int.TryParse(search, out int orderId);
                if (isNumber)
                {
                    query = query.Where(o => o.OrderId == orderId || o.RecipientPhone.Contains(search));
                }
                else
                {
                    query = query.Where(o => o.RecipientName.Contains(search) || o.RecipientPhone.Contains(search));
                }
            }

            // Lọc theo trạng thái
            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                query = query.Where(o => o.OrderStatus == status);
            }

            // Lọc theo ngày
            if (fromDate.HasValue)
                query = query.Where(o => o.OrderDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(o => o.OrderDate <= toDate.Value.AddDays(1)); // +1 để lấy hết ngày cuối

            // Sắp xếp mới nhất lên đầu
            var totalItems = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new OrderAdminListDto
                {
                    OrderId = o.OrderId,
                    CustomerName = o.RecipientName,
                    Phone = o.RecipientPhone,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount ?? 0,
                    OrderStatus = o.OrderStatus,
                    PaymentStatus = o.PaymentStatus
                })
                .ToListAsync();

            return Ok(new
            {
                Data = orders,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }

        // 2. Lấy chi tiết đơn hàng
        [HttpGet("admin/detail/{id}")]
        public async Task<IActionResult> GetOrderDetailAdmin(int id)
        {
            var order = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Product) // Join bảng Product để lấy tên
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            var result = new OrderAdminDetailDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                OrderStatus = order.OrderStatus,
                PaymentStatus = order.PaymentStatus,
                RecipientName = order.RecipientName,
                RecipientPhone = order.RecipientPhone,
                ShippingAddress = order.ShippingAddress,
                Note = order.Note,
                SubTotal = order.SubTotal,
                ShippingFee = order.ShippingFee,
                DiscountAmount = order.DiscountAmount,
                TotalAmount = order.TotalAmount,
                Items = order.TblOrderDetails.Select(d => new OrderDetailDto
                {
                    ProductName = d.Product.ProductName,
                    Size = d.Product.Size, // Lấy size từ Product
                    Quantity = d.Quantity,
                    Price = d.PriceAtTime,
                    Total = d.Quantity * d.PriceAtTime
                }).ToList()
            };

            return Ok(result);
        }

        // 3. Cập nhật trạng thái đơn hàng (QUAN TRỌNG: Logic hoàn kho)
        [HttpPut("admin/update-status/{id}")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusRequest req)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.TblOrders
                    .Include(o => o.TblOrderDetails) // Phải include để lấy list sản phẩm nếu cần hoàn kho
                    .FirstOrDefaultAsync(o => o.OrderId == id);

                if (order == null) return NotFound("Đơn hàng không tồn tại");

                string oldStatus = order.OrderStatus;
                string newStatus = req.NewStatus;

                // Không cho phép đổi nếu đơn đã Hoàn thành hoặc Đã hủy (Tùy nghiệp vụ, ở đây làm chặt chẽ)
                if (oldStatus == "Cancelled" || oldStatus == "Completed")
                {
                    // return BadRequest("Không thể thay đổi trạng thái của đơn đã Hoàn thành hoặc Đã hủy.");
                    // Mở rộng: Admin có thể reopen đơn hủy, nhưng logic sẽ phức tạp hơn. Tạm thời chặn.
                }

                // LOGIC HOÀN KHO KHI HỦY ĐƠN
                if (newStatus == "Cancelled" && oldStatus != "Cancelled")
                {
                    foreach (var item in order.TblOrderDetails)
                    {
                        var product = await _context.TblProducts.FindAsync(item.ProductId);
                        if (product != null)
                        {
                            // Cộng lại số lượng tồn kho
                            product.StockQuantity = (product.StockQuantity ?? 0) + item.Quantity;
                        }
                    }
                }

                // Cập nhật trạng thái mới
                order.OrderStatus = newStatus;

                // Nếu Completed thì set PaymentStatus = Paid (Nếu chưa)
                if (newStatus == "Completed" && order.PaymentStatus == "Unpaid")
                {
                    order.PaymentStatus = "Paid";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = $"Đã cập nhật trạng thái từ {oldStatus} sang {newStatus}" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Lỗi cập nhật: " + ex.Message);
            }
        }
    }
}