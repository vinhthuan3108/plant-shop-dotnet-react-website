using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace back_end.Models;

public partial class TblProductImage
{
    public int ImageId { get; set; }
    public int ProductId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public bool? IsThumbnail { get; set; }
    public int? DisplayOrder { get; set; }

    [JsonIgnore]
    public virtual TblProduct? Product { get; set; } 

    [JsonIgnore]
    public virtual ICollection<TblProductVariant> TblProductVariants { get; set; } = new List<TblProductVariant>();
}