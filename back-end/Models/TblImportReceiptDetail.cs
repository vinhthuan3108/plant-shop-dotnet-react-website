using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblImportReceiptDetail
{
    public int DetailId { get; set; }

    public int ReceiptId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public decimal ImportPrice { get; set; }

    public virtual TblProduct Product { get; set; } = null!;

    public virtual TblImportReceipt Receipt { get; set; } = null!;
}
