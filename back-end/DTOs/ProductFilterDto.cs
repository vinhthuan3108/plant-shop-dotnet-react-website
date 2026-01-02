namespace back_end.DTOs
{
    public class ProductFilterDto
    {
        public string? Keyword { get; set; }

        public int? CategoryId { get; set; }

        public bool? IsActive { get; set; }

        //Tồn kho: "all", "out_of_stock" (Hết hàng), "low_stock" (Sắp hết)
        public string? StockStatus { get; set; }


        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? IsOnSale { get; set; } 
        public string? SortByPrice { get; set; }
    }
}
