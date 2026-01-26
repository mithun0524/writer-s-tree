import React, { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface KeyboardVisualizationProps {
  suggestions: string[];
  onSuggestionSelect: (index: number) => void;
}

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const KeyboardVisualization: React.FC<KeyboardVisualizationProps> = ({ 
  suggestions = [], 
  onSuggestionSelect 
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const { toggleKeyboardPanel } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      setActiveKey(key);
      setTimeout(() => setActiveKey(null), 150);

      // Handle Q/W/E/R/T/Y keys for suggestion selection
      if (['Q', 'W', 'E', 'R', 'T', 'Y'].includes(key) && suggestions.length > 0) {
        const keyIndex = ['Q', 'W', 'E', 'R', 'T', 'Y'].indexOf(key);
        if (keyIndex < suggestions.length) {
          e.preventDefault();
          setSelectedSuggestion(keyIndex);
          onSuggestionSelect(keyIndex);
          setTimeout(() => setSelectedSuggestion(null), 200);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, onSuggestionSelect]);

  return (
    <div className="h-[80px] bg-white border-t border-background-secondary shadow-level2 flex items-center justify-between px-8 z-30 relative">
      
      {/* Close button */}
      <button
        onClick={toggleKeyboardPanel}
        className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
        title="Hide keyboard"
      >
        <Keyboard size={16} />
      </button>
      
      {/* Full Keyboard (Visual) - Single Line */}
      <div className="flex gap-1">
        {KEYS.flat().map(key => {
          const suggestionIndex = ['Q', 'W', 'E', 'R', 'T', 'Y'].indexOf(key);
          const hasSuggestion = suggestionIndex >= 0 && suggestionIndex < suggestions.length;
          
          return (
            <Key 
              key={key} 
              char={key} 
              active={activeKey === key}
              hasSuggestion={hasSuggestion}
              suggestion={hasSuggestion ? suggestions[suggestionIndex] : undefined}
            />
          );
        })}
      </div>

      {/* Suggestions Info */}
      <div className="flex gap-4 items-center">
        {suggestions.length > 0 && (
          suggestions.map((word, index) => {
            const key = ['Q', 'W', 'E', 'R', 'T', 'Y'][index];
            return (
              <div 
                key={index}
                className={`flex items-center gap-2 text-sm transition-all ${
                  selectedSuggestion === index ? 'scale-105 font-semibold' : ''
                }`}
              >
                <span className="font-mono text-accent-focus bg-accent-focus/10 px-2 py-1 rounded">
                  {key}
                </span>
                <span className="text-text-secondary">{word}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const Key: React.FC<{ 
  char: string; 
  active: boolean;
  hasSuggestion?: boolean;
  suggestion?: string;
}> = ({ char, active, hasSuggestion, suggestion }) => (
  <div className={`
    w-10 h-10 rounded flex flex-col items-center justify-center font-mono text-xs transition-all duration-100 ease-out relative
    ${active 
      ? 'bg-accent-focus text-white scale-110 shadow-md transform -translate-y-1' 
      : hasSuggestion
      ? 'bg-accent-focus/20 border-2 border-accent-focus text-accent-focus'
      : 'bg-background-secondary border border-gray-200 text-text-secondary'}
  `}>
    <span className="font-semibold">{char}</span>
    {hasSuggestion && suggestion && (
      <span className="text-[8px] absolute -bottom-1 text-accent-focus/70 truncate max-w-full px-1">
        {suggestion.substring(0, 4)}
      </span>
    )}
  </div>
);
