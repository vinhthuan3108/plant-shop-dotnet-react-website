using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting; // 1. Thêm thư viện này
using System.IO;
using System.Text.RegularExpressions;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblPostsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        private readonly IWebHostEnvironment _environment; // 3. Khai báo biến môi trường

        // 4. Inject vào constructor
        public TblPostsController(DbplantShopThuanCuongContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult> GetPosts(string? search, int? categoryId, string? status)
        {
            var query = _context.TblPosts.AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(p => p.Title.Contains(search));

            if (categoryId.HasValue)
                query = query.Where(p => p.PostCategoryId == categoryId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);

                // LOGIC QUAN TRỌNG:
                // Nếu đang lấy bài "Published" (tức là Client đang xem),
                // thì BẮT BUỘC loại bỏ những bài đã bị Xóa mềm (IsDeleted = true)
                if (status == "Published")
                {
                    // p.IsDeleted != true (nghĩa là lấy false hoặc null)
                    query = query.Where(p => p.IsDeleted != true);
                }
            }

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
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
                    AuthorName = p.Author.FullName,
                    PublishedAt = p.PublishedAt,
                    CreatedAt = p.CreatedAt,
                    IsDeleted = p.IsDeleted ?? false
                }).ToListAsync();

            return Ok(posts);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult> GetPost(int id)
        {
            var post = await _context.TblPosts
                .Include(p => p.Author)      // Kèm thông tin tác giả
                .Include(p => p.PostCategory) // Kèm danh mục
                .FirstOrDefaultAsync(p => p.PostId == id);

            if (post == null) return NotFound("Không tìm thấy bài viết");

            // Chỉ cho phép xem bài đã Published (nếu muốn chặt chẽ hơn)
            // if (post.Status != "Published") return BadRequest("Bài viết chưa được xuất bản");

            // Tăng lượt xem (nếu có trường ViewCount) - ở đây model bạn chưa có nên bỏ qua

            var postDto = new PostDto
            {
                PostId = post.PostId,
                Title = post.Title,
                ShortDescription = post.ShortDescription,
                Content = post.Content,
                ThumbnailUrl = post.ThumbnailUrl,
                Status = post.Status,
                PostCategoryId = post.PostCategoryId,
                CategoryName = post.PostCategory?.CategoryName,
                AuthorName = post.Author?.FullName,
                PublishedAt = post.PublishedAt,
                CreatedAt = post.CreatedAt,
                Tags = post.Tags
            };

            return Ok(postDto);
        }
        // --- CHÈN ĐOẠN NÀY VÀO GIỮA GetPost VÀ CreatePost ---

        // GET: api/TblPosts/search?keyword=abc
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchPosts(string keyword)
        {
            if (string.IsNullOrEmpty(keyword)) return Ok(new List<object>());

            string kw = keyword.ToLower().Trim();

            // Tìm bài viết:
            // 1. Phải là bài đã Published (hoặc Active)
            // 2. Chưa bị xóa (IsDeleted != true)
            // 3. Tiêu đề hoặc Mô tả chứa từ khóa
            var posts = await _context.TblPosts
                .Where(p => (p.Status == "Published")
                            && (p.IsDeleted != true)
                            && p.Title.ToLower().Contains(kw))
                .OrderByDescending(p => p.CreatedAt)
                .Take(5) // Chỉ lấy 5 bài gợi ý
                .Select(p => new
                {
                    Id = p.PostId,
                    Title = p.Title,
                    Image = p.ThumbnailUrl,
                    Type = "blog", // Đánh dấu để Frontend biết đây là bài viết
                    ShortDescription = p.ShortDescription
                })
                .ToListAsync();

            return Ok(posts);
        }

        // ----------------------------------------------------

        [HttpPost]
        [Authorize] // <--- Bắt buộc phải có token mới được đăng bài
        public async Task<ActionResult> CreatePost(PostDto postDto)
        {
            // 1. Lấy UserId từ Token (tên "UserId" phải khớp với Bước 1)
            var userIdClaim = User.FindFirst("UserId");

            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại." });
            }

            // Chuyển đổi từ string sang int
            int loggedInUserId = int.Parse(userIdClaim.Value);

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

                // 2. GÁN ID NGƯỜI ĐĂNG NHẬP VÀO ĐÂY
                AuthorId = loggedInUserId,

                IsDeleted = postDto.IsDeleted
            };

            if (post.Status == "Published") post.PublishedAt = DateTime.Now;

            _context.TblPosts.Add(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tạo bài viết thành công!" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, PostDto postDto)
        {
            if (id != postDto.PostId) return BadRequest("ID không khớp");

            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound("Không tìm thấy bài viết");

            // --- XỬ LÝ XÓA ẢNH CŨ KHI CẬP NHẬT (OPTIONAL) ---
            // Nếu có ảnh cũ VÀ ảnh mới khác ảnh cũ (nghĩa là người dùng đã thay ảnh)
            if (!string.IsNullOrEmpty(post.ThumbnailUrl) &&
                post.ThumbnailUrl != postDto.ThumbnailUrl)
            {
                var oldRelativePath = post.ThumbnailUrl.TrimStart('/');
                var oldFullPath = Path.Combine(_environment.WebRootPath, oldRelativePath);
                if (System.IO.File.Exists(oldFullPath))
                {
                    try { System.IO.File.Delete(oldFullPath); } catch { }
                }
            }
            // --------------------------------------------------

            post.Title = postDto.Title;
            post.ShortDescription = postDto.ShortDescription;
            post.Content = postDto.Content;
            post.ThumbnailUrl = postDto.ThumbnailUrl; // Cập nhật đường dẫn ảnh mới
            post.PostCategoryId = postDto.PostCategoryId;
            post.Tags = postDto.Tags;

            post.IsDeleted = postDto.IsDeleted;

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


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            // Soft Delete chỉ ẩn bài, vẫn giữ file ảnh để có thể khôi phục
            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            post.IsDeleted = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã ngừng hoạt động bài viết thành công" });
        }

        // DELETE: Xóa vĩnh viễn (Hard Delete) -> Cần xóa file
        [HttpDelete("hard/{id}")]
        public async Task<IActionResult> HardDeletePost(int id)
        {
            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            // --- ĐOẠN CODE XÓA FILE ẢNH VẬT LÝ ---
            if (!string.IsNullOrEmpty(post.ThumbnailUrl))
            {
                // post.ThumbnailUrl dạng: /posts/anh1.jpg -> bỏ dấu / đầu
                var relativePath = post.ThumbnailUrl.TrimStart('/');
                var fullPath = Path.Combine(_environment.WebRootPath, relativePath);

                if (System.IO.File.Exists(fullPath))
                {
                    try
                    {
                        System.IO.File.Delete(fullPath);
                    }
                    catch (Exception)
                    {
                        // Bỏ qua lỗi nếu file đang bị khóa hoặc không xóa được
                    }
                }
            }
            // ---------------------------------------


            _context.TblPosts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa vĩnh viễn bài viết khỏi hệ thống" });
        }
    }
}