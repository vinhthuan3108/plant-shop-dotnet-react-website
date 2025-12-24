using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblTestimonialsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IWebHostEnvironment _environment;

        public TblTestimonialsController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // ==========================================================
        // HÀM PHỤ TRỢ: Xóa file vật lý
        // ==========================================================
        private void DeleteFileFromServer(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return;

            try
            {
                var cleanPath = relativePath.TrimStart('/');
                var fullPath = Path.Combine(_environment.WebRootPath, cleanPath);

                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch { /* Bỏ qua lỗi */ }
        }

        // ==========================================================
        // CÁC API ENDPOINTS
        // ==========================================================

        // 1. GET: api/TblTestimonials (Admin)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblTestimonial>>> GetTestimonials()
        {
            // Sắp xếp theo ID giảm dần (Mới nhất lên đầu)
            return await _context.TblTestimonials.OrderByDescending(t => t.TestimonialId).ToListAsync();
        }

        // 2. GET: api/TblTestimonials/public (Client)
        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<TblTestimonial>>> GetPublicReviews()
        {
            return await _context.TblTestimonials
                .Where(x => x.IsActive == true)
                .OrderByDescending(t => t.TestimonialId) // Sửa lại: Sắp xếp theo ID thay vì CreatedAt
                .ToListAsync();
        }

        // 3. GET: api/TblTestimonials/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TblTestimonial>> GetTblTestimonial(int id)
        {
            var tblTestimonial = await _context.TblTestimonials.FindAsync(id);
            if (tblTestimonial == null) return NotFound();
            return tblTestimonial;
        }

        // 4. POST: api/TblTestimonials
        [HttpPost]
        public async Task<ActionResult<TblTestimonial>> PostTblTestimonial(TblTestimonial tblTestimonial)
        {
            // (Đã xóa đoạn gán CreatedAt vì model không có)

            _context.TblTestimonials.Add(tblTestimonial);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTblTestimonial", new { id = tblTestimonial.TestimonialId }, tblTestimonial);
        }

        // 5. PUT: api/TblTestimonials/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblTestimonial(int id, TblTestimonial tblTestimonial)
        {
            if (id != tblTestimonial.TestimonialId) return BadRequest();

            // --- LOGIC XÓA ẢNH CŨ ---
            var existingTestimonial = await _context.TblTestimonials.AsNoTracking().FirstOrDefaultAsync(x => x.TestimonialId == id);

            if (existingTestimonial == null) return NotFound();

            // Kiểm tra và xóa ảnh cũ nếu có thay đổi
            if (!string.IsNullOrEmpty(existingTestimonial.AvatarUrl) &&
                existingTestimonial.AvatarUrl != tblTestimonial.AvatarUrl)
            {
                DeleteFileFromServer(existingTestimonial.AvatarUrl);
            }
            // ------------------------

            _context.Entry(tblTestimonial).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TblTestimonialExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // 6. DELETE: api/TblTestimonials/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblTestimonial(int id)
        {
            var tblTestimonial = await _context.TblTestimonials.FindAsync(id);
            if (tblTestimonial == null) return NotFound();

            // Xóa ảnh vật lý trước khi xóa dữ liệu
            if (!string.IsNullOrEmpty(tblTestimonial.AvatarUrl))
            {
                DeleteFileFromServer(tblTestimonial.AvatarUrl);
            }

            _context.TblTestimonials.Remove(tblTestimonial);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TblTestimonialExists(int id)
        {
            return _context.TblTestimonials.Any(e => e.TestimonialId == id);
        }
    }
}