import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useState, useEffect } from 'react';
import { $getRoot, $isTextNode, TextNode } from 'lexical';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

export function FindReplaceModal() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<{ node: TextNode; index: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const findMatches = useCallback(() => {
    if (!searchTerm) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const foundMatches: { node: TextNode; index: number }[] = [];

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const textNodes: TextNode[] = [];

      // Collect all text nodes
      root.getAllTextNodes().forEach((node) => {
        if ($isTextNode(node)) {
          textNodes.push(node);
        }
      });

      // Search in each text node
      textNodes.forEach((node) => {
        const text = node.getTextContent();
        const searchPattern = wholeWord
          ? new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, caseSensitive ? 'g' : 'gi')
          : new RegExp(escapeRegex(searchTerm), caseSensitive ? 'g' : 'gi');

        let match;
        while ((match = searchPattern.exec(text)) !== null) {
          foundMatches.push({ node, index: match.index });
        }
      });
    });

    setMatches(foundMatches);
    setCurrentMatchIndex(foundMatches.length > 0 ? 0 : -1);
  }, [editor, searchTerm, caseSensitive, wholeWord]);

  const replaceOne = useCallback(() => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const match = matches[currentMatchIndex];

    editor.update(() => {
      const text = match.node.getTextContent();
      const searchPattern = caseSensitive
        ? new RegExp(escapeRegex(searchTerm), 'g')
        : new RegExp(escapeRegex(searchTerm), 'gi');

      const newText = text.replace(searchPattern, replaceTerm);
      match.node.setTextContent(newText);
    });

    // Re-find matches after replacement
    setTimeout(() => {
      findMatches();
    }, 10);
  }, [editor, matches, currentMatchIndex, searchTerm, replaceTerm, caseSensitive, findMatches]);

  const replaceAll = useCallback(() => {
    editor.update(() => {
      matches.forEach((match) => {
        const text = match.node.getTextContent();
        const searchPattern = new RegExp(
          escapeRegex(searchTerm),
          caseSensitive ? 'g' : 'gi'
        );
        const newText = text.replace(searchPattern, replaceTerm);
        match.node.setTextContent(newText);
      });
    });

    setMatches([]);
    setCurrentMatchIndex(-1);
  }, [editor, matches, searchTerm, replaceTerm, caseSensitive]);

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goToPrevious = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search size={20} />
          Find & Replace
        </h2>

        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && findMatches()}
              placeholder="Find..."
              className="w-full px-3 py-2 border border-border-light rounded focus:outline-none focus:ring-2 focus:ring-accent-focus/30"
              autoFocus
            />
            {matches.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-text-tertiary">
                <span>
                  {currentMatchIndex + 1} of {matches.length}
                </span>
                <button onClick={goToPrevious} className="p-1 hover:bg-background-secondary rounded">
                  <ChevronUp size={14} />
                </button>
                <button onClick={goToNext} className="p-1 hover:bg-background-secondary rounded">
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace with..."
            className="w-full px-3 py-2 border border-border-light rounded focus:outline-none focus:ring-2 focus:ring-accent-focus/30"
          />

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded"
              />
              <span>Case sensitive</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded"
              />
              <span>Whole word</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={findMatches}
              className="flex-1 px-4 py-2 bg-accent-focus text-white rounded hover:bg-accent-focus/90 transition-colors"
            >
              Find
            </button>
            <button
              onClick={replaceOne}
              disabled={matches.length === 0}
              className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded hover:bg-border-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Replace
            </button>
            <button
              onClick={replaceAll}
              disabled={matches.length === 0}
              className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded hover:bg-border-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
