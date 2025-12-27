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
        [HttpGet("get-cart/{userId}")]
        public async Task<IActionResult> GetCart(int userId)
        {
            var cart = await _context.TblCarts
                .Include(c => c.TblCartItems)
                    .ThenInclude(ci => ci.Variant) // Link tới Variant
                        .ThenInclude(v => v.Product) // Từ Variant lên Product lấy tên/ảnh chung
                            .ThenInclude(p => p.TblProductImages)
                .Include(c => c.TblCartItems)
                    .ThenInclude(ci => ci.Variant)
                        .ThenInclude(v => v.Image) // Lấy ảnh riêng của Variant (nếu có)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return Ok(new List<object>());

            var result = cart.TblCartItems.Select(item => new
            {
                // Thông tin cần thiết cho giỏ hàng
                cartItemId = item.CartItemId,
                variantId = item.VariantId,
                productId = item.Variant.ProductId,

                // Tên hiển thị: Tên cây + Tên biến thể (VD: Cây Bàng - Size Nhỏ)
                productName = item.Variant.Product.ProductName,
                variantName = item.Variant.VariantName,

                // Giá lấy từ Variant
                price = item.Variant.SalePrice ?? item.Variant.OriginalPrice,
                originalPrice = item.Variant.OriginalPrice,

                quantity = item.Quantity,

                // Logic ảnh: Ưu tiên ảnh của Variant -> Ảnh thumbnail Product -> Ảnh đầu tiên
                imageUrl = item.Variant.Image?.ImageUrl
                           ?? item.Variant.Product.TblProductImages.FirstOrDefault(x => x.IsThumbnail == true)?.ImageUrl
                           ?? item.Variant.Product.TblProductImages.FirstOrDefault()?.ImageUrl
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