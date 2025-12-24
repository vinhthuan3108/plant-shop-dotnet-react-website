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
        // PUT: api/TblProducts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblProduct(int id, TblProduct tblProduct)
        {
            if (id != tblProduct.ProductId) return BadRequest();

            // 1. Lấy sản phẩm cũ
            var existingProduct = await _context.TblProducts
                .Include(p => p.TblProductImages)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (existingProduct == null) return NotFound();

            // --- SỬA LỖI MẤT SẢN PHẨM ---
            // Lưu lại trạng thái Active/Deleted cũ trước khi update
            var oldIsActive = existingProduct.IsActive;
            var oldIsDeleted = existingProduct.IsDeleted;
            var oldCreatedAt = existingProduct.CreatedAt;

            // 2. Ghi đè dữ liệu mới vào
            _context.Entry(existingProduct).CurrentValues.SetValues(tblProduct);

            // 3. KHÔI PHỤC LẠI CÁC TRƯỜNG QUAN TRỌNG
            // Nếu frontend không gửi IsActive (hoặc gửi false do lỗi), ta ép nó về trạng thái cũ
            // Dòng này đảm bảo sửa ảnh không làm ẩn sản phẩm
            existingProduct.IsActive = oldIsActive;
            existingProduct.IsDeleted = oldIsDeleted;
            existingProduct.CreatedAt = oldCreatedAt;
            existingProduct.UpdatedAt = DateTime.Now;

            // --- XỬ LÝ ẢNH (Giữ nguyên logic của bạn nhưng thêm try-catch xóa file cho an toàn) ---
            var clientImages = tblProduct.TblProductImages ?? new List<TblProductImage>();
            var clientImageIds = clientImages.Select(i => i.ImageId).ToList();
            var imagesToDelete = existingProduct.TblProductImages
                .Where(img => !clientImageIds.Contains(img.ImageId))
                .ToList();

            foreach (var img in imagesToDelete)
            {
                if (!string.IsNullOrEmpty(img.ImageUrl))
                {
                    // Sửa lỗi đường dẫn khi xóa file: thay / bằng \ cho đúng chuẩn Windows nếu cần
                    var relativePath = img.ImageUrl.Replace("/", "\\").TrimStart('\\');
                    var filePath = Path.Combine(_environment.WebRootPath, relativePath);
                    if (System.IO.File.Exists(filePath))
                    {
                        try { System.IO.File.Delete(filePath); } catch { }
                    }
                }
                _context.TblProductImages.Remove(img);
            }

            foreach (var img in clientImages)
            {
                if (img.ImageId == 0)
                {
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
                    var existingImg = existingProduct.TblProductImages.FirstOrDefault(i => i.ImageId == img.ImageId);
                    if (existingImg != null)
                    {
                        existingImg.IsThumbnail = img.IsThumbnail;
                        // existingImg.ImageUrl = img.ImageUrl; // Nếu muốn cho phép sửa link ảnh cũ
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
            var query = _context.TblProducts
                .Include(p => p.Category)
                .Include(p => p.TblProductImages)
                .AsQueryable();

            // ... (Giữ nguyên các logic lọc Keyword, Category, IsActive, StockStatus cũ) ...

            // 1. Tìm kiếm (Giữ nguyên)
            if (!string.IsNullOrEmpty(filter.Keyword))
            {
                string kw = filter.Keyword.ToLower().Trim();
                query = query.Where(p => p.ProductName.ToLower().Contains(kw) || p.ProductCode.ToLower().Contains(kw));
            }
            // 2. Danh mục (Giữ nguyên)
            if (filter.CategoryId.HasValue) query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
            // 3. Trạng thái (Giữ nguyên)
            if (filter.IsActive.HasValue) query = query.Where(p => p.IsActive == filter.IsActive.Value);
            // 4. Tồn kho (Giữ nguyên)
            if (!string.IsNullOrEmpty(filter.StockStatus))
            {
                switch (filter.StockStatus.ToLower())
                {
                    case "out_of_stock": query = query.Where(p => p.StockQuantity <= 0); break;
                    case "low_stock": query = query.Where(p => p.StockQuantity > 0 && p.StockQuantity <= (p.MinStockAlert ?? 5)); break;
                    case "available": query = query.Where(p => p.StockQuantity > (p.MinStockAlert ?? 5)); break;
                }
            }
            // 5. Khoảng giá (Giữ nguyên)
            if (filter.MinPrice.HasValue) query = query.Where(p => (p.SalePrice ?? p.OriginalPrice) >= filter.MinPrice.Value);
            if (filter.MaxPrice.HasValue) query = query.Where(p => (p.SalePrice ?? p.OriginalPrice) <= filter.MaxPrice.Value);

            // --- LOGIC MỚI BẮT ĐẦU TỪ ĐÂY ---

            // 6. Lọc theo Khuyến mãi (IsOnSale)
            if (filter.IsOnSale.HasValue)
            {
                if (filter.IsOnSale.Value == true)
                {
                    // Đang sale: Có giá sale VÀ giá sale nhỏ hơn giá gốc
                    query = query.Where(p => p.SalePrice != null && p.SalePrice < p.OriginalPrice);
                }
                else
                {
                    // Không sale: Giá sale null HOẶC giá sale >= giá gốc
                    query = query.Where(p => p.SalePrice == null || p.SalePrice >= p.OriginalPrice);
                }
            }

            // 7. Sắp xếp (SortByPrice)
            // Lưu ý: Logic sắp xếp phải đặt cuối cùng trước khi .Select()
            if (!string.IsNullOrEmpty(filter.SortByPrice))
            {
                if (filter.SortByPrice.ToLower() == "asc") // Tăng dần
                {
                    query = query.OrderBy(p => p.SalePrice ?? p.OriginalPrice);
                }
                else if (filter.SortByPrice.ToLower() == "desc") // Giảm dần
                {
                    query = query.OrderByDescending(p => p.SalePrice ?? p.OriginalPrice);
                }
            }
            else
            {
                // Mặc định: Mới nhất lên đầu (nếu không chọn sắp xếp giá)
                query = query.OrderByDescending(p => p.CreatedAt);
            }

            // --- KẾT THÚC LOGIC MỚI ---

            var result = await query
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductCode,
                    p.ProductName,
                    p.CategoryId, // Nhớ dòng này để sửa lỗi select danh mục lúc trước
                    CategoryName = p.Category != null ? p.Category.CategoryName : "N/A",
                    p.OriginalPrice,
                    p.SalePrice,
                    p.StockQuantity,
                    p.MinStockAlert,
                    p.IsActive,
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
        // GET: api/TblProducts/shop
        // GET: api/TblProducts/shop
        [HttpGet("shop")]
        public async Task<ActionResult<object>> GetProductsForShop(int? categoryId, int page = 1, int pageSize = 12)
        {
            // 1. Khởi tạo Query
            var query = _context.TblProducts
                .Include(p => p.Category)           // Kèm thông tin danh mục
                .Include(p => p.TblProductImages)   // Kèm danh sách ảnh (QUAN TRỌNG)
                .Where(p => p.IsActive == true && p.IsDeleted == false); // Chỉ lấy sản phẩm hiện

            // 2. Lọc theo danh mục nếu có
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // 3. Tính toán phân trang
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            // 4. Lấy dữ liệu (GIỮ NGUYÊN GỐC - KHÔNG CHẾ BIẾN)
            // Giống hệt logic của API HomePage
            var products = await query
                .OrderByDescending(p => p.CreatedAt) // Sắp xếp mới nhất
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 5. Trả về format chuẩn
            return Ok(new
            {
                data = products,      // Danh sách sản phẩm (Cấu trúc y hệt HomePage)
                page = page,
                pageSize = pageSize,
                totalPages = totalPages,
                totalItems = totalItems
            });
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