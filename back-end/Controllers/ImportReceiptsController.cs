using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // Thêm dòng này
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

        var result = await query.OrderByDescending(r => r.ImportDate).Select(r => new {
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
        var detail = await _context.TblImportReceiptDetails
            .Include(d => d.Product)
            .Where(d => d.ReceiptId == id)
            .Select(d => new {
                d.ProductId,
                ProductName = d.Product.ProductName,
                d.Quantity,
                d.ImportPrice,
                SubTotal = d.Quantity * d.ImportPrice
            }).ToListAsync();

        return Ok(detail);
    }
    [HttpPost]
    [Authorize] // <--- 1. Bắt buộc phải đăng nhập mới tạo được phiếu
    public async Task<IActionResult> CreateReceipt(ImportReceiptCreateDto dto)
    {
        // --- 2. Lấy UserId từ Token ---
        var userIdClaim = User.FindFirst("UserId");
        if (userIdClaim == null)
        {
            return Unauthorized(new { message = "Không tìm thấy thông tin người dùng." });
        }
        int loggedInUserId = int.Parse(userIdClaim.Value);
        // ------------------------------

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

                // --- 3. Gán ID lấy từ Token vào đây ---
                CreatorId = loggedInUserId,
                // (Không dùng dto.CreatorId nữa)

                TotalAmount = dto.Details.Sum(d => d.Quantity * d.ImportPrice)
            };

            _context.TblImportReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            // ... (Phần xử lý Details giữ nguyên như cũ) ...
            foreach (var item in dto.Details)
            {
                var detail = new TblImportReceiptDetail
                {
                    ReceiptId = receipt.ReceiptId,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    ImportPrice = item.ImportPrice
                };
                _context.TblImportReceiptDetails.Add(detail);

                var product = await _context.TblProducts.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity = (product.StockQuantity ?? 0) + item.Quantity;
                    product.UpdatedAt = DateTime.Now;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { success = true, message = "Nhập hàng và cập nhật kho thành công!" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            // Log lỗi ra console để debug nếu cần
            Console.WriteLine(ex.ToString());
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }
    }
}