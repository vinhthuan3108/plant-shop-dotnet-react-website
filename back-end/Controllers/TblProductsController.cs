using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using System.IO;                // Thư viện thao tác file
using Microsoft.AspNetCore.Hosting;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblProductsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IWebHostEnvironment _environment; // Khai báo biến môi trường

        // Inject IWebHostEnvironment vào constructor
        public TblProductsController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/TblProducts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblProduct>>> GetTblProducts()
        {
            return await _context.TblProducts
                                 .Include(p => p.Category)
                                 .Include(p => p.TblProductImages)
                                 .OrderByDescending(p => p.CreatedAt)
                                 .ToListAsync();
        }

        // GET: api/TblProducts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TblProduct>> GetTblProduct(int id)
        {
            var tblProduct = await _context.TblProducts
                                           .Include(p => p.TblProductImages) // Quan trọng: Load kèm ảnh
                                           .Include(p => p.Category)         // Load kèm tên danh mục
                                           .FirstOrDefaultAsync(p => p.ProductId == id);

            if (tblProduct == null)
            {
                return NotFound();
            }

            return tblProduct;
        }

        // PUT: api/TblProducts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblProduct(int id, TblProduct tblProduct)
        {
            if (id != tblProduct.ProductId) return BadRequest();

            // BƯỚC 1: Lấy sản phẩm cũ từ DB kèm ảnh
            var existingProduct = await _context.TblProducts
                .Include(p => p.TblProductImages)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (existingProduct == null) return NotFound();

            // BƯỚC 2: Cập nhật thông tin cơ bản
            _context.Entry(existingProduct).CurrentValues.SetValues(tblProduct);

            // Cập nhật ngày sửa, giữ nguyên ngày tạo
            existingProduct.UpdatedAt = DateTime.Now;
            _context.Entry(existingProduct).Property(x => x.CreatedAt).IsModified = false;

            // BƯỚC 3: Xử lý hình ảnh cũ
            if (existingProduct.TblProductImages != null && existingProduct.TblProductImages.Any())
            {
                // 3.1. Xóa file vật lý trong thư mục wwwroot trước
                foreach (var item in existingProduct.TblProductImages)
                {
                    if (!string.IsNullOrEmpty(item.ImageUrl))
                    {
                        var relativePath = item.ImageUrl.TrimStart('/');
                        var filePath = Path.Combine(_environment.WebRootPath, relativePath);

                        if (System.IO.File.Exists(filePath))
                        {
                            try { System.IO.File.Delete(filePath); } catch { }
                        }
                    }
                }
                // 3.2. Xóa record trong Database
                _context.TblProductImages.RemoveRange(existingProduct.TblProductImages);
            }

            // BƯỚC 4: Thêm ảnh mới từ client gửi lên
            if (tblProduct.TblProductImages != null && tblProduct.TblProductImages.Any())
            {
                foreach (var img in tblProduct.TblProductImages)
                {
                    img.ImageId = 0; // Đánh dấu là mới để EF tự sinh ID
                    img.ProductId = id;
                    _context.TblProductImages.Add(img);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TblProductExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // --- ĐÂY LÀ HÀM BẠN ĐANG THIẾU ---
        // GET: api/TblProducts/shop
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

            var products = await query.Select(p => new
            {
                p.ProductId,
                p.ProductName,
                p.OriginalPrice,
                p.SalePrice,
                Thumbnail = p.TblProductImages
                            .Where(img => img.IsThumbnail == true)
                            .Select(img => img.ImageUrl)
                            .FirstOrDefault()
                            ?? p.TblProductImages.Select(img => img.ImageUrl).FirstOrDefault(),
                p.CategoryId
            }).ToListAsync();

            return Ok(products);
        }
        // ----------------------------------

        // POST: api/TblProducts
        [HttpPost]
        public async Task<ActionResult<TblProduct>> PostTblProduct(TblProduct tblProduct)
        {
            tblProduct.CreatedAt = DateTime.Now;
            tblProduct.UpdatedAt = DateTime.Now;
            _context.TblProducts.Add(tblProduct);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTblProduct", new { id = tblProduct.ProductId }, tblProduct);
        }

        // DELETE: api/TblProducts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblProduct(int id)
        {
            // BƯỚC 1: Tìm sản phẩm và KÈM THEO DANH SÁCH ẢNH
            var tblProduct = await _context.TblProducts
                .Include(p => p.TblProductImages)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (tblProduct == null)
            {
                return NotFound();
            }

            // BƯỚC 2: Xóa file vật lý trong thư mục wwwroot
            if (tblProduct.TblProductImages != null && tblProduct.TblProductImages.Any())
            {
                foreach (var image in tblProduct.TblProductImages)
                {
                    if (!string.IsNullOrEmpty(image.ImageUrl))
                    {
                        var relativePath = image.ImageUrl.TrimStart('/');
                        var fullPath = Path.Combine(_environment.WebRootPath, relativePath);

                        if (System.IO.File.Exists(fullPath))
                        {
                            try { System.IO.File.Delete(fullPath); } catch { }
                        }
                    }
                }
            }

            // BƯỚC 3: Xóa dữ liệu trong Database
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