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

    // 4. DTO cho Thống kê Tồn kho (MỚI THÊM)
    public class InventoryStatDto
    {
        public string ProductName { get; set; } = null!;
        public string CategoryName { get; set; } = null!;
        public int StockQuantity { get; set; } // Số lượng tồn
        public decimal Price { get; set; }     // Giá bán hiện tại (để ước tính giá trị tồn)
    }

    // Object trả về tổng hợp cho trang Sản phẩm
    public class ProductStatsResponse
    {
        public List<TopProductDto> TopProducts { get; set; }
        public List<CategoryShareDto> CategoryShares { get; set; }
        public List<InventoryStatDto> TopInventory { get; set; } // Danh sách tồn kho nhiều
    }
}