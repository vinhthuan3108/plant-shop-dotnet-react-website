using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace back_end.DTOs
{

    public class BannerCreateDto
    {
        public string? Title { get; set; }
        public string? LinkUrl { get; set; }
        public int? DisplayOrder { get; set; } = 0;
        public bool? IsActive { get; set; } = true; 
        [Required(ErrorMessage = "Vui lòng chọn hình ảnh")]
        public IFormFile ImageFile { get; set; } 
    }

    public class BannerUpdateDto
    {
        public int BannerId { get; set; }
        public string? Title { get; set; }
        public string? LinkUrl { get; set; }
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }

        
        public IFormFile? ImageFile { get; set; }// Khi sửa, có thể người dùng không chọn ảnh mới -> Cho phép null
    }
}