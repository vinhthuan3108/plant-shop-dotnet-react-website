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
        // API 1: Lấy danh sách danh mục hiển thị cho khách hàng (Public)
        // Chỉ lấy những cái IsActive = true và sắp xếp theo thứ tự
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<TblCategory>>> GetActiveCategories()
        {
            return await _context.TblCategories
                .Where(c => c.IsActive == true)
                .OrderBy(c => c.DisplayOrder) // Sắp xếp theo thứ tự ưu tiên
                .ToListAsync();
        }
        // GET: api/TblCategories
        // GET: api/TblCategories
        [HttpGet]
        public async Task<IActionResult> GetTblCategories()
        {
            // Sử dụng Select để chỉ lấy dữ liệu cần thiết và đếm số sản phẩm
            var categories = await _context.TblCategories
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.Description,
                    c.DisplayOrder,
                    c.IsActive,
                    c.IsDeleted,
                    // Đếm số lượng sản phẩm thuộc danh mục này
                    ProductCount = c.TblProducts.Count()
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/TblCategories/5
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

        // PUT: api/TblCategories/5
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

        // POST: api/TblCategories
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

        // DELETE: api/TblCategories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblCategory(int id)
        {
            var tblCategory = await _context.TblCategories.FindAsync(id);
            if (tblCategory == null)
            {
                return NotFound();
            }

            _context.TblCategories.Remove(tblCategory);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("get-featured")]
        public async Task<ActionResult<IEnumerable<TblCategory>>> GetFeaturedCategories()
        {
            return await _context.TblCategories
                // Chỉ lấy danh mục đang hoạt động và chưa bị xóa (nếu logic của bạn cần)
                .Where(c => c.IsActive == true && c.IsDeleted == false)
                .OrderBy(c => c.DisplayOrder) 
                .Take(4) // Chỉ lấy 4 cái
                .ToListAsync();
        }
        private bool TblCategoryExists(int id)
        {
            return _context.TblCategories.Any(e => e.CategoryId == id);
        }
    }
}
