using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblCartItem
{
    public int CartItemId { get; set; }

    public int CartId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public virtual TblCart Cart { get; set; } = null!;

    public virtual TblProduct Product { get; set; } = null!;
}
