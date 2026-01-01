using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblProductVariant
{
    public int VariantId { get; set; }
    public int ProductId { get; set; }
    public string VariantName { get; set; } = null!;
    public decimal OriginalPrice { get; set; }
    public decimal? SalePrice { get; set; }
    public int? StockQuantity { get; set; }
    public decimal Weight { get; set; } = 0;
    public int? MinStockAlert { get; set; } // Đã thêm ở bước trước
    public int? ImageId { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsDeleted { get; set; }

    // --- SỬA DÒNG DƯỚI ĐÂY ---
    [JsonIgnore]
    public virtual TblProduct? Product { get; set; } // Thêm dấu ? và bỏ = null!

    [JsonIgnore]
    public virtual TblProductImage? Image { get; set; }

    public virtual ICollection<TblCartItem> TblCartItems { get; set; } = new List<TblCartItem>();
    public virtual ICollection<TblImportReceiptDetail> TblImportReceiptDetails { get; set; } = new List<TblImportReceiptDetail>();
    public virtual ICollection<TblInventoryAdjustment> TblInventoryAdjustments { get; set; } = new List<TblInventoryAdjustment>();
    public virtual ICollection<TblOrderDetail> TblOrderDetails { get; set; } = new List<TblOrderDetail>();
}