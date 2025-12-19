using System;
using System.ComponentModel.DataAnnotations;

namespace back_end.Models
{
    public class TblNew
    {
        [Key]
        public int NewsId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public bool? IsActive { get; set; }
    }
}