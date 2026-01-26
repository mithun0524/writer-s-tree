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

      // Handle number keys for suggestion selection
      if (['1', '2', '3'].includes(e.key) && suggestions.length > 0) {
        const index = parseInt(e.key) - 1;
        if (index < suggestions.length) {
          e.preventDefault();
          setSelectedSuggestion(index);
          onSuggestionSelect(index);
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
      
      {/* Keyboard (Visual) */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
           {KEYS[0].slice(0, 6).map(key => (
              <Key key={key} char={key} active={activeKey === key} />
           ))}
           <span className="text-text-tertiary text-xs self-center ml-2">...</span>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex gap-6 items-center">
        <span className="text-text-tertiary text-xs font-mono">Suggestions:</span>
        {suggestions.length > 0 ? (
          suggestions.map((word, index) => (
            <Suggestion 
              key={index}
              number={index + 1} 
              word={word}
              isSelected={selectedSuggestion === index}
              onClick={() => onSuggestionSelect(index)}
            />
          ))
        ) : (
          <span className="text-text-tertiary text-xs italic">Start typing...</span>
        )}
      </div>
    </div>
  );
};

const Key: React.FC<{ char: string; active: boolean }> = ({ char, active }) => (
  <div className={`
    w-8 h-8 rounded flex items-center justify-center font-mono text-xs transition-all duration-100 ease-out
    ${active 
      ? 'bg-accent-focus text-white scale-110 shadow-md transform -translate-y-1' 
      : 'bg-background-secondary border border-gray-200 text-text-secondary'}
  `}>
    {char}
  </div>
);

const Suggestion: React.FC<{ 
  number: number; 
  word: string; 
  isSelected: boolean;
  onClick: () => void;
}> = ({ number, word, isSelected, onClick }) => (
  <button 
    className={`group flex items-center gap-2 font-mono text-sm transition-all duration-200 ${
      isSelected ? 'text-white' : 'text-text-primary hover:text-text-primary'
    }`}
    onClick={onClick}
  >
     <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border transition-all duration-200 ${
       isSelected 
         ? 'bg-green-500 text-white border-green-500 scale-110' 
         : 'bg-background-secondary text-accent-focus border-gray-200 group-hover:bg-accent-focus group-hover:text-white'
     }`}>
       {number}
     </span>
     <span className={`group-hover:underline decoration-accent-focus underline-offset-4 transition-all ${
       isSelected ? 'font-bold' : ''
     }`}>{word}</span>
  </button>
);
