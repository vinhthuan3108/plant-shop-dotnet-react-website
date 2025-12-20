// Controllers/VouchersController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using back_end.DTOs;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VouchersController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public VouchersController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // 2.2.3.2 Xem danh sách mã giảm giá (Có lọc và tìm kiếm)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblVoucher>>> GetVouchers(string? search, bool? isActive)
        {
            var query = _context.TblVouchers.AsQueryable();

            // Tìm kiếm theo tên mã
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(v => v.Code.Contains(search));
            }

            // Lọc theo trạng thái
            if (isActive.HasValue)
            {
                query = query.Where(v => v.IsActive == isActive.Value);
            }

            // Sắp xếp giảm dần theo ngày tạo (hoặc ID)
            return await query.OrderByDescending(v => v.VoucherId).ToListAsync();
        }

        // 2.2.3.1 Tạo mã giảm giá mới
        [HttpPost]
        public async Task<ActionResult<TblVoucher>> CreateVoucher(VoucherCreateUpdateDto dto)
        {
            // 1. Kiểm tra trùng lặp Code
            if (await _context.TblVouchers.AnyAsync(v => v.Code == dto.Code && v.IsActive == true))
            {
                return BadRequest("Mã voucher này đang hoạt động và đã tồn tại.");
            }

            // 2. Kiểm tra thời gian
            if (dto.EndDate < dto.StartDate)
            {
                return BadRequest("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
            }

            // 3. Kiểm tra giá trị % (1-100)
            if (dto.DiscountType == "PERCENT" && (dto.DiscountValue <= 0 || dto.DiscountValue > 100))
            {
                return BadRequest("Nếu giảm theo %, giá trị phải từ 1 đến 100.");
            }

            var voucher = new TblVoucher
            {
                Code = dto.Code.ToUpper(), // Lưu in hoa
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MaxDiscountAmount = dto.DiscountType == "PERCENT" ? dto.MaxDiscountAmount : null,
                MinOrderValue = dto.MinOrderValue,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                UsageLimit = dto.UsageLimit,
                UsageCount = 0, // Mặc định chưa dùng
                IsActive = true
            };

            _context.TblVouchers.Add(voucher);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetVouchers", new { id = voucher.VoucherId }, voucher);
        }

        // 2.2.3.3 Cập nhật mã giảm giá
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVoucher(int id, VoucherCreateUpdateDto dto)
        {
            var voucher = await _context.TblVouchers
                                        .Include(v => v.TblOrders) // Load lịch sử đơn hàng để check
                                        .FirstOrDefaultAsync(v => v.VoucherId == id);

            if (voucher == null) return NotFound();

            // Kiểm tra xem mã đã có người dùng chưa (dựa vào UsageCount hoặc bảng Order)
            bool hasUsed = voucher.UsageCount > 0 || voucher.TblOrders.Any();

            // Logic: Hạn chế sửa nếu đang chạy/đã dùng
            if (hasUsed)
            {
                // Chỉ cho phép sửa: Số lượng, Ngày kết thúc
                voucher.UsageLimit = dto.UsageLimit;
                voucher.EndDate = dto.EndDate;

                // Nếu cố tình sửa Giá trị tiền hoặc Code -> Báo lỗi hoặc lờ đi (ở đây mình báo lỗi cho rõ)
                if (voucher.DiscountValue != dto.DiscountValue || voucher.Code != dto.Code.ToUpper())
                {
                    return BadRequest("Mã đã có người sử dụng, chỉ được phép gia hạn ngày hoặc tăng số lượng.");
                }
            }
            else
            {
                // Nếu chưa ai dùng -> Cho sửa thoải mái (cần check trùng code nếu đổi code mới)
                if (voucher.Code != dto.Code.ToUpper() && await _context.TblVouchers.AnyAsync(v => v.Code == dto.Code && v.IsActive == true))
                {
                    return BadRequest("Mã code mới bị trùng.");
                }

                voucher.Code = dto.Code.ToUpper();
                voucher.DiscountType = dto.DiscountType;
                voucher.DiscountValue = dto.DiscountValue;
                voucher.MaxDiscountAmount = dto.DiscountType == "PERCENT" ? dto.MaxDiscountAmount : null;
                voucher.MinOrderValue = dto.MinOrderValue;
                voucher.StartDate = dto.StartDate;
                voucher.EndDate = dto.EndDate;
                voucher.UsageLimit = dto.UsageLimit;
            }

            await _context.SaveChangesAsync();
            return Ok(voucher);
        }

        // 2.2.3.4 Xóa hoặc ngừng kích hoạt
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoucher(int id)
        {
            var voucher = await _context.TblVouchers
                                        .Include(v => v.TblOrders)
                                        .FirstOrDefaultAsync(v => v.VoucherId == id);

            if (voucher == null) return NotFound();

            bool hasUsed = voucher.UsageCount > 0 || voucher.TblOrders.Any();

            if (hasUsed)
            {
                // Nếu đã dùng -> Chỉ chuyển trạng thái sang ngưng hoạt động (Soft Delete)
                voucher.IsActive = false;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Mã đã có người dùng nên hệ thống chỉ tạm khóa (Ngừng kích hoạt)." });
            }
            else
            {
                // Nếu chưa dùng -> Xóa vĩnh viễn (Hard Delete)
                _context.TblVouchers.Remove(voucher);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã xóa mã giảm giá vĩnh viễn." });
            }
        }
    }
}