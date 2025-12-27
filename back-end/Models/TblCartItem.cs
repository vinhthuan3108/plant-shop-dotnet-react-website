using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblCartItem
{
    public int CartItemId { get; set; }

    public int CartId { get; set; }

    public int VariantId { get; set; } // Thay ProductId

    public int Quantity { get; set; }

    [JsonIgnore]
    public virtual TblCart Cart { get; set; } = null!;

    public virtual TblProductVariant Variant { get; set; } = null!; // Trỏ về Variant
}