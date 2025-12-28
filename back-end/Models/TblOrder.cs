using System;
using System.Collections.Generic;

namespace back_end.Models;

public partial class TblOrder
{
    public int OrderId { get; set; }

    public int? UserId { get; set; }

    public DateTime? OrderDate { get; set; }

    public string? RecipientName { get; set; }

    public string? RecipientPhone { get; set; }

    public string? ShippingAddress { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public int? VoucherId { get; set; }

    public string? OrderStatus { get; set; }

    public string? PaymentStatus { get; set; }
    public string? PaymentMethod { get; set; }

    public string? Note { get; set; }

    public virtual ICollection<TblOrderDetail> TblOrderDetails { get; set; } = new List<TblOrderDetail>();

    public virtual TblUser? User { get; set; }

    public virtual TblVoucher? Voucher { get; set; }
}
