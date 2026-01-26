import React, { useEffect, useRef, useState } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { useWordSuggestions } from '@/hooks/useWordSuggestions';
import { Bold, Italic, Heading1, Heading2, Quote, Link } from 'lucide-react';

interface HistoryState {
  content: string;
  cursorPosition: number;
}

interface EditorPanelProps {
  onSuggestionsChange?: (suggestions: string[]) => void;
  onSuggestionInsert?: (callback: (index: number) => void) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  onSuggestionsChange,
  onSuggestionInsert 
}) => {
  const { content, updateContent, project, saving, error } = useProjectContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryState[]>([{ content: '', cursorPosition: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Sync content to contenteditable div
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== content && !isUndoRedo) {
      editorRef.current.innerText = content;
    }
  }, [content]);

  // Get word suggestions based on current cursor position
  const suggestions = useWordSuggestions(content, cursorPosition);

  // Notify parent of suggestions changes
  useEffect(() => {
    onSuggestionsChange?.(suggestions);
  }, [suggestions, onSuggestionsChange]);

  // Register suggestion insert handler
  useEffect(() => {
    const handleInsert = (index: number) => {
      if (index < suggestions.length && editorRef.current) {
        const editor = editorRef.current;
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const textBeforeCursor = content.substring(0, cursorPosition);
        const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
        const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
        const startIndex = Math.max(lastSpaceIndex, lastNewlineIndex) + 1;
        
        const newContent = 
          content.substring(0, startIndex) + 
          suggestions[index] + ' ' + 
          content.substring(cursorPosition);
        
        handleContentChange(newContent);
        
        // Move cursor after inserted word
        setTimeout(() => {
          const newPos = startIndex + suggestions[index].length + 1;
          editor.focus();
          setCursorPosition(newPos);
        }, 0);
      }
    };

    onSuggestionInsert?.(handleInsert);
  }, [suggestions, cursorPosition, content, onSuggestionInsert]);

  // Initialize history with current content
  useEffect(() => {
    if (content && history.length === 1 && history[0].content === '') {
      setHistory([{ content, cursorPosition: 0 }]);
    }
  }, [content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setIsUndoRedo(true);
      updateContent(history[newIndex].content);
      setTimeout(() => {
        setIsUndoRedo(false);
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setIsUndoRedo(true);
      updateContent(history[newIndex].content);
      setTimeout(() => {
        setIsUndoRedo(false);
      }, 0);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!isUndoRedo) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ content: newContent, cursorPosition: 0 });
      
      // Limit history to last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
    updateContent(newContent);
  };

  const handleFormat = (type: 'bold' | 'italic' | 'h1' | 'h2' | 'quote' | 'link') => {
    document.execCommand(type === 'h1' || type === 'h2' ? 'formatBlock' : type, false, 
      type === 'h1' ? 'h1' : type === 'h2' ? 'h2' : undefined);
    
    if (type === 'link') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    }
    
    // Update content after formatting
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerText);
    }
  };

  if (error) {
      return (
          <div className="flex-1 h-full flex items-center justify-center text-accent-warning">
              Error: {error}
          </div>
      );
  }

  if (!project) return (
      <div className="flex-1 h-full flex items-center justify-center text-text-tertiary">
          Loading project...
      </div>
  );

  return (
    <div className="flex-1 h-full bg-background-primary flex flex-col overflow-hidden">
      <div className="flex-1 flex justify-center overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-[800px] py-[48px] px-8 sm:px-12 relative flex flex-col">
          <div className="absolute top-4 right-12 text-xs text-text-tertiary transition-opacity duration-300 opacity-60">
            {saving ? 'Saving...' : 'Saved'}
          </div>
          {/* Always-visible formatting toolbar */}
          <div className="sticky top-0 z-10 bg-background-primary/95 backdrop-blur-sm border-b border-border-light mb-6 -mx-8 sm:-mx-12 px-8 sm:px-12 py-3">
            <div className="flex gap-1 items-center">
             <button
               onClick={() => handleFormat('bold')}
               title="Bold (Ctrl+B)"
               className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
             >
               <Bold size={16} />
             </button>
             <button
               onClick={() => handleFormat('italic')}
               title="Italic (Ctrl+I)"
               className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
             >
               <Italic size={16} />
             </button>
             <button
               onClick={() => handleFormat('h1')}
               title="Heading 1"
               className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
             >
               <Heading1 size={16} />
             </button>
             <button
               onClick={() => handleFormat('h2')}
               title="Heading 2"
               className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
             >
               <Heading2 size={16} />
             </button>
             <div className="w-px h-6 bg-border-light mx-1" />
             <button
               onClick={() => handleFormat('quote')}
               title="Quote"
               className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
             >
               <Quote size={16} />
             </button>
             <button
               onClick={() => handleFormat('link')}
               title="Insert Link"
               className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
             >
               <Link size={16} />
             </button>
            </div>
          </div>
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) => {
              const newContent = e.currentTarget.innerText;
              handleContentChange(newContent);
            }}
            onSelect={() => {
              const sel = window.getSelection();
              if (sel) {
                const range = sel.getRangeAt(0);
                setCursorPosition(range.startOffset);
              }
            }}
            onClick={() => {
              const sel = window.getSelection();
              if (sel) {
                const range = sel.getRangeAt(0);
                setCursorPosition(range.startOffset);
              }
            }}
            onKeyUp={() => {
              const sel = window.getSelection();
              if (sel) {
                const range = sel.getRangeAt(0);
                setCursorPosition(range.startOffset);
              }
            }}
            data-placeholder="Start writing... your tree grows with every word."
            className="flex-1 w-full resize-none bg-transparent border-none outline-none font-serif text-[18px] leading-[32px] text-text-primary caret-accent-focus empty:before:content-[attr(data-placeholder)] empty:before:text-text-tertiary/50"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};