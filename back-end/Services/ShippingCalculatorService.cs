using back_end.Helpers;
using back_end.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Services
{
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
            // Lấy mã tỉnh của Cửa hàng từ Config
            var storeConfig = await _context.TblSystemConfigs
                .FirstOrDefaultAsync(c => c.ConfigKey == "Store_Province_Code");

            string storeProvinceCode = storeConfig?.ConfigValue ?? ""; 

            // Xác định loại vận chuyển (Nội tỉnh/ Nội miền / Liên miền)
            // Kết quả trả về string: "INNER_PROVINCE", "INNER_REGION", hoặc "INTER_REGION"
            string zoneType = VietnamZoneHelper.DetermineZoneType(storeProvinceCode, customerProvinceCode);

            //Lấy bảng giá từ DB
            //có quy tắc Gốc và bước nhảy lũy tiến
            var rules = await _context.TblShippingRules.ToListAsync();

            var baseRule = rules.FirstOrDefault(r => r.IsBaseRule == true);
            var stepRule = rules.FirstOrDefault(r => r.IsBaseRule == false);

            if (baseRule == null) return 30000; //Nếu nhân viên chưa nhập giá có mặc định 30k


            decimal finalFee = 0;

            
            decimal GetPriceByZone(TblShippingRule rule)
            {
                if (zoneType == "INNER_PROVINCE") return rule.PriceInnerProvince;
                if (zoneType == "INNER_REGION") return rule.PriceInnerRegion;
                return rule.PriceInterRegion; // này là Liên miền
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
                // Vd: Nặng 70kg. Base = 50kg. Dư 20kg.
                decimal overWeight = totalWeightKg - baseRule.WeightCriteria;

                if (stepRule != null && stepRule.WeightCriteria > 0)
                {
                    decimal stepPrice = GetPriceByZone(stepRule);

                    // sốbước nhảy sẽ = Làm tròn lên (Dư / Bước)
                    // VD: Dư 20kg, Bước 10kg => 2 bước.
                    // VD: Dư 21kg, Bước 10kg => 3 bước.
                    int steps = (int)Math.Ceiling(overWeight / stepRule.WeightCriteria);

                    finalFee = basePrice + (steps * stepPrice);
                }
                else
                {
                    
                    finalFee = basePrice;
                }
            }

            return finalFee;
        }
    }
}