using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblCategoriesController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblCategoriesController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }
        // APILấy danh sách danh mục hiển thị cho khách hàng
        
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<TblCategory>>> GetActiveCategories()
        {
            return await _context.TblCategories
                .Where(c => c.IsActive == true)
                .OrderBy(c => c.DisplayOrder) 
                .ToListAsync();
        }

        [HttpGet]
        public async Task<IActionResult> GetTblCategories()
        {
            try
            {
                var categories = await _context.TblCategories
                    .Where(c => c.IsDeleted == false || c.IsDeleted == null)
                    .OrderBy(c => c.DisplayOrder)
                    .Select(c => new
                    {
                        c.CategoryId,
                        c.CategoryName,
                        c.Description,
                        c.DisplayOrder,
                        c.IsActive,
                        c.IsDeleted,
                        ProductCount = c.TblProducts.Count()
                    })
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    Loi = "...",
                    ChiTiet = ex.Message,
                    LoiSauCung = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TblCategory>> GetTblCategory(int id)
        {
            var tblCategory = await _context.TblCategories.FindAsync(id);

            if (tblCategory == null)
            {
                return NotFound();
            }

            return tblCategory;
        }
        [HttpGet("best-selling")]
        public async Task<ActionResult<IEnumerable<TblCategory>>> GetBestSellingCategories()
        {
            // 1. Truy vấn từ chi tiết đơn hàng để tính thực tế số lượng bán
            var topCategories = await _context.TblOrderDetails
 
                .Include(d => d.Order)
                .Include(d => d.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Category)

                .Where(d => d.Order.OrderStatus == "Completed")
                // Nhóm theo Category
                .GroupBy(d => d.Variant.Product.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    TotalSold = g.Sum(d => d.Quantity) 
                })
                .OrderByDescending(x => x.TotalSold)
                // Lấy 4 danh mục đầu tiên
                .Take(4)
                .Select(x => x.Category)
                .ToListAsync();

            //Nếu chưa có đơn hàng nào
            // thì lấy 4 danh mục mặc định
            if (topCategories == null || topCategories.Count == 0)
            {
                return await _context.TblCategories
                    .Where(c => c.IsActive == true && c.IsDeleted == false)
                    .OrderBy(c => c.DisplayOrder)
                    .Take(4)
                    .ToListAsync();
            }

            return Ok(topCategories);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblCategory(int id, TblCategory tblCategory)
        {
            if (id != tblCategory.CategoryId)
            {
                return BadRequest();
            }

            _context.Entry(tblCategory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TblCategoryExists(id))
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

        [HttpPost]
        public async Task<ActionResult<TblCategory>> PostTblCategory(TblCategory tblCategory)
        {

            bool isDuplicate = await _context.TblCategories
                .AnyAsync(c => c.CategoryName.ToLower() == tblCategory.CategoryName.ToLower());

            if (isDuplicate)
            {

                return Conflict(new { message = "Tên danh mục đã tồn tại! Vui lòng chọn tên khác." });
            }

            if (tblCategory.IsActive == null) tblCategory.IsActive = true;

            if (tblCategory.DisplayOrder == null) tblCategory.DisplayOrder = 0;

            tblCategory.IsDeleted = false;


            _context.TblCategories.Add(tblCategory);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTblCategory", new { id = tblCategory.CategoryId }, tblCategory);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblCategory(int id)
        {
            var tblCategory = await _context.TblCategories.FindAsync(id);
            if (tblCategory == null)
            {
                return NotFound();
            }


            int productCount = await _context.TblProducts.CountAsync(p => p.CategoryId == id);

            if (productCount > 0)
            {
                
                return BadRequest(new
                {
                    message = $"Danh mục này đang chứa {productCount} sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác trước khi xóa."
                });
            }
            // ------------------------------------------------

            _context.TblCategories.Remove(tblCategory);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("get-featured")]
        public async Task<ActionResult<IEnumerable<TblCategory>>> GetFeaturedCategories()
        {
            return await _context.TblCategories
                // Chỉ lấy danh mục đang hoạt động và chưa bị xóa
                .Where(c => c.IsActive == true && c.IsDeleted == false)
                .OrderBy(c => c.DisplayOrder) 
                .Take(4)
                .ToListAsync();
        }
        private bool TblCategoryExists(int id)
        {
            return _context.TblCategories.Any(e => e.CategoryId == id);
        }
    }
}
