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

        //xóa file cũ
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
            catch {  }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblTestimonial>>> GetTestimonials()
        {
            
            return await _context.TblTestimonials.OrderByDescending(t => t.TestimonialId).ToListAsync();
        }

        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<TblTestimonial>>> GetPublicReviews()
        {
            return await _context.TblTestimonials
                .Where(x => x.IsActive == true)
                .OrderByDescending(t => t.TestimonialId) 
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TblTestimonial>> GetTblTestimonial(int id)
        {
            var tblTestimonial = await _context.TblTestimonials.FindAsync(id);
            if (tblTestimonial == null) return NotFound();
            return tblTestimonial;
        }

        [HttpPost]
        public async Task<ActionResult<TblTestimonial>> PostTblTestimonial(TblTestimonial tblTestimonial)
        {
           

            _context.TblTestimonials.Add(tblTestimonial);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTblTestimonial", new { id = tblTestimonial.TestimonialId }, tblTestimonial);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblTestimonial(int id, TblTestimonial tblTestimonial)
        {
            if (id != tblTestimonial.TestimonialId) return BadRequest();

            //xóa ảnh cũ
            var existingTestimonial = await _context.TblTestimonials.AsNoTracking().FirstOrDefaultAsync(x => x.TestimonialId == id);

            if (existingTestimonial == null) return NotFound();

            // Kiểm tra và xóa ảnh cũ nếu có thay đổi
            if (!string.IsNullOrEmpty(existingTestimonial.AvatarUrl) &&
                existingTestimonial.AvatarUrl != tblTestimonial.AvatarUrl)
            {
                DeleteFileFromServer(existingTestimonial.AvatarUrl);
            }


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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblTestimonial(int id)
        {
            var tblTestimonial = await _context.TblTestimonials.FindAsync(id);
            if (tblTestimonial == null) return NotFound();

            //xóa ảnh
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