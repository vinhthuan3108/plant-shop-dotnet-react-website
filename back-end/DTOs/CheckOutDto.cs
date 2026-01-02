using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace back_end.DTOs
{

    public class CheckoutItemDto
    {
        public int VariantId { get; set; } 
        public int Quantity { get; set; }
    }

    public class CheckoutRequest
    {
        public int? UserId { get; set; }

        [Required]
        public string RecipientName { get; set; } = null!;

        [Required]
        public string RecipientPhone { get; set; } = null!;

        [Required]
        public string ShippingAddress { get; set; } = null!; 
        public string Province { get; set; } = null!;
        public string? ProvinceCode { get; set; } 
        public string? District { get; set; }


        public string? Ward { get; set; }

        public string? VoucherCode { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = null!;

        public string? Note { get; set; }

        public List<CheckoutItemDto> Items { get; set; } = new List<CheckoutItemDto>();
    }
    public class ShippingFeeRequest
    {
        public string ProvinceCode { get; set; }
        public List<CheckoutItemDto> Items { get; set; }
    }

}