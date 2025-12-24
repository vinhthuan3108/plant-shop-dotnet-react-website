using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;                // Thư viện thao tác file
using System.Linq;
using System.Threading.Tasks;

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
            // Lưu ý: Không update TblProductImages ở dòng này để tránh xung đột
            _context.Entry(existingProduct).CurrentValues.SetValues(tblProduct);

            existingProduct.UpdatedAt = DateTime.Now;
            _context.Entry(existingProduct).Property(x => x.CreatedAt).IsModified = false;

            // --- BẮT ĐẦU XỬ LÝ ẢNH THÔNG MINH ---

            // Danh sách ảnh từ Client gửi lên (đảm bảo không null)
            var clientImages = tblProduct.TblProductImages ?? new List<TblProductImage>();

            // A. XỬ LÝ XÓA: Những ảnh có trong DB cũ nhưng KHÔNG có trong danh sách mới gửi lên
            // Lấy ra danh sách ID ảnh mà client giữ lại
            var clientImageIds = clientImages.Select(i => i.ImageId).ToList();

            // Tìm những ảnh trong DB không nằm trong danh sách giữ lại -> Xóa
            var imagesToDelete = existingProduct.TblProductImages
                .Where(img => !clientImageIds.Contains(img.ImageId))
                .ToList();

            foreach (var img in imagesToDelete)
            {
                // 1. Xóa file vật lý
                if (!string.IsNullOrEmpty(img.ImageUrl))
                {
                    var relativePath = img.ImageUrl.TrimStart('/');
                    var filePath = Path.Combine(_environment.WebRootPath, relativePath);
                    if (System.IO.File.Exists(filePath))
                    {
                        try { System.IO.File.Delete(filePath); } catch { }
                    }
                }
                // 2. Xóa trong DB (EF Core tracking sẽ tự đánh dấu deleted)
                _context.TblProductImages.Remove(img);
            }

            // B. XỬ LÝ THÊM MỚI VÀ CẬP NHẬT
            foreach (var img in clientImages)
            {
                if (img.ImageId == 0)
                {
                    // --- TRƯỜNG HỢP 1: ẢNH MỚI (ID = 0) ---
                    // Thêm mới vào DB
                    var newImage = new TblProductImage
                    {
                        ProductId = id,
                        ImageUrl = img.ImageUrl,
                        IsThumbnail = img.IsThumbnail,
                        DisplayOrder = img.DisplayOrder ?? 0
                    };
                    _context.TblProductImages.Add(newImage);
                }
                else
                {
                    // --- TRƯỜNG HỢP 2: ẢNH CŨ (Đã có ID) ---
                    // Cập nhật trạng thái (ví dụ: đổi ảnh đại diện)
                    var existingImg = existingProduct.TblProductImages
                                                     .FirstOrDefault(i => i.ImageId == img.ImageId);
                    if (existingImg != null)
                    {
                        existingImg.IsThumbnail = img.IsThumbnail;
                        // existingImg.DisplayOrder = img.DisplayOrder; // Nếu có tính năng sắp xếp

                        // QUAN TRỌNG: KHÔNG XÓA FILE VẬT LÝ Ở ĐÂY
                    }
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
        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<object>>> GetFilteredProducts([FromQuery] ProductFilterDto filter)
        {
            // Khởi tạo query, chưa thực thi vào DB
            // Dùng AsNoTracking() để tăng tốc độ nếu chỉ đọc dữ liệu
            var query = _context.TblProducts
                                .Include(p => p.Category)
                                .Include(p => p.TblProductImages)
                                .AsQueryable(); // Chuyển sang IQueryable để nối chuỗi điều kiện

            // --- XỬ LÝ LOGIC LỌC ---

            // 1. Tìm kiếm theo Tên hoặc Mã sản phẩm
            if (!string.IsNullOrEmpty(filter.Keyword))
            {
                string kw = filter.Keyword.ToLower().Trim();
                query = query.Where(p => p.ProductName.ToLower().Contains(kw)
                                      || p.ProductCode.ToLower().Contains(kw));
            }

            // 2. Lọc theo Danh mục
            if (filter.CategoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
            }

            // 3. Lọc theo Trạng thái (Đang bán / Ngừng bán)
            if (filter.IsActive.HasValue)
            {
                query = query.Where(p => p.IsActive == filter.IsActive.Value);
            }

            // 4. Lọc theo Tồn kho (Logic quan trọng để lên kế hoạch nhập)
            if (!string.IsNullOrEmpty(filter.StockStatus))
            {
                switch (filter.StockStatus.ToLower())
                {
                    case "out_of_stock": // Hết hàng
                        query = query.Where(p => p.StockQuantity <= 0);
                        break;
                    case "low_stock": // Sắp hết hàng (Số lượng <= Mức cảnh báo VÀ > 0)
                                      // Lưu ý: Cần xử lý trường hợp MinStockAlert null, ví dụ mặc định là 5
                        query = query.Where(p => p.StockQuantity > 0
                                              && p.StockQuantity <= (p.MinStockAlert ?? 5));
                        break;
                    case "available": // Còn hàng (thoải mái bán)
                        query = query.Where(p => p.StockQuantity > (p.MinStockAlert ?? 5));
                        break;
                }
            }

            // 5. Lọc theo Khoảng giá (Ưu tiên giá Khuyến mãi nếu có, nếu không thì lấy giá gốc)
            // Logic: Nếu MinPrice có giá trị => Giá bán phải >= MinPrice
            if (filter.MinPrice.HasValue)
            {
                query = query.Where(p => (p.SalePrice ?? p.OriginalPrice) >= filter.MinPrice.Value);
            }

            // Logic: Nếu MaxPrice có giá trị => Giá bán phải <= MaxPrice
            if (filter.MaxPrice.HasValue)
            {
                query = query.Where(p => (p.SalePrice ?? p.OriginalPrice) <= filter.MaxPrice.Value);
            }

            // --- TRẢ VỀ KẾT QUẢ ---

            // Chọn các trường cần thiết để trả về (Projection) giúp nhẹ băng thông
            var result = await query
                .OrderByDescending(p => p.CreatedAt) // Mới nhất lên đầu
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductCode,
                    p.ProductName,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.CategoryName : "N/A",
                    p.OriginalPrice,
                    p.SalePrice,
                    p.StockQuantity,
                    p.MinStockAlert,
                    p.IsActive,
                    // Lấy ảnh đại diện (Thumbnail) hoặc ảnh đầu tiên
                    Thumbnail = p.TblProductImages
                                 .Where(img => img.IsThumbnail == true)
                                 .Select(img => img.ImageUrl)
                                 .FirstOrDefault()
                                 ?? p.TblProductImages.Select(img => img.ImageUrl).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(result);
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