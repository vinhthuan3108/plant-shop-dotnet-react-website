using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public CartController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // 1. Lấy giỏ hàng (GET)
        // [CartController.cs]

        [HttpGet("get-cart/{userId}")]
        public async Task<IActionResult> GetCart(int userId)
        {
            var cart = await _context.TblCarts
                .Include(c => c.TblCartItems)
                    .ThenInclude(ci => ci.Variant)
                        .ThenInclude(v => v.Product) // Lấy thông tin Product để check ngày Sale
                            .ThenInclude(p => p.TblProductImages)
                .Include(c => c.TblCartItems)
                    .ThenInclude(ci => ci.Variant)
                        .ThenInclude(v => v.Image)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return Ok(new List<object>());

            var result = cart.TblCartItems.Select(item => {

                // --- LOGIC TÍNH GIÁ MỚI ---
                var variant = item.Variant;
                var product = item.Variant.Product;
                var now = DateTime.Now;

                // 1. Kiểm tra có giá sale > 0 không
                bool hasSalePrice = variant.SalePrice.HasValue && variant.SalePrice.Value > 0;

                // 2. Kiểm tra ngày khuyến mãi (Nếu sản phẩm có set ngày)
                // Logic: Nếu ngày Start/End có dữ liệu thì phải check, nếu null thì bỏ qua (hoặc coi như luôn active tùy logic của bạn)
                // Ở đây giả sử: Nếu có set ngày thì phải đúng hạn mới được Sale
                bool isDateValid = true;
                if (product.SaleStartDate.HasValue && product.SaleEndDate.HasValue)
                {
                    isDateValid = now >= product.SaleStartDate.Value && now <= product.SaleEndDate.Value;
                }

                // 3. Chốt giá cuối cùng
                // Phải thỏa mãn: Có giá Sale VÀ Giá Sale < Giá Gốc VÀ Còn hạn khuyến mãi
                decimal finalPrice = (hasSalePrice && isDateValid && variant.SalePrice < variant.OriginalPrice)
                                     ? variant.SalePrice.Value
                                     : variant.OriginalPrice;
                // ---------------------------

                return new
                {
                    cartItemId = item.CartItemId,
                    variantId = item.VariantId,
                    productId = variant.ProductId,
                    productName = product.ProductName,
                    variantName = variant.VariantName,

                    // SỬ DỤNG GIÁ ĐÃ TÍNH TOÁN
                    price = finalPrice,

                    originalPrice = variant.OriginalPrice,
                    quantity = item.Quantity,
                    imageUrl = variant.Image?.ImageUrl
                               ?? product.TblProductImages.FirstOrDefault(x => x.IsThumbnail == true)?.ImageUrl
                               ?? product.TblProductImages.FirstOrDefault()?.ImageUrl
                };
            });

            return Ok(result);
        }

        // 2. Thêm vào giỏ (POST)
        [HttpPost("add-to-cart")]
        public async Task<IActionResult> AddToCart([FromBody] AddCartRequest req)
        {
            // Tìm hoặc tạo giỏ hàng
            var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == req.UserId);
            if (cart == null)
            {
                cart = new TblCart { UserId = req.UserId, UpdatedAt = DateTime.Now };
                _context.TblCarts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // Kiểm tra sản phẩm (Variant) đã có trong giỏ chưa
            var cartItem = await _context.TblCartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.VariantId == req.VariantId);

            if (cartItem != null)
            {
                cartItem.Quantity += req.Quantity;
            }
            else
            {
                cartItem = new TblCartItem
                {
                    CartId = cart.CartId,
                    VariantId = req.VariantId, // Lưu VariantId
                    Quantity = req.Quantity
                };
                _context.TblCartItems.Add(cartItem);
            }

            cart.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm thành công" });
        }

        // 3. Xóa sản phẩm (DELETE)
        [HttpDelete("remove-item")]
        public async Task<IActionResult> RemoveItem(int userId, int variantId)
        {
            var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null) return NotFound();

            var cartItem = await _context.TblCartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.VariantId == variantId);

            if (cartItem != null)
            {
                _context.TblCartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
            }
            return Ok(new { message = "Đã xóa sản phẩm" });
        }

        // 4. Cập nhật số lượng (PUT)
        [HttpPut("update-quantity")]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartRequest req)
        {
            var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == req.UserId);
            if (cart == null) return NotFound();

            var cartItem = await _context.TblCartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.VariantId == req.VariantId);

            if (cartItem != null)
            {
                cartItem.Quantity = req.Quantity;
                if (cartItem.Quantity <= 0) _context.TblCartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
            }
            return Ok(new { message = "Cập nhật thành công" });
        }
    }

    // DTOs cập nhật theo VariantId
    public class AddCartRequest
    {
        public int UserId { get; set; }
        public int VariantId { get; set; } // Đổi ProductId -> VariantId
        public int Quantity { get; set; }
    }

    public class UpdateCartRequest
    {
        public int UserId { get; set; }
        public int VariantId { get; set; }
        public int Quantity { get; set; }
    }
}