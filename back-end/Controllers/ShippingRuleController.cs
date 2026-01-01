using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShippingRuleController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public ShippingRuleController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // GET: api/ShippingRule
        // Lấy cấu hình hiện tại để hiển thị lên form Admin
        [HttpGet]
        public async Task<IActionResult> GetConfig()
        {
            // 1. Lấy mã tỉnh cửa hàng
            var storeConfig = await _context.TblSystemConfigs.FindAsync("Store_Province_Code");

            // 2. Lấy bảng giá
            var rules = await _context.TblShippingRules.ToListAsync();
            var baseRule = rules.FirstOrDefault(r => r.IsBaseRule == true);
            var stepRule = rules.FirstOrDefault(r => r.IsBaseRule == false);

            return Ok(new
            {
                StoreProvinceCode = storeConfig?.ConfigValue ?? "",
                BaseRule = baseRule,
                StepRule = stepRule
            });
        }

        // POST: api/ShippingRule
        // Lưu cấu hình mới
        [HttpPost]
        public async Task<IActionResult> UpdateConfig([FromBody] ShippingConfigDto request)
        {
            // 1. Lưu vị trí cửa hàng
            var storeConfig = await _context.TblSystemConfigs.FindAsync("Store_Province_Code");
            if (storeConfig == null)
            {
                storeConfig = new TblSystemConfig
                {
                    ConfigKey = "Store_Province_Code",
                    Description = "Mã tỉnh của cửa hàng (dùng tính phí ship)"
                };
                _context.TblSystemConfigs.Add(storeConfig);
            }
            storeConfig.ConfigValue = request.StoreProvinceCode;

            // 2. Lưu Rule Cơ bản (IsBaseRule = true)
            var baseRule = await _context.TblShippingRules.FirstOrDefaultAsync(r => r.IsBaseRule == true);
            if (baseRule == null)
            {
                baseRule = new TblShippingRule { IsBaseRule = true };
                _context.TblShippingRules.Add(baseRule);
            }
            // Map dữ liệu
            baseRule.WeightCriteria = request.BaseRule.WeightCriteria;
            baseRule.PriceInnerProvince = request.BaseRule.PriceInnerProvince;
            baseRule.PriceInnerRegion = request.BaseRule.PriceInnerRegion;
            baseRule.PriceInterRegion = request.BaseRule.PriceInterRegion;

            // 3. Lưu Rule Lũy tiến (IsBaseRule = false)
            var stepRule = await _context.TblShippingRules.FirstOrDefaultAsync(r => r.IsBaseRule == false);
            if (stepRule == null)
            {
                stepRule = new TblShippingRule { IsBaseRule = false };
                _context.TblShippingRules.Add(stepRule);
            }
            // Map dữ liệu
            stepRule.WeightCriteria = request.StepRule.WeightCriteria;
            stepRule.PriceInnerProvince = request.StepRule.PriceInnerProvince;
            stepRule.PriceInnerRegion = request.StepRule.PriceInnerRegion;
            stepRule.PriceInterRegion = request.StepRule.PriceInterRegion;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật cấu hình vận chuyển thành công!" });
        }
    }
}