using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblInventoryAdjustment
{
    public int AdjustmentId { get; set; }

    public int VariantId { get; set; } // Kiểm kê theo biến thể

    public int UserId { get; set; }

    public int QuantityAdjusted { get; set; }

    public string? Reason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual TblProductVariant Variant { get; set; } = null!;

    [JsonIgnore]
    public virtual TblUser User { get; set; } = null!;
}