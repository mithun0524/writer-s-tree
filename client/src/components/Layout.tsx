import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Keyboard } from 'lucide-react';
import { Header } from './Header';
import { EditorPanel } from './EditorPanel';
import { TreePanel } from './TreePanel';
import { KeyboardVisualization } from './KeyboardVisualization';
import { WelcomeModal } from './WelcomeModal';
import { useStore } from '@/store/useStore';
import { ProjectProvider } from '@/context/ProjectContext';

export const Layout: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isTreePanelOpen, isKeyboardPanelVisible, toggleKeyboardPanel } = useStore();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [suggestionInsertHandler, setSuggestionInsertHandler] = useState<((index: number) => void) | null>(null);

    const handleSuggestionsChange = useCallback((newSuggestions: string[]) => {
      setSuggestions(newSuggestions);
    }, []);

    const handleSuggestionInsert = useCallback((handler: (index: number) => void) => {
      setSuggestionInsertHandler(() => handler);
    }, []);

    const handleSuggestionSelect = useCallback((index: number) => {
      if (suggestionInsertHandler) {
        suggestionInsertHandler(index);
      }
    }, [suggestionInsertHandler]);

    if (!id) return null;

    return (
        <ProjectProvider projectId={id}>
            <WelcomeModal />
            <div className="flex flex-col h-screen w-screen overflow-hidden bg-background-primary text-text-primary font-sans selection:bg-accent-focus/20">
              <Header />
              
              <main className="flex-1 flex overflow-hidden relative">
                {/* Editor Panel (60% or 100%) */}
                <section className={`transition-all duration-500 ease-in-out h-full ${isTreePanelOpen ? 'w-[60%]' : 'w-full'}`}>
                  <EditorPanel 
                    onSuggestionsChange={handleSuggestionsChange}
                    onSuggestionInsert={handleSuggestionInsert}
                  />
                </section>

                {/* Tree Panel (40%) */}
                <aside className={`
                    absolute right-0 top-0 bottom-0 h-full bg-background-secondary border-l border-white/50 shadow-inner
                    transition-all duration-500 ease-in-out transform
                    ${isTreePanelOpen ? 'w-[40%] translate-x-0' : 'w-[40%] translate-x-full'}
                `}>
                  <TreePanel />
                </aside>
              </main>

              {isKeyboardPanelVisible && (
                <KeyboardVisualization 
                  suggestions={suggestions}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              )}
              
              {/* Keyboard Toggle Button (when hidden) */}
              {!isKeyboardPanelVisible && (
                <button
                  onClick={toggleKeyboardPanel}
                  className="fixed bottom-4 right-4 p-3 bg-white rounded-full shadow-level3 text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-all z-40 border border-border-light"
                  title="Show keyboard visualization"
                >
                  <Keyboard size={20} />
                </button>
              )}
            </div>
        </ProjectProvider>
    );
};
