import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { useProjectContext } from '@/context/ProjectContext';

interface WordCountPluginProps {
  onContentChange?: (content: string, cursorPosition: number) => void;
}

export function WordCountPlugin({ onContentChange }: WordCountPluginProps = {}) {
  const [editor] = useLexicalComposerContext();
  const { updateContent } = useProjectContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        
        // Get cursor position
        const selection = $getSelection();
        let cursorPosition = 0;
        if (selection && $isRangeSelection(selection)) {
          cursorPosition = selection.anchor.offset;
        }
        
        // Update content in ProjectContext
        updateContent(text);
        
        // Call the callback if provided
        if (onContentChange) {
          onContentChange(text, cursorPosition);
        }
      });
    });
  }, [editor, updateContent, onContentChange]);

  return null;
}
