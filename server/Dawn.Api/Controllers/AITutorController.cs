using Dawn.Infrastructure.Data;
using Dawn.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AITutorController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly INativeSearchService _searchService;
    private readonly IProfanityFilterService _profanityFilter;

    public AITutorController(
        ApplicationDbContext context,
        INativeSearchService searchService,
        IProfanityFilterService profanityFilter)
    {
        _context = context;
        _searchService = searchService;
        _profanityFilter = profanityFilter;
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public int? CourseId { get; set; }
    }

    // ─── Knowledge Base: keyword → (response, followUpSuggestions[]) ───
    private static readonly List<(string[] Keywords, string Response, string[] Suggestions)> KnowledgeBase = new()
    {
        // ═══ GREETINGS ═══
        (new[] { "hello", "hi", "hey", "namaste", "good morning", "good evening" },
         "Namaste! 🙏 I'm Dawn, your AI learning assistant. I can help you navigate the platform, explain concepts, or recommend courses. What would you like to know?",
         new[] { "Show my courses", "How do I enroll?", "Tell me a study tip" }),

        (new[] { "how are you", "what's up", "sup" },
         "I'm running at peak performance! 🚀 Ready to help you crush your learning goals. What can I do for you?",
         new[] { "Recommend a course", "Help with coding", "Study tips" }),

        // ═══ PLATFORM NAVIGATION ═══
        (new[] { "dashboard", "home page", "main page" },
         "Your **Dashboard** is your command center! 📊\n\n• **Students** see enrolled courses, progress bars, and learning stats\n• **Teachers** see their published courses and student engagement\n• **Admins** see platform-wide analytics\n\nJust click 'Dashboard' in the sidebar to get there!",
         new[] { "How do I enroll?", "Where are my certificates?", "Show course catalog" }),

        (new[] { "enroll", "join course", "sign up for course", "register course" },
         "To **enroll in a course**:\n\n1. Go to the **Course Catalog** from the sidebar\n2. Click on any course that interests you\n3. Hit the **'Enroll Now'** button\n4. You'll instantly see it on your Dashboard!\n\nFree courses are enrolled immediately. Paid courses will prompt payment first.",
         new[] { "Show free courses", "How to unenroll?", "Where is my progress?" }),

        (new[] { "unenroll", "leave course", "drop course", "remove course" },
         "To **unenroll** from a course, go to the Course Detail page and click the **'Unenroll'** button. Your progress will be saved in case you want to rejoin later!",
         new[] { "Show my enrollments", "Find new courses", "Contact teacher" }),

        (new[] { "certificate", "certificates", "completion certificate" },
         "🎓 **Certificates** are awarded when you complete 100% of a course!\n\nOnce completed, go to the **Certificates** page from your sidebar to view and download your achievement certificates as PDFs.",
         new[] { "How to complete a course?", "Show my progress", "Dashboard" }),

        (new[] { "quiz", "quizzes", "test", "exam", "assessment" },
         "📝 **Quizzes** are found inside each course!\n\n• Navigate to any course you're enrolled in\n• Click the **'Quizzes'** tab\n• Answer the multiple-choice questions\n• Results are **auto-graded instantly**!\n\nYou can retake quizzes to improve your score.",
         new[] { "How is progress calculated?", "Study tips for exams", "Show my courses" }),

        (new[] { "lesson", "lessons", "video", "content", "material" },
         "📚 **Lessons** are the building blocks of each course!\n\nEach course contains multiple lessons with:\n• Video content\n• Text explanations\n• Downloadable resources\n\nGo to any enrolled course and start working through the lessons in order!",
         new[] { "How do quizzes work?", "Track my progress", "Recommend courses" }),

        (new[] { "discussion", "forum", "ask question", "community" },
         "💬 **Discussion Forums** are available in each course!\n\n• Post questions about the course material\n• Reply to other students' questions\n• Your instructor can also respond\n\nGreat for collaborative learning!",
         new[] { "How do live classes work?", "Contact my teacher", "Study tips" }),

        (new[] { "live class", "live session", "zoom", "meeting", "webinar" },
         "🎥 **Live Classes** are scheduled by teachers!\n\n• Check the **Live Classes** page from your sidebar\n• You'll see upcoming sessions with date/time\n• Click **Join** when the class is live\n\nMake sure to join on time!",
         new[] { "Where are discussions?", "Show my schedule", "Dashboard" }),

        (new[] { "profile", "account", "settings", "my account" },
         "👤 To manage your **profile**:\n\n• Click your name/avatar in the top navigation\n• Update your full name, email, or password\n• View your role (Student, Teacher, Admin)\n\nKeep your profile updated for a personalized experience!",
         new[] { "Change password", "Dashboard", "My certificates" }),

        (new[] { "notification", "notifications", "alerts" },
         "🔔 **Notifications** keep you informed about:\n\n• New course enrollments\n• Quiz results\n• Discussion replies\n• Certificate awards\n\nCheck the bell icon in the top navigation bar!",
         new[] { "Dashboard", "My courses", "Discussion forum" }),

        // ═══ PROGRAMMING HELP ═══
        (new[] { "python", "learn python" },
         "🐍 **Python** is perfect for beginners!\n\n**Key concepts to master:**\n• Variables & data types\n• Lists, dictionaries, tuples\n• Functions & classes\n• File handling\n• Libraries: NumPy, Pandas, Flask\n\n**Pro tip:** Practice on small projects like a calculator or to-do app!",
         new[] { "JavaScript tips", "What is an API?", "Database basics" }),

        (new[] { "javascript", "js", "learn javascript" },
         "⚡ **JavaScript** powers the modern web!\n\n**Key concepts:**\n• Variables (let, const, var)\n• Arrow functions & callbacks\n• DOM manipulation\n• Async/Await & Promises\n• ES6+ features\n\n**Pro tip:** Build interactive web pages to practice!",
         new[] { "React basics", "Python tips", "What is Node.js?" }),

        (new[] { "react", "reactjs", "react.js" },
         "⚛️ **React** is a powerful UI library!\n\n**Core concepts:**\n• Components (functional vs class)\n• Props & State (useState)\n• useEffect for side effects\n• React Router for navigation\n• React Query for data fetching\n\n**Pro tip:** Start with small component-based projects!",
         new[] { "JavaScript basics", "What is JSX?", "State management" }),

        (new[] { "c#", "csharp", "c sharp", "dotnet", ".net" },
         "🔷 **C# / .NET** is great for backend development!\n\n**Key concepts:**\n• Classes & interfaces\n• LINQ queries\n• Entity Framework (ORM)\n• ASP.NET Core for web APIs\n• Dependency Injection\n\n**Pro tip:** Build a REST API to learn the full stack!",
         new[] { "What is an API?", "Database basics", "Python vs C#" }),

        (new[] { "java", "learn java" },
         "☕ **Java** is widely used in enterprise development!\n\n**Key concepts:**\n• OOP (classes, inheritance, polymorphism)\n• Collections framework\n• Exception handling\n• Multithreading\n• Spring Boot for web apps\n\n**Pro tip:** Practice data structures and algorithms in Java for interviews!",
         new[] { "Python vs Java", "What is OOP?", "Algorithm tips" }),

        (new[] { "html", "css", "web design", "frontend" },
         "🎨 **HTML & CSS** are the foundation of web development!\n\n**HTML:** Structure your content with tags\n**CSS:** Style with colors, layouts, animations\n\n**Modern CSS concepts:**\n• Flexbox & Grid layouts\n• CSS variables\n• Responsive design\n• Animations & transitions\n\n**Pro tip:** Clone your favorite website's design for practice!",
         new[] { "JavaScript basics", "React basics", "Responsive design" }),

        (new[] { "sql", "database", "mysql", "postgresql", "mongodb" },
         "🗄️ **Databases** store and manage your application data!\n\n**SQL basics:**\n• SELECT, INSERT, UPDATE, DELETE\n• JOINs (INNER, LEFT, RIGHT)\n• GROUP BY & aggregate functions\n• Indexes for performance\n\n**NoSQL (MongoDB):** Document-based, flexible schema\n\n**Pro tip:** Practice writing queries on sample datasets!",
         new[] { "What is an API?", "C# backend", "Data structures" }),

        (new[] { "api", "rest api", "restful", "endpoint" },
         "🔌 **APIs** let applications communicate!\n\n**REST API basics:**\n• **GET** — Read data\n• **POST** — Create data\n• **PUT** — Update data\n• **DELETE** — Remove data\n\n**Key concepts:**\n• HTTP status codes (200, 404, 500)\n• JSON data format\n• Authentication (JWT tokens)\n\n**Pro tip:** Use Swagger to test your API endpoints!",
         new[] { "What is JWT?", "Build with C#", "Database basics" }),

        (new[] { "git", "github", "version control" },
         "🌿 **Git** tracks your code changes!\n\n**Essential commands:**\n• `git init` — Start a repo\n• `git add .` — Stage changes\n• `git commit -m \"message\"` — Save changes\n• `git push` — Upload to GitHub\n• `git pull` — Download updates\n• `git branch` — Manage branches\n\n**Pro tip:** Commit frequently with clear messages!",
         new[] { "What is GitHub?", "Collaboration tips", "Deploy project" }),

        (new[] { "algorithm", "algorithms", "data structure", "data structures", "dsa" },
         "🧮 **Data Structures & Algorithms** are key for interviews!\n\n**Must-know structures:**\n• Arrays, Linked Lists, Stacks, Queues\n• Trees (Binary, BST, AVL)\n• Hash Maps\n• Graphs\n\n**Must-know algorithms:**\n• Sorting (Quick, Merge, Bubble)\n• Searching (Binary Search)\n• BFS & DFS\n• Dynamic Programming\n\n**Pro tip:** Solve 2-3 problems daily on practice platforms!",
         new[] { "Python for DSA", "Java for interviews", "Time complexity" }),

        // ═══ STUDY TIPS ═══
        (new[] { "study tip", "study tips", "how to study", "learn better", "study advice" },
         "📖 **Top Study Tips for Success:**\n\n1. **Pomodoro Technique** — 25 min study, 5 min break\n2. **Active Recall** — Test yourself instead of re-reading\n3. **Spaced Repetition** — Review at increasing intervals\n4. **Teach Others** — Explain concepts to solidify understanding\n5. **Project-Based Learning** — Build real things!\n\nConsistency beats intensity. Even 30 minutes daily compounds into expertise!",
         new[] { "Time management", "Exam preparation", "Stay motivated" }),

        (new[] { "time management", "schedule", "organize", "planning" },
         "⏰ **Time Management Tips:**\n\n1. **Block your calendar** — Dedicate specific hours to study\n2. **Prioritize** — Do the hardest tasks when you're most alert\n3. **Eliminate distractions** — Put your phone in another room\n4. **Set deadlines** — Even self-imposed ones create urgency\n5. **Review weekly** — Adjust your plan based on progress\n\nStart small: commit to just 1 hour of focused study today!",
         new[] { "Study tips", "Stay motivated", "Pomodoro technique" }),

        (new[] { "motivation", "motivated", "inspire", "don't feel like studying", "lazy", "procrastinating" },
         "💪 **Feeling unmotivated? That's normal!**\n\nHere's how to push through:\n\n1. **Remember your WHY** — Why did you start?\n2. **Start with 5 minutes** — Momentum builds naturally\n3. **Celebrate small wins** — Every lesson completed counts!\n4. **Find a study buddy** — Accountability helps\n5. **Visualize success** — Imagine achieving your goals\n\nYou're already ahead by being here. Keep going! 🚀",
         new[] { "Study tips", "Time management", "Show my progress" }),

        (new[] { "exam", "exam prep", "prepare for exam", "test preparation" },
         "📋 **Exam Preparation Strategy:**\n\n1. **Start early** — Don't cram the night before\n2. **Review past quizzes** — Check your quiz results on Dawn\n3. **Make flashcards** — For key concepts\n4. **Practice problems** — Do exercises, not just reading\n5. **Sleep well** — Your brain consolidates learning during sleep\n6. **Stay hydrated** — Water improves concentration\n\nYou've got this! 💯",
         new[] { "Study tips", "Take a quiz", "Show my courses" }),

        (new[] { "note", "notes", "note taking", "notetaking" },
         "📝 **Effective Note-Taking Methods:**\n\n1. **Cornell Method** — Divide page into notes, cues, and summary\n2. **Mind Maps** — Visual connections between concepts\n3. **Bullet Journaling** — Quick, organized points\n4. **Digital Notes** — Use tools like Notion or OneNote\n\n**Pro tip:** Rewrite your notes in your own words within 24 hours!",
         new[] { "Study tips", "Time management", "Exam preparation" }),

        // ═══ GENERAL CONVERSATION ═══
        (new[] { "thank", "thanks", "thank you", "dhanyabad" },
         "You're very welcome! 😊 Always happy to help. Is there anything else you'd like to know?",
         new[] { "Show my courses", "Study tips", "Goodbye" }),

        (new[] { "bye", "goodbye", "see you", "later", "exit" },
         "Goodbye! 👋 Keep learning and growing. I'll be right here whenever you need me. Happy studying!",
         new[] { "Actually, one more question", "Dashboard", "Show courses" }),

        (new[] { "joke", "funny", "make me laugh", "tell me a joke" },
         "Here's a programmer joke for you! 😄\n\n**Why do programmers prefer dark mode?**\nBecause light attracts bugs! 🪲\n\n...I'll be here all week! Want another one or shall we get back to learning?",
         new[] { "Another joke", "Back to studying", "Programming help" }),

        (new[] { "another joke", "one more joke", "more jokes" },
         "Okay, one more! 😂\n\n**A SQL query walks into a bar, walks up to two tables and asks...**\n\"Can I JOIN you?\"\n\n🎤 *ba dum tss!* Alright, back to learning now! 📚",
         new[] { "Study tips", "Show my courses", "Programming help" }),

        (new[] { "who are you", "what are you", "what can you do" },
         "I'm **Dawn AI Tutor** 🤖 — your personal learning assistant!\n\n**I can help you with:**\n• 🧭 Navigating the Dawn platform\n• 💻 Programming concepts (Python, JS, C#, Java, etc.)\n• 📖 Study tips and exam preparation\n• 📊 Understanding your progress\n• 🎯 Course recommendations\n\nJust ask me anything!",
         new[] { "Recommend a course", "Programming help", "Study tips" }),

        (new[] { "recommend", "suggestion", "what should i learn", "course recommendation" },
         "Based on popular choices, here are my top recommendations:\n\n🔥 **Trending Now:**\n1. Full-Stack Web Development (React + C#)\n2. Python for Data Science\n3. Mobile App Development\n4. Cloud Computing Basics\n\nCheck your **Dashboard** for AI-powered personalized recommendations based on your enrollment history!",
         new[] { "How to enroll?", "Python tips", "JavaScript tips" }),

        (new[] { "progress", "my progress", "how am i doing", "track progress" },
         "📊 **Your progress** is tracked automatically!\n\nAs you complete lessons and quizzes, your progress bar updates in real-time on your Dashboard.\n\n• Complete all lessons → 100% progress\n• 100% progress → 🎓 Certificate unlocked!\n\nKeep pushing forward!",
         new[] { "Dashboard", "My certificates", "Show my courses" }),

        (new[] { "password", "change password", "forgot password", "reset password" },
         "🔐 **Password Management:**\n\n• To change your password, go to your **Profile/Settings** page\n• If you forgot your password, use the **'Forgot Password'** link on the login page\n• Use a strong password: at least 6 characters with numbers\n\nStay secure!",
         new[] { "My profile", "Login help", "Dashboard" }),

        (new[] { "teacher", "become teacher", "teach", "create course", "publish course" },
         "🎓 **Want to teach on Dawn?**\n\n1. Register with the **'Teacher'** role\n2. Go to your **Dashboard** → Click **'Publish New Course'**\n3. Fill in course title, description, and price\n4. Add lessons with content\n5. Students can then enroll!\n\nShare your knowledge with the world!",
         new[] { "How to add lessons?", "Pricing advice", "Dashboard" }),

        (new[] { "price", "pricing", "cost", "fee", "payment", "money" },
         "💰 **Pricing on Dawn:**\n\n• **Free courses** — Enroll instantly, no payment needed\n• **Paid courses** — Set by the teacher (price shown on course card)\n• **Revenue** — Teachers earn from each enrollment\n\nCheck out the Course Catalog to see available courses and their prices!",
         new[] { "Free courses", "How to enroll?", "Course catalog" }),

        (new[] { "error", "bug", "not working", "broken", "issue", "problem" },
         "🔧 **Having a technical issue?**\n\nTry these steps:\n1. **Refresh** the page (Ctrl+Shift+R)\n2. **Clear browser cache** and cookies\n3. **Log out and log back in**\n4. Check if the backend server is running\n\nIf the issue persists, note the exact error message and contact your administrator!",
         new[] { "Login help", "Dashboard", "Contact admin" }),
    };

    [HttpPost("ask")]
    public async Task<IActionResult> AskTutor([FromBody] ChatRequest request)
    {
        var input = request.Message?.Trim() ?? "";

        // ═══ STEP 1: Profanity Check ═══
        var (isProfane, warning) = _profanityFilter.Check(input);
        if (isProfane)
        {
            return Ok(new
            {
                Response = warning,
                Suggestions = new[] { "How do I enroll?", "Study tips", "Help with coding" },
                Flagged = true
            });
        }

        var inputLower = input.ToLower();

        // ═══ STEP 2: Native Hybrid Search (BM25 + TF-IDF) on Course Lessons ═══
        if (request.CourseId.HasValue)
        {
            var lessons = await _context.Lessons
                .Where(l => l.CourseId == request.CourseId.Value)
                .ToListAsync();

            if (lessons.Any())
            {
                var searchResult = _searchService.HybridSearch(request.Message, lessons);
                if (searchResult != null)
                {
                    return Ok(new
                    {
                        Response = searchResult.Answer,
                        Suggestions = new[] { "Tell me more", "Summarize this lesson", "Are there quizzes?" },
                        Confidence = searchResult.Confidence,
                        Method = searchResult.SearchMethod
                    });
                }
            }
        }

        // ═══ STEP 3: Keyword Knowledge Base Fallback ═══
        var match = KnowledgeBase
            .Select(kb => new { Entry = kb, Score = kb.Keywords.Count(k => inputLower.Contains(k)) })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .FirstOrDefault();

        if (match != null)
        {
            return Ok(new
            {
                Response = match.Entry.Response,
                Suggestions = match.Entry.Suggestions
            });
        }

        // ═══ STEP 4: Generic Fallback ═══
        return Ok(new
        {
            Response = $"That's a thoughtful question about \"{request.Message}\"! 🤔\n\nI'm continuously learning, but I might not have a specific answer for that yet. Here's what I suggest:\n\n• Check the **Discussion Forum** in your course\n• Ask your **instructor** directly\n• Try rephrasing your question with keywords like 'python', 'quiz', 'enroll', etc.\n\nI'm best at helping with platform navigation, programming concepts, and study tips!",
            Suggestions = new[] { "What can you do?", "Study tips", "Show my courses" }
        });
    }

    [HttpGet("quick-replies")]
    public IActionResult GetQuickReplies()
    {
        // Return contextual quick reply chips
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Ok(new
        {
            Suggestions = new[] { "How do I enroll?", "Study tips", "Programming help", "My progress", "Tell me a joke" }
        });
    }
}
