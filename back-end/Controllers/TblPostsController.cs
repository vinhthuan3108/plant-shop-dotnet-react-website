using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblPostsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        public TblPostsController(DbplantShopThuanCuongContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách bài viết (Hiển thị tất cả, bao gồm cả bài ngừng hoạt động)
        [HttpGet]
        public async Task<ActionResult> GetPosts(string? search, int? categoryId, string? status)
        {
            var query = _context.TblPosts.AsQueryable();

            // Lọc theo từ khóa tìm kiếm
            if (!string.IsNullOrEmpty(search))
                query = query.Where(p => p.Title.Contains(search));

            // Lọc theo danh mục
            if (categoryId.HasValue)
                query = query.Where(p => p.PostCategoryId == categoryId);

            // Lọc theo trạng thái Published/Draft
            if (!string.IsNullOrEmpty(status))
                query = query.Where(p => p.Status == status);

            var posts = await query
                .OrderByDescending(p => p.CreatedAt) // Sắp xếp bài mới nhất lên đầu
                .Select(p => new PostDto
                {
                    PostId = p.PostId,
                    Title = p.Title,
                    ShortDescription = p.ShortDescription,
                    Content = p.Content,
                    ThumbnailUrl = p.ThumbnailUrl,
                    Status = p.Status,
                    PostCategoryId = p.PostCategoryId,
                    CategoryName = p.PostCategory.CategoryName,
                    PublishedAt = p.PublishedAt,
                    IsDeleted = p.IsDeleted ?? false 
                }).ToListAsync();

            return Ok(posts);
        }

        // 2. Tạo bài viết mới
        [HttpPost]
        public async Task<ActionResult> CreatePost(PostDto postDto)
        {
            var post = new TblPost
            {
                Title = postDto.Title,
                ShortDescription = postDto.ShortDescription,
                Content = postDto.Content,
                ThumbnailUrl = postDto.ThumbnailUrl,
                PostCategoryId = postDto.PostCategoryId,
                Tags = postDto.Tags,
                Status = postDto.Status ?? "Draft",
                CreatedAt = DateTime.Now,
                AuthorId = 6, // ID tác giả (Admin/Nhân viên)
                IsDeleted = postDto.IsDeleted // Nhận trạng thái từ Checkbox Modal
            };

            // Nếu đặt trạng thái là công khai ngay khi tạo
            if (post.Status == "Published") post.PublishedAt = DateTime.Now;

            _context.TblPosts.Add(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tạo bài viết thành công!" });
        }

        // 3. Cập nhật bài viết (Cho phép cập nhật cả bài đang IsDeleted = true)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, PostDto postDto)
        {
            if (id != postDto.PostId) return BadRequest("ID không khớp");

            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound("Không tìm thấy bài viết");

            // Cập nhật các thông tin cơ bản
            post.Title = postDto.Title;
            post.ShortDescription = postDto.ShortDescription;
            post.Content = postDto.Content;
            post.ThumbnailUrl = postDto.ThumbnailUrl;
            post.PostCategoryId = postDto.PostCategoryId;
            post.Tags = postDto.Tags;

            // Cập nhật trạng thái Hoạt động/Ngừng hoạt động (IsDeleted)
            post.IsDeleted = postDto.IsDeleted;

            // Xử lý logic ngày xuất bản khi đổi trạng thái từ Nháp -> Công khai
            if (post.Status == "Draft" && postDto.Status == "Published")
            {
                post.PublishedAt = DateTime.Now;
            }
            post.Status = postDto.Status ?? "Draft";

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.TblPosts.Any(e => e.PostId == id)) return NotFound();
                else throw;
            }

            return Ok(new { message = "Cập nhật bài viết thành công!" });
        }

        // 4. Xóa mềm (Có thể dùng làm nút đổi trạng thái nhanh nếu cần)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            post.IsDeleted = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã ngừng hoạt động bài viết thành công" });
        }

        // 5. Xóa cứng (Xóa vĩnh viễn khỏi Database)
        [HttpDelete("hard/{id}")]
        public async Task<IActionResult> HardDeletePost(int id)
        {
            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            _context.TblPosts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa vĩnh viễn bài viết khỏi hệ thống" });
        }
    }
}