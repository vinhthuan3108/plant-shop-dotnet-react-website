using back_end.Helpers;
using back_end.Models; // Thay namespace của bạn vào
using Microsoft.AspNetCore.Hosting; // 1. Thêm thư viện này
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
public class MailSettingsDto
{
    public string Email { get; set; }
    public string Password { get; set; }
}
public class PayOsSettingsDto
{
    public string ClientId { get; set; }
    public string ApiKey { get; set; }
    public string ChecksumKey { get; set; }
}
public class RecaptchaSettingsDto
{
    public string SiteKey { get; set; }   // Thêm cái này
    public string SecretKey { get; set; }
}
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblSystemConfigController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        private readonly IWebHostEnvironment _environment; // 3. Khai báo biến môi trường
        private readonly IConfiguration _configuration;
        // 4. Inject vào constructor
        public TblSystemConfigController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment, IConfiguration configuration)
        {
            _context = context;
            _environment = environment;
            _configuration = configuration;
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

        [HttpPost("UpdateMailSettings")]
        public async Task<IActionResult> UpdateMailSettings([FromBody] MailSettingsDto request)
        {
            // 1. Lưu Email (Không cần mã hóa)
            var emailConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "Mail_User");
            if (emailConfig == null)
            {
                emailConfig = new TblSystemConfig { ConfigKey = "Mail_User", Description = "Email gửi hệ thống" };
                _context.TblSystemConfigs.Add(emailConfig);
            }
            emailConfig.ConfigValue = request.Email;

            // 2. Lưu Password (CẦN MÃ HÓA)
            if (!string.IsNullOrEmpty(request.Password))
            {
                var passConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "Mail_Password");
                if (passConfig == null)
                {
                    passConfig = new TblSystemConfig { ConfigKey = "Mail_Password", Description = "Mật khẩu ứng dụng Email" };
                    _context.TblSystemConfigs.Add(passConfig);
                }

                // Lấy SecretKey từ appsettings.json (Bạn nhớ thêm vào file json nhé)
                string secretKey = _configuration["AppSettings:SecretKey"] ?? "KeyMacDinhChoDev123";

                // Mã hóa trước khi gán vào Value
                passConfig.ConfigValue = SecurityHelper.Encrypt(request.Password, secretKey);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật cấu hình email thành công!" });
        }
        [HttpPost("UpdatePayOsSettings")]
        public async Task<IActionResult> UpdatePayOsSettings([FromBody] PayOsSettingsDto request)
        {
            string secretKey = _configuration["AppSettings:SecretKey"];
            if (string.IsNullOrEmpty(secretKey)) return BadRequest("Server chưa cấu hình SecretKey!");

            // --- 1. Lưu ClientId (MÃ HÓA LUÔN) ---
            if (!string.IsNullOrEmpty(request.ClientId))
            {
                var clientIdConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ClientId");
                if (clientIdConfig == null)
                {
                    clientIdConfig = new TblSystemConfig { ConfigKey = "PayOS_ClientId", Description = "PayOS Client ID (Encrypted)" };
                    _context.TblSystemConfigs.Add(clientIdConfig);
                }
                // Thay đổi ở đây: Encrypt cả ClientId
                clientIdConfig.ConfigValue = SecurityHelper.Encrypt(request.ClientId, secretKey);
            }

            // --- 2. Lưu ApiKey (MÃ HÓA) ---
            if (!string.IsNullOrEmpty(request.ApiKey))
            {
                var apiKeyConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ApiKey");
                if (apiKeyConfig == null)
                {
                    apiKeyConfig = new TblSystemConfig { ConfigKey = "PayOS_ApiKey", Description = "PayOS API Key (Encrypted)" };
                    _context.TblSystemConfigs.Add(apiKeyConfig);
                }
                apiKeyConfig.ConfigValue = SecurityHelper.Encrypt(request.ApiKey, secretKey);
            }

            // --- 3. Lưu ChecksumKey (MÃ HÓA) ---
            if (!string.IsNullOrEmpty(request.ChecksumKey))
            {
                var checksumConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ChecksumKey");
                if (checksumConfig == null)
                {
                    checksumConfig = new TblSystemConfig { ConfigKey = "PayOS_ChecksumKey", Description = "PayOS Checksum Key (Encrypted)" };
                    _context.TblSystemConfigs.Add(checksumConfig);
                }
                checksumConfig.ConfigValue = SecurityHelper.Encrypt(request.ChecksumKey, secretKey);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật cấu hình PayOS thành công!" });
        }
        [HttpPost("UpdateRecaptchaSettings")]
        public async Task<IActionResult> UpdateRecaptchaSettings([FromBody] RecaptchaSettingsDto request)
        {
            string appSecretKey = _configuration["AppSettings:SecretKey"];
            if (string.IsNullOrEmpty(appSecretKey)) return BadRequest("Server chưa cấu hình SecretKey!");

            // --- 1. LƯU SITE KEY (KHÔNG MÃ HÓA) ---
            // Frontend cần đọc trực tiếp giá trị này nên ta lưu plain text
            if (!string.IsNullOrEmpty(request.SiteKey))
            {
                var siteKeyConfig = await _context.TblSystemConfigs
                    .FirstOrDefaultAsync(x => x.ConfigKey == "Recaptcha_SiteKey");

                if (siteKeyConfig == null)
                {
                    siteKeyConfig = new TblSystemConfig
                    {
                        ConfigKey = "Recaptcha_SiteKey",
                        Description = "Khóa công khai Google Recaptcha (Site Key)"
                    };
                    _context.TblSystemConfigs.Add(siteKeyConfig);
                }
                siteKeyConfig.ConfigValue = request.SiteKey; // Lưu trực tiếp
            }

            // --- 2. LƯU SECRET KEY (CÓ MÃ HÓA) ---
            if (!string.IsNullOrEmpty(request.SecretKey))
            {
                var secretKeyConfig = await _context.TblSystemConfigs
                    .FirstOrDefaultAsync(x => x.ConfigKey == "Recaptcha_SecretKey");

                if (secretKeyConfig == null)
                {
                    secretKeyConfig = new TblSystemConfig
                    {
                        ConfigKey = "Recaptcha_SecretKey",
                        Description = "Khóa bí mật Google Recaptcha (Secret Key"
                    };
                    _context.TblSystemConfigs.Add(secretKeyConfig);
                }
                // Mã hóa trước khi lưu
                secretKeyConfig.ConfigValue = SecurityHelper.Encrypt(request.SecretKey, appSecretKey);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật cấu hình Recaptcha thành công!" });
        }
    }

}