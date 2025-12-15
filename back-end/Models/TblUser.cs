using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblUser
{
    public int UserId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string? AvatarUrl { get; set; }

    public DateTime? DateofBirth { get; set; }

    public string? Gender { get; set; }

    public bool? IsActive { get; set; }

    public int RoleId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLogin { get; set; }

    public virtual TblRole Role { get; set; } = null!;

    public virtual TblCart? TblCart { get; set; }

    public virtual ICollection<TblImportReceipt> TblImportReceipts { get; set; } = new List<TblImportReceipt>();

    public virtual ICollection<TblInventoryAdjustment> TblInventoryAdjustments { get; set; } = new List<TblInventoryAdjustment>();

    public virtual ICollection<TblOrder> TblOrders { get; set; } = new List<TblOrder>();

    public virtual ICollection<TblPost> TblPosts { get; set; } = new List<TblPost>();

    public virtual ICollection<TblUserAddress> TblUserAddresses { get; set; } = new List<TblUserAddress>();
}
