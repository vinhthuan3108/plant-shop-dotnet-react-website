using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
[Route("api/[controller]")]
[ApiController]
public class SuppliersController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public SuppliersController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TblSupplier>>> GetSuppliers()
    {
        return await _context.TblSuppliers.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<TblSupplier>> PostSupplier(SupplierDto dto)
    {
        var supplier = new TblSupplier
        {
            SupplierName = dto.SupplierName,
            Email = dto.Email, 
            PhoneNumber = dto.PhoneNumber,
            Address = dto.Address,
            Note = dto.Note
        };

        _context.TblSuppliers.Add(supplier);
        await _context.SaveChangesAsync();
        return Ok(supplier);
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> PutSupplier(int id, SupplierDto dto)
    {
        var supplier = await _context.TblSuppliers.FindAsync(id);
        if (supplier == null) return NotFound();

        supplier.SupplierName = dto.SupplierName;
        supplier.Email = dto.Email; 
        supplier.PhoneNumber = dto.PhoneNumber;
        supplier.Address = dto.Address;
        supplier.Note = dto.Note;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSupplier(int id)
    {
        var supplier = await _context.TblSuppliers.FindAsync(id);
        if (supplier == null) return NotFound();

        _context.TblSuppliers.Remove(supplier);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}