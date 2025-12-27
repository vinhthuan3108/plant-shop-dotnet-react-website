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
    [Authorize]
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
}