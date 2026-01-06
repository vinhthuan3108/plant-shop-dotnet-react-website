using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace back_end.Controllers // Đảm bảo namespace đúng với project của bạn
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportReceiptsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public ImportReceiptsController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        
        [HttpGet]
        public async Task<ActionResult> GetReceipts(
            DateTime? fromDate,
            DateTime? toDate,
            int? supplierId,
            string? keyword,      
            decimal? minPrice,    
            decimal? maxPrice     
        )
        {
            var query = _context.TblImportReceipts
                .Include(r => r.Supplier)
                .Include(r => r.Creator)
                .AsQueryable();

            
            if (fromDate.HasValue) query = query.Where(r => r.ImportDate >= fromDate);
            if (toDate.HasValue) query = query.Where(r => r.ImportDate <= toDate);

            
            if (supplierId.HasValue) query = query.Where(r => r.SupplierId == supplierId);

            
            if (!string.IsNullOrEmpty(keyword))
            {
                
                query = query.Where(r =>
                    r.Supplier.SupplierName.Contains(keyword) ||
                    r.Creator.FullName.Contains(keyword) ||
                    r.ReceiptId.ToString().Contains(keyword)
                );
            }

            
            if (minPrice.HasValue)
            {
                query = query.Where(r => r.TotalAmount >= minPrice);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(r => r.TotalAmount <= maxPrice);
            }

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

        

        [HttpGet("{id}")]
        public async Task<ActionResult> GetReceiptDetail(int id)
        {
            var detail = await _context.TblImportReceiptDetails
                .Include(d => d.Variant)
                    .ThenInclude(v => v.Product)
                .Where(d => d.ReceiptId == id)
                .Select(d => new
                {
                    d.DetailId,
                    d.VariantId,
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
            var userIdClaim = User.FindFirst("UserId");
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
                        VariantId = item.VariantId,
                        Quantity = item.Quantity,
                        ImportPrice = item.ImportPrice
                    };
                    _context.TblImportReceiptDetails.Add(detail);

                    var variant = await _context.TblProductVariants.FindAsync(item.VariantId);
                    if (variant != null)
                    {
                        variant.StockQuantity = (variant.StockQuantity ?? 0) + item.Quantity;
                    }
                }

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

        [HttpPut("{id}/update-price")]
        public async Task<IActionResult> UpdateReceiptPrice(int id, [FromBody] List<UpdateReceiptPriceDto> updates)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var receipt = await _context.TblImportReceipts
                    .Include(r => r.TblImportReceiptDetails)
                    .ThenInclude(d => d.Variant)
                    .FirstOrDefaultAsync(r => r.ReceiptId == id);
                if (receipt == null) return NotFound("Không tìm thấy phiếu nhập.");

                decimal newTotalAmount = 0;
                foreach (var detail in receipt.TblImportReceiptDetails)
                {
                    var updateItem = updates.FirstOrDefault(u => u.DetailId == detail.DetailId);
                    if (updateItem != null)
                    {
                        detail.ImportPrice = updateItem.NewImportPrice;
                        if (detail.Variant != null)
                        {
                            detail.Variant.OriginalPrice = updateItem.NewImportPrice;
                        }
                    }
                    newTotalAmount += detail.Quantity * detail.ImportPrice;
                }

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
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var receipt = await _context.TblImportReceipts
                    .Include(r => r.TblImportReceiptDetails)
                        .ThenInclude(d => d.Variant)
                    .FirstOrDefaultAsync(r => r.ReceiptId == id);
                if (receipt == null)
                    return NotFound(new { message = "Không tìm thấy phiếu nhập." });

                foreach (var detail in receipt.TblImportReceiptDetails)
                {
                    if (detail.Variant == null) continue;
                    int currentStock = detail.Variant.StockQuantity ?? 0;

                    if (currentStock < detail.Quantity)
                    {
                        return BadRequest(new
                        {
                            message = $"Không thể xóa! Sản phẩm '{detail.Variant.VariantName}' hiện chỉ còn {currentStock} trong kho (đã nhập {detail.Quantity}). Hàng đã được bán hoặc xuất đi."
                        });
                    }
                }

                foreach (var detail in receipt.TblImportReceiptDetails)
                {
                    if (detail.Variant != null)
                    {
                        detail.Variant.StockQuantity -= detail.Quantity;
                        if (detail.Variant.StockQuantity < 0) detail.Variant.StockQuantity = 0;
                    }
                }

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
}