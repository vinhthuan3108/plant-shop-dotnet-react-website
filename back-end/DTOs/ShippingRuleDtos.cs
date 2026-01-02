using System.ComponentModel.DataAnnotations;

namespace back_end.DTOs
{
    // DTO để Admin cập nhật cấu hình
    public class ShippingConfigDto
    {
        [Required]
        public string StoreProvinceCode { get; set; } = null!; // Mã tỉnh

        // Quy tắc cơ bản (VD: 10kg đầu giá bao nhiêu)
        public ShippingRuleInputDto BaseRule { get; set; } = null!;

        // Quy tắc lũy tiến (VD: mỗi 5kg tiếp theo giá bao nhiêu)
        public ShippingRuleInputDto StepRule { get; set; } = null!;
    }

    public class ShippingRuleInputDto
    {
        public decimal WeightCriteria { get; set; }
        public decimal PriceInnerProvince { get; set; }
        public decimal PriceInnerRegion { get; set; }
        public decimal PriceInterRegion { get; set; }
    }
}