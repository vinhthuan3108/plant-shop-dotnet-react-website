using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblOrderDetail
{
    public int OrderDetailId { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public decimal PriceAtTime { get; set; }

    public decimal CostPrice { get; set; }

    public virtual TblOrder Order { get; set; } = null!;

    public virtual TblProduct Product { get; set; } = null!;
}
