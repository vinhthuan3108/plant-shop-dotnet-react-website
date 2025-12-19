using System;
using System.ComponentModel.DataAnnotations;

namespace back_end.Models
{
    public class TblTestimonial
    {
        [Key]
        public int TestimonialId { get; set; }
        public string? Name { get; set; }
        public string? Role { get; set; }
        public string? Content { get; set; }
        public string? AvatarUrl { get; set; }
        public int? Rating { get; set; }
        public bool? IsActive { get; set; }
    }
}