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
                return BadRequest("Giỏ hàng trống.");
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
                        return BadRequest($"Sản phẩm ID {item.ProductId} không tồn tại.");
                    }

                    // Kiểm tra tồn kho
                    if (product.StockQuantity < item.Quantity)
                    {
                        return BadRequest($"Sản phẩm '{product.ProductName}' không đủ hàng. Còn lại: {product.StockQuantity}.");
                    }

                    if (product.IsActive != true || product.IsDeleted == true)
                    {
                        return BadRequest($"Sản phẩm '{product.ProductName}' đã ngừng kinh doanh.");
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

                    if (voucher == null) return BadRequest("Mã giảm giá không tồn tại.");

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
            if (string.IsNullOrEmpty(province)) return 50000; // Mặc định

            string p = province.ToLower();
            if (p.Contains("hồ chí minh") || p.Contains("sài gòn"))
            {
                return 30000; // Nội thành (Giả sử Shop ở HCM)
            }
            // Các tỉnh lân cận
            if (p.Contains("bình dương") || p.Contains("đồng nai") || p.Contains("long an"))
            {
                return 40000;
            }

            return 50000; // Các tỉnh còn lại
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
    }
}