namespace back_end.DTOs
{
    public class UpdateReceiptPriceDto
    {
        public int DetailId { get; set; }
        public decimal NewImportPrice { get; set; }
    }
}
