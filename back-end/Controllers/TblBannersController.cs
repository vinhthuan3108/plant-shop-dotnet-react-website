using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblBannersController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IWebHostEnvironment _environment;

        public TblBannersController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/TblBanners/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<TblBanner>>> GetBannersForAdmin()
        {
            return await _context.TblBanners.OrderBy(b => b.DisplayOrder).ToListAsync();
        }

        // GET: api/TblBanners/public
        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<TblBanner>>> GetBannersForClient()
        {
            return await _context.TblBanners
                .Where(b => b.IsActive == true)
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync();
        }

        // POST: api/TblBanners
        // Nhận JSON: { "title": "...", "imageUrl": "/banners/abc.jpg", ... }
        [HttpPost]
        public async Task<ActionResult<TblBanner>> CreateBanner([FromBody] TblBanner banner)
        {
            // Vì ảnh đã upload ở UploadController rồi, ở đây chỉ việc lưu thông tin
            _context.TblBanners.Add(banner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBannersForAdmin), new { id = banner.BannerId }, banner);
        }

        // PUT: api/TblBanners/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBanner(int id, [FromBody] TblBanner banner)
        {
            if (id != banner.BannerId) return BadRequest();

            // Logic xóa ảnh cũ nếu người dùng đổi ảnh mới
            var oldBanner = await _context.TblBanners.AsNoTracking().FirstOrDefaultAsync(x => x.BannerId == id);

            if (oldBanner != null && oldBanner.ImageUrl != banner.ImageUrl)
            {
                // Nếu đường dẫn ảnh mới khác ảnh cũ -> Xóa ảnh cũ đi cho nhẹ server
                var oldPath = Path.Combine(_environment.WebRootPath, oldBanner.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            _context.Entry(banner).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.TblBanners.Any(e => e.BannerId == id)) return NotFound();
                else throw;
            }

            return Ok(banner);
        }

        // DELETE: api/TblBanners/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var banner = await _context.TblBanners.FindAsync(id);
            if (banner == null) return NotFound();

            // Xóa file vật lý
            if (!string.IsNullOrEmpty(banner.ImageUrl))
            {
                var filePath = Path.Combine(_environment.WebRootPath, banner.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            }

            _context.TblBanners.Remove(banner);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Deleted successfully" });
        }
    }
}