using System;
using System.Collections.Generic;

namespace back_end.DTOs
{
    //DTO cho Thống kê Doanh thu
    public class RevenueStatDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public decimal Profit { get; set; }
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

    //DTO cho Thống kê Sản phẩm Bán chạy
    public class TopProductDto
    {
        public string ProductName { get; set; } = null!;
        public string Thumbnail { get; set; } 
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalProfit { get; set; } 
    }

    //DTO cho Biểu đồ tỷ lệ danh mục
    public class CategoryShareDto
    {
        public string CategoryName { get; set; } = null!;
        public int TotalSold { get; set; }
    }

    //DTO cho Hàng tồn kho lâu (Thay thế InventoryStatDto cũ)
    public class SlowMovingProductDto
    {
        public string ProductName { get; set; } = null!;
        public string CategoryName { get; set; } = null!;
        public string Thumbnail { get; set; }
        public int StockQuantity { get; set; }
        public decimal CapitalPrice { get; set; } // Giá vốn
        public DateTime? LastImportDate { get; set; }
        public int DaysSinceLastImport { get; set; }
    }

    //trả về tổng hợp
    public class ProductStatsResponse
    {
        public List<TopProductDto> TopProducts { get; set; }
        public int TotalProducts { get; set; } 
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }

        public List<CategoryShareDto> CategoryShares { get; set; }
        public List<SlowMovingProductDto> SlowMovingProducts { get; set; }
    }
}