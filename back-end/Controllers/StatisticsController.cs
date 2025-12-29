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
            var fromDate = startDate.Date;
            var toDate = endDate.Date.AddDays(1).AddTicks(-1);

            // 1. Lấy danh sách đơn hàng "Completed" trong khoảng thời gian
            var orders = await _context.TblOrders
                .Include(o => o.TblOrderDetails)
                .Where(o => o.OrderDate >= fromDate && o.OrderDate <= toDate)
                .Where(o => o.OrderStatus == "Completed") // <--- CHÍNH LÀ CỘT NÀY
                .ToListAsync();

            // 2. Tính giá vốn trung bình từ lịch sử nhập hàng (TblImportReceiptDetails)
            // (Lấy TẤT CẢ phiếu nhập để tính giá trung bình chính xác nhất)
            var importStats = await _context.TblImportReceiptDetails
                .GroupBy(x => x.VariantId)
                .Select(g => new
                {
                    VariantId = g.Key,
                    TotalImportValue = g.Sum(x => x.Quantity * x.ImportPrice),
                    TotalImportQty = g.Sum(x => x.Quantity)
                })
                .ToListAsync();

            // Tạo Map để tra cứu giá vốn nhanh: [VariantId] => [Giá trung bình]
            var avgCostMap = importStats.ToDictionary(
                k => k.VariantId,
                v => v.TotalImportQty > 0 ? (v.TotalImportValue / v.TotalImportQty) : 0
            );

            // 3. Tính toán chi tiết
            var dailyStats = orders
            .GroupBy(o => o.OrderDate.Value.Date)
            .Select(g =>
            {
                decimal revenue = g.Sum(o => o.TotalAmount ?? 0);

                // Tính tổng tiền ship trong ngày (để trừ ra khỏi lợi nhuận)
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

                    // TRẢ VỀ THÊM TIỀN SHIP TRONG NGÀY (Cần thêm thuộc tính này vào DTO nếu chưa có, hoặc tính tổng ở ngoài)
                    // Tuy nhiên để đơn giản, ta sẽ tính tổng Shipping ở bên dưới, 
                    // còn Profit ở đây ta trừ ship đi luôn.

                    // CÔNG THỨC MỚI: Lợi nhuận = Tổng thu - Tiền Ship - Giá vốn nhập
                    Profit = revenue - dailyShipping - totalCost
                };
            })
            .OrderBy(s => s.Date)
            .ToList();

            // Tính tổng ship toàn bộ giai đoạn
            decimal totalShippingPeriod = orders.Sum(o => o.ShippingFee ?? 0);
            var totalImportCost = await _context.TblImportReceipts
        .Where(r => r.ImportDate >= fromDate && r.ImportDate <= toDate)
        .SumAsync(r => r.TotalAmount ?? 0);

            // Tính toán các chỉ số tổng
            decimal totalRevenue = dailyStats.Sum(x => x.Revenue); // Tiền thu về từ khách
            decimal totalShipping = orders.Sum(o => o.ShippingFee ?? 0); // Tiền ship (thu hộ)
            decimal totalProfit = dailyStats.Sum(x => x.Profit); // Lợi nhuận sổ sách

            // CÔNG THỨC DÒNG TIỀN (CASH FLOW):
            // Tiền vào túi (Doanh thu) - Tiền ship (trả shipper) - Tiền chi ra nhập hàng (Bất kể bán được hay chưa)
            // Lưu ý: Đây là tiền thực tế còn lại trong két sắt sau giai đoạn này.
            decimal netCashFlow = totalRevenue - totalShipping - totalImportCost;
            var response = new StatisticsResponse
            {
                TotalOrders = orders.Count,
                TotalRevenue = dailyStats.Sum(x => x.Revenue),
                TotalProfit = dailyStats.Sum(x => x.Profit),

                // Bạn cần thêm thuộc tính này vào class StatisticsResponse DTO nhé
                TotalShipping = totalShippingPeriod,
                TotalImportCost = totalImportCost, // Tổng tiền chi nhập hàng
                NetCashFlow = netCashFlow,
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
                // THAY ĐỔI: Chỉ tính những đơn hàng đã hoàn thành ("Completed")
                .Where(d => d.Order.OrderStatus == "Completed") // <-- Đã sửa dòng này
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

            // Thống kê theo Danh mục (Cũng sẽ chỉ tính trên đơn Completed do dùng biến orderDetails ở trên)
            var categoryShares = orderDetails
                .GroupBy(d => d.Variant.Product.Category.CategoryName)
                .Select(g => new CategoryShareDto
                {
                    CategoryName = g.Key,
                    TotalSold = g.Sum(d => d.Quantity)
                })
                .ToList();

            // B. TÍNH TOÁN TỒN KHO (Giữ nguyên logic cũ vì tồn kho không phụ thuộc vào đơn hàng lịch sử)
            var allProducts = await _context.TblProducts
                .Include(p => p.Category)
                .Include(p => p.TblProductVariants)
                .ToListAsync();

            var topInventory = allProducts
                .Select(p => new InventoryStatDto
                {
                    ProductName = p.ProductName,
                    CategoryName = p.Category.CategoryName,
                    StockQuantity = p.TblProductVariants.Sum(v => v.StockQuantity ?? 0),
                    Price = p.TblProductVariants.OrderBy(v => v.OriginalPrice).Select(v => v.OriginalPrice).FirstOrDefault()
                })
                .Where(p => p.StockQuantity > 0)
                .OrderByDescending(p => p.StockQuantity)
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