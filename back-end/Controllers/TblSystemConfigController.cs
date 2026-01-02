using back_end.Helpers;
using back_end.Models; 
using Microsoft.AspNetCore.Hosting; 
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
    public string SiteKey { get; set; }  
    public string SecretKey { get; set; }
}
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblSystemConfigController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        public TblSystemConfigController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment, IConfiguration configuration)
        {
            _context = context;
            _environment = environment;
            _configuration = configuration;
        }

        // Lấy danh sách cấu hình để hiển thị lên Header/Footer/Trang Admin
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblSystemConfig>>> GetConfigs()
        {
            return await _context.TblSystemConfigs.ToListAsync();
        }

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
                    //xóa ảnh cũ
                    if (existingConfig.ConfigValue != item.ConfigValue && !string.IsNullOrEmpty(existingConfig.ConfigValue))
                    {
                        var oldRelativePath = existingConfig.ConfigValue.TrimStart('/');
                        var oldFullPath = Path.Combine(_environment.WebRootPath, oldRelativePath);

                        if (System.IO.File.Exists(oldFullPath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldFullPath);
                            }
                            catch { }
                        }
                    }
                    // Cập nhật giá trị mới
                    existingConfig.ConfigValue = item.ConfigValue;
                    existingConfig.Description = item.Description ?? existingConfig.Description;
                }
                else
                {
                    _context.TblSystemConfigs.Add(item);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật cấu hình thành công!" });
        }

        [HttpPost("UpdateMailSettings")]
        public async Task<IActionResult> UpdateMailSettings([FromBody] MailSettingsDto request)
        {
            //Lưu Email(Không cần mã hóa)
            var emailConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "Mail_User");
            if (emailConfig == null)
            {
                emailConfig = new TblSystemConfig { ConfigKey = "Mail_User", Description = "Email gửi hệ thống" };
                _context.TblSystemConfigs.Add(emailConfig);
            }
            emailConfig.ConfigValue = request.Email;

            //ưu Password (mã hóa)
            if (!string.IsNullOrEmpty(request.Password))
            {
                var passConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "Mail_Password");
                if (passConfig == null)
                {
                    passConfig = new TblSystemConfig { ConfigKey = "Mail_Password", Description = "Mật khẩu ứng dụng Email" };
                    _context.TblSystemConfigs.Add(passConfig);
                }

                // Lấy SecretKey từ appsettings.json
                string secretKey = _configuration["AppSettings:SecretKey"];

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

            // client id
            if (!string.IsNullOrEmpty(request.ClientId))
            {
                var clientIdConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ClientId");
                if (clientIdConfig == null)
                {
                    clientIdConfig = new TblSystemConfig { ConfigKey = "PayOS_ClientId", Description = "PayOS Client ID (Encrypted)" };
                    _context.TblSystemConfigs.Add(clientIdConfig);
                }
                
                clientIdConfig.ConfigValue = SecurityHelper.Encrypt(request.ClientId, secretKey);
            }

            // api key
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

            // Lưu ChecksumKey
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

            //lưu site key(plain ở hiển thị)
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
                siteKeyConfig.ConfigValue = request.SiteKey; 
            }

            //secret key có mã hóa
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
                // Mã hóa trước lúc lưu
                secretKeyConfig.ConfigValue = SecurityHelper.Encrypt(request.SecretKey, appSecretKey);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật cấu hình Recaptcha thành công!" });
        }
    }

}