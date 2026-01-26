import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';

import { editorTheme } from './themes/EditorTheme';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { WordCountPlugin } from './plugins/WordCountPlugin';
import { EditorStatePlugin } from './plugins/EditorStatePlugin';
import { SuggestionsPlugin } from './plugins/SuggestionsPlugin';
import { FindReplaceModal } from './plugins/FindReplacePlugin';
import { DocumentOutlinePlugin } from './plugins/DocumentOutlinePlugin';
import { VersionHistoryPlugin } from './plugins/VersionHistoryPlugin';
import { WritingSprintPlugin } from './plugins/WritingSprintPlugin';

const editorConfig = {
  namespace: 'WritersTreeEditor',
  theme: editorTheme,
  onError(error: Error) {
    console.error('Lexical Error:', error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
  ],
};

interface LexicalEditorProps {
  initialContent?: string;
  onSuggestionsChange?: (suggestions: string[]) => void;
  onSuggestionInsert?: (callback: (index: number) => void) => void;
  onEditorReady?: (getEditorState: () => any) => void;
}

import { useState } from 'react';
import React from 'react';
import { useWordSuggestions } from '@/hooks/useWordSuggestions';

export function LexicalEditor(props: LexicalEditorProps) {
  const { onEditorReady, onSuggestionsChange, onSuggestionInsert } = props;
  const [openPanel, setOpenPanel] = useState<null | 'outline' | 'history' | 'sprint' | 'focus'>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editorContent, setEditorContent] = useState('');
  
  const { suggestions } = useWordSuggestions(editorContent, cursorPosition);

  // Update parent with suggestions
  React.useEffect(() => {
    if (onSuggestionsChange) {
      onSuggestionsChange(suggestions);
    }
  }, [suggestions, onSuggestionsChange]);

  const anyPanelOpen = openPanel !== null;

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="lexical-editor-container editor-container relative h-full overflow-hidden" style={{ backgroundColor: '#FEFDFB' }}>
        <ToolbarPlugin />

        <div className="editor-wrapper h-[calc(100%-60px)] overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-content max-w-200 mx-auto pl-2 pt-6 pr-4 pb-2 font-[Lora] text-[18px] leading-[1.8] min-h-full outline-none" 
                style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  caretColor: '#4A90E2',
                  color: '#2C2C2C',
                }}
              />
            }
            placeholder={
              <div className="editor-placeholder absolute w-full max-w-200 italic pointer-events-none select-none pl-2 pt-6 z-20 bg-transparent" style={{ color: '#888888' }}>
                Start writing... your tree grows with every word.
              </div>
            }
            ErrorBoundary={() => <div>Editor Error</div>}
          />
        </div>

        <HistoryPlugin />
        <LinkPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <EditorStatePlugin onEditorStateChange={onEditorReady} />
        <WordCountPlugin onContentChange={(content: string, position: number) => {
          setEditorContent(content);
          setCursorPosition(position);
        }} />
        <SuggestionsPlugin 
          onSuggestionsChange={onSuggestionsChange}
          onSuggestionInsert={onSuggestionInsert}
          suggestions={suggestions}
        />

        {/* Advanced features with panel state */}
        <FindReplaceModal />
        <DocumentOutlinePlugin
          isOpen={openPanel === 'outline'}
          onOpen={() => setOpenPanel('outline')}
          onClose={() => setOpenPanel(null)}
          anyPanelOpen={anyPanelOpen}
        />
        <VersionHistoryPlugin
          isOpen={openPanel === 'history'}
          onOpen={() => setOpenPanel('history')}
          onClose={() => setOpenPanel(null)}
          anyPanelOpen={anyPanelOpen}
        />
        <WritingSprintPlugin
          isOpen={openPanel === 'sprint'}
          onOpen={() => setOpenPanel('sprint')}
          onClose={() => setOpenPanel(null)}
          anyPanelOpen={anyPanelOpen}
        />

      </div>
    </LexicalComposer>
  );
}
