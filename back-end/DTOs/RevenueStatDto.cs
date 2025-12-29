using System;
using System.Collections.Generic;

namespace back_end.DTOs
{
    // 1. DTO cho Thống kê Doanh thu
    public class RevenueStatDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; } // Doanh thu
        public decimal Profit { get; set; }  // Lợi nhuận
    }

    public class StatisticsResponse
    {
        public decimal TotalRevenue { get; set; }
        public decimal TotalProfit { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalShipping { get; set; }
        public decimal TotalImportCost { get; set; }
        public decimal NetCashFlow { get; set; }

        public List<RevenueStatDto> DailyStats { get; set; }
    }

    // 2. DTO cho Thống kê Sản phẩm Bán chạy
    public class TopProductDto
    {
        public string ProductName { get; set; } = null!;
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    // 3. DTO cho Biểu đồ tỷ lệ danh mục
    public class CategoryShareDto
    {
        public string CategoryName { get; set; } = null!;
        public int TotalSold { get; set; }
    }

    // 4. DTO cho Thống kê Tồn kho
    // Lưu ý: Dữ liệu này đang trả về tồn kho tổng hợp của Sản phẩm cha
    public class InventoryStatDto
    {
        public string ProductName { get; set; } = null!;
        public string CategoryName { get; set; } = null!;
        public int StockQuantity { get; set; } // Tổng số lượng tồn (của tất cả variants)
        public decimal Price { get; set; }     // Giá bán tham khảo (thường là giá min hoặc giá gốc)
    }

    // Object trả về tổng hợp cho API /api/Statistics/products
    public class ProductStatsResponse
    {
        public List<TopProductDto> TopProducts { get; set; }
        public List<CategoryShareDto> CategoryShares { get; set; }
        public List<InventoryStatDto> TopInventory { get; set; }
    }
}