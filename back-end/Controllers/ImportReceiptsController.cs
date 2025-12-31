using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
public class ImportReceiptsController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public ImportReceiptsController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    // GET: api/ImportReceipts
    [HttpGet]
    public async Task<ActionResult> GetReceipts(DateTime? fromDate, DateTime? toDate, int? supplierId)
    {
        var query = _context.TblImportReceipts
            .Include(r => r.Supplier)
            .Include(r => r.Creator)
            .AsQueryable();

        if (fromDate.HasValue) query = query.Where(r => r.ImportDate >= fromDate);
        if (toDate.HasValue) query = query.Where(r => r.ImportDate <= toDate);
        if (supplierId.HasValue) query = query.Where(r => r.SupplierId == supplierId);

        var result = await query.OrderByDescending(r => r.ImportDate).Select(r => new
        {
            r.ReceiptId,
            SupplierName = r.Supplier.SupplierName,
            r.TotalAmount,
            r.ImportDate,
            CreatorName = r.Creator.FullName,
            r.Note
        }).ToListAsync();

        return Ok(result);
    }

    // GET: api/ImportReceipts/5
    [HttpGet("{id}")]
    public async Task<ActionResult> GetReceiptDetail(int id)
    {
        // 
        var detail = await _context.TblImportReceiptDetails
            .Include(d => d.Variant)          // Link tới Variant
                .ThenInclude(v => v.Product)  // Từ Variant lấy thông tin Product
            .Where(d => d.ReceiptId == id)
            .Select(d => new
            {
                d.DetailId,
                d.VariantId, // Trả về VariantId
                // Lấy tên sản phẩm + tên biến thể
                ProductName = d.Variant.Product.ProductName,
                VariantName = d.Variant.VariantName,

                d.Quantity,
                d.ImportPrice,
                SubTotal = d.Quantity * d.ImportPrice
            }).ToListAsync();

        return Ok(detail);
    }

    [HttpPost]
    [Authorize(Roles = "1, 4")]
    public async Task<IActionResult> CreateReceipt(ImportReceiptCreateDto dto)
    {
        var userIdClaim = User.FindFirst("UserId"); // Hoặc ClaimTypes.NameIdentifier tùy cấu hình
        if (userIdClaim == null) return Unauthorized(new { message = "Không tìm thấy thông tin người dùng." });

        int loggedInUserId = int.Parse(userIdClaim.Value);

        if (dto.Details == null || !dto.Details.Any())
            return BadRequest("Phải chọn ít nhất 1 sản phẩm để nhập kho.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var receipt = new TblImportReceipt
            {
                SupplierId = dto.SupplierId,
                ImportDate = dto.ImportDate,
                Note = dto.Note,
                CreatorId = loggedInUserId,
                TotalAmount = dto.Details.Sum(d => d.Quantity * d.ImportPrice)
            };

            _context.TblImportReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            foreach (var item in dto.Details)
            {
                var detail = new TblImportReceiptDetail
                {
                    ReceiptId = receipt.ReceiptId,
                    VariantId = item.VariantId, // Sửa ProductId -> VariantId
                    Quantity = item.Quantity,
                    ImportPrice = item.ImportPrice
                };
                _context.TblImportReceiptDetails.Add(detail);

                // Cập nhật kho trong bảng Variant
                var variant = await _context.TblProductVariants.FindAsync(item.VariantId);
                if (variant != null)
                {
                    variant.StockQuantity = (variant.StockQuantity ?? 0) + item.Quantity;
                    // Nếu muốn cập nhật giá gốc theo giá nhập mới (tùy logic):
                    // variant.OriginalPrice = item.ImportPrice; 
                }
            }

            // Cập nhật UpdatedAt của sản phẩm cha (để biết mới có thay đổi)
            // Logic này tùy chọn, nhưng tốt cho việc tracking
            var variantIds = dto.Details.Select(d => d.VariantId).Distinct().ToList();
            var productsToUpdate = await _context.TblProductVariants
                .Where(v => variantIds.Contains(v.VariantId))
                .Select(v => v.Product)
                .Distinct()
                .ToListAsync();

            foreach (var p in productsToUpdate) p.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { success = true, message = "Nhập hàng và cập nhật kho thành công!" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }
    }
    // PUT: api/ImportReceipts/5/update-price
    [HttpPut("{id}/update-price")]
    
    public async Task<IActionResult> UpdateReceiptPrice(int id, [FromBody] List<UpdateReceiptPriceDto> updates)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var receipt = await _context.TblImportReceipts
                .Include(r => r.TblImportReceiptDetails)
                .ThenInclude(d => d.Variant) // Include để cập nhật lại giá gốc SP nếu cần
                .FirstOrDefaultAsync(r => r.ReceiptId == id);

            if (receipt == null) return NotFound("Không tìm thấy phiếu nhập.");

            decimal newTotalAmount = 0;

            foreach (var detail in receipt.TblImportReceiptDetails)
            {
                // Tìm thông tin cập nhật tương ứng với DetailId này
                var updateItem = updates.FirstOrDefault(u => u.DetailId == detail.DetailId);

                if (updateItem != null)
                {
                    // 1. Cập nhật giá nhập trong lịch sử
                    detail.ImportPrice = updateItem.NewImportPrice;

                    // 2. Tùy chọn: Cập nhật lại giá vốn hiện tại của sản phẩm (OriginalPrice)
                    // Nếu đây là phiếu nhập sai làm giá vốn hiện tại bị sai, ta cần sửa lại nó.
                    if (detail.Variant != null)
                    {
                        detail.Variant.OriginalPrice = updateItem.NewImportPrice;
                    }
                }

                // Cộng dồn lại tổng tiền phiếu
                newTotalAmount += detail.Quantity * detail.ImportPrice;
            }

            // Cập nhật tổng tiền phiếu
            receipt.TotalAmount = newTotalAmount;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Cập nhật giá vốn thành công!", totalAmount = newTotalAmount });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, "Lỗi cập nhật: " + ex.Message);
        }
    }
    [HttpDelete("{id}")]
     // Chỉ cho phép Admin hoặc Quản lý xóa
    public async Task<IActionResult> DeleteReceipt(int id)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Lấy thông tin phiếu và chi tiết, kèm theo thông tin Variant để check kho
            var receipt = await _context.TblImportReceipts
                .Include(r => r.TblImportReceiptDetails)
                    .ThenInclude(d => d.Variant)
                .FirstOrDefaultAsync(r => r.ReceiptId == id);

            if (receipt == null)
                return NotFound(new { message = "Không tìm thấy phiếu nhập." });

            // 2. KIỂM TRA ĐIỀU KIỆN AN TOÀN KHO
            foreach (var detail in receipt.TblImportReceiptDetails)
            {
                // Nếu sản phẩm/biến thể đã bị xóa hoặc không tồn tại
                if (detail.Variant == null) continue;

                int currentStock = detail.Variant.StockQuantity ?? 0;

                // Logic quan trọng: Nếu tồn kho hiện tại < số lượng đã nhập
                // Nghĩa là hàng đã bị bán đi rồi -> Không được phép xóa phiếu này để tránh âm kho
                if (currentStock < detail.Quantity)
                {
                    return BadRequest(new
                    {
                        message = $"Không thể xóa! Sản phẩm '{detail.Variant.VariantName}' hiện chỉ còn {currentStock} trong kho (đã nhập {detail.Quantity}). Hàng đã được bán hoặc xuất đi."
                    });
                }
            }

            // 3. NẾU THỎA MÃN, TIẾN HÀNH TRỪ KHO VÀ XÓA
            foreach (var detail in receipt.TblImportReceiptDetails)
            {
                if (detail.Variant != null)
                {
                    detail.Variant.StockQuantity -= detail.Quantity;
                    // Đảm bảo không âm (dù logic trên đã check, nhưng check lại cho chắc)
                    if (detail.Variant.StockQuantity < 0) detail.Variant.StockQuantity = 0;
                }
            }

            // Xóa chi tiết và phiếu (Cascade delete thường tự xử lý chi tiết, nhưng code rõ ràng thì tốt hơn)
            _context.TblImportReceiptDetails.RemoveRange(receipt.TblImportReceiptDetails);
            _context.TblImportReceipts.Remove(receipt);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Xóa phiếu nhập và hoàn tác tồn kho thành công." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }
    }
}