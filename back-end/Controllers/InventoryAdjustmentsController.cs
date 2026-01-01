using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryAdjustmentsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        // 1. Thêm Accessor để lấy domain hiện tại (giống StatisticsController)
        private readonly IHttpContextAccessor _httpContextAccessor;

        public InventoryAdjustmentsController(DbplantShopThuanCuongContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        // 2. Hàm helper xử lý URL ảnh (Copy y chang từ StatisticsController)
        private string GetFullImageUrl(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return "";
            if (relativePath.StartsWith("http")) return relativePath;

            var request = _httpContextAccessor.HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";
            var formattedPath = relativePath.StartsWith("/") ? relativePath : "/" + relativePath;

            return $"{baseUrl}{formattedPath}";
        }

        // API GHI NHẬN ĐIỀU CHỈNH KHO (Giữ nguyên)
        [HttpPost]
        public async Task<IActionResult> CreateAdjustment(InventoryAdjustmentDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var adjustment = new TblInventoryAdjustment
                {
                    VariantId = dto.VariantId,
                    UserId = dto.UserId,
                    QuantityAdjusted = dto.QuantityAdjusted,
                    Reason = dto.Reason,
                    CreatedAt = DateTime.Now
                };
                _context.TblInventoryAdjustments.Add(adjustment);

                var variant = await _context.TblProductVariants.FindAsync(dto.VariantId);

                if (variant == null)
                    return NotFound($"Biến thể sản phẩm (ID: {dto.VariantId}) không tồn tại");

                variant.StockQuantity = (variant.StockQuantity ?? 0) + dto.QuantityAdjusted;

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

        // API LẤY LỊCH SỬ ĐIỀU CHỈNH (Đã sửa để dùng GetFullImageUrl)
        [HttpGet]
        public async Task<IActionResult> GetHistory(DateTime? fromDate, DateTime? toDate)
        {
            try
            {
                var query = _context.TblInventoryAdjustments
                    .Include(a => a.User)
                    .Include(a => a.Variant)
                        .ThenInclude(v => v.Product) // Lấy thông tin SP cha
                    .Include(a => a.Variant)
                        .ThenInclude(v => v.Image)   // Lấy ảnh riêng của biến thể
                    .Include(a => a.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.TblProductImages) // Lấy ảnh của SP cha (để fallback)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(x => x.CreatedAt >= fromDate.Value);

                if (toDate.HasValue)
                {
                    var nextDay = toDate.Value.AddDays(1);
                    query = query.Where(x => x.CreatedAt < nextDay);
                }

                var rawData = await query
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync(); // Lấy dữ liệu về trước để xử lý URL (do GetFullImageUrl cần HttpContext)

                // Map dữ liệu sang DTO
                var historyList = rawData.Select(x => {
                    // Logic chọn ảnh: Ưu tiên ảnh Variant -> Ảnh thumbnail SP -> Ảnh đầu tiên của SP
                    string rawImage = "";

                    if (x.Variant.Image != null)
                    {
                        rawImage = x.Variant.Image.ImageUrl;
                    }
                    else if (x.Variant.Product != null && x.Variant.Product.TblProductImages.Any())
                    {
                        // Tìm ảnh thumbnail, nếu không có lấy ảnh đầu tiên
                        var thumb = x.Variant.Product.TblProductImages.FirstOrDefault(i => i.IsThumbnail == true);
                        rawImage = thumb != null ? thumb.ImageUrl : x.Variant.Product.TblProductImages.First().ImageUrl;
                    }

                    return new InventoryAdjustmentHistoryDto
                    {
                        AdjustmentId = x.AdjustmentId,
                        ProductName = x.Variant.Product != null ? x.Variant.Product.ProductName : "SP đã xóa",
                        VariantName = x.Variant.VariantName,

                        // 3. Áp dụng hàm xử lý URL tại đây
                        ImageUrl = GetFullImageUrl(rawImage),

                        QuantityAdjusted = x.QuantityAdjusted,
                        Reason = x.Reason,
                        FullName = x.User != null ? x.User.FullName : "Unknown",
                        CreatedAt = x.CreatedAt ?? DateTime.Now
                    };
                }).ToList();

                return Ok(historyList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi tải lịch sử: {ex.Message}");
            }
        }
    }
}