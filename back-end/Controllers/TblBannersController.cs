using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models; // Đảm bảo đúng namespace Models của bạn

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblBannersController : ControllerBase
    {
        // Thay tên Context cho đúng với file Program.cs của bạn
        // Dựa vào ảnh cũ, tên Context của bạn là DbPlantShopThuanCuongContext
        private readonly DbplantShopThuanCuongContext _context;

        public TblBannersController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // GET: api/TblBanners
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblBanner>>> GetTblBanners()
        {
            // Kiểm tra nếu bảng null
            if (_context.TblBanners == null)
            {
                return NotFound();
            }

            // Lấy danh sách Banner đang hoạt động (IsActive = true)
            // Sắp xếp theo thứ tự hiển thị (DisplayOrder)
            return await _context.TblBanners
                .Where(b => b.IsActive == true)
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync();
        }
    }
}