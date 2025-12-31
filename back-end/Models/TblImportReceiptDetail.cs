using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; // 1. THÊM THƯ VIỆN NÀY
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblImportReceiptDetail
{
    public int DetailId { get; set; }

    public int ReceiptId { get; set; } // Khóa ngoại

    public int VariantId { get; set; } 

    public int Quantity { get; set; }

    public decimal ImportPrice { get; set; }

    [JsonIgnore]
    public virtual TblProductVariant Variant { get; set; } = null!;

    // --- SỬA ĐOẠN DƯỚI ĐÂY ---
    
    // 2. Đổi tên từ 'Receipt' thành 'ImportReceipt' để khớp với code Controller
    // 3. Thêm [ForeignKey] để báo cho C# biết biến này liên kết qua cột 'ReceiptId' ở trên
    [JsonIgnore]
    [ForeignKey("ReceiptId")] 
    public virtual TblImportReceipt Receipt { get; set; } = null!;
}