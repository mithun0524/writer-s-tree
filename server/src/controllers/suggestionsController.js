import logger from '../config/logger.js';

// Simple word suggestion based on common words
// In production, this should use OpenAI API or similar NLP service
const commonWords = {
  'the': ['quick', 'brown', 'lazy', 'fast', 'slow'],
  'a': ['beautiful', 'wonderful', 'terrible', 'great', 'small'],
  'is': ['going', 'running', 'walking', 'jumping', 'flying'],
  'to': ['the', 'a', 'go', 'run', 'walk'],
  'and': ['the', 'then', 'so', 'but', 'or'],
  'in': ['the', 'a', 'an', 'this', 'that'],
  'on': ['the', 'a', 'top', 'bottom', 'side'],
  'at': ['the', 'a', 'home', 'work', 'school'],
  'for': ['the', 'a', 'you', 'me', 'us'],
  'with': ['the', 'a', 'you', 'me', 'us']
};

const fallbackSuggestions = ['the', 'and', 'to', 'a', 'of', 'in', 'is', 'it', 'you', 'that'];

export const getSuggestions = async (req, res, next) => {
  try {
    const { context, limit = 3 } = req.body;

    if (!context || typeof context !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CONTEXT',
        message: 'Context must be a non-empty string'
      });
    }

    // Get last word from context
    const words = context.trim().toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];

    // Get suggestions based on last word
    let suggestions = commonWords[lastWord] || fallbackSuggestions;

    // Filter out words already in context to avoid repetition
    const contextWords = new Set(words);
    suggestions = suggestions.filter(word => !contextWords.has(word));

    // Limit suggestions
    suggestions = suggestions.slice(0, Math.min(limit, 5));

    // In production, implement rate limiting per user
    // For now, log the request for monitoring
    logger.info('Suggestion request', {
      userId: req.userId,
      contextLength: context.length,
      suggestionsCount: suggestions.length
    });

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map((word, index) => ({
          word,
          confidence: 1 - (index * 0.2), // Mock confidence score
          position: index + 1
        }))
      }
    });
  } catch (error) {
    logger.error('Suggestion error', { error: error.message });
    next(error);
  }
};

// TODO: Integrate with OpenAI API for production
// export const getSuggestionsFromOpenAI = async (context, limit) => {
//   const response = await fetch('https://api.openai.com/v1/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//     },
//     body: JSON.stringify({
//       model: 'gpt-3.5-turbo-instruct',
//       prompt: `Complete the following text with ${limit} word suggestions:\n${context}`,
//       max_tokens: 10,
//       n: limit,
//       temperature: 0.7
//     })
//   });
//   
//   const data = await response.json();
//   return data.choices.map(choice => choice.text.trim());
// };
