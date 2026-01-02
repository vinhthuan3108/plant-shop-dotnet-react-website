using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;


//cái này không dùng nữa
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblNewsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblNewsController(DbplantShopThuanCuongContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblNew>>> GetNews()
        {
            return await _context.TblNews.Where(x => x.IsActive == true).ToListAsync();
        }
    }
}