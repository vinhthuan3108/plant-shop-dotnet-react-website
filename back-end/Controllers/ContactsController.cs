using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using back_end.Services; // 1. Nhớ using namespace chứa EmailService

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly EmailService _emailService; // 2. Khai báo service

        // 3. Inject EmailService vào Constructor
        public ContactsController(DbplantShopThuanCuongContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // 1. Lấy danh sách liên hệ (Giữ nguyên)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblContact>>> GetContacts(string? search, string? status)
        {
            var query = _context.TblContacts.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.FullName.Contains(search) || c.Email.Contains(search));
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(c => c.Status == status);
            }

            return await query.OrderByDescending(c => c.SentAt).ToListAsync();
        }

        // 2. Lấy chi tiết (Giữ nguyên)
        [HttpGet("{id}")]
        public async Task<ActionResult<TblContact>> GetContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            // Tự động đánh dấu đã đọc nếu đang là New (Optional logic)
            if (contact.Status == "New")
            {
                contact.Status = "Read";
                await _context.SaveChangesAsync();
            }

            return contact;
        }

        // 3. Cập nhật trạng thái (Giữ nguyên)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            contact.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // 4. Xóa liên hệ (Giữ nguyên)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            _context.TblContacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa tin nhắn liên hệ." });
        }

        // 5. API User gửi tin (Giữ nguyên)
        [HttpPost]
        public async Task<IActionResult> CreateContact([FromBody] ContactSubmissionDto request)
        {
            // 1. Kiểm tra Captcha với Google
            string secretKey = "6Lc37zwsAAAAABz0cJwRpYRqkl0c1kz7_DsXRBFg"; // <-- Thay Secret Key vào đây
            var isCaptchaValid = await VerifyCaptcha(request.RecaptchaToken, secretKey);

            if (!isCaptchaValid)
            {
                return BadRequest(new { message = "Xác thực Captcha thất bại. Vui lòng thử lại." });
            }

            // 2. Nếu Captcha đúng, tiến hành lưu vào DB
            var contact = new TblContact
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Message = request.Message,
                Subject = request.Subject, // Nếu DB có cột này
                SentAt = DateTime.Now,
                Status = "New"
            };

            _context.TblContacts.Add(contact);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetContact", new { id = contact.ContactId }, contact);
        }

        // Hàm phụ trợ để gọi sang Google (Copy hàm này vào trong Class Controller)
        // Sửa lại hàm này trong ContactsController.cs
        private async Task<bool> VerifyCaptcha(string token, string secretKey)
        {
            if (string.IsNullOrEmpty(token)) return false;

            using (var client = new HttpClient())
            {
                var response = await client.GetStringAsync($"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={token}");

                // Deserialize ra dynamic object
                var jsonResult = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(response);

                // SỬA LỖI Ở ĐÂY:
                // Ép kiểu về bool thay vì so sánh với chuỗi "true"
                try
                {
                    return (bool)jsonResult.success;
                }
                catch
                {
                    return false;
                }
            }
        }

        // 6. API Phản hồi liên hệ (SỬA ĐỔI QUAN TRỌNG)
        [HttpPost("reply/{id}")]
        public async Task<IActionResult> ReplyContact(int id, [FromBody] ReplyContactRequest request)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            try
            {
                // Chuẩn bị nội dung mail
                // Vì EmailService mặc định IsBodyHtml = true, nên ta dùng thẻ <br> để xuống dòng
                string emailSubject = "Phản hồi: " + request.Subject;
                string emailBody = $@"
                    <h3>Chào {contact.FullName},</h3>
                    <p>{request.Message.Replace("\n", "<br/>")}</p>
                    <br/>
                    <p>Trân trọng,<br/>Đội ngũ Admin.</p>
                ";

                // GỌI EMAIL SERVICE (Nó sẽ tự lo việc lấy pass từ DB, giải mã và gửi)
                await _emailService.SendEmailAsync(contact.Email, emailSubject, emailBody);

                // Cập nhật trạng thái trong DB
                contact.Status = "Replied";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã gửi email phản hồi thành công!" });
            }
            catch (Exception ex)
            {
                // Log lỗi ra console để debug nếu cần
                Console.WriteLine(ex.Message);
                return BadRequest("Lỗi gửi email: " + ex.Message);
            }
        }
    }

    public class ReplyContactRequest
    {
        public string Subject { get; set; }
        public string Message { get; set; }
    }
    public class ContactSubmissionDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Message { get; set; }
        public string Subject { get; set; }
        public string RecaptchaToken { get; set; } // Nhận token từ React
    }
}