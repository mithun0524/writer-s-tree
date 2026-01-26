import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';
import { useProjectContext } from '@/context/ProjectContext';

export function WordCountPlugin() {
  const [editor] = useLexicalComposerContext();
  const { updateContent } = useProjectContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        
        // Update content in ProjectContext
        updateContent(text);
      });
    });
  }, [editor, updateContent]);

  return null;
}
