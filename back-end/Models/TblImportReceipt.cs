using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblImportReceipt
{
    public int ReceiptId { get; set; }

    public int SupplierId { get; set; }

    public int CreatorId { get; set; }

    public DateTime? ImportDate { get; set; }

    public decimal? TotalAmount { get; set; }

    public string? Note { get; set; }

    public virtual TblUser Creator { get; set; } = null!;

    public virtual TblSupplier Supplier { get; set; } = null!;

    public virtual ICollection<TblImportReceiptDetail> TblImportReceiptDetails { get; set; } = new List<TblImportReceiptDetail>();
}
