namespace back_end.DTOs
{
    // DTO dùng để cập nhật giá
    public class UpdateReceiptPriceDto
    {
        public int DetailId { get; set; }
        public decimal NewImportPrice { get; set; }
    }
}
