using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace back_end.DTOs
{
    // Dữ liệu chi tiết từng sản phẩm trong đơn
    public class CheckoutItemDto
    {
        public int VariantId { get; set; } // Đã đổi thành VariantId
        public int Quantity { get; set; }
    }

    // Dữ liệu tổng thể gửi lên để tạo đơn
    public class CheckoutRequest
    {
        public int? UserId { get; set; }

        [Required]
        public string RecipientName { get; set; } = null!;

        [Required]
        public string RecipientPhone { get; set; } = null!;

        [Required]
        public string ShippingAddress { get; set; } = null!; // Đây là số nhà, tên đường
        public string Province { get; set; } = null!;
        public string? ProvinceCode { get; set; } // Mới thêm lúc nãy
        public string? District { get; set; }

        // --- THÊM DÒNG NÀY ---
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
    // ĐÃ XÓA UpdateStatusRequest KHỎI ĐÂY
}