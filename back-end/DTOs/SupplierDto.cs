namespace back_end.DTOs
{
    public class SupplierDto
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Note { get; set; }
    }
    public class ReceiptDetailDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal ImportPrice { get; set; }
    }

    // DTO cho toàn bộ phiếu nhập
    public class ImportReceiptCreateDto
    {
        public int SupplierId { get; set; }
        public int CreatorId { get; set; }
        public string? Note { get; set; }
        public DateTime ImportDate { get; set; }
        public List<ReceiptDetailDto> Details { get; set; }
    }
    public class InventoryAdjustmentDto
    {
        public int ProductId { get; set; }
        public int UserId { get; set; }
        public int QuantityAdjusted { get; set; } // Số âm nếu giảm, dương nếu tăng
        public string Reason { get; set; } // Lý do: Cây chết, vỡ chậu...
    }
}
