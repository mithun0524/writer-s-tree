import { useState, useEffect } from 'react';

// Common word completions for basic functionality
const COMMON_WORDS: Record<string, string[]> = {
  'the': ['therefore', 'themselves', 'therapy'],
  'cha': ['character', 'chapter', 'challenge'],
  'wri': ['writing', 'written', 'writer'],
  'sto': ['story', 'stopped', 'storage'],
  'boo': ['book', 'books', 'bookmark'],
  'con': ['continued', 'connection', 'considerable'],
  'car': ['carefully', 'carried', 'ការ'],
  'des': ['described', 'description', 'despite'],
  'exp': ['experience', 'explained', 'expression'],
  'mom': ['moment', 'moments', 'momentum'],
  'sud': ['suddenly', 'sudden', 'suddently'],
  'tho': ['thought', 'though', 'thorough'],
  'bec': ['because', 'became', 'become'],
  'som': ['something', 'someone', 'sometimes'],
  'whe': ['where', 'when', 'whether'],
  'wor': ['world', 'words', 'worked'],
};

export const useWordSuggestions = (content: string, cursorPosition: number) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Get the current word being typed
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const startIndex = Math.max(lastSpaceIndex, lastNewlineIndex) + 1;
    const currentWord = textBeforeCursor.substring(startIndex).toLowerCase();

    // Only show suggestions if word is at least 3 characters
    if (currentWord.length >= 3) {
      const prefix = currentWord.substring(0, 3);
      const matches = COMMON_WORDS[prefix] || [];
      
      // Filter to words that start with the current word
      const filtered = matches
        .filter(word => word.toLowerCase().startsWith(currentWord))
        .slice(0, 3);
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [content, cursorPosition]);

  return suggestions;
};
