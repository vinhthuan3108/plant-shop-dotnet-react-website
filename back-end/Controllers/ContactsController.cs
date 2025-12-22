using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models; // Đổi namespace theo project của bạn
using System.Net;
using System.Net.Mail;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context; // Đổi tên Context theo project của bạn

        public ContactsController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách liên hệ (Có tìm kiếm và lọc trạng thái)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblContact>>> GetContacts(string? search, string? status)
        {
            var query = _context.TblContacts.AsQueryable();

            // Tìm kiếm theo Tên hoặc Email
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.FullName.Contains(search) || c.Email.Contains(search));
            }

            // Lọc theo trạng thái (New, Read, Replied)
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(c => c.Status == status);
            }

            // Sắp xếp tin nhắn mới nhất lên đầu
            return await query.OrderByDescending(c => c.SentAt).ToListAsync();
        }

        // 2. Lấy chi tiết 1 tin nhắn (và tự động đánh dấu là Đã xem nếu đang là New)
        [HttpGet("{id}")]
        public async Task<ActionResult<TblContact>> GetContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            return contact;
        }

        // 3. Cập nhật trạng thái (Ví dụ: Admin bấm nút "Đã xử lý")
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            contact.Status = newStatus; // Ví dụ: "Processed"
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // 4. Xóa liên hệ
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            _context.TblContacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa tin nhắn liên hệ." });
        }

        // 5. API nhận tin nhắn từ User (Dùng cho Form ở Hình 1 của bạn)
        [HttpPost]
        public async Task<ActionResult<TblContact>> CreateContact(TblContact contact)
        {
            contact.SentAt = DateTime.Now;
            contact.Status = "New"; // Mặc định là tin mới
            _context.TblContacts.Add(contact);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetContact", new { id = contact.ContactId }, contact);
        }
        // 6. API Phản hồi liên hệ (Gửi Email)
        [HttpPost("reply/{id}")]
        public async Task<IActionResult> ReplyContact(int id, [FromBody] ReplyContactRequest request)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            try
            {
                // --- CẤU HÌNH GỬI EMAIL (SMTP) ---
                // Lưu ý: Nếu dùng Gmail, bạn cần bật "App Password" (Mật khẩu ứng dụng)
                string fromEmail = "vinhthuan9@gmail.com"; // <-- THAY EMAIL CỦA BẠN
                string password = "gxmp burt maca knab";        // <-- THAY MẬT KHẨU ỨNG DỤNG GMAIL

                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential(fromEmail, password),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail),
                    Subject = "Phản hồi: " + request.Subject,
                    Body = $"Chào {contact.FullName},\n\n{request.Message}\n\nTrân trọng,\nĐội ngũ Admin.",
                    IsBodyHtml = false,
                };

                mailMessage.To.Add(contact.Email);

                // Gửi mail
                smtpClient.Send(mailMessage);

                // --- CẬP NHẬT TRẠNG THÁI ---
                contact.Status = "Replied"; // Đánh dấu là Đã phản hồi
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã gửi email phản hồi thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest("Lỗi gửi email: " + ex.Message);
            }
        }
    }
    public class ReplyContactRequest
    {
        public string Subject { get; set; }
        public string Message { get; set; }
    }

}