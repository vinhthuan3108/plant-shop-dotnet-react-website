using System.Net;
using System.Net.Mail;

namespace back_end.Services
{
    public class EmailService
    {
        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            // Thông tin cấu hình Gmail
            var fromEmail = "vinhthuan9@gmail.com"; // <-- Thay email của bạn
            var appPassword = "gxmp burt maca knab"; // <-- Thay mật khẩu ứng dụng 16 ký tự

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
                IsBodyHtml = true, // Cho phép gửi HTML đẹp
            };
            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}