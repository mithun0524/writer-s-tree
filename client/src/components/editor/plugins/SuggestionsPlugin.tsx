import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical';

interface SuggestionsPluginProps {
  onSuggestionsChange?: (suggestions: string[]) => void;
  onSuggestionInsert?: (callback: (index: number) => void) => void;
  suggestions?: string[];
}

export function SuggestionsPlugin({ onSuggestionsChange, onSuggestionInsert, suggestions = [] }: SuggestionsPluginProps) {
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
          if (currentWord.length >= 3 && index < suggestions.length) {
            const suggestion = suggestions[index];
            
            // Select the word portion and replace it
            selection.anchor.set(node.getKey(), startIndex, 'text');
            selection.focus.set(node.getKey(), offset, 'text');
            selection.insertText(suggestion + ' ');
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
        const currentWord = textBeforeCursor.substring(startIndex);

        // Only show suggestions if word is at least 3 characters
        if (currentWord.length >= 3) {
          // Instead of generating suggestions here, we'll let the parent handle it
          // The parent component will detect this change and fetch suggestions
          onSuggestionsChange(suggestions);
        } else {
          onSuggestionsChange([]);
        }
      });
    });
  }, [editor, onSuggestionsChange, suggestions]);

  return null;
}
