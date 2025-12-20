using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace back_end.DTOs
{
    // DTO dùng khi Thêm mới Banner
    public class BannerCreateDto
    {
        public string? Title { get; set; }
        public string? LinkUrl { get; set; }
        public int? DisplayOrder { get; set; } = 0; // Mặc định là 0
        public bool? IsActive { get; set; } = true; // Mặc định là hiển thị

        [Required(ErrorMessage = "Vui lòng chọn hình ảnh")]
        public IFormFile ImageFile { get; set; } // Bắt buộc phải có ảnh khi tạo mới
    }

    // DTO dùng khi Cập nhật Banner
    public class BannerUpdateDto
    {
        public int BannerId { get; set; }
        public string? Title { get; set; }
        public string? LinkUrl { get; set; }
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }

        // Khi sửa, có thể người dùng không chọn ảnh mới -> Cho phép null
        public IFormFile? ImageFile { get; set; }
    }
}