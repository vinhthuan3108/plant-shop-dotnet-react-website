using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblProduct
{
    public int ProductId { get; set; }

    public string ProductCode { get; set; } = null!;

    public string ProductName { get; set; } = null!;

    public int CategoryId { get; set; }

    public decimal OriginalPrice { get; set; }

    public decimal? SalePrice { get; set; }

    public DateTime? SaleStartDate { get; set; }

    public DateTime? SaleEndDate { get; set; }

    public int? StockQuantity { get; set; }

    public int? MinStockAlert { get; set; }

    public string? ShortDescription { get; set; }

    public string? DetailDescription { get; set; }

    public string? Size { get; set; }

    public string? Characteristics { get; set; }

    public string? FengShuiTags { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual TblCategory Category { get; set; } = null!;

    public virtual ICollection<TblCartItem> TblCartItems { get; set; } = new List<TblCartItem>();

    public virtual ICollection<TblImportReceiptDetail> TblImportReceiptDetails { get; set; } = new List<TblImportReceiptDetail>();

    public virtual ICollection<TblInventoryAdjustment> TblInventoryAdjustments { get; set; } = new List<TblInventoryAdjustment>();

    public virtual ICollection<TblOrderDetail> TblOrderDetails { get; set; } = new List<TblOrderDetail>();

    public virtual ICollection<TblProductImage> TblProductImages { get; set; } = new List<TblProductImage>();
}
