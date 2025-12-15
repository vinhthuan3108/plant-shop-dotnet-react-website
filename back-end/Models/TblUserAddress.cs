using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblUserAddress
{
    public int AddressId { get; set; }

    public int UserId { get; set; }

    public string RecipientName { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public string AddressDetail { get; set; } = null!;

    public string? Province { get; set; }

    public string? District { get; set; }

    public string? Ward { get; set; }

    public bool? IsDefault { get; set; }

    public virtual TblUser User { get; set; } = null!;
}
