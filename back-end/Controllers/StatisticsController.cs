using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public StatisticsController(DbplantShopThuanCuongContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        // Hàm helper xử lý URL ảnh
        private string GetFullImageUrl(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return "";
            if (relativePath.StartsWith("http")) return relativePath;

            var request = _httpContextAccessor.HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";
            var formattedPath = relativePath.StartsWith("/") ? relativePath : "/" + relativePath;

            return $"{baseUrl}{formattedPath}";
        }

        // 1. Thống kê Doanh thu & Lợi nhuận
        [HttpGet("revenue")]
        public async Task<ActionResult<StatisticsResponse>> GetRevenueStats(DateTime startDate, DateTime endDate)
        {
            var fromDate = startDate.Date;
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            var orders = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                .Where(o => o.OrderDate >= fromDate && o.OrderDate <= toDate)
                .Where(o => o.OrderStatus == "Completed")
                .ToListAsync();

            var importStats = await _context.TblImportReceiptDetails
                .GroupBy(x => x.VariantId)
                .Select(g => new
                {
                    VariantId = g.Key,
                    TotalImportValue = g.Sum(x => x.Quantity * x.ImportPrice),
                    TotalImportQty = g.Sum(x => x.Quantity)
                })
                .ToListAsync();

            var avgCostMap = importStats.ToDictionary(
                k => k.VariantId,
                v => v.TotalImportQty > 0 ? (v.TotalImportValue / v.TotalImportQty) : 0
            );

            var dailyStats = orders
                .GroupBy(o => o.OrderDate.Value.Date)
                .Select(g =>
                {
                    decimal revenue = g.Sum(o => o.TotalAmount ?? 0);
                    decimal dailyShipping = g.Sum(o => o.ShippingFee ?? 0);
                    decimal totalCost = 0;
                    foreach (var order in g)
                    {
                        foreach (var detail in order.TblOrderDetails)
                        {
                            decimal importPrice = avgCostMap.ContainsKey(detail.VariantId) ? avgCostMap[detail.VariantId] : 0;
                            totalCost += importPrice * detail.Quantity;
                        }
                    }

                    return new RevenueStatDto
                    {
                        Date = g.Key,
                        Revenue = revenue,
                        Profit = revenue - dailyShipping - totalCost
                    };
                })
                .OrderBy(s => s.Date)
                .ToList();

            decimal totalShippingPeriod = orders.Sum(o => o.ShippingFee ?? 0);
            var totalImportCost = await _context.TblImportReceipts
                .Where(r => r.ImportDate >= fromDate && r.ImportDate <= toDate)
                .SumAsync(r => r.TotalAmount ?? 0);

            decimal totalRevenue = dailyStats.Sum(x => x.Revenue);
            var response = new StatisticsResponse
            {
                TotalOrders = orders.Count,
                TotalRevenue = totalRevenue,
                TotalProfit = dailyStats.Sum(x => x.Profit),
                TotalShipping = totalShippingPeriod,
                TotalImportCost = totalImportCost,
                NetCashFlow = totalRevenue - totalShippingPeriod - totalImportCost,
                DailyStats = dailyStats
            };

            return Ok(response);
        }

        // 2. Thống kê Sản phẩm (Bán chạy & Tồn kho)
        [HttpGet("products")]
        public async Task<ActionResult<ProductStatsResponse>> GetProductStats(
            DateTime startDate,
            DateTime endDate,
            int? categoryId = null,
            int slowMovingDays = 60,
            int page = 1,
            int pageSize = 10)
        {
            var fromDate = startDate.Date;
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            // --- A. TÍNH GIÁ VỐN TRUNG BÌNH ---
            var importStats = await _context.TblImportReceiptDetails
                .GroupBy(x => x.VariantId)
                .Select(g => new
                {
                    VariantId = g.Key,
                    AvgCost = g.Sum(x => x.Quantity) > 0 ? g.Sum(x => x.Quantity * x.ImportPrice) / g.Sum(x => x.Quantity) : 0
                })
                .ToListAsync();

            var avgCostMap = importStats.ToDictionary(k => k.VariantId, v => v.AvgCost);

            // --- B. XỬ LÝ TOP SẢN PHẨM BÁN CHẠY (CÓ PHÂN TRANG) ---
            var query = _context.TblOrderDetails
                .Include(d => d.Order)
                .Include(d => d.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Category)
                .Include(d => d.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.TblProductImages)
                .Where(d => d.Order.OrderDate >= fromDate && d.Order.OrderDate <= toDate)
                .Where(d => d.Order.OrderStatus == "Completed")
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(d => d.Variant.Product.CategoryId == categoryId.Value);
            }

            var orderDetails = await query.ToListAsync();

            // Group dữ liệu và tính toán
            var groupedStats = orderDetails
                .GroupBy(d => d.Variant.ProductId)
                .Select(g => {
                    var product = g.First().Variant.Product;

                    var thumbRelative = product.TblProductImages.FirstOrDefault(i => i.IsThumbnail == true)?.ImageUrl
                                        ?? product.TblProductImages.FirstOrDefault()?.ImageUrl
                                        ?? "";
                    var thumbFull = GetFullImageUrl(thumbRelative);

                    decimal totalRevenue = g.Sum(d => d.Quantity * d.PriceAtTime);
                    decimal totalCost = g.Sum(d => d.Quantity * (avgCostMap.ContainsKey(d.VariantId) ? avgCostMap[d.VariantId] : 0));

                    return new TopProductDto
                    {
                        ProductName = product.ProductName,
                        Thumbnail = thumbFull,
                        QuantitySold = g.Sum(d => d.Quantity),
                        TotalRevenue = totalRevenue,
                        TotalProfit = totalRevenue - totalCost
                    };
                })
                .OrderByDescending(x => x.QuantitySold)
                .ToList();

            // Phân trang trên RAM
            int totalItems = groupedStats.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var pagedTopProducts = groupedStats
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // --- C. BIỂU ĐỒ TRÒN (CATEGORY SHARE) ---
            var categoryShares = orderDetails
                .GroupBy(d => d.Variant.Product.Category.CategoryName)
                .Select(g => new CategoryShareDto
                {
                    CategoryName = g.Key,
                    TotalSold = g.Sum(d => d.Quantity)
                })
                .ToList();

            // --- D. HÀNG TỒN KHO LÂU (SLOW MOVING) ---
            // Đã thêm lại đoạn code bị thiếu ở đây
            var thresholdDate = DateTime.Now.AddDays(-slowMovingDays);

            var inventoryProducts = await _context.TblProducts
                .Include(p => p.Category)
                .Include(p => p.TblProductImages)
                .Include(p => p.TblProductVariants)
                .Where(p => p.TblProductVariants.Sum(v => v.StockQuantity) > 0)
                .ToListAsync();

            var recentSoldProductIds = await _context.TblOrderDetails
                .Include(d => d.Order)
                .Where(d => d.Order.OrderDate >= thresholdDate)
                .Select(d => d.Variant.ProductId)
                .Distinct()
                .ToListAsync();

            // Tạo danh sách slowMovingList
            var slowMovingList = inventoryProducts
                .Where(p => !recentSoldProductIds.Contains(p.ProductId))
                .Select(p => {
                    // Tìm ngày nhập cuối
                    var lastImport = _context.TblImportReceiptDetails
                        .Include(id => id.Receipt)
                        .Where(id => id.Variant.ProductId == p.ProductId)
                        .OrderByDescending(id => id.Receipt.ImportDate)
                        .Select(id => id.Receipt.ImportDate)
                        .FirstOrDefault();

                    var thumbRelative = p.TblProductImages.FirstOrDefault(i => i.IsThumbnail == true)?.ImageUrl
                                        ?? p.TblProductImages.FirstOrDefault()?.ImageUrl
                                        ?? "";
                    var thumbFull = GetFullImageUrl(thumbRelative);

                    decimal stuckCapital = p.TblProductVariants.Sum(v =>
                        (v.StockQuantity ?? 0) * (avgCostMap.ContainsKey(v.VariantId) ? avgCostMap[v.VariantId] : 0));

                    return new SlowMovingProductDto
                    {
                        ProductName = p.ProductName,
                        CategoryName = p.Category.CategoryName,
                        Thumbnail = thumbFull,
                        StockQuantity = p.TblProductVariants.Sum(v => v.StockQuantity ?? 0),
                        CapitalPrice = stuckCapital,
                        LastImportDate = lastImport,
                        DaysSinceLastImport = lastImport.HasValue ? (DateTime.Now - lastImport.Value).Days : 0
                    };
                })
                .OrderByDescending(x => x.DaysSinceLastImport)
                .Take(20)
                .ToList();

            // --- E. TRẢ VỀ KẾT QUẢ ---
            return Ok(new ProductStatsResponse
            {
                TopProducts = pagedTopProducts, // Danh sách đã phân trang
                TotalProducts = totalItems,     // Tổng số SP
                TotalPages = totalPages,        // Tổng số trang
                CurrentPage = page,             // Trang hiện tại

                CategoryShares = categoryShares,
                SlowMovingProducts = slowMovingList // Biến này giờ đã tồn tại
            });
        }
    }
}