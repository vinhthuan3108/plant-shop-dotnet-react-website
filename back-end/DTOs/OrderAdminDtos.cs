using System;
using System.Collections.Generic;

namespace back_end.DTOs
{
    // DTO hiển thị danh sách đơn hàng (Bảng bên ngoài trang Admin)
    public class OrderAdminListDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; }
        public string Phone { get; set; }
        public DateTime? OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }
    }

    // DTO hiển thị chi tiết 1 đơn hàng (Modal chi tiết)
    public class OrderAdminDetailDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderDate { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }

        // Thông tin người nhận
        public string RecipientName { get; set; }
        public string RecipientPhone { get; set; }
        public string ShippingAddress { get; set; }
        public string Note { get; set; }

        // Thông tin tài chính
        public decimal? SubTotal { get; set; }
        public decimal? ShippingFee { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? TotalAmount { get; set; }

        public List<OrderDetailDto> Items { get; set; }
    }

    public class OrderDetailDto
    {
        public string ProductName { get; set; }
        public string ProductImage { get; set; } // Link ảnh (nếu cần hiển thị)

        // SỬA: Đổi Size -> VariantName (Hiển thị: "Size Nhỏ - Chậu Sứ")
        public string VariantName { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; } // Giá lúc mua
        public decimal Total { get; set; }
    }

    // DTO nhận request cập nhật trạng thái (Giữ cái này ở đây, xóa ở file kia)
    public class UpdateStatusRequest
    {
        public string NewStatus { get; set; } // Pending, Processing, Shipping, Completed, Cancelled
    }
}