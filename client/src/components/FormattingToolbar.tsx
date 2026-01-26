import React, { useEffect, useState, type RefObject } from 'react';
import { Bold, Italic, Heading1, Heading2, Quote, Link } from 'lucide-react';

interface FormattingToolbarProps {
  onFormat: (type: 'bold' | 'italic' | 'h1' | 'h2' | 'quote' | 'link') => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormat, textareaRef }) => {
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Check if textarea is focused and has selection
      if (document.activeElement === textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (selectedText.trim().length > 0) {
          // Calculate position based on textarea and selection
          const textareaRect = textarea.getBoundingClientRect();
          
          setSelection({
            text: selectedText,
            start: start,
            end: end
          });
          
          // Position toolbar above the middle of the textarea
          setPosition({
            top: textareaRect.top + window.scrollY - 50,
            left: textareaRect.left + window.scrollX + (textareaRect.width / 2) - 100
          });
        } else {
          setSelection(null);
          setPosition(null);
        }
      } else {
        setSelection(null);
        setPosition(null);
      }
    };

    // Listen to both selectionchange and mouseup on textarea
    document.addEventListener('selectionchange', handleSelectionChange);
    const textarea = textareaRef.current;
    textarea?.addEventListener('mouseup', handleSelectionChange);
    textarea?.addEventListener('keyup', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      textarea?.removeEventListener('mouseup', handleSelectionChange);
      textarea?.removeEventListener('keyup', handleSelectionChange);
    };
  }, [textareaRef]);

  if (!selection || !position) return null;

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-level3 border border-border-light px-2 py-1 flex gap-1"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <ToolbarButton icon={<Bold size={16} />} onClick={() => onFormat('bold')} title="Bold (Ctrl+B)" />
      <ToolbarButton icon={<Italic size={16} />} onClick={() => onFormat('italic')} title="Italic (Ctrl+I)" />
      <ToolbarButton icon={<Heading1 size={16} />} onClick={() => onFormat('h1')} title="Heading 1" />
      <ToolbarButton icon={<Heading2 size={16} />} onClick={() => onFormat('h2')} title="Heading 2" />
      <div className="w-px h-6 bg-border-light my-auto" />
      <ToolbarButton icon={<Quote size={16} />} onClick={() => onFormat('quote')} title="Quote" />
      <ToolbarButton icon={<Link size={16} />} onClick={() => onFormat('link')} title="Insert Link" />
    </div>
  );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; title: string }> = ({ icon, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 hover:bg-background-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
  >
    {icon}
  </button>
);
