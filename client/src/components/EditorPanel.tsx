import React from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { LexicalEditor } from './editor/LexicalEditor';
import './editor/LexicalEditor.css';

interface EditorPanelProps {
  onSuggestionsChange?: (suggestions: string[]) => void;
  onSuggestionInsert?: (callback: (index: number) => void) => void;
  onEditorReady?: (getEditorState: () => any) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  onSuggestionsChange,
  onSuggestionInsert,
  onEditorReady
}) => {
  const { content, project, error } = useProjectContext();

  if (error) {
    return (
      <div className="flex-1 h-full flex items-center justify-center text-accent-warning">
        Error: {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 h-full flex items-center justify-center text-text-tertiary">
        Loading project...
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-background-primary flex flex-col overflow-hidden">
      <LexicalEditor 
        initialContent={content}
        onSuggestionsChange={onSuggestionsChange}
        onSuggestionInsert={onSuggestionInsert}
        onEditorReady={onEditorReady}
      />
    </div>
  );
};
