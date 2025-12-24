using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblProductsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IWebHostEnvironment _environment;

        public TblProductsController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // 1. GET: api/TblProducts (Lấy toàn bộ - Dùng cho Admin/Home)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblProduct>>> GetTblProducts()
        {
            return await _context.TblProducts
                                 .Include(p => p.Category)
                                 .Include(p => p.TblProductImages)
                                 .OrderByDescending(p => p.CreatedAt)
                                 .ToListAsync();
        }

        // ==================================================================
        // 2. QUAN TRỌNG: ĐƯA HÀM "SHOP" LÊN TRƯỚC HÀM "ID"
        // GET: api/TblProducts/shop
        // ==================================================================
        [HttpGet("shop")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductsForShop(int? categoryId)
        {
            var query = _context.TblProducts
                .Include(p => p.TblProductImages)
                .Where(p => p.IsActive == true && p.IsDeleted == false);

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // Trả về dữ liệu đã chọn lọc (giống Homepage)
            var products = await query.Select(p => new
            {
                p.ProductId,
                p.ProductName,
                p.OriginalPrice,
                p.SalePrice,
                // Lấy ảnh thumbnail
                Thumbnail = p.TblProductImages
                            .Where(img => img.IsThumbnail == true)
                            .Select(img => img.ImageUrl)
                            .FirstOrDefault()
                            ?? p.TblProductImages.Select(img => img.ImageUrl).FirstOrDefault(),
                p.CategoryId
            }).ToListAsync();

            return Ok(products);
        }

        // ==================================================================
        // 3. HÀM LẤY THEO ID PHẢI ĐỂ DƯỚI CÙNG (Để tránh nhận nhầm chữ "shop" là ID)
        // GET: api/TblProducts/5
        // ==================================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<TblProduct>> GetTblProduct(int id)
        {
            var tblProduct = await _context.TblProducts
                                           .Include(p => p.TblProductImages)
                                           .Include(p => p.Category)
                                           .FirstOrDefaultAsync(p => p.ProductId == id);

            if (tblProduct == null) return NotFound();

            return tblProduct;
        }

        // ... CÁC HÀM KHÁC (PUT, POST, DELETE) GIỮ NGUYÊN Ở DƯỚI ...

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblProduct(int id, TblProduct tblProduct)
        {
            // (Giữ nguyên code hàm Put của bạn ở đây)
            if (id != tblProduct.ProductId) return BadRequest();
            // ... logic xử lý ...
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<TblProduct>> PostTblProduct(TblProduct tblProduct)
        {
            // (Giữ nguyên code hàm Post của bạn)
            _context.TblProducts.Add(tblProduct);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetTblProduct", new { id = tblProduct.ProductId }, tblProduct);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblProduct(int id)
        {
            // (Giữ nguyên code hàm Delete của bạn)
            var tblProduct = await _context.TblProducts.FindAsync(id);
            if (tblProduct == null) return NotFound();
            _context.TblProducts.Remove(tblProduct);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool TblProductExists(int id)
        {
            return _context.TblProducts.Any(e => e.ProductId == id);
        }
    }
}