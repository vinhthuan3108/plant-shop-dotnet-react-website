using System.Linq;
using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public StatisticsController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // 1. Thống kê Doanh thu & Lợi nhuận (Theo thời gian)
        [HttpGet("revenue")]
        public async Task<ActionResult<StatisticsResponse>> GetRevenueStats(DateTime startDate, DateTime endDate)
        {
            // Xử lý thời gian: Đầu ngày start -> Cuối ngày end
            var fromDate = startDate.Date;
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            // Lấy đơn hàng trong khoảng thời gian (Không lấy đơn hủy)
            var orders = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                .Where(o => o.OrderDate >= fromDate && o.OrderDate <= toDate)
                .Where(o => o.OrderStatus != "Cancelled")
                .ToListAsync();

            // Tính toán chi tiết theo ngày
            var dailyStats = orders
                .GroupBy(o => o.OrderDate.Value.Date)
                .Select(g => new RevenueStatDto
                {
                    Date = g.Key,
                    // Tổng doanh thu (Giá bán thực tế)
                    Revenue = g.Sum(o => o.TotalAmount ?? 0),

                    // Lợi nhuận = Tổng thu - Tổng giá vốn
                    // Giá vốn (CostPrice) đã được lưu trong OrderDetail lúc mua
                    Profit = g.Sum(o => o.TotalAmount ?? 0) - g.Sum(o => o.TblOrderDetails.Sum(d => d.CostPrice * d.Quantity))
                })
                .OrderBy(s => s.Date)
                .ToList();

            var response = new StatisticsResponse
            {
                TotalOrders = orders.Count,
                TotalRevenue = dailyStats.Sum(x => x.Revenue),
                TotalProfit = dailyStats.Sum(x => x.Profit),
                DailyStats = dailyStats
            };

            return Ok(response);
        }

        // 2. Thống kê Sản phẩm (Bán chạy & Tồn kho)
        [HttpGet("products")]
        public async Task<ActionResult<ProductStatsResponse>> GetProductStats(DateTime startDate, DateTime endDate)
        {
            var fromDate = startDate.Date;
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            // A. LẤY TOP SẢN PHẨM BÁN CHẠY (Dựa vào OrderDetails)
            // Vì OrderDetail giờ trỏ vào Variant, ta cần Group theo ProductId cha
            var orderDetails = await _context.TblOrderDetails
                .Include(d => d.Order)
                .Include(d => d.Variant)
                    .ThenInclude(v => v.Product) // Lấy thông tin sản phẩm cha
                        .ThenInclude(p => p.Category)
                .Where(d => d.Order.OrderDate >= fromDate && d.Order.OrderDate <= toDate)
                .Where(d => d.Order.OrderStatus != "Cancelled")
                .ToListAsync();

            // Nhóm theo ProductId (Gộp các variant lại thành 1 sản phẩm chung)
            var topProducts = orderDetails
                .GroupBy(d => d.Variant.ProductId)
                .Select(g => new TopProductDto
                {
                    // Lấy tên sản phẩm cha
                    ProductName = g.First().Variant.Product.ProductName,
                    // Tổng số lượng bán (tất cả các size)
                    QuantitySold = g.Sum(d => d.Quantity),
                    // Tổng doanh thu từ sản phẩm này
                    TotalRevenue = g.Sum(d => d.Quantity * d.PriceAtTime)
                })
                .OrderByDescending(x => x.QuantitySold)
                .Take(5)
                .ToList();

            // Thống kê theo Danh mục
            var categoryShares = orderDetails
                .GroupBy(d => d.Variant.Product.Category.CategoryName)
                .Select(g => new CategoryShareDto
                {
                    CategoryName = g.Key,
                    TotalSold = g.Sum(d => d.Quantity)
                })
                .ToList();

            // B. TÍNH TOÁN TỒN KHO (LOGIC MỚI: Dựa vào bảng Variants)
            // Lấy danh sách sản phẩm và tính tổng tồn kho từ các biến thể con
            var allProducts = await _context.TblProducts
                .Include(p => p.Category)
                .Include(p => p.TblProductVariants) // Include để tính tổng
                .ToListAsync();

            // Lọc và sắp xếp trong bộ nhớ (Client-side evaluation) vì EF Core khó GroupBy phức tạp
            var topInventory = allProducts
                .Select(p => new InventoryStatDto
                {
                    ProductName = p.ProductName,
                    CategoryName = p.Category.CategoryName,

                    // Tổng tồn kho = Tổng stock của các biến thể
                    StockQuantity = p.TblProductVariants.Sum(v => v.StockQuantity ?? 0),

                    // Giá hiển thị: Lấy giá thấp nhất của biến thể
                    Price = p.TblProductVariants.OrderBy(v => v.OriginalPrice).Select(v => v.OriginalPrice).FirstOrDefault()
                })
                .Where(p => p.StockQuantity > 0) // Chỉ lấy sp còn hàng
                .OrderByDescending(p => p.StockQuantity) // Tồn nhiều nhất lên đầu
                .Take(10)
                .ToList();

            return Ok(new ProductStatsResponse
            {
                TopProducts = topProducts,
                CategoryShares = categoryShares,
                TopInventory = topInventory
            });
        }
    }
}