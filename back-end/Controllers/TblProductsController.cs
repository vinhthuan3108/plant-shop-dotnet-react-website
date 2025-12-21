using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using System.IO;                // Thêm thư viện này để thao tác file
using Microsoft.AspNetCore.Hosting;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblProductsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        private readonly IWebHostEnvironment _environment; // 1. Khai báo biến môi trường

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
            // CŨ (Bị lỗi thiếu ảnh): 
            // var tblProduct = await _context.TblProducts.FindAsync(id);

            // MỚI (Sửa lại để lấy kèm ảnh và danh mục):
            var tblProduct = await _context.TblProducts
                                           .Include(p => p.TblProductImages) // Quan trọng: Load kèm ảnh
                                           .Include(p => p.Category)         // Load kèm tên danh mục (nếu cần hiển thị)
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
            if (id != tblProduct.ProductId)
            {
                return BadRequest();
            }

            // BƯỚC 1: Lấy sản phẩm cũ từ DB, BẮT BUỘC phải Include ảnh cũ để xử lý
            var existingProduct = await _context.TblProducts
                .Include(p => p.TblProductImages)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (existingProduct == null)
            {
                return NotFound();
            }

            // BƯỚC 2: Cập nhật thông tin cơ bản (Text, số...)
            // Cách này copy giá trị từ tblProduct (gửi lên) sang existingProduct (trong DB)
            _context.Entry(existingProduct).CurrentValues.SetValues(tblProduct);

            // Giữ nguyên ngày tạo, cập nhật ngày sửa
            existingProduct.UpdatedAt = DateTime.Now;
            // Đảm bảo CreatedAt không bị ghi đè bởi null hoặc giá trị sai (dù SetValues đã copy, nhưng an toàn thì giữ lại cái cũ)
            _context.Entry(existingProduct).Property(x => x.CreatedAt).IsModified = false;

            // BƯỚC 3: Xử lý hình ảnh
            // 3.1. Xóa toàn bộ ảnh cũ của sản phẩm này trong Database
            if (existingProduct.TblProductImages != null && existingProduct.TblProductImages.Any())
            {
                _context.TblProductImages.RemoveRange(existingProduct.TblProductImages);
            }

            // 3.2. Thêm lại danh sách ảnh mới từ Frontend gửi lên
            if (tblProduct.TblProductImages != null && tblProduct.TblProductImages.Any())
            {
                foreach (var img in tblProduct.TblProductImages)
                {
                    // Quan trọng: Gán ImageId = 0 để EF hiểu đây là dữ liệu mới cần Insert
                    img.ImageId = 0;
                    img.ProductId = id; // Gắn lại ID sản phẩm cho chắc chắn

                    // Thêm vào danh sách ảnh của sản phẩm
                    _context.TblProductImages.Add(img);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TblProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblProduct(int id)
        {
            // BƯỚC 1: Tìm sản phẩm và KÈM THEO DANH SÁCH ẢNH (Include)
            var tblProduct = await _context.TblProducts
                .Include(p => p.TblProductImages) // Quan trọng: Phải load ảnh ra mới biết đường dẫn mà xóa
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
                    // Giả sử property lưu đường dẫn ảnh trong DB là 'ImageUrl' (hoặc bạn sửa lại theo tên cột thực tế của bạn)
                    // Đường dẫn trong DB thường dạng: /images/abc.jpg -> cần xóa dấu / ở đầu
                    if (!string.IsNullOrEmpty(image.ImageUrl))
                    {
                        var relativePath = image.ImageUrl.TrimStart('/');
                        var fullPath = Path.Combine(_environment.WebRootPath, relativePath);

                        // Kiểm tra file có tồn tại không thì mới xóa
                        if (System.IO.File.Exists(fullPath))
                        {
                            try
                            {
                                System.IO.File.Delete(fullPath);
                            }
                            catch (Exception ex)
                            {
                                // Có thể log lỗi nếu cần, nhưng thường ta sẽ bỏ qua để đảm bảo DB vẫn được xóa
                                // Console.WriteLine("Lỗi xóa ảnh: " + ex.Message);
                            }
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
