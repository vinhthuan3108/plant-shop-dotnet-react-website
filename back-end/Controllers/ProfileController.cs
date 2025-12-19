using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models; // Namespace chứa DbContext và Models
using back_end.DTOs;

[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public ProfileController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    // 1. Lấy thông tin User
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetProfile(int userId)
    {
        var user = await _context.TblUsers
            .Select(u => new {
                u.UserId,
                u.Email, // Email không cho sửa
                u.FullName,
                u.PhoneNumber,
                u.AvatarUrl,
                u.DateofBirth,
                u.Gender
            })
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return NotFound();
        return Ok(user);
    }

    // 2. Cập nhật thông tin User
    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UserProfileDto dto)
    {
        var user = await _context.TblUsers.FindAsync(userId);
        if (user == null) return NotFound();

        user.FullName = dto.FullName;
        user.PhoneNumber = dto.PhoneNumber;
        user.DateofBirth = dto.DateofBirth;
        user.Gender = dto.Gender;

        // Nếu có gửi link ảnh mới thì cập nhật
        if (!string.IsNullOrEmpty(dto.AvatarUrl))
        {
            user.AvatarUrl = dto.AvatarUrl;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật hồ sơ thành công" });
    }

    // 3. Lấy danh sách địa chỉ
    [HttpGet("{userId}/addresses")]
    public async Task<IActionResult> GetAddresses(int userId)
    {
        var list = await _context.TblUserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault) // Mặc định lên đầu
            .Select(a => new UserAddressDto
            {
                AddressId = a.AddressId,
                RecipientName = a.RecipientName,
                PhoneNumber = a.PhoneNumber,
                AddressDetail = a.AddressDetail,
                Province = a.Province,
                District = a.District,
                Ward = a.Ward,
                IsDefault = a.IsDefault
            })
            .ToListAsync();
        return Ok(list);
    }

    // 4. Thêm địa chỉ mới
    [HttpPost("{userId}/addresses")]
    public async Task<IActionResult> AddAddress(int userId, [FromBody] UserAddressDto dto)
    {
        // Logic: Nếu địa chỉ mới là Default -> Reset các cái cũ
        if (dto.IsDefault == true)
        {
            var oldDefaults = await _context.TblUserAddresses
                .Where(a => a.UserId == userId && a.IsDefault == true)
                .ToListAsync();
            foreach (var item in oldDefaults) item.IsDefault = false;
        }
        else
        {
            // Nếu user chưa có địa chỉ nào, cái đầu tiên auto là Default
            bool hasAddress = await _context.TblUserAddresses.AnyAsync(a => a.UserId == userId);
            if (!hasAddress) dto.IsDefault = true;
        }

        var newAddr = new TblUserAddress
        {
            UserId = userId,
            RecipientName = dto.RecipientName,
            PhoneNumber = dto.PhoneNumber,
            AddressDetail = dto.AddressDetail,
            Province = dto.Province,
            District = dto.District,
            Ward = dto.Ward,
            IsDefault = dto.IsDefault ?? false
        };

        _context.TblUserAddresses.Add(newAddr);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Thêm địa chỉ thành công" });
    }

    // 5. Cập nhật địa chỉ
    [HttpPut("addresses/{addressId}")]
    public async Task<IActionResult> UpdateAddress(int addressId, [FromBody] UserAddressDto dto)
    {
        var addr = await _context.TblUserAddresses.FindAsync(addressId);
        if (addr == null) return NotFound();

        // Logic Default
        if (dto.IsDefault == true && addr.IsDefault != true)
        {
            var oldDefaults = await _context.TblUserAddresses
                .Where(a => a.UserId == addr.UserId && a.IsDefault == true)
                .ToListAsync();
            foreach (var item in oldDefaults) item.IsDefault = false;
        }

        addr.RecipientName = dto.RecipientName;
        addr.PhoneNumber = dto.PhoneNumber;
        addr.AddressDetail = dto.AddressDetail;
        addr.Province = dto.Province;
        addr.District = dto.District;
        addr.Ward = dto.Ward;
        addr.IsDefault = dto.IsDefault ?? false;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật địa chỉ thành công" });
    }

    // 6. Xóa địa chỉ
    [HttpDelete("addresses/{addressId}")]
    public async Task<IActionResult> DeleteAddress(int addressId)
    {
        var addr = await _context.TblUserAddresses.FindAsync(addressId);
        if (addr == null) return NotFound();

        // Không cho xóa địa chỉ mặc định (hoặc tùy logic của bạn)
        if (addr.IsDefault == true)
        {
            return BadRequest("Không thể xóa địa chỉ mặc định. Hãy thiết lập địa chỉ khác làm mặc định trước.");
        }

        _context.TblUserAddresses.Remove(addr);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã xóa địa chỉ" });
    }
}