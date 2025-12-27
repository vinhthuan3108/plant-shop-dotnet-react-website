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
                    decimal price = variant.SalePrice ?? variant.OriginalPrice;

                    subTotal += price * item.Quantity;

                    // Tạo chi tiết đơn hàng
                    orderDetailsList.Add(new TblOrderDetail
                    {
                        VariantId = item.VariantId, // Lưu VariantId
                        // Lưu Snapshot Tên để giữ lịch sử nếu Admin đổi tên sau này
                        ProductName = variant.Product.ProductName,
                        VariantName = variant.VariantName,

                        Quantity = item.Quantity,
                        PriceAtTime = price,
                        CostPrice = variant.OriginalPrice // Lưu giá vốn (nếu cần tính lãi)
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

                    // Logic check voucher (Hạn sử dụng, Số lượng, Giá trị tối thiểu...)
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

                    OrderStatus = "Pending",
                    PaymentStatus = "Unpaid"
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
                        // Xóa các item trong giỏ tương ứng với user
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
                    PaymentMethod = request.PaymentMethod
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
        [HttpGet("admin/list")]
        public async Task<IActionResult> GetOrdersAdmin([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.TblOrders.OrderByDescending(o => o.OrderDate).AsQueryable();
            var totalItems = await query.CountAsync();
            var orders = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return Ok(new { Data = orders, TotalItems = totalItems, TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize) });
        }

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

            // Map data trả về
            var result = new
            {
                order.OrderId,
                order.OrderDate,
                order.OrderStatus,
                order.RecipientName,
                order.RecipientPhone,
                order.ShippingAddress,
                order.TotalAmount,
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