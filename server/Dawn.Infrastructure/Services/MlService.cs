using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dawn.Core.Entities;

namespace Dawn.Infrastructure.Services;

public interface IMlService
{
    Task<List<int>> GetCourseRecommendationsAsync(List<Course> userEnrolled, List<Course> allCourses);
    Task<MlChatResponse?> GetChatAnswerAsync(string query, List<Lesson> lessons);
}

public class MlService : IMlService
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;

    public MlService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task<List<int>> GetCourseRecommendationsAsync(List<Course> userEnrolled, List<Course> allCourses)
    {
        try
        {
            var payload = new
            {
                user_enrolled = userEnrolled.Select(c => new { id = c.Id, title = c.Title, description = c.Description ?? "" }).ToList(),
                all_courses = allCourses.Select(c => new { id = c.Id, title = c.Title, description = c.Description ?? "" }).ToList()
            };

            var content = new StringContent(JsonSerializer.Serialize(payload, _jsonOptions), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("recommend", content);
            
            if (!response.IsSuccessStatusCode) return new List<int>();

            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<MlRecommendationResponse>(responseString, _jsonOptions);
            
            return result?.RecommendedIds ?? new List<int>();
        }
        catch (Exception)
        {
            // Python service might be down, fail gracefully
            return new List<int>();
        }
    }

    public async Task<MlChatResponse?> GetChatAnswerAsync(string query, List<Lesson> lessons)
    {
        try
        {
            var payload = new
            {
                query = query,
                lessons = lessons.Select(l => new { id = l.Id, title = l.Title, content = l.Description ?? "" }).ToList()
            };

            var content = new StringContent(JsonSerializer.Serialize(payload, _jsonOptions), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("chat", content);

            if (!response.IsSuccessStatusCode) return null;

            var responseString = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<MlChatResponse>(responseString, _jsonOptions);
        }
        catch (Exception)
        {
            // Python service down
            return null;
        }
    }
}

public class MlRecommendationResponse
{
    [JsonPropertyName("recommended_ids")]
    public List<int> RecommendedIds { get; set; } = new List<int>();
}

public class MlChatResponse
{
    [JsonPropertyName("answer")]
    public string Answer { get; set; } = string.Empty;

    [JsonPropertyName("retrieved_lesson_id")]
    public int? RetrievedLessonId { get; set; }
}
