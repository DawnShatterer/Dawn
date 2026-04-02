namespace Dawn.Infrastructure.Services;

public interface IProfanityFilterService
{
    (bool IsProfane, string? Warning) Check(string input);
}

public class ProfanityFilterService : IProfanityFilterService
{
    // Only strong profanities that have NO innocent substring collisions
    private static readonly HashSet<string> ProfaneWords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Major profanities (standalone words only)
        "fuck", "fucking", "fucked", "fucker", "fucks", "fck", "fuk", "fuq",
        "shit", "shitty", "bullshit", "shitting", "shits",
        "asshole", "arsehole",
        "bitch", "bitches", "bitchy", "bitching",
        "goddamn", "goddammit",
        "bastard", "bastards",
        "dickhead",
        "piss", "pissed", "pissing",
        "cunt", "cunts",
        "whore", "whores", "slut", "sluts",
        "wanker", "wankers", "twat", "twats",
        "bollocks", "bugger",
        "motherfucker", "motherfucking", "mofo",
        "wtf", "stfu", "gtfo",

        // Slurs & hate speech
        "nigger", "nigga", "niggas",
        "faggot", "faggy",
        "retard", "retarded", "retards",
        "spic", "spick", "chink", "gook",
        "kike", "dyke",
        "tranny", "shemale",
        "coon", "darkie", "wetback", "beaner",
        "honky",

        // Sexual / vulgar
        "blowjob", "handjob", "masturbate", "masturbation",
        "orgasm", "dildo", "vibrator",
        "porn", "porno", "pornography", "hentai",
        "sexting",
        "cumshot", "cumming",

        // Violence
        "rape", "raping", "rapist",

        // Common leetspeak evasions
        "f*ck", "sh*t", "b*tch", "a$$", "d*ck", "c*nt",
        "f**k", "s**t", "b**ch",
        "phuck", "phuk", "biatch", "beyotch",
        "a55", "5hit", "5h1t",
    };

    // Common safe words that could collide with substring checks
    private static readonly HashSet<string> SafeWords = new(StringComparer.OrdinalIgnoreCase)
    {
       
        "class", "classes", "classroom", "classic", "classification",
        "assignment", "assignments", "assess", "assessment", "assist",
        "assistant", "associate", "associated", "assembly", "passing",
        "bypass", "compass", "embassy", "grass", "massachusetts", "bassist",
     
        "hello", "shell", "shelling", "michelle", "seashell",
      
        "white", "whiten", "chitchat", "architecture",
       
        "document", "documents", "documentation", "circumstance",
       
        "analysis", "analyst", "analytical", "analyze", "canal", "banal",
        
        "grape", "grapes", "drape", "scrape", "scraped",
        
        "dictionary", "predict", "prediction", "dictate", "addiction",
        
        "peacock", "cocktail", "cockatoo", "hancock",
        
        "title", "titles", "titled", "subtitle", "constitute", "institution",
       
        "night", "knight", "nighttime", "benign",
        
        "shoe", "shoes", "phoenix", "horseshoe",
       
        "mississippi",
        
        "skill", "skills", "skilled", "kilogram", "kilometer",
       
        "document", "accumulate",
    };

    public (bool IsProfane, string? Warning) Check(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return (false, null);

        // Tokenize the input into clean words
        var words = input.ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '!', '?', ';', ':', '-', '_', '/', '\\', '(', ')', '[', ']', '{', '}', '"', '\'', '\n', '\r', '\t' },
                   StringSplitOptions.RemoveEmptyEntries);

        foreach (var word in words)
        {
            // Skip safe words entirely
            if (SafeWords.Contains(word))
                continue;

            // Direct exact-word match against profanity list
            if (ProfaneWords.Contains(word))
            {
                return (true,
                    "⚠️ **Please maintain respectful language.**\n\n" +
                    "Dawn is a professional learning environment. " +
                    "Offensive, vulgar, or hateful language is not permitted here.\n\n" +
                    "Please rephrase your message respectfully so I can assist you! 🙏");
            }
        }

        // Secondary: check for profane substrings hidden inside single words 
        // (e.g. "yourefucking" or "stupidasshat")
        // Only check profane words >= 5 chars to avoid false positives like hell→hello
        foreach (var word in words)
        {
            if (SafeWords.Contains(word))
                continue;

            foreach (var profane in ProfaneWords.Where(p => p.Length >= 5))
            {
                if (word.Length > profane.Length && word.Contains(profane))
                {
                    return (true,
                        "⚠️ **Please maintain respectful language.**\n\n" +
                        "Dawn is a professional learning environment. " +
                        "Offensive, vulgar, or hateful language is not tolerated.\n\n" +
                        "Please rephrase your message appropriately. Thank you! 🙏");
                }
            }
        }

        return (false, null);
    }
}
