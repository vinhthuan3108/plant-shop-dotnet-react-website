using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblSupplier
{
    public int SupplierId { get; set; }

    public string SupplierName { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string? Address { get; set; }

    public string? Note { get; set; }

    public virtual ICollection<TblImportReceipt> TblImportReceipts { get; set; } = new List<TblImportReceipt>();
}
