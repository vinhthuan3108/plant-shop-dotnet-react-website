using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Cần thiết để FindAsync hoạt động tốt

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
                VariantId = dto.VariantId, // Sửa ProductId -> VariantId
                UserId = dto.UserId,
                QuantityAdjusted = dto.QuantityAdjusted,
                Reason = dto.Reason,
                CreatedAt = DateTime.Now
            };
            _context.TblInventoryAdjustments.Add(adjustment);

            // Tìm Variant thay vì Product
            var variant = await _context.TblProductVariants.FindAsync(dto.VariantId);

            if (variant == null)
                return NotFound($"Biến thể sản phẩm (ID: {dto.VariantId}) không tồn tại");

            // Cộng/Trừ kho của Variant
            variant.StockQuantity = (variant.StockQuantity ?? 0) + dto.QuantityAdjusted;

            // Cập nhật ngày sửa của sản phẩm cha (không bắt buộc, nhưng nên làm)
            // Lưu ý: Cần load Product nếu FindAsync chưa load
            // Hoặc đơn giản chỉ update variant nếu không cần tracking ngày sửa cha

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