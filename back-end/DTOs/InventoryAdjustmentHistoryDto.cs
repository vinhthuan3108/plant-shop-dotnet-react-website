namespace back_end.DTOs
{
    public class InventoryAdjustmentHistoryDto
    {
        public int AdjustmentId { get; set; }
        public string ProductName { get; set; } = null!;
        public string VariantName { get; set; } = null!;
        public string? ImageUrl { get; set; } 
        public int QuantityAdjusted { get; set; }
        public string? Reason { get; set; }
        public string FullName { get; set; } = null!; 
        public DateTime CreatedAt { get; set; }
    }
}