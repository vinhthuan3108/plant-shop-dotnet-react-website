using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QandAController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public QandAController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // GET: api/QandA
        // 1. API lấy tất cả (cho Admin)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblQandA>>> GetQandAs()
        {
            return await _context.TblQandAs
                                 .OrderBy(x => x.DisplayOrder) // Sắp xếp theo thứ tự hiển thị (tăng dần)
                                 .ThenByDescending(x => x.Id)  // Nếu trùng thứ tự thì cái mới lên trên
                                 .ToListAsync();
        }

        // 2. API lấy danh sách hiển thị (cho Client)
        [HttpGet("Active")]
        public async Task<ActionResult<IEnumerable<TblQandA>>> GetActiveQandAs()
        {
            return await _context.TblQandAs
                                 .Where(x => x.IsActive == true)
                                 .OrderBy(x => x.DisplayOrder) // Ưu tiên thứ tự hiển thị
                                 .ThenByDescending(x => x.Id)
                                 .ToListAsync();
        }

        // POST: api/QandA
        [HttpPost]
        public async Task<ActionResult<TblQandA>> CreateQandA(TblQandA qanda)
        {
            _context.TblQandAs.Add(qanda);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetQandAs", new { id = qanda.Id }, qanda);
        }

        // PUT: api/QandA/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQandA(int id, TblQandA qanda)
        {
            if (id != qanda.Id) return BadRequest();

            _context.Entry(qanda).State = EntityState.Modified;

            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.TblQandAs.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/QandA/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQandA(int id)
        {
            var qanda = await _context.TblQandAs.FindAsync(id);
            if (qanda == null) return NotFound();

            _context.TblQandAs.Remove(qanda);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}