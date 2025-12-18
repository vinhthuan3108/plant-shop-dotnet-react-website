namespace back_end.DTOs
{
    public class PostDto
    {
        public int PostId { get; set; }
        public string Title { get; set; } = null!;
        public string? ShortDescription { get; set; }
        public string? Content { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int PostCategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? AuthorName { get; set; }
        public string? Tags { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public bool IsDeleted { get; set; } 
        public DateTime? PublishedAt { get; set; }
    }
}
