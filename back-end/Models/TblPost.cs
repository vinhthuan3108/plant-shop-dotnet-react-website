using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblPost
{
    public int PostId { get; set; }

    public string Title { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public string? Content { get; set; }

    public string? ThumbnailUrl { get; set; }

    public int PostCategoryId { get; set; }

    public int AuthorId { get; set; }

    public string? Tags { get; set; }

    public string? Status { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public virtual TblUser Author { get; set; } = null!;

    public virtual TblPostCategory PostCategory { get; set; } = null!;
}
