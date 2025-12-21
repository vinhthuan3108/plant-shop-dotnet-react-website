using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models; // Thay namespace của bạn vào
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting; // 1. Thêm thư viện này
using System.IO;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblSystemConfigController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        private readonly IWebHostEnvironment _environment; // 3. Khai báo biến môi trường

        // 4. Inject vào constructor
        public TblSystemConfigController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
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
                    // --- LOGIC XÓA ẢNH CŨ ---
                    // Chỉ thực hiện nếu:
                    // 1. Giá trị có thay đổi (người dùng up logo mới)
                    // 2. Giá trị cũ không rỗng
                    if (existingConfig.ConfigValue != item.ConfigValue && !string.IsNullOrEmpty(existingConfig.ConfigValue))
                    {
                        // Thử tìm xem giá trị cũ có phải là đường dẫn file không
                        var oldRelativePath = existingConfig.ConfigValue.TrimStart('/');
                        var oldFullPath = Path.Combine(_environment.WebRootPath, oldRelativePath);

                        // Nếu file tồn tại thì xóa (Chỉ ảnh mới tồn tại, còn số điện thoại/email thì hàm này trả về false -> an toàn)
                        if (System.IO.File.Exists(oldFullPath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldFullPath);
                            }
                            catch { /* Bỏ qua lỗi nếu không xóa được */ }
                        }
                    }
                    // ------------------------

                    // Cập nhật giá trị mới
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