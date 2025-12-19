using System.ComponentModel.DataAnnotations;

namespace back_end.DTOs
{
    // Dữ liệu chi tiết từng sản phẩm trong đơn
    public class CartItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    // Dữ liệu tổng thể gửi lên để tạo đơn
    public class CheckoutRequest
    {
        public int? UserId { get; set; } // Null nếu là khách vãng lai

        [Required]
        public string RecipientName { get; set; } = null!;

        [Required]
        public string RecipientPhone { get; set; } = null!;

        [Required]
        public string ShippingAddress { get; set; } = null!; // Địa chỉ chi tiết + Quận/Huyện/Tỉnh

        // Dùng để tính phí ship (Frontend gửi lên "Hà Nội", "Hồ Chí Minh"...)
        public string Province { get; set; } = null!;
        public string? District { get; set; }

        public string? VoucherCode { get; set; } // Mã giảm giá (nếu có)

        [Required]
        public string PaymentMethod { get; set; } = null!; // "COD" hoặc "PAYOS"

        public string? Note { get; set; } // Ghi chú của khách

        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    }
}