using back_end.Models; // Namespace chứa DbContext
using back_end.Helpers; // Namespace chứa SecurityHelper
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace back_end.Services
{
    public class EmailService
    {
        // Lưu ý: EmailService cần được đăng ký là Scoped (AddScoped) trong Program.cs thì mới Inject được DbContext
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IConfiguration _configuration;

        public EmailService(DbplantShopThuanCuongContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            // 1. Lấy thông tin từ DB
            var emailConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "Mail_User");
            var passConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "Mail_Password");

            if (emailConfig == null || passConfig == null || string.IsNullOrEmpty(emailConfig.ConfigValue))
            {
                // Nếu chưa cấu hình thì return hoặc throw lỗi tùy bạn
                Console.WriteLine("Chưa cấu hình Email hệ thống.");
                return;
            }

            string fromEmail = emailConfig.ConfigValue;
            string encryptedPass = passConfig.ConfigValue;

            // 2. Giải mã Password
            string secretKey = _configuration["AppSettings:SecretKey"] ?? "KeyMacDinhChoDev123";
            string appPassword = SecurityHelper.Decrypt(encryptedPass, secretKey);

            // 3. Gửi mail (Code cũ của bạn)
            var smtpClient = new SmtpClient("smtp.gmail.com")
            {
                Port = 587,
                Credentials = new NetworkCredential(fromEmail, appPassword),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail),
                Subject = subject,
                Body = message,
                IsBodyHtml = true,
            };
            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}