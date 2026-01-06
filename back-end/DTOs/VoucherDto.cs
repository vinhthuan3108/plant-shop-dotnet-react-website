using System;
using System.ComponentModel.DataAnnotations;

namespace back_end.DTOs
{
    public class VoucherCreateUpdateDto
    {
        [Required]
        public string Code { get; set; } = null!; 

        [Required]
        public string DiscountType { get; set; } = null!; //số or %

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị giảm phải lớn hơn 0")]
        public decimal DiscountValue { get; set; }

        public decimal? MaxDiscountAmount { get; set; } // Giảm tối đa (cho loại %)

        public decimal? MinOrderValue { get; set; } // Đơn tối thiểu

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public int? UsageLimit { get; set; }
        public bool IsActive { get; set; }
    }
}