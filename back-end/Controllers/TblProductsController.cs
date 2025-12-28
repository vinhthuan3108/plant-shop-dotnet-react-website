using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

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

        // GET: api/TblProducts/filter (Dùng cho Admin - Danh sách & Tìm kiếm)
        // GET: api/TblProducts/filter
        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<object>>> GetFilteredProducts([FromQuery] ProductFilterDto filter)
        {
            var query = _context.TblProducts
                .Include(p => p.Category)
                .Include(p => p.TblProductImages)
                .Include(p => p.TblProductVariants)
                .AsQueryable();

            // 1. Lọc Keyword
            if (!string.IsNullOrEmpty(filter.Keyword))
            {
                string kw = filter.Keyword.ToLower().Trim();
                query = query.Where(p => p.ProductName.ToLower().Contains(kw) || p.ProductCode.ToLower().Contains(kw));
            }

            // 2. Lọc Category
            if (filter.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

            // 3. Lọc Active
            if (filter.IsActive.HasValue)
                query = query.Where(p => p.IsActive == filter.IsActive.Value);

            // 4. Lọc Tồn kho
            if (!string.IsNullOrEmpty(filter.StockStatus))
            {
                switch (filter.StockStatus.ToLower())
                {
                    case "out_of_stock":
                        query = query.Where(p => p.TblProductVariants.Sum(v => v.StockQuantity) <= 0);
                        break;
                    case "low_stock":
                        query = query.Where(p => p.TblProductVariants.Sum(v => v.StockQuantity) > 0
                                              && p.TblProductVariants.Sum(v => v.StockQuantity) <= (p.TblProductVariants.FirstOrDefault().MinStockAlert ?? 5));
                        break;
                    case "available":
                        query = query.Where(p => p.TblProductVariants.Sum(v => v.StockQuantity) > (p.TblProductVariants.FirstOrDefault().MinStockAlert ?? 5));
                        break;
                }
            }

            // --- 5. LỌC KHOẢNG GIÁ (SỬA LẠI LOGIC) ---
            // Logic: Nếu SalePrice khác null VÀ lớn hơn 0 thì dùng SalePrice, ngược lại dùng OriginalPrice
            if (filter.MinPrice.HasValue)
            {
                query = query.Where(p => p.TblProductVariants.Any(v =>
                    ((v.SalePrice != null && v.SalePrice > 0) ? v.SalePrice : v.OriginalPrice) >= filter.MinPrice.Value));
            }

            if (filter.MaxPrice.HasValue)
            {
                query = query.Where(p => p.TblProductVariants.Any(v =>
                    ((v.SalePrice != null && v.SalePrice > 0) ? v.SalePrice : v.OriginalPrice) <= filter.MaxPrice.Value));
            }

            // 6. Lọc chương trình Sale
            if (filter.IsOnSale.HasValue)
            {
                if (filter.IsOnSale.Value == true)
                    query = query.Where(p => p.TblProductVariants.Any(v => v.SalePrice != null && v.SalePrice > 0 && v.SalePrice < v.OriginalPrice));
                else
                    query = query.Where(p => !p.TblProductVariants.Any(v => v.SalePrice != null && v.SalePrice > 0 && v.SalePrice < v.OriginalPrice));
            }

            // --- 7. SẮP XẾP GIÁ (CŨNG PHẢI SỬA) ---
            if (!string.IsNullOrEmpty(filter.SortByPrice))
            {
                if (filter.SortByPrice.ToLower() == "asc")
                {
                    // Sắp xếp tăng dần theo giá thực tế (ưu tiên giá Sale nếu có) của biến thể đầu tiên
                    query = query.OrderBy(p => p.TblProductVariants.OrderBy(v => v.VariantId)
                        .Select(v => (v.SalePrice != null && v.SalePrice > 0) ? v.SalePrice : v.OriginalPrice)
                        .FirstOrDefault());
                }
                else if (filter.SortByPrice.ToLower() == "desc")
                {
                    // Sắp xếp giảm dần
                    query = query.OrderByDescending(p => p.TblProductVariants.OrderBy(v => v.VariantId)
                        .Select(v => (v.SalePrice != null && v.SalePrice > 0) ? v.SalePrice : v.OriginalPrice)
                        .FirstOrDefault());
                }
            }
            else
            {
                query = query.OrderByDescending(p => p.CreatedAt);
            }

            // 8. Select kết quả
            var result = await query
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductCode,
                    p.ProductName,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.CategoryName : "N/A",

                    // Lấy giá hiển thị (để Frontend dùng)
                    OriginalPrice = p.TblProductVariants.OrderBy(v => v.VariantId).Select(v => v.OriginalPrice).FirstOrDefault(),
                    SalePrice = p.TblProductVariants.OrderBy(v => v.VariantId).Select(v => v.SalePrice).FirstOrDefault(),

                    StockQuantity = p.TblProductVariants.Sum(v => v.StockQuantity),
                    MinStockAlert = p.TblProductVariants.OrderBy(v => v.VariantId).Select(v => v.MinStockAlert).FirstOrDefault() ?? 5,

                    TblProductVariants = p.TblProductVariants.Select(v => new
                    {
                        v.VariantId,
                        v.VariantName,
                        v.StockQuantity,
                        v.OriginalPrice // Giá nhập tham khảo
                    }).ToList(),
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

        // GET: api/TblProducts/shop (Dùng cho Khách hàng)
        [HttpGet("shop")]
        public async Task<IActionResult> GetProductsForShop(
            int? categoryId,
            decimal? minPrice, // 1. THÊM THAM SỐ NHẬN GIÁ MIN
            decimal? maxPrice, // 2. THÊM THAM SỐ NHẬN GIÁ MAX
            int page = 1,
            int pageSize = 12)
        {
            var query = _context.TblProducts
                .Include(p => p.TblProductImages)
                .Include(p => p.TblProductVariants) // Load biến thể để check giá
                .Where(p => p.IsActive == true && (p.IsDeleted == false || p.IsDeleted == null));

            // 1. Lọc theo Danh mục
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // 2. --- LỌC THEO KHOẢNG GIÁ (LOGIC MỚI) ---
            if (minPrice.HasValue)
            {
                // Kiểm tra xem sản phẩm có BẤT KỲ biến thể nào có giá >= minPrice không
                // Giá thực tế = Giá Sale (nếu có) hoặc Giá Gốc
                query = query.Where(p => p.TblProductVariants.Any(v =>
                    ((v.SalePrice != null && v.SalePrice > 0 ? v.SalePrice.Value : v.OriginalPrice) >= minPrice.Value)
                ));
            }

            if (maxPrice.HasValue)
            {
                // Kiểm tra xem sản phẩm có BẤT KỲ biến thể nào có giá <= maxPrice không
                query = query.Where(p => p.TblProductVariants.Any(v =>
                    ((v.SalePrice != null && v.SalePrice > 0 ? v.SalePrice.Value : v.OriginalPrice) <= maxPrice.Value)
                ));
            }

            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var products = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductName,
                    // Lấy giá thấp nhất trong các biến thể để hiển thị "Từ..."
                    OriginalPrice = p.TblProductVariants.OrderBy(v => v.OriginalPrice).Select(v => v.OriginalPrice).FirstOrDefault(),
                    SalePrice = p.TblProductVariants.OrderBy(v => v.OriginalPrice).Select(v => v.SalePrice).FirstOrDefault(),

                    StockQuantity = p.TblProductVariants.Sum(v => v.StockQuantity ?? 0),

                    thumbnail = p.TblProductImages
                                .Where(img => img.IsThumbnail == true)
                                .Select(img => img.ImageUrl)
                                .FirstOrDefault()
                                ?? p.TblProductImages.Select(img => img.ImageUrl).FirstOrDefault(),
                    p.CategoryId
                }).ToListAsync();

            return Ok(new
            {
                data = products,
                totalPages = totalPages,
                currentPage = page,
                totalItems = totalItems
            });
        }

        // GET: api/TblProducts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TblProduct>> GetTblProduct(int id)
        {
            var tblProduct = await _context.TblProducts
                   .Include(p => p.TblProductImages)
                   .Include(p => p.Category)
                   .Include(p => p.TblProductVariants) // Load danh sách biến thể để edit
                   .FirstOrDefaultAsync(p => p.ProductId == id);

            if (tblProduct == null) return NotFound();

            return tblProduct;
        }

        // POST: api/TblProducts (Tạo mới)
        [HttpPost]
        public async Task<ActionResult<TblProduct>> PostTblProduct(TblProduct tblProduct)
        {
            bool isDuplicate = await _context.TblProducts.AnyAsync(p => p.ProductCode == tblProduct.ProductCode);
            if (isDuplicate) return BadRequest(new { title = $"Mã sản phẩm '{tblProduct.ProductCode}' đã tồn tại!" });

            tblProduct.CreatedAt = DateTime.Now;
            tblProduct.UpdatedAt = DateTime.Now;
            tblProduct.ProductId = 0;

            _context.TblProducts.Add(tblProduct);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { title = "Lỗi Server: " + ex.Message });
            }

            return CreatedAtAction("GetTblProduct", new { id = tblProduct.ProductId }, tblProduct);
        }

        // PUT: api/TblProducts/5 (Cập nhật)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblProduct(int id, TblProduct tblProduct)
        {
            if (id != tblProduct.ProductId) return BadRequest();

            var existingProduct = await _context.TblProducts
                .Include(p => p.TblProductImages)
                .Include(p => p.TblProductVariants) // Load biến thể cũ
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (existingProduct == null) return NotFound();

            // Cập nhật thông tin chung
            existingProduct.ProductCode = tblProduct.ProductCode;
            existingProduct.ProductName = tblProduct.ProductName;
            existingProduct.CategoryId = tblProduct.CategoryId;
            existingProduct.ShortDescription = tblProduct.ShortDescription;
            existingProduct.DetailDescription = tblProduct.DetailDescription;
            existingProduct.FengShuiTags = tblProduct.FengShuiTags;
            existingProduct.IsActive = tblProduct.IsActive;

            // Cập nhật ngày Sale (ở bảng cha)
            existingProduct.SaleStartDate = tblProduct.SaleStartDate;
            existingProduct.SaleEndDate = tblProduct.SaleEndDate;

            existingProduct.UpdatedAt = DateTime.Now;

            // --- XỬ LÝ ẢNH ---
            var clientImages = tblProduct.TblProductImages ?? new List<TblProductImage>();
            var clientImageIds = clientImages.Select(i => i.ImageId).ToList();
            var imagesToDelete = existingProduct.TblProductImages.Where(img => !clientImageIds.Contains(img.ImageId)).ToList();

            foreach (var img in imagesToDelete)
            {
                if (!string.IsNullOrEmpty(img.ImageUrl))
                {
                    var relativePath = img.ImageUrl.Replace("/", "\\").TrimStart('\\');
                    var filePath = Path.Combine(_environment.WebRootPath, relativePath);
                    if (System.IO.File.Exists(filePath)) try { System.IO.File.Delete(filePath); } catch { }
                }
                _context.TblProductImages.Remove(img);
            }

            foreach (var img in clientImages)
            {
                if (img.ImageId == 0)
                {
                    existingProduct.TblProductImages.Add(new TblProductImage
                    {
                        ProductId = id,
                        ImageUrl = img.ImageUrl,
                        IsThumbnail = img.IsThumbnail,
                        DisplayOrder = img.DisplayOrder ?? 0
                    });
                }
                else
                {
                    var existingImg = existingProduct.TblProductImages.FirstOrDefault(i => i.ImageId == img.ImageId);
                    if (existingImg != null) existingImg.IsThumbnail = img.IsThumbnail;
                }
            }

            // --- XỬ LÝ BIẾN THỂ (VARIANTS) ---
            var clientVariants = tblProduct.TblProductVariants ?? new List<TblProductVariant>();
            var clientVariantIds = clientVariants.Select(v => v.VariantId).ToList();

            // Xóa biến thể cũ không còn tồn tại
            var variantsToDelete = existingProduct.TblProductVariants.Where(v => !clientVariantIds.Contains(v.VariantId)).ToList();
            foreach (var v in variantsToDelete) _context.TblProductVariants.Remove(v);

            // Thêm/Sửa biến thể
            foreach (var v in clientVariants)
            {
                if (v.VariantId == 0)
                {
                    existingProduct.TblProductVariants.Add(new TblProductVariant
                    {
                        VariantName = v.VariantName,
                        OriginalPrice = v.OriginalPrice,
                        SalePrice = v.SalePrice,
                        StockQuantity = v.StockQuantity,
                        MinStockAlert = v.MinStockAlert,
                        IsActive = true
                    });
                }
                else
                {
                    var existingVar = existingProduct.TblProductVariants.FirstOrDefault(x => x.VariantId == v.VariantId);
                    if (existingVar != null)
                    {
                        existingVar.VariantName = v.VariantName;
                        existingVar.OriginalPrice = v.OriginalPrice;
                        existingVar.SalePrice = v.SalePrice;
                        existingVar.StockQuantity = v.StockQuantity;
                        existingVar.MinStockAlert = v.MinStockAlert;
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.TblProducts.Any(e => e.ProductId == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/TblProducts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblProduct(int id)
        {
            var tblProduct = await _context.TblProducts.Include(p => p.TblProductImages).FirstOrDefaultAsync(p => p.ProductId == id);
            if (tblProduct == null) return NotFound();

            if (tblProduct.TblProductImages != null)
            {
                foreach (var image in tblProduct.TblProductImages)
                {
                    if (!string.IsNullOrEmpty(image.ImageUrl))
                    {
                        var relativePath = image.ImageUrl.TrimStart('/');
                        var fullPath = Path.Combine(_environment.WebRootPath, relativePath);
                        if (System.IO.File.Exists(fullPath)) try { System.IO.File.Delete(fullPath); } catch { }
                    }
                }
            }

            _context.TblProducts.Remove(tblProduct);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}