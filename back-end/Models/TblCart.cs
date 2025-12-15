using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblCart
{
    public int CartId { get; set; }

    public int UserId { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TblCartItem> TblCartItems { get; set; } = new List<TblCartItem>();

    public virtual TblUser User { get; set; } = null!;
}
