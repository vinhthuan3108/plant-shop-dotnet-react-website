using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblOrderDetail
{
    public int OrderDetailId { get; set; }

    public int OrderId { get; set; }

    public int VariantId { get; set; } // Thay ProductId

    // Lưu cứng tên lúc mua để không bị đổi khi Admin sửa tên sản phẩm
    public string? ProductName { get; set; }
    public string? VariantName { get; set; }

    public int Quantity { get; set; }

    public decimal PriceAtTime { get; set; }

    public decimal CostPrice { get; set; }

    [JsonIgnore]
    public virtual TblOrder Order { get; set; } = null!;

    public virtual TblProductVariant Variant { get; set; } = null!;
}