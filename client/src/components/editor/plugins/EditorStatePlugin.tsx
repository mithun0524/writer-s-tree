import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

interface EditorStatePluginProps {
  onEditorStateChange?: (getEditorState: () => any) => void;
}

export function EditorStatePlugin({ onEditorStateChange }: EditorStatePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (onEditorStateChange) {
      // Provide a function to get the current editor state
      onEditorStateChange(() => editor.getEditorState());
    }
  }, [editor, onEditorStateChange]);

  return null;
}
