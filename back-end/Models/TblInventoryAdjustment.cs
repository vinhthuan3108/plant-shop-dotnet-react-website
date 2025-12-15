using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblInventoryAdjustment
{
    public int AdjustmentId { get; set; }

    public int ProductId { get; set; }

    public int UserId { get; set; }

    public int QuantityAdjusted { get; set; }

    public string? Reason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual TblProduct Product { get; set; } = null!;

    public virtual TblUser User { get; set; } = null!;
}
