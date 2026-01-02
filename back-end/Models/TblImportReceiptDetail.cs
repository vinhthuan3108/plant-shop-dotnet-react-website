using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; 
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

    [JsonIgnore]
    [ForeignKey("ReceiptId")] 
    public virtual TblImportReceipt Receipt { get; set; } = null!;
}