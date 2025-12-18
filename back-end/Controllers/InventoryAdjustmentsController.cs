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
        // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Lưu log vào bảng TblInventoryAdjustments
            var adjustment = new TblInventoryAdjustment
            {
                ProductId = dto.ProductId,
                UserId = dto.UserId,
                QuantityAdjusted = dto.QuantityAdjusted,
                Reason = dto.Reason, // Nhận trực tiếp chuỗi text từ FE
                CreatedAt = DateTime.Now
            };
            _context.TblInventoryAdjustments.Add(adjustment);

            // 2. Tác vụ hệ thống: Cập nhật tồn kho ngay lập tức
            var product = await _context.TblProducts.FindAsync(dto.ProductId);
            if (product == null) return NotFound("Sản phẩm không tồn tại");

            // Số lượng điều chỉnh có thể âm (giảm) hoặc dương (tăng)
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