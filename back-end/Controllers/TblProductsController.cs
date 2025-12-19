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
    public class TblProductsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblProductsController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // GET: api/TblProducts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblProduct>>> GetTblProducts()
        {

            return await _context.TblProducts
                                 .Include(p => p.Category)       
                                 .Include(p => p.TblProductImages) 
                                 .OrderByDescending(p => p.CreatedAt)
                                 .ToListAsync();
        }

        // GET: api/TblProducts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TblProduct>> GetTblProduct(int id)
        {
            var tblProduct = await _context.TblProducts.FindAsync(id);

            if (tblProduct == null)
            {
                return NotFound();
            }

            return tblProduct;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTblProduct(int id, TblProduct tblProduct)
        {
            if (id != tblProduct.ProductId)
            {
                return BadRequest();
            }


            tblProduct.UpdatedAt = DateTime.Now;

            _context.Entry(tblProduct).State = EntityState.Modified;


            _context.Entry(tblProduct).Property(x => x.CreatedAt).IsModified = false;


            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TblProductExists(id))
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

        // POST: api/TblProducts
        [HttpPost]
        public async Task<ActionResult<TblProduct>> PostTblProduct(TblProduct tblProduct)
        {
            tblProduct.CreatedAt = DateTime.Now; 
            tblProduct.UpdatedAt = DateTime.Now;
            _context.TblProducts.Add(tblProduct);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTblProduct", new { id = tblProduct.ProductId }, tblProduct);
        }

        // DELETE: api/TblProducts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTblProduct(int id)
        {
            var tblProduct = await _context.TblProducts.FindAsync(id);
            if (tblProduct == null)
            {
                return NotFound();
            }

            _context.TblProducts.Remove(tblProduct);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TblProductExists(int id)
        {
            return _context.TblProducts.Any(e => e.ProductId == id);
        }
    }
}
