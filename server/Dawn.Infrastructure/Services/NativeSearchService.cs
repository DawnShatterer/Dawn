using Dawn.Core.Entities;

namespace Dawn.Infrastructure.Services;

/// <summary>
/// Native C# Hybrid Search Engine (BM25 + TF-IDF Cosine Similarity)
/// Replaces the external Python ML service entirely.
/// </summary>
public interface INativeSearchService
{
    /// <summary>
    /// Searches course lessons using hybrid BM25 + TF-IDF ranking.
    /// Returns the best-matching lesson content as an AI tutor response.
    /// </summary>
    NativeSearchResult? HybridSearch(string query, List<Lesson> lessons);

    /// <summary>
    /// Recommends courses using content-based TF-IDF similarity.
    /// Compares enrolled course descriptions against all available courses.
    /// </summary>
    List<int> GetContentBasedRecommendations(List<Course> enrolled, List<Course> allCourses, int topN = 5);
}

public class NativeSearchService : INativeSearchService
{
    // ═══════════════════════════════════════════════
    // ═══ BM25 PARAMETERS (Okapi BM25 standard) ═══
    // ═══════════════════════════════════════════════
    private const double K1 = 1.5;   // Term frequency saturation
    private const double B = 0.75;   // Document length normalization

    // Hybrid ranking weights
    private const double BM25_WEIGHT = 0.4;
    private const double TFIDF_WEIGHT = 0.6;

    // Minimum confidence threshold
    private const double MIN_SCORE = 0.05;

    // ═══════════════════════════════════════
    // ═══ 1. HYBRID SEARCH (BM25 + TF-IDF) ═══
    // ═══════════════════════════════════════
    public NativeSearchResult? HybridSearch(string query, List<Lesson> lessons)
    {
        if (string.IsNullOrWhiteSpace(query) || lessons == null || lessons.Count == 0)
            return null;

        var queryTerms = Tokenize(query);
        if (queryTerms.Length == 0) return null;

        // Build document corpus from lessons
        var documents = lessons.Select(l => new SearchDocument
        {
            LessonId = l.Id,
            Title = l.Title ?? "",
            Content = $"{l.Title} {l.Description}".Trim(),
            Tokens = Tokenize($"{l.Title} {l.Description}")
        }).ToList();

        // Calculate average document length for BM25
        double avgDl = documents.Average(d => d.Tokens.Length);
        int totalDocs = documents.Count;

        // Calculate IDF for each query term
        var idfScores = new Dictionary<string, double>();
        foreach (var term in queryTerms.Distinct())
        {
            int docsContaining = documents.Count(d => d.Tokens.Contains(term));
            // BM25 IDF formula: log((N - n + 0.5) / (n + 0.5) + 1)
            idfScores[term] = Math.Log((totalDocs - docsContaining + 0.5) / (docsContaining + 0.5) + 1.0);
        }

        // Score each document
        var results = new List<(SearchDocument Doc, double BM25Score, double TFIDFScore, double HybridScore)>();

        foreach (var doc in documents)
        {
            // ── BM25 Score ──
            double bm25 = 0;
            foreach (var term in queryTerms.Distinct())
            {
                int tf = doc.Tokens.Count(t => t == term);
                double idf = idfScores.GetValueOrDefault(term, 0);
                double numerator = tf * (K1 + 1);
                double denominator = tf + K1 * (1 - B + B * (doc.Tokens.Length / avgDl));
                bm25 += idf * (numerator / denominator);
            }

            // ── TF-IDF Cosine Similarity ──
            double tfidfSim = CalculateCosineSimilarity(queryTerms, doc.Tokens, idfScores);

            // ── Hybrid Score ──
            double hybrid = (BM25_WEIGHT * bm25) + (TFIDF_WEIGHT * tfidfSim);
            results.Add((doc, bm25, tfidfSim, hybrid));
        }

        // Get the best match
        var best = results.OrderByDescending(r => r.HybridScore).FirstOrDefault();

        if (best.HybridScore < MIN_SCORE)
            return null;

        // Format the response
        var confidence = Math.Min(best.HybridScore * 100, 99.9);
        var response = $"📚 **Based on lesson: \"{best.Doc.Title}\"**\n\n" +
                       $"{TruncateContent(best.Doc.Content, 500)}\n\n" +
                       $"_AI Confidence: {confidence:F1}% (Hybrid BM25 + TF-IDF)_";

        return new NativeSearchResult
        {
            Answer = response,
            LessonId = best.Doc.LessonId,
            Confidence = confidence,
            SearchMethod = "BM25 + TF-IDF Hybrid"
        };
    }

    // ═══════════════════════════════════════════════════
    // ═══ 2. CONTENT-BASED RECOMMENDATIONS (TF-IDF) ═══
    // ═══════════════════════════════════════════════════
    public List<int> GetContentBasedRecommendations(List<Course> enrolled, List<Course> allCourses, int topN = 5)
    {
        if (enrolled == null || enrolled.Count == 0 || allCourses == null || allCourses.Count == 0)
            return new List<int>();

        var enrolledIds = new HashSet<int>(enrolled.Select(c => c.Id));

        // Build a combined "user profile" from all enrolled course descriptions
        var userProfileText = string.Join(" ", enrolled.Select(c => $"{c.Title} {c.Description}"));
        var userTokens = Tokenize(userProfileText);

        if (userTokens.Length == 0)
            return new List<int>();

        // Build IDF from the entire course catalog
        var allDocs = allCourses.Select(c => Tokenize($"{c.Title} {c.Description}")).ToList();
        var allTerms = userTokens.Concat(allDocs.SelectMany(d => d)).Distinct().ToArray();
        var idfMap = new Dictionary<string, double>();

        foreach (var term in allTerms)
        {
            int docsContaining = allDocs.Count(d => d.Contains(term));
            idfMap[term] = Math.Log((double)(allDocs.Count + 1) / (docsContaining + 1)) + 1.0;
        }

        // Score each non-enrolled course by cosine similarity to the user profile
        var scored = allCourses
            .Where(c => !enrolledIds.Contains(c.Id))
            .Select(c =>
            {
                var courseTokens = Tokenize($"{c.Title} {c.Description}");
                var sim = CalculateCosineSimilarity(userTokens, courseTokens, idfMap);
                return (CourseId: c.Id, Score: sim);
            })
            .Where(x => x.Score > 0.01)
            .OrderByDescending(x => x.Score)
            .Take(topN)
            .Select(x => x.CourseId)
            .ToList();

        return scored;
    }

    // ═══════════════════════════════════════
    // ═══ MATH UTILITIES ═══
    // ═══════════════════════════════════════

    /// <summary>
    /// Tokenizes text: lowercases, splits, removes stop words and short tokens.
    /// </summary>
    private static string[] Tokenize(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Array.Empty<string>();

        var stopWords = new HashSet<string>
        {
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "shall", "can", "need", "dare", "ought",
            "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
            "as", "into", "through", "during", "before", "after", "above", "below",
            "between", "out", "off", "over", "under", "again", "further", "then",
            "once", "here", "there", "when", "where", "why", "how", "all", "each",
            "every", "both", "few", "more", "most", "other", "some", "such", "no",
            "nor", "not", "only", "own", "same", "so", "than", "too", "very",
            "just", "because", "but", "and", "or", "if", "while", "about",
            "this", "that", "these", "those", "i", "me", "my", "we", "our",
            "you", "your", "he", "him", "his", "she", "her", "it", "its",
            "they", "them", "their", "what", "which", "who", "whom",
        };

        return text.ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '!', '?', ';', ':', '-', '_', '/', '\\',
                           '(', ')', '[', ']', '{', '}', '"', '\'', '\n', '\r', '\t' },
                   StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 2 && !stopWords.Contains(w))
            .ToArray();
    }

    /// <summary>
    /// Calculates cosine similarity between two token arrays using TF-IDF weighting.
    /// </summary>
    private static double CalculateCosineSimilarity(string[] tokensA, string[] tokensB, Dictionary<string, double> idfMap)
    {
        if (tokensA.Length == 0 || tokensB.Length == 0) return 0;

        var allTerms = tokensA.Concat(tokensB).Distinct().ToArray();

        // Build TF-IDF vectors
        var vecA = new double[allTerms.Length];
        var vecB = new double[allTerms.Length];

        for (int i = 0; i < allTerms.Length; i++)
        {
            var term = allTerms[i];
            double idf = idfMap.GetValueOrDefault(term, 1.0);

            double tfA = (double)tokensA.Count(t => t == term) / tokensA.Length;
            double tfB = (double)tokensB.Count(t => t == term) / tokensB.Length;

            vecA[i] = tfA * idf;
            vecB[i] = tfB * idf;
        }

        // Cosine similarity = (A · B) / (||A|| * ||B||)
        double dotProduct = 0, magA = 0, magB = 0;
        for (int i = 0; i < allTerms.Length; i++)
        {
            dotProduct += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }

        double magnitude = Math.Sqrt(magA) * Math.Sqrt(magB);
        return magnitude > 0 ? dotProduct / magnitude : 0;
    }

    private static string TruncateContent(string content, int maxLength)
    {
        if (content.Length <= maxLength) return content;
        return content[..maxLength] + "...";
    }

    // ═══ Internal Data Models ═══
    private class SearchDocument
    {
        public int LessonId { get; set; }
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public string[] Tokens { get; set; } = Array.Empty<string>();
    }
}

// ═══ Result Model ═══
public class NativeSearchResult
{
    public string Answer { get; set; } = string.Empty;
    public int LessonId { get; set; }
    public double Confidence { get; set; }
    public string SearchMethod { get; set; } = string.Empty;
}
