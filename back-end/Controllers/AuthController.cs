using back_end.DTO;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(DbplantShopThuanCuongContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

  
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            // 1. Kiểm tra email đã tồn tại chưa
            if (await _context.TblUsers.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email đã tồn tại.");
            }


            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new TblUser
            {
                Email = request.Email,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                IsActive = true, // Tạm thời cho active để test
                RoleId = 2, //1 là Admin, 2 là Customer 
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.TblUsers.Add(user);
            await _context.SaveChangesAsync();

            return Ok("Đăng ký thành công!");
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            // 1. Tìm user theo email
            var user = await _context.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest("Sai email hoặc mật khẩu.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest("Sai email hoặc mật khẩu.");
            }


            string token = CreateToken(user);

            return Ok(new
            {
                Token = token,
                FullName = user.FullName,
                Role = user.RoleId 
            });
        }

        // Hàm tạo JWT Token
        private string CreateToken(TblUser user)
        {
            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.RoleId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetSection("AppSettings:Token").Value ?? "tokencuavinhthuanvamanhcuong-dsjfhjdfhshfhsfdfhsdfhsdhfsfskhfdjhfkshdfhsdfsdf"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1), // Token hết hạn sau 1 ngày
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }
    }
}