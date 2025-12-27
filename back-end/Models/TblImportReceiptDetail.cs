using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblImportReceiptDetail
{
    public int DetailId { get; set; }

    public int ReceiptId { get; set; }

    public int VariantId { get; set; } // Nhập kho theo biến thể cụ thể

    public int Quantity { get; set; }

    public decimal ImportPrice { get; set; }

    public virtual TblProductVariant Variant { get; set; } = null!;

    [JsonIgnore]
    public virtual TblImportReceipt Receipt { get; set; } = null!;
}