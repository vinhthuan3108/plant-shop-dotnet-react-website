using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Services;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IShippingCalculatorService _shippingService;
        public OrdersController(DbplantShopThuanCuongContext context, IShippingCalculatorService shippingService)
        {
            _context = context;
            _shippingService = shippingService;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new { message = "Giỏ hàng trống." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                  //xử lý sp + tỉnh tổng tiền
                decimal subTotal = 0;
                decimal totalWeight = 0; 
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

                    // Kiểm tra trạng thái sản phẩm cha
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
                    decimal price = variant.OriginalPrice; 

                    bool hasSale = variant.SalePrice.HasValue && variant.SalePrice.Value > 0;

                    //Kiểm tra hạn khuyến mãi (Nếu sản phẩm có cài đặt ngày)
                    bool isDateValid = true;
                    if (variant.Product.SaleStartDate.HasValue && variant.Product.SaleEndDate.HasValue)
                    {
                        var now = DateTime.Now;
                        isDateValid = now >= variant.Product.SaleStartDate.Value && now <= variant.Product.SaleEndDate.Value;
                    }

                    //Chốt giá: Nếu có Sale hợp lệ và rẻ hơn giá gốc thì lấy
                    if (hasSale && isDateValid && variant.SalePrice.Value < variant.OriginalPrice)
                    {
                        price = variant.SalePrice.Value;
                    }

                    subTotal += price * item.Quantity;

                    //tính tổng cân nặng
                    totalWeight += (variant.Weight) * item.Quantity;

                    orderDetailsList.Add(new TblOrderDetail
                    {
                        VariantId = item.VariantId,
                        ProductName = variant.Product.ProductName, 
                        VariantName = variant.VariantName,         

                        Quantity = item.Quantity,
                        PriceAtTime = price,
                        CostPrice = variant.OriginalPrice
                    });

                    variant.StockQuantity -= item.Quantity;
                }

                //tính phí vận chuyển
                string customerProvCode = request.ProvinceCode ?? "";

                decimal shippingFee = await _shippingService.CalculateShippingFeeAsync(customerProvCode, totalWeight);

                //áp dụng voucher
                decimal discountAmount = 0;
                int? voucherId = null;

                if (!string.IsNullOrEmpty(request.VoucherCode))
                {
                    var voucher = await _context.TblVouchers
                        .FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive == true);

                    //check voucher(Hạn sử dụng)
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
                            else 
                            {
                                discountAmount = voucher.DiscountValue;
                            }

                            //Cập nhật số lần dùng
                            voucher.UsageCount = (voucher.UsageCount ?? 0) + 1;
                            voucherId = voucher.VoucherId;
                        }
                    }
                }

                //tạo đơn hàng
                decimal totalAmount = subTotal + shippingFee - discountAmount;
                if (totalAmount < 0) totalAmount = 0;

                var order = new TblOrder
                {
                    UserId = request.UserId,
                    OrderDate = DateTime.Now,
                    RecipientName = request.RecipientName,
                    RecipientPhone = request.RecipientPhone,
                    ShippingAddress = $"{request.ShippingAddress}, {request.Ward}, {request.District}, {request.Province}",
                    SubTotal = subTotal,
                    ShippingFee = shippingFee,
                    DiscountAmount = discountAmount,
                    TotalAmount = totalAmount,

                    VoucherId = voucherId,
                    Note = request.Note,

                    OrderStatus = "Chờ xác nhận", 

                    PaymentMethod = request.PaymentMethod, 
                    PaymentStatus = "Chưa thanh toán"               
                };

                _context.TblOrders.Add(order);
                await _context.SaveChangesAsync(); // Lưu để lấy OrderId

                // Lưu chi tiết đơn hàng
                foreach (var detail in orderDetailsList)
                {
                    detail.OrderId = order.OrderId;
                    _context.TblOrderDetails.Add(detail);
                }

                //xóa giỏ hàng
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
                    PaymentMethod = request.PaymentMethod 
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Lỗi server: " + ex.Message);
            }
        }

        [HttpPost("calculate-fee")]
        public async Task<IActionResult> CalculateShippingFeePreview([FromBody] ShippingFeeRequest request)
        {
            try
            {
                // 1. Nếu chưa có mã tỉnh, trả về 0
                if (string.IsNullOrEmpty(request.ProvinceCode))
                {
                    return Ok(new { ShippingFee = 0 });
                }

                decimal totalWeight = 0;

                //Tính tổng cân nặng
                if (request.Items != null && request.Items.Count > 0)
                {

                    var variantIds = request.Items.Select(i => i.VariantId).ToList();

                    var variants = await _context.TblProductVariants
                        .Where(v => variantIds.Contains(v.VariantId))
                        .ToListAsync();

                    foreach (var item in request.Items)
                    {
                        var variant = variants.FirstOrDefault(v => v.VariantId == item.VariantId);
                        if (variant != null)
                        {

                            totalWeight += (variant.Weight) * item.Quantity;
                        }
                    }
                }
               
                decimal fee = await _shippingService.CalculateShippingFeeAsync(request.ProvinceCode, totalWeight);
                return Ok(new { ShippingFee = fee });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("validate-voucher")]
        public async Task<IActionResult> ValidateVoucher(string code, decimal orderValue)
        {
            var voucher = await _context.TblVouchers
                       .FirstOrDefaultAsync(v => v.Code == code && v.IsActive == true);

            if (voucher == null) return BadRequest("Mã không tồn tại.");
            if (DateTime.Now < voucher.StartDate || DateTime.Now > voucher.EndDate) return BadRequest("Mã hết hạn.");
            if (voucher.UsageLimit.HasValue && voucher.UsageCount >= voucher.UsageLimit) return BadRequest("Mã hết lượt dùng.");
            if (orderValue < (voucher.MinOrderValue ?? 0)) return BadRequest($"Đơn hàng cần tối thiểu {voucher.MinOrderValue:N0}đ.");


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

            // 1. Lọc cơ bản (Status, Date, Search
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

            // 
            // tính maxprice trước khi lọc để thanh trượt luôn hiển thị được giá trị lớn nhất của toàn bộ danh sách
            decimal maxTotalAmount = 0;
            if (await query.AnyAsync())
            {
                maxTotalAmount = await query.MaxAsync(o => o.TotalAmount ?? 0);
            }


            // 2. Lọc theo khoảng giá (nếu cótừ Slider)
            if (minPrice.HasValue) query = query.Where(o => o.TotalAmount >= minPrice.Value);
            if (maxPrice.HasValue) query = query.Where(o => o.TotalAmount <= maxPrice.Value);

            //Phân trang & Trả về
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
                MaxPrice = maxTotalAmount 
            });
        }

        [HttpGet("admin/detail/{id}")]
        public async Task<IActionResult> GetOrderDetailAdmin(int id)
        {
            var order = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Variant) 
                        .ThenInclude(v => v.Product) 
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            var result = new
            {
                order.OrderId,
                order.OrderDate,
                order.OrderStatus,

                order.PaymentStatus,     
                order.PaymentMethod,     
                order.Note,              
                order.SubTotal,          
                order.ShippingFee,       
                order.DiscountAmount,    


                order.RecipientName,
                order.RecipientPhone,
                order.ShippingAddress,
                order.TotalAmount,       

                Items = order.TblOrderDetails.Select(d => new
                {
                    ProductName = d.ProductName ?? d.Variant.Product.ProductName,
                    VariantName = d.VariantName ?? d.Variant.VariantName,
                    Quantity = d.Quantity,
                    Price = d.PriceAtTime,
                    Total = d.Quantity * d.PriceAtTime
                })
            };

            return Ok(result);
        }

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

                //Hoàn kho khi Hủy đơn
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

                    o.RecipientName,
                    o.RecipientPhone,
                    o.ShippingAddress,
                    o.Note,
                    SubTotal = o.SubTotal ?? 0,
                    ShippingFee = o.ShippingFee ?? 0,
                    DiscountAmount = o.DiscountAmount ?? 0,


                    Items = o.TblOrderDetails.Select(od => new
                    {
                        ProductName = od.ProductName ?? od.Variant.Product.ProductName,
                        VariantName = od.VariantName ?? od.Variant.VariantName, 

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

        [HttpDelete("admin/delete/{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.TblOrders.FindAsync(id);
            if (order == null) return NotFound();

            _context.TblOrders.Remove(order);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa đơn hàng" });
        }
    }
}