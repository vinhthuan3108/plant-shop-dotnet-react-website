using System;
using System.Collections.Generic;

namespace back_end.DTOs
{
    // DTO hiển thị danh sách đơn hàng
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

    //detaik
    public class OrderAdminDetailDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderDate { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }

        
        public string RecipientName { get; set; }
        public string RecipientPhone { get; set; }
        public string ShippingAddress { get; set; }
        public string Note { get; set; }

        
        public decimal? SubTotal { get; set; }
        public decimal? ShippingFee { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? TotalAmount { get; set; }

        public List<OrderDetailDto> Items { get; set; }
    }

    public class OrderDetailDto
    {
        public string ProductName { get; set; }
        public string ProductImage { get; set; } 

        public string VariantName { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; } 
        public decimal Total { get; set; }
    }
    public class UpdateStatusRequest
    {
        public string NewStatus { get; set; } // Pending, Processing, Shipping, Completed, Cancelled
    }
}