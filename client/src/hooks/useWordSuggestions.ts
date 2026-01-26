import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '@/config';

export const useWordSuggestions = (content: string, cursorPosition: number) => {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get the current word being typed
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const startIndex = Math.max(lastSpaceIndex, lastNewlineIndex) + 1;
    const currentWord = textBeforeCursor.substring(startIndex);

    // Only show suggestions if word is at least 3 characters
    if (currentWord.length >= 3) {
      fetchSuggestions(currentWord);
    } else {
      setSuggestions([]);
    }
  }, [content, cursorPosition]);

  const fetchSuggestions = async (context: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({
          context: context,
          limit: 3
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data.suggestions || []);
      } else {
        console.error('Failed to fetch suggestions:', data.message);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading };
};
