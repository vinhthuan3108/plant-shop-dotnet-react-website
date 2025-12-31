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
            // 1. Validate đầu vào
            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new { message = "Giỏ hàng trống." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // ---------------------------------------------------------
                // BƯỚC 1: XỬ LÝ SẢN PHẨM & TÍNH TỔNG TIỀN (LOGIC VARIANTS)
                // ---------------------------------------------------------
                decimal subTotal = 0;
                var orderDetailsList = new List<TblOrderDetail>();

                foreach (var item in request.Items)
                {
                    // Lấy thông tin Biến thể + Sản phẩm cha
                    var variant = await _context.TblProductVariants
                        .Include(v => v.Product)
                        .FirstOrDefaultAsync(v => v.VariantId == item.VariantId);

                    if (variant == null)
                    {
                        return BadRequest(new { message = $"Sản phẩm (Mã loại: {item.VariantId}) không tồn tại." });
                    }

                    // Kiểm tra trạng thái sản phẩm cha (Ngừng kinh doanh?)
                    if (variant.Product.IsActive != true || variant.Product.IsDeleted == true)
                    {
                        return BadRequest(new { message = $"Sản phẩm '{variant.Product.ProductName}' đang tạm ngưng bán." });
                    }

                    // Kiểm tra tồn kho của Biến thể
                    if ((variant.StockQuantity ?? 0) < item.Quantity)
                    {
                        return BadRequest(new { message = $"Phân loại '{variant.VariantName}' của '{variant.Product.ProductName}' không đủ hàng. Còn lại: {variant.StockQuantity}." });
                    }

                    // Lấy giá: Ưu tiên giá Sale của biến thể -> Giá gốc biến thể
                    decimal price = variant.OriginalPrice; // Mặc định lấy giá gốc

                    // 1. Kiểm tra có giá Sale > 0 không
                    bool hasSale = variant.SalePrice.HasValue && variant.SalePrice.Value > 0;

                    // 2. Kiểm tra hạn khuyến mãi (Nếu sản phẩm có cài đặt ngày)
                    bool isDateValid = true;
                    if (variant.Product.SaleStartDate.HasValue && variant.Product.SaleEndDate.HasValue)
                    {
                        var now = DateTime.Now;
                        isDateValid = now >= variant.Product.SaleStartDate.Value && now <= variant.Product.SaleEndDate.Value;
                    }

                    // 3. Chốt giá: Nếu có Sale hợp lệ và rẻ hơn giá gốc thì lấy
                    if (hasSale && isDateValid && variant.SalePrice.Value < variant.OriginalPrice)
                    {
                        price = variant.SalePrice.Value;
                    }

                    subTotal += price * item.Quantity;

                    // Tạo chi tiết đơn hàng
                    orderDetailsList.Add(new TblOrderDetail
                    {
                        VariantId = item.VariantId,
                        ProductName = variant.Product.ProductName, // Snapshot tên SP
                        VariantName = variant.VariantName,         // Snapshot tên loại

                        Quantity = item.Quantity,
                        PriceAtTime = price,
                        CostPrice = variant.OriginalPrice
                    });

                    // TRỪ TỒN KHO BIẾN THỂ
                    variant.StockQuantity -= item.Quantity;
                }

                // ---------------------------------------------------------
                // BƯỚC 2: TÍNH PHÍ VẬN CHUYỂN
                // ---------------------------------------------------------
                decimal shippingFee = CalculateShippingFee(request.Province);

                // ---------------------------------------------------------
                // BƯỚC 3: ÁP DỤNG VOUCHER
                // ---------------------------------------------------------
                decimal discountAmount = 0;
                int? voucherId = null;

                if (!string.IsNullOrEmpty(request.VoucherCode))
                {
                    var voucher = await _context.TblVouchers
                        .FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive == true);

                    // Logic check voucher (Hạn sử dụng)
                    if (voucher != null && DateTime.Now >= voucher.StartDate && DateTime.Now <= voucher.EndDate)
                    {
                        if (subTotal >= (voucher.MinOrderValue ?? 0))
                        {
                            if (voucher.DiscountType == "PERCENT")
                            {
                                discountAmount = subTotal * (voucher.DiscountValue / 100);
                                if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount)
                                    discountAmount = voucher.MaxDiscountAmount.Value;
                            }
                            else // Fixed amount
                            {
                                discountAmount = voucher.DiscountValue;
                            }

                            // Cập nhật số lần dùng
                            voucher.UsageCount = (voucher.UsageCount ?? 0) + 1;
                            voucherId = voucher.VoucherId;
                        }
                    }
                }

                // ---------------------------------------------------------
                // BƯỚC 4: TẠO ĐƠN HÀNG (TBLORDERS)
                // ---------------------------------------------------------
                decimal totalAmount = subTotal + shippingFee - discountAmount;
                if (totalAmount < 0) totalAmount = 0;

                var order = new TblOrder
                {
                    UserId = request.UserId,
                    OrderDate = DateTime.Now,
                    RecipientName = request.RecipientName,
                    RecipientPhone = request.RecipientPhone,
                    ShippingAddress = $"{request.ShippingAddress}, {request.District}, {request.Province}",

                    SubTotal = subTotal,
                    ShippingFee = shippingFee,
                    DiscountAmount = discountAmount,
                    TotalAmount = totalAmount,

                    VoucherId = voucherId,
                    Note = request.Note,

                    OrderStatus = "Chờ xác nhận", // Mặc định: Chờ xác nhận

                    // --- CẬP NHẬT MỚI ---
                    PaymentMethod = request.PaymentMethod, // Lưu phương thức (COD/PayOS...)
                    PaymentStatus = "Chưa thanh toán"               // Mặc định là Chưa thanh toán
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
                // BƯỚC 5: XÓA GIỎ HÀNG (Nếu user đã đăng nhập)
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

                return Ok(new
                {
                    Message = "Đặt hàng thành công",
                    OrderId = order.OrderId,
                    TotalAmount = totalAmount,
                    PaymentMethod = request.PaymentMethod // Trả về để Frontend biết đường xử lý tiếp
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Lỗi server: " + ex.Message);
            }
        }

        private decimal CalculateShippingFee(string province)
        {
            if (string.IsNullOrEmpty(province)) return 30000;
            string p = province.ToLower();
            if (p.Contains("hồ chí minh") || p.Contains("sài gòn")) return 15000;
            return 30000;
        }

        // --- CÁC API KHÁC CHO ADMIN & USER ---

        // GET: api/Orders/admin/list
        // GET: api/Orders/admin/list
        // GET: api/Orders/admin/list
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
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null
        )
        {
            var query = _context.TblOrders.AsQueryable();

            // 1. Lọc cơ bản (Status, Date, Search) - Code cũ giữ nguyên
            if (!string.IsNullOrEmpty(status)) query = query.Where(o => o.OrderStatus == status);
            if (fromDate.HasValue) query = query.Where(o => o.OrderDate >= fromDate.Value.Date);
            if (toDate.HasValue)
            {
                var nextDay = toDate.Value.Date.AddDays(1);
                query = query.Where(o => o.OrderDate < nextDay);
            }
            if (!string.IsNullOrEmpty(search))
            {
                string s = search.ToLower().Trim();
                query = query.Where(o =>
                    o.OrderId.ToString().Contains(s) ||
                    (o.RecipientName != null && o.RecipientName.ToLower().Contains(s)) ||
                    (o.RecipientPhone != null && o.RecipientPhone.Contains(s))
                );
            }

            // --- TÍNH MAX PRICE TRƯỚC KHI LỌC GIÁ ---
            // Để thanh trượt luôn hiển thị được giá trị lớn nhất của toàn bộ danh sách (theo bộ lọc status/search hiện tại)
            decimal maxTotalAmount = 0;
            if (await query.AnyAsync())
            {
                maxTotalAmount = await query.MaxAsync(o => o.TotalAmount ?? 0);
            }
            // ----------------------------------------

            // 2. Lọc theo khoảng giá (nếu có request từ Slider)
            if (minPrice.HasValue) query = query.Where(o => o.TotalAmount >= minPrice.Value);
            if (maxPrice.HasValue) query = query.Where(o => o.TotalAmount <= maxPrice.Value);

            // 3. Phân trang & Trả về
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
                    PaymentStatus = o.PaymentStatus,
                    PaymentMethod = o.PaymentMethod
                })
                .ToListAsync();

            return Ok(new
            {
                Data = orders,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                MaxPrice = maxTotalAmount // <--- TRẢ VỀ GIÁ TRỊ LỚN NHẤT
            });
        }

        // GET: api/Orders/admin/detail/5
        // GET: api/Orders/admin/detail/5
        [HttpGet("admin/detail/{id}")]
        public async Task<IActionResult> GetOrderDetailAdmin(int id)
        {
            var order = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Variant) // Include Variant
                        .ThenInclude(v => v.Product) // Include Product cha
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            // Map data trả về (Cập nhật thêm các trường mới)
            var result = new
            {
                order.OrderId,
                order.OrderDate,
                order.OrderStatus,

                // --- THÊM CÁC TRƯỜNG NÀY ---
                order.PaymentStatus,     // Trạng thái thanh toán (Paid/Unpaid)
                order.PaymentMethod,     // Phương thức (COD/PayOS...)
                order.Note,              // Ghi chú đơn hàng
                order.SubTotal,          // Tiền hàng
                order.ShippingFee,       // Phí ship
                order.DiscountAmount,    // Giảm giá
                                         // ---------------------------

                order.RecipientName,
                order.RecipientPhone,
                order.ShippingAddress,
                order.TotalAmount,       // Tổng cộng cuối cùng

                Items = order.TblOrderDetails.Select(d => new
                {
                    // Lấy tên từ snapshot nếu có, nếu không lấy từ quan hệ
                    ProductName = d.ProductName ?? d.Variant.Product.ProductName,
                    VariantName = d.VariantName ?? d.Variant.VariantName,
                    Quantity = d.Quantity,
                    Price = d.PriceAtTime,
                    Total = d.Quantity * d.PriceAtTime
                })
            };

            return Ok(result);
        }

        // PUT: api/Orders/admin/update-status/5
        [HttpPut("admin/update-status/{id}")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusRequest req)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.TblOrders
                    .Include(o => o.TblOrderDetails)
                    .FirstOrDefaultAsync(o => o.OrderId == id);

                if (order == null) return NotFound();

                // Logic Hoàn kho khi Hủy đơn
                if (req.NewStatus == "Cancelled" && order.OrderStatus != "Cancelled")
                {
                    foreach (var item in order.TblOrderDetails)
                    {
                        var variant = await _context.TblProductVariants.FindAsync(item.VariantId);
                        if (variant != null)
                        {
                            variant.StockQuantity = (variant.StockQuantity ?? 0) + item.Quantity; // Cộng lại kho cho Variant
                        }
                    }
                }

                order.OrderStatus = req.NewStatus;
                if (req.NewStatus == "Completed") order.PaymentStatus = "Paid";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { Message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/Orders/user/1
        // GET: api/Orders/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetOrdersByUser(int userId)
        {
            var orders = await _context.TblOrders
                .Where(o => o.UserId == userId)
                .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.TblProductImages)
                .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Variant)
                        .ThenInclude(v => v.Image)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.OrderStatus,
                    o.PaymentStatus,
                    o.TotalAmount,

                    // --- THÊM CÁC TRƯỜNG CHI TIẾT CHO MODAL ---
                    o.RecipientName,
                    o.RecipientPhone,
                    o.ShippingAddress,
                    o.Note,
                    SubTotal = o.SubTotal ?? 0,
                    ShippingFee = o.ShippingFee ?? 0,
                    DiscountAmount = o.DiscountAmount ?? 0,
                    // ------------------------------------------

                    Items = o.TblOrderDetails.Select(od => new
                    {
                        ProductName = od.ProductName ?? od.Variant.Product.ProductName,
                        VariantName = od.VariantName ?? od.Variant.VariantName, // Lấy tên phân loại

                        ProductImage = od.Variant.Image != null ? od.Variant.Image.ImageUrl :
                                       (od.Variant.Product.TblProductImages.FirstOrDefault(x => x.IsThumbnail == true) != null
                                       ? od.Variant.Product.TblProductImages.FirstOrDefault(x => x.IsThumbnail == true).ImageUrl
                                       : od.Variant.Product.TblProductImages.FirstOrDefault().ImageUrl),

                        Quantity = od.Quantity,
                        Price = od.PriceAtTime
                    }).ToList()
                })
                .ToListAsync();

            return Ok(orders);
        }

        // DELETE: api/Orders/admin/delete/5
        [HttpDelete("admin/delete/{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.TblOrders.FindAsync(id);
            if (order == null) return NotFound();

            // Xóa cứng (Cascade sẽ tự xóa OrderDetails nếu DB cấu hình đúng,
            // hoặc EF Core tự xử lý nếu load order kèm details)
            _context.TblOrders.Remove(order);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa đơn hàng" });
        }
    }
}