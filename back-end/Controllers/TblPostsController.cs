using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting; 
using System.IO;
using System.Text.RegularExpressions;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TblPostsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;

        private readonly IWebHostEnvironment _environment; 

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


                if (status == "Published")
                {

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
                .Include(p => p.Author)      
                .Include(p => p.PostCategory) 
                .FirstOrDefaultAsync(p => p.PostId == id);

            if (post == null) return NotFound("Không tìm thấy bài viết");

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

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchPosts(string keyword)
        {
            if (string.IsNullOrEmpty(keyword)) return Ok(new List<object>());

            string kw = keyword.ToLower().Trim();

            // Tìm bài viết:
            // Phải là bài đã Published, Chưa bị xóa (IsDeleted != true)
            // Tiêu đề chứa từ khóa
            var posts = await _context.TblPosts
                .Where(p => (p.Status == "Published")
                            && (p.IsDeleted != true)
                            && p.Title.ToLower().Contains(kw))
                .OrderByDescending(p => p.CreatedAt)
                .Take(5) 
                .Select(p => new
                {
                    Id = p.PostId,
                    Title = p.Title,
                    Image = p.ThumbnailUrl,
                    Type = "blog" 
                })
                .ToListAsync(); 

            return Ok(posts);
        } 
        [HttpGet("related/{id}")]
        public async Task<ActionResult<IEnumerable<PostDto>>> GetRelatedPosts(int id)
        {
            //Lấy thông tin bài viết hiện tại để biết nó thuộc Category nào
            var currentPost = await _context.TblPosts.FindAsync(id);
            if (currentPost == null) return NotFound();

            var relatedPosts = await _context.TblPosts
                .Where(p => p.PostCategoryId == currentPost.PostCategoryId // Cùng danh mục
                         && p.PostId != id // KHÔNG trùng với bài hiện tại
                         && p.Status == "Published" 
                         && p.IsDeleted != true) 
                .OrderByDescending(p => p.CreatedAt) // Bài mới nhất
                .Take(3) 
                .Select(p => new PostDto
                {
                    PostId = p.PostId,
                    Title = p.Title,
                    ThumbnailUrl = p.ThumbnailUrl,
                    PublishedAt = p.PublishedAt,
                    CreatedAt = p.CreatedAt,
                    ShortDescription = p.ShortDescription
                })
                .ToListAsync();

            return Ok(relatedPosts);
        }
        [HttpPost]
        [Authorize] 
        public async Task<ActionResult> CreatePost(PostDto postDto)
        {
            var userIdClaim = User.FindFirst("UserId");

            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại." });
            }

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

            //xóa ảnh cũ
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


            post.Title = postDto.Title;
            post.ShortDescription = postDto.ShortDescription;
            post.Content = postDto.Content;
            post.ThumbnailUrl = postDto.ThumbnailUrl; 
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
            // Soft Delete chỉ ẩn bài
            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            post.IsDeleted = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã ngừng hoạt động bài viết thành công" });
        }

        //xóa vĩnh viễn
        [HttpDelete("hard/{id}")]
        public async Task<IActionResult> HardDeletePost(int id)
        {
            var post = await _context.TblPosts.FindAsync(id);
            if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });

            //xóa ảnh
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
                        
                    }
                }
            }



            _context.TblPosts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa vĩnh viễn bài viết khỏi hệ thống" });
        }
    }
}