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

        // 1. Lấy giỏ hàng của User
        [HttpGet("get-cart/{userId}")]
        public async Task<IActionResult> GetCart(int userId)
        {
            // Tìm giỏ hàng của user
            var cart = await _context.TblCarts
                .Include(c => c.TblCartItems)
                .ThenInclude(ci => ci.Product)
                .ThenInclude(p => p.TblProductImages) // Để lấy ảnh
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                return Ok(new List<object>()); // Chưa có giỏ thì trả về rỗng
            }

            // Map dữ liệu để trả về format giống LocalStorage phía React
            var result = cart.TblCartItems.Select(item => new
            {
                productId = item.ProductId,
                productName = item.Product.ProductName,
                price = item.Product.SalePrice ?? item.Product.OriginalPrice, // Ưu tiên giá Sale
                originalPrice = item.Product.OriginalPrice,
                salePrice = item.Product.SalePrice,
                quantity = item.Quantity,
                // Lấy ảnh thumbnail hoặc ảnh đầu tiên
                imageUrl = item.Product.TblProductImages.FirstOrDefault(x => x.IsThumbnail == true)?.ImageUrl
                           ?? item.Product.TblProductImages.FirstOrDefault()?.ImageUrl
            });

            return Ok(result);
        }

        // 2. Thêm vào giỏ hàng (DB)
        [HttpPost("add-to-cart")]
        public async Task<IActionResult> AddToCart([FromBody] AddCartRequest req)
        {
            // Kiểm tra xem User đã có giỏ hàng chưa
            var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == req.UserId);

            if (cart == null)
            {
                // Chưa có thì tạo mới
                cart = new TblCart
                {
                    UserId = req.UserId,
                    UpdatedAt = DateTime.Now
                };
                _context.TblCarts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // Kiểm tra xem sản phẩm đã có trong giỏ chưa
            var cartItem = await _context.TblCartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == req.ProductId);

            if (cartItem != null)
            {
                // Có rồi thì tăng số lượng
                cartItem.Quantity += req.Quantity;
            }
            else
            {
                // Chưa có thì thêm mới
                cartItem = new TblCartItem
                {
                    CartId = cart.CartId,
                    ProductId = req.ProductId,
                    Quantity = req.Quantity
                };
                _context.TblCartItems.Add(cartItem);
            }

            cart.UpdatedAt = DateTime.Now; // Cập nhật thời gian sửa giỏ
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm thành công" });
        }
        // 3. Xóa sản phẩm khỏi giỏ
        [HttpDelete("remove-item")]
        public async Task<IActionResult> RemoveItem(int userId, int productId)
        {
            var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null) return NotFound();

            var cartItem = await _context.TblCartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == productId);

            if (cartItem != null)
            {
                _context.TblCartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
            }
            return Ok(new { message = "Đã xóa sản phẩm" });
        }

        // 4. Cập nhật số lượng
        [HttpPut("update-quantity")]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartRequest req)
        {
            var cart = await _context.TblCarts.FirstOrDefaultAsync(c => c.UserId == req.UserId);
            if (cart == null) return NotFound();

            var cartItem = await _context.TblCartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == req.ProductId);

            if (cartItem != null)
            {
                cartItem.Quantity = req.Quantity;
                if (cartItem.Quantity <= 0)
                {
                    // Nếu số lượng <= 0 thì xóa luôn
                    _context.TblCartItems.Remove(cartItem);
                }
                await _context.SaveChangesAsync();
            }
            return Ok(new { message = "Cập nhật thành công" });
        }
    }

    // Class DTO nhận dữ liệu update
    public class UpdateCartRequest
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}

    // Class để nhận dữ liệu từ Frontend gửi lên
    public class AddCartRequest
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
