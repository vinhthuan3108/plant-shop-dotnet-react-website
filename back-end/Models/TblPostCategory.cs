using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblPostCategory
{
    public int PostCategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<TblPost> TblPosts { get; set; } = new List<TblPost>();
}
