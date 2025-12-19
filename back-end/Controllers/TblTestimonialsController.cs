using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblTestimonialsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblTestimonialsController(DbplantShopThuanCuongContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblTestimonial>>> GetReviews()
        {
            return await _context.TblTestimonials.Where(x => x.IsActive == true).ToListAsync();
        }
    }
}