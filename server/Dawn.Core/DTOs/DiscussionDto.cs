namespace Dawn.Core.DTOs;

public class DiscussionThreadDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ReplyCount { get; set; }
}

public class DiscussionThreadDetailDto : DiscussionThreadDto
{
    public List<DiscussionReplyDto> Replies { get; set; } = new();
}

public class DiscussionReplyDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class DiscussionThreadCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int CourseId { get; set; }
}

public class DiscussionReplyCreateDto
{
    public string Content { get; set; } = string.Empty;
    public int ThreadId { get; set; }
}
