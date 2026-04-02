using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class DiscussionThread : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser Author { get; set; } = null!;

    public ICollection<DiscussionReply> Replies { get; set; } = new List<DiscussionReply>();
}

public class DiscussionReply : BaseEntity
{
    public string Content { get; set; } = string.Empty;

    public int ThreadId { get; set; }
    public DiscussionThread Thread { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser Author { get; set; } = null!;
}
