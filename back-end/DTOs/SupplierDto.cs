using System;
using System.Collections.Generic;

namespace back_end.DTOs
{
    public class SupplierDto
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Note { get; set; }
    }

    // Chi tiết sản phẩm trong phiếu nhập
    public class ReceiptDetailDto
    {
        public int VariantId { get; set; }
        public int Quantity { get; set; }
        public decimal ImportPrice { get; set; }
    }

    // Tạo phiếu nhập kho
    public class ImportReceiptCreateDto
    {
        public int SupplierId { get; set; }
        public int CreatorId { get; set; }
        public string? Note { get; set; }
        public DateTime ImportDate { get; set; }
        public List<ReceiptDetailDto> Details { get; set; }
    }

    // DTO Cập nhật tồn kho (Kiểm kê/Cân bằng kho)
    public class InventoryAdjustmentDto
    {
        public int VariantId { get; set; }

        public int UserId { get; set; }
        public int QuantityAdjusted { get; set; } 
        public string Reason { get; set; }
    }
}