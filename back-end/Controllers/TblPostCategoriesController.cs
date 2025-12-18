using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class TblPostCategoriesController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public TblPostCategoriesController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TblPostCategory>>> GetCategories()
    {
        // Vì không có IsDeleted, ta lấy toàn bộ danh sách
        return await _context.TblPostCategories.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<TblPostCategory>> PostCategory(TblPostCategory category)
    {
        _context.TblPostCategories.Add(category);
        await _context.SaveChangesAsync();
        return Ok(category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutCategory(int id, TblPostCategory category)
    {
        if (id != category.PostCategoryId) return BadRequest();
        _context.Entry(category).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.TblPostCategories.FindAsync(id);
        if (category == null) return NotFound();

        // Xóa cứng (xóa hẳn khỏi DB) vì không có cột IsDeleted
        _context.TblPostCategories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}