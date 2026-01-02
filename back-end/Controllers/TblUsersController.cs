using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblUsersController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblUsersController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.TblUsers
                .Include(u => u.Role) 
                .Select(u => new
                {
                    u.UserId,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.IsActive,
                    u.RoleId,
                    RoleName = u.Role.RoleName,
                    u.CreatedAt
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser(TblUser user)
        {
            if (await _context.TblUsers.AnyAsync(u => u.Email == user.Email))
                return BadRequest(new { message = "Email đã tồn tại" });


            string passRaw = string.IsNullOrEmpty(user.PasswordHash) ? "123456" : user.PasswordHash;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passRaw);

            user.CreatedAt = DateTime.Now;
            user.UpdatedAt = DateTime.Now;

            _context.TblUsers.Add(user);
            await _context.SaveChangesAsync();

            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, TblUser user)
        {
            var existingUser = await _context.TblUsers.FindAsync(id);
            if (existingUser == null) return NotFound();

            existingUser.FullName = user.FullName;
            existingUser.PhoneNumber = user.PhoneNumber;
            existingUser.RoleId = user.RoleId;
            existingUser.IsActive = user.IsActive;
            existingUser.UpdatedAt = DateTime.Now;


            // Nếucó nhập mật khẩu mới vào ô (khác rông) mới đổi pass.
            // Nếu ô mật khẩu trống, giữ nguyên pass cũ.
            if (!string.IsNullOrEmpty(user.PasswordHash) && user.PasswordHash.Length < 20)
            {
                //Nếu chuỗi gửi lên ngắn (<20 ký tự) thì đó là pass mới chưa hash -> Hash 
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.TblUsers.FindAsync(id);
            if (user == null) return NotFound();

            _context.TblUsers.Remove(user);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}