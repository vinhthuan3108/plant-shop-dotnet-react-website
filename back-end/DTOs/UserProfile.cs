using System;
using System.ComponentModel.DataAnnotations;

namespace back_end.DTOs
{
    // DTO cập nhật thông tin cá nhân
    public class UserProfileDto
    {
        public string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? DateofBirth { get; set; }
        public string? Gender { get; set; }
    }

    // DTO hiển thị và thêm/sửa cái sổ địa chỉ
    public class UserAddressDto
    {
        public int AddressId { get; set; }

        [Required]
        public string RecipientName { get; set; } 

        [Required]
        public string PhoneNumber { get; set; }

        [Required]
        public string AddressDetail { get; set; } 

        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public bool? IsDefault { get; set; }
    }
}