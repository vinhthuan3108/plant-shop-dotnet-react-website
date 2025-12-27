namespace back_end.Models;
using System.Text.Json.Serialization;

public partial class TblProduct
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public int CategoryId { get; set; }
    public string? ShortDescription { get; set; }
    public string? DetailDescription { get; set; }
    public string? FengShuiTags { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // --- MỚI THÊM LẠI ---
    public DateTime? SaleStartDate { get; set; }
    public DateTime? SaleEndDate { get; set; }

    [JsonIgnore]
    public virtual TblCategory? Category { get; set; }
    public virtual ICollection<TblProductImage> TblProductImages { get; set; } = new List<TblProductImage>();
    public virtual ICollection<TblProductVariant> TblProductVariants { get; set; } = new List<TblProductVariant>();
}