using back_end.Helpers;
using back_end.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Services
{
    // Interface để tiện Dependency Injection
    public interface IShippingCalculatorService
    {
        Task<decimal> CalculateShippingFeeAsync(string customerProvinceCode, decimal totalWeightKg);
    }

    public class ShippingCalculatorService : IShippingCalculatorService
    {
        private readonly DbplantShopThuanCuongContext _context;

        public ShippingCalculatorService(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        public async Task<decimal> CalculateShippingFeeAsync(string customerProvinceCode, decimal totalWeightKg)
        {
            // 1. Lấy mã tỉnh của Cửa hàng từ Config
            var storeConfig = await _context.TblSystemConfigs
                .FirstOrDefaultAsync(c => c.ConfigKey == "Store_Province_Code");

            string storeProvinceCode = storeConfig?.ConfigValue ?? ""; // Nếu chưa cấu hình thì rỗng

            // 2. Xác định loại vận chuyển (Nội tỉnh / Nội miền / Liên miền)
            // Kết quả trả về string: "INNER_PROVINCE", "INNER_REGION", hoặc "INTER_REGION"
            string zoneType = VietnamZoneHelper.DetermineZoneType(storeProvinceCode, customerProvinceCode);

            // 3. Lấy bảng giá từ DB
            // Chúng ta cần lấy quy tắc GỐC (Base) và quy tắc BƯỚC NHẢY (Step)
            var rules = await _context.TblShippingRules.ToListAsync();

            var baseRule = rules.FirstOrDefault(r => r.IsBaseRule == true);
            var stepRule = rules.FirstOrDefault(r => r.IsBaseRule == false);

            if (baseRule == null) return 30000; // Fallback: Nếu admin chưa nhập bảng giá, trả về giá mặc định 30k

            // 4. Tính toán chi tiết
            decimal finalFee = 0;

            // --- Lấy giá theo vùng ---
            decimal GetPriceByZone(TblShippingRule rule)
            {
                if (zoneType == "INNER_PROVINCE") return rule.PriceInnerProvince;
                if (zoneType == "INNER_REGION") return rule.PriceInnerRegion;
                return rule.PriceInterRegion; // Liên miền
            }

            decimal basePrice = GetPriceByZone(baseRule);

            // Nếu hàng nhẹ hơn hoặc bằng mức quy định cơ bản (VD: < 50kg)
            if (totalWeightKg <= baseRule.WeightCriteria)
            {
                finalFee = basePrice;
            }
            else
            {
                // Hàng vượt mức cơ bản -> Tính thêm tiền bước nhảy
                // VD: Nặng 70kg. Base = 50kg. Dư 20kg.
                decimal overWeight = totalWeightKg - baseRule.WeightCriteria;

                if (stepRule != null && stepRule.WeightCriteria > 0)
                {
                    decimal stepPrice = GetPriceByZone(stepRule);

                    // Công thức: Số bước nhảy = Làm tròn lên (Dư / Bước)
                    // VD: Dư 20kg, Bước 10kg => 2 bước.
                    // VD: Dư 21kg, Bước 10kg => 3 bước.
                    int steps = (int)Math.Ceiling(overWeight / stepRule.WeightCriteria);

                    finalFee = basePrice + (steps * stepPrice);
                }
                else
                {
                    // Nếu không có cấu hình bước nhảy, cứ lấy giá base (hoặc xử lý tùy ý)
                    finalFee = basePrice;
                }
            }

            return finalFee;
        }
    }
}