using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models; // Thay namespace của bạn vào
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblSystemConfigController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblSystemConfigController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // GET: api/SystemConfig
        // Lấy danh sách cấu hình để hiển thị lên Header/Footer/Trang Admin
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblSystemConfig>>> GetConfigs()
        {
            return await _context.TblSystemConfigs.ToListAsync();
        }

        // POST: api/SystemConfig/BulkUpdate
        // Dùng để Admin lưu một lúc nhiều cài đặt (Logo, SĐT, Email...)
        [HttpPost("BulkUpdate")]
        public async Task<IActionResult> BulkUpdate([FromBody] List<TblSystemConfig> configs)
        {
            if (configs == null || configs.Count == 0)
            {
                return BadRequest("Không có dữ liệu cập nhật.");
            }

            foreach (var item in configs)
            {
                var existingConfig = await _context.TblSystemConfigs
                                             .FirstOrDefaultAsync(x => x.ConfigKey == item.ConfigKey);

                if (existingConfig != null)
                {
                    // Cập nhật nếu đã tồn tại
                    existingConfig.ConfigValue = item.ConfigValue;
                    existingConfig.Description = item.Description ?? existingConfig.Description;
                }
                else
                {
                    // Thêm mới nếu chưa có
                    _context.TblSystemConfigs.Add(item);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật cấu hình thành công!" });
        }
    }
}