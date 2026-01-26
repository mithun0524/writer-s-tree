import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';


interface FocusModePluginProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  anyPanelOpen: boolean;
}

export function FocusModePlugin({ isOpen, onOpen, onClose, anyPanelOpen }: FocusModePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const container = editor.getRootElement()?.closest('.lexical-editor-container');
    if (!container) return;

    if (isEnabled) {
      container.classList.add('focus-mode-enabled');
      
      // Add keyboard shortcut
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsEnabled(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      container.classList.remove('focus-mode-enabled');
    }
  }, [editor, isEnabled]);

  if (!isOpen && !anyPanelOpen) {
    return (
      <button
        onClick={onOpen}
        className={`absolute top-52 right-4 p-2 rounded transition-all z-20 bg-white text-text-secondary border border-border-light hover:shadow-md`}
        title={isEnabled ? 'Exit Focus Mode (Esc)' : 'Enter Focus Mode'}
      >
        {isEnabled ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    );
  }
  if (!isOpen) return null;
  // When open, show a panel (for demo, just a close button)
  return (
    <div className="absolute top-52 right-4 p-4 bg-white rounded-lg shadow-2xl z-20 border border-border-light">
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-2">
          <Maximize2 size={18} />
          Focus Mode
        </span>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
