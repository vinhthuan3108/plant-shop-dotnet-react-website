namespace back_end.DTOs
{
    public class ProductFilterDto
    {
        public string? Keyword { get; set; }

        // 2. Lọc theo Danh mục
        public int? CategoryId { get; set; }

        // 3. Trạng thái (null=tất cả, true=đang bán, false=ngừng)
        public bool? IsActive { get; set; }

        // 4. Tồn kho: "all", "out_of_stock" (Hết hàng), "low_stock" (Sắp hết)
        public string? StockStatus { get; set; }

        // 5. Khoảng giá
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? IsOnSale { get; set; } // true: Đang sale, false: Không sale
        public string? SortByPrice { get; set; }
    }
}
