using back_end.Models;

namespace back_end.DTOs
{
    public class BackupDataDto
    {
        public DateTime BackupTime { get; set; }
        public List<TblUser> Users { get; set; }
        public List<TblProduct> Products { get; set; }
        public List<TblOrder> Orders { get; set; }
        public List<TblOrderDetail> OrderDetails { get; set; } 
        public List<TblCategory> Categories { get; set; }
        public List<TblSystemConfig> SystemConfigs { get; set; }

    }
}
