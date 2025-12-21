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

        [HttpGet("revenue")]
        public async Task<ActionResult<StatisticsResponse>> GetRevenueStats(DateTime startDate, DateTime endDate)
        {
            // --- BƯỚC 1: XỬ LÝ LẠI THỜI GIAN (QUAN TRỌNG) ---
            // Đảm bảo lấy từ đầu ngày (00:00:00)
            var fromDate = startDate.Date;

            // Đảm bảo lấy đến hết cuối ngày (23:59:59)
            // Logic: Cộng thêm 1 ngày rồi lùi lại 1 tích tắc
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            // --- BƯỚC 2: TRUY VẤN DỮ LIỆU ---
            var orders = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                // Sử dụng biến fromDate và toDate mới tạo ở trên
                .Where(o => o.OrderDate >= fromDate && o.OrderDate <= toDate)

                // Lọc đơn hàng: Bỏ đơn đã hủy. 
                // Lưu ý: Kiểm tra kỹ trong Database xem trạng thái lưu là "Cancelled" hay "Đã hủy"
                // Nếu chưa chắc chắn, bạn có thể tạm thời comment dòng này lại để test xem dữ liệu có lên không
                .Where(o => o.OrderStatus != "Cancelled")
                .ToListAsync();

            // --- BƯỚC 3: TÍNH TOÁN CHI TIẾT ---
            var dailyStats = orders
                .GroupBy(o => o.OrderDate.Value.Date) // Nhóm theo ngày
                .Select(g => new RevenueStatDto
                {
                    Date = g.Key,
                    // Tổng doanh thu
                    Revenue = g.Sum(o => o.TotalAmount ?? 0),

                    // Lợi nhuận = Tổng doanh thu - Tổng giá vốn
                    Profit = g.Sum(o => o.TotalAmount ?? 0) - g.Sum(o => o.TblOrderDetails.Sum(d => d.CostPrice * d.Quantity))
                })
                .OrderBy(s => s.Date)
                .ToList();

            // --- BƯỚC 4: TỔNG HỢP KẾT QUẢ ---
            var response = new StatisticsResponse
            {
                TotalOrders = orders.Count,
                TotalRevenue = dailyStats.Sum(x => x.Revenue),
                TotalProfit = dailyStats.Sum(x => x.Profit),
                DailyStats = dailyStats
            };

            return Ok(response);
        }
        [HttpGet("products")]
        public async Task<ActionResult<ProductStatsResponse>> GetProductStats(DateTime startDate, DateTime endDate)
        {
            // 1. Xử lý thời gian
            var fromDate = startDate.Date;
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            // 2. Lấy danh sách đơn hàng để tính bán chạy
            var orderDetails = await _context.TblOrderDetails
                .Include(d => d.Order)
                .Include(d => d.Product)
                .ThenInclude(p => p.Category)
                .Where(d => d.Order.OrderDate >= fromDate && d.Order.OrderDate <= toDate)
                .Where(d => d.Order.OrderStatus != "Cancelled")
                .ToListAsync();

            // --- TÍNH TOÁN BÁN CHẠY ---
            var topProducts = orderDetails
                .GroupBy(d => d.ProductId)
                .Select(g => new TopProductDto
                {
                    ProductName = g.First().Product.ProductName,
                    QuantitySold = g.Sum(d => d.Quantity),
                    TotalRevenue = g.Sum(d => d.Quantity * d.PriceAtTime)
                })
                .OrderByDescending(x => x.QuantitySold)
                .Take(5)
                .ToList();

            var categoryShares = orderDetails
                .GroupBy(d => d.Product.Category.CategoryName)
                .Select(g => new CategoryShareDto
                {
                    CategoryName = g.Key,
                    TotalSold = g.Sum(d => d.Quantity)
                })
                .ToList();

            // --- TÍNH TOÁN TỒN KHO (MỚI) ---
            // Lấy 10 sản phẩm có số lượng tồn lớn nhất
            var topInventory = await _context.TblProducts
                .Include(p => p.Category)
                .Where(p => p.StockQuantity > 0) // Chỉ lấy sp còn hàng
                .OrderByDescending(p => p.StockQuantity) // Tồn nhiều nhất lên đầu
                .Take(10)
                .Select(p => new InventoryStatDto
                {
                    ProductName = p.ProductName,
                    CategoryName = p.Category.CategoryName,
                    StockQuantity = p.StockQuantity ?? 0,
                    Price = p.OriginalPrice
                })
                .ToListAsync();

            return Ok(new ProductStatsResponse
            {
                TopProducts = topProducts,
                CategoryShares = categoryShares,
                TopInventory = topInventory // Trả về dữ liệu tồn kho
            });
        }
    }

}

//Logic tính toán:

//Doanh thu: Lấy từ TotalAmount trong bảng TblOrder.

//Lợi nhuận: (Giá bán - Giá vốn) * Số lượng. Cần join bảng Order với OrderDetail.

//Điều kiện: Chỉ lấy đơn hàng đã hoàn thành (hoặc không bị hủy).