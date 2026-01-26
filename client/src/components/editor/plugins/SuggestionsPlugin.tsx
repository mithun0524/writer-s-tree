import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical';

// Common word completions for basic functionality
const COMMON_WORDS: Record<string, string[]> = {
  'the': ['therefore', 'themselves', 'therapy'],
  'cha': ['character', 'chapter', 'challenge'],
  'wri': ['writing', 'written', 'writer'],
  'sto': ['story', 'stopped', 'storage'],
  'boo': ['book', 'books', 'bookmark'],
  'con': ['continued', 'connection', 'considerable'],
  'car': ['carefully', 'carried', 'character'],
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

interface SuggestionsPluginProps {
  onSuggestionsChange?: (suggestions: string[]) => void;
  onSuggestionInsert?: (callback: (index: number) => void) => void;
}

export function SuggestionsPlugin({ onSuggestionsChange, onSuggestionInsert }: SuggestionsPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register the insert handler with parent
    if (onSuggestionInsert) {
      const handleInsert = (index: number) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const anchor = selection.anchor;
          const node = anchor.getNode();
          if (!$isTextNode(node)) return;

          const textContent = node.getTextContent();
          const offset = anchor.offset;

          // Find the start of the current word
          const textBeforeCursor = textContent.substring(0, offset);
          const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
          const startIndex = lastSpaceIndex + 1;

          // Get current suggestions
          const currentWord = textBeforeCursor.substring(startIndex).toLowerCase();
          if (currentWord.length >= 3) {
            const prefix = currentWord.substring(0, 3);
            const matches = COMMON_WORDS[prefix] || [];
            const filtered = matches
              .filter(word => word.toLowerCase().startsWith(currentWord))
              .slice(0, 3);

            if (index < filtered.length) {
              const suggestion = filtered[index];
              
              // Select the word portion and replace it
              selection.anchor.set(node.getKey(), startIndex, 'text');
              selection.focus.set(node.getKey(), offset, 'text');
              selection.insertText(suggestion + ' ');
            }
          }
        });
      };

      onSuggestionInsert(handleInsert);
    }
  }, [editor, onSuggestionInsert]);

  useEffect(() => {
    if (!onSuggestionsChange) return;

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          onSuggestionsChange([]);
          return;
        }

        const anchor = selection.anchor;
        const textNode = anchor.getNode();
        const textContent = textNode.getTextContent();
        const offset = anchor.offset;

        // Get the current word being typed
        const textBeforeCursor = textContent.substring(0, offset);
        const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
        const startIndex = lastSpaceIndex + 1;
        const currentWord = textBeforeCursor.substring(startIndex).toLowerCase();

        // Only show suggestions if word is at least 3 characters
        if (currentWord.length >= 3) {
          const prefix = currentWord.substring(0, 3);
          const matches = COMMON_WORDS[prefix] || [];
          
          // Filter to words that start with the current word
          const filtered = matches
            .filter(word => word.toLowerCase().startsWith(currentWord))
            .slice(0, 3);
          
          onSuggestionsChange(filtered);
        } else {
          onSuggestionsChange([]);
        }
      });
    });
  }, [editor, onSuggestionsChange]);

  return null;
}
