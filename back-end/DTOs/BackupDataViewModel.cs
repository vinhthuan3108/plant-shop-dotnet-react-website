using back_end.Models;

namespace back_end.DTOs
{
    // DTOs/BackupDataDto.cs
    public class BackupDataDto
    {
        public DateTime BackupTime { get; set; }
        public List<TblUser> Users { get; set; }
        public List<TblProduct> Products { get; set; }
        public List<TblOrder> Orders { get; set; }
        public List<TblOrderDetail> OrderDetails { get; set; } // Nhớ backup chi tiết đơn hàng
        public List<TblCategory> Categories { get; set; }
        public List<TblSystemConfig> SystemConfigs { get; set; }
        // Thêm các bảng khác nếu cần
    }
}
