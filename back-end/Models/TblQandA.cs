using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace back_end.Models
{
    [Table("TblQandA")]
    public partial class TblQandA
    {
        [Key]
        public int Id { get; set; }

        public string Question { get; set; } = null!; 

        public string Answer { get; set; } = null!;   

        public bool IsActive { get; set; }           
        public int DisplayOrder { get; set; }
    }
}