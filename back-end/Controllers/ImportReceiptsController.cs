using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        // Lọc theo ngày nếu có
        if (fromDate.HasValue) query = query.Where(r => r.ImportDate >= fromDate);
        if (toDate.HasValue) query = query.Where(r => r.ImportDate <= toDate);

        // Lọc theo nhà cung cấp
        if (supplierId.HasValue) query = query.Where(r => r.SupplierId == supplierId);

        var result = await query.OrderByDescending(r => r.ImportDate).Select(r => new {
            r.ReceiptId,
            SupplierName = r.Supplier.SupplierName,
            r.TotalAmount,
            r.ImportDate,
            CreatorName = r.Creator.FullName, // Giả sử TblUsers có cột FullName
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
    public async Task<IActionResult> CreateReceipt(ImportReceiptCreateDto dto)
    {
        if (dto.Details == null || !dto.Details.Any())
            return BadRequest("Phải chọn ít nhất 1 sản phẩm để nhập kho.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Tạo Header cho Phiếu nhập
            var receipt = new TblImportReceipt
            {
                SupplierId = dto.SupplierId,
                ImportDate = dto.ImportDate,
                Note = dto.Note,
                CreatorId = dto.CreatorId, // ID người dùng thực hiện (Admin/Thủ kho)
                // Tính tổng tiền từ danh sách chi tiết
                TotalAmount = dto.Details.Sum(d => d.Quantity * d.ImportPrice)
            };

            _context.TblImportReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            // 2. Xử lý từng dòng chi tiết
            foreach (var item in dto.Details)
            {
                // Thêm chi tiết phiếu nhập
                var detail = new TblImportReceiptDetail
                {
                    ReceiptId = receipt.ReceiptId,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    ImportPrice = item.ImportPrice
                };
                _context.TblImportReceiptDetails.Add(detail);

                // CẬP NHẬT TỒN KHO TRONG TblProducts
                var product = await _context.TblProducts.FindAsync(item.ProductId);
                if (product != null)
                {
                    // Cộng dồn vào cột StockQuantity theo database của bạn
                    product.StockQuantity = (product.StockQuantity ?? 0) + item.Quantity;
                    product.UpdatedAt = DateTime.Now; // Cập nhật thời gian thay đổi
                }
            }

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