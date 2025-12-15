using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblBanner
{
    public int BannerId { get; set; }

    public string? Title { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? LinkUrl { get; set; }

    public int? DisplayOrder { get; set; }

    public bool? IsActive { get; set; }
}
