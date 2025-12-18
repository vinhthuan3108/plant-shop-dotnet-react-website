using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models; // Đảm bảo đúng namespace Models của bạn

[Route("api/[controller]")]
[ApiController]
public class TblPostCategoriesController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public TblPostCategoriesController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    // GET: api/TblPostCategories
    [HttpGet]
    public async Task<ActionResult> GetCategories()
    {
        // Lấy danh sách danh mục để hiện lên Dropdown ở Frontend
        var categories = await _context.TblPostCategories
            .Select(c => new { c.PostCategoryId, c.CategoryName })
            .ToListAsync();
        return Ok(categories);
    }
}