using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class InventoryAdjustmentsController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public InventoryAdjustmentsController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAdjustment(InventoryAdjustmentDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var adjustment = new TblInventoryAdjustment
            {
                ProductId = dto.ProductId,
                UserId = dto.UserId,
                QuantityAdjusted = dto.QuantityAdjusted,
                Reason = dto.Reason, 
                CreatedAt = DateTime.Now
            };
            _context.TblInventoryAdjustments.Add(adjustment);

            var product = await _context.TblProducts.FindAsync(dto.ProductId);
            if (product == null) return NotFound("Sản phẩm không tồn tại");

            product.StockQuantity = (product.StockQuantity ?? 0) + dto.QuantityAdjusted;
            product.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { success = true, message = "Đã cập nhật tồn kho thành công!" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }
    }
}