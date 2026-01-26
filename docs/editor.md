# Writer's Tree - Production Editor Specification

## 1. Competitive Analysis: What Writers Expect

### 1.1 Competitor Feature Comparison

| Feature | Scrivener | Google Docs | Notion | Wattpad | **Writer's Tree** |
|---------|-----------|-------------|---------|---------|-------------------|
| Rich Text Formatting | ✅ | ✅ | ✅ | ✅ | ✅ |
| Document Organization | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| Auto-Save | ✅ | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ⚠️ | ⚠️ | ❌ | ✅ |
| Export Options | ✅ | ⚠️ | ⚠️ | ❌ | ✅ |
| Distraction-Free | ✅ | ❌ | ❌ | ⚠️ | ✅ |
| Version History | ⚠️ | ✅ | ✅ | ❌ | ✅ |
| Word Count Goals | ✅ | ❌ | ❌ | ❌ | ✅ |
| Visual Progress | ❌ | ❌ | ❌ | ❌ | ✅ (TREE) |
| Writing Statistics | ✅ | ⚠️ | ❌ | ⚠️ | ✅ |
| Comments/Notes | ✅ | ✅ | ✅ | ✅ | ✅ (Phase 2) |
| Mobile App | ✅ | ✅ | ✅ | ✅ | ⚠️ (Phase 2) |

### 1.2 Decision: Use **Lexical Framework** (Meta's Modern Editor)

**Why Lexical over contentEditable/Draft.js:**

✅ **Performance:** Built for documents >500k words  
✅ **Extensibility:** Plugin architecture for future features  
✅ **Mobile-Ready:** Touch optimized out of the box  
✅ **Accessibility:** ARIA compliant by default  
✅ **Modern:** TypeScript-first, React 18 concurrent features  
✅ **Active Development:** Meta is committed long-term  
✅ **Markdown Support:** Built-in, toggle on/off  
✅ **Collaborative Ready:** OT/CRDT support for Phase 2  

**Trade-offs:**
- ⚠️ 120KB bundle (vs 5KB contentEditable) - **acceptable for features gained**
- ⚠️ Learning curve - **mitigated by excellent docs and community**
- ⚠️ Newer (2022) - **but backed by Meta, used in Facebook, Instagram**

---

## 2. Complete Feature Set (Launch Day)

### 2.1 Text Formatting (Complete Rich Text)

#### **Inline Formatting**
- ✅ **Bold** (Ctrl/Cmd+B) - `<strong>`
- ✅ *Italic* (Ctrl/Cmd+I) - `<em>`
- ✅ <u>Underline</u> (Ctrl/Cmd+U) - `<u>`
- ✅ ~~Strikethrough~~ (Ctrl/Cmd+Shift+X) - `<del>`
- ✅ `Inline Code` (Ctrl/Cmd+E) - `<code>`
- ✅ Superscript¹ - `<sup>`
- ✅ Subscript₂ - `<sub>`
- ✅ Highlight/Mark - `<mark>` (yellow background)

#### **Block Formatting**
- ✅ Paragraph (default)
- ✅ Heading 1 (Ctrl/Cmd+Alt+1)
- ✅ Heading 2 (Ctrl/Cmd+Alt+2)
- ✅ Heading 3 (Ctrl/Cmd+Alt+3)
- ✅ Blockquote (Ctrl/Cmd+Shift+>)
- ✅ Code Block (Ctrl/Cmd+Alt+C) - syntax highlighting
- ✅ Divider/Horizontal Rule (---)

#### **Lists**
- ✅ Bulleted List (Ctrl/Cmd+Shift+8)
- ✅ Numbered List (Ctrl/Cmd+Shift+7)
- ✅ Checklist/Todo List (interactive checkboxes)
- ✅ Nested lists (Tab to indent, Shift+Tab to outdent)
- ✅ Convert between list types

#### **Advanced Formatting**
- ✅ Hyperlinks (Ctrl/Cmd+K) - with edit/remove
- ✅ Footnotes - inline reference with hover preview
- ✅ Tables (basic 2D grid) - add/remove rows/cols
- ✅ Custom Text Color (writer can mark dialogue, scenes, etc.)
- ✅ Custom Background Color (highlight important passages)

### 2.2 Document Organization

#### **Chapters & Sections**
- ✅ Document Outline Sidebar
  - Auto-generated from H1/H2/H3
  - Click to jump to section
  - Drag to reorder chapters
  - Collapse/expand nested sections
- ✅ Bookmarks (Ctrl/Cmd+D)
  - Named bookmarks
  - Quick jump navigation
  - Sync with outline

#### **Scenes & Breaks**
- ✅ Scene divider (custom marker: `***` or `###`)
- ✅ Page break (for print formatting)
- ✅ Chapter break (visual divider + new page)

### 2.3 Writing Tools

#### **Find & Replace**
- ✅ Find (Ctrl/Cmd+F) - incremental search
- ✅ Find Next/Previous (F3/Shift+F3)
- ✅ Replace (Ctrl/Cmd+H)
- ✅ Replace All
- ✅ Case sensitive toggle
- ✅ Whole word toggle
- ✅ Regex support (advanced users)

#### **Word Count & Statistics**
- ✅ **Real-time counts:**
  - Total words
  - Words in selection
  - Characters (with/without spaces)
  - Sentences
  - Paragraphs
  - Pages (estimated, 250 words/page)
  - Reading time (200 wpm average)
- ✅ **Session stats:**
  - Words written this session
  - Time writing (active typing time)
  - Average WPM
- ✅ **Document stats:**
  - Longest sentence
  - Average sentence length
  - Readability score (Flesch-Kincaid)
  - Unique words (vocabulary richness)

#### **Spelling & Grammar**
- ✅ Browser native spell-check (red underlines)
- ✅ Custom dictionary (add words)
- ✅ Language selection (EN-US, EN-GB, etc.)
- ✅ Grammar suggestions via LanguageTool API (free tier)
  - Common mistakes
  - Style suggestions
  - Toggle on/off in settings

#### **Auto-Correct & Smart Typing**
- ✅ Smart quotes (" " vs " ")
- ✅ Auto-capitalize sentences
- ✅ Em-dash (--) and en-dash (-)
- ✅ Ellipsis (...) to …
- ✅ Auto-complete paired characters:
  - Quotes: " → ""
  - Parentheses: ( → ()
  - Brackets: [ → []
- ✅ Fractions: 1/2 → ½ (optional)

### 2.4 Productivity Features

#### **Markdown Mode** (Toggle in Settings)
```markdown
# Heading 1
## Heading 2
**bold** *italic* ~~strikethrough~~
- Bullet list
1. Numbered list
> Blockquote
[Link text](url)
![Image](url)
```
- ✅ Live preview as you type
- ✅ Export as Markdown (.md)
- ✅ Import from Markdown

#### **Focus Mode**
- ✅ Typewriter mode (current line centered)
- ✅ Dim other paragraphs (highlight current paragraph only)
- ✅ Hide formatting toolbar (minimalist)
- ✅ Hide word count (optional)
- ✅ Full-screen (F11 or dedicated button)
- ✅ Tree panel auto-hides (swipe to reveal)

#### **Writing Sprints**
- ✅ Set timer (5, 10, 15, 30, 60 min)
- ✅ Word count goal for sprint
- ✅ Progress bar during sprint
- ✅ Gentle sound when complete (optional)
- ✅ Sprint history/stats

#### **Daily Goals**
- ✅ Set daily word count target
- ✅ Progress bar in header
- ✅ Streak counter (consecutive days)
- ✅ Calendar heatmap view (GitHub-style)
- ✅ Notifications (browser permission)

### 2.5 Export & Publishing

#### **Export Formats**
- ✅ **Plain Text (.txt)** - UTF-8 encoding
- ✅ **Markdown (.md)** - GitHub-flavored
- ✅ **Microsoft Word (.docx)** - with formatting preserved
- ✅ **PDF** - book formatting (6x9, A4, Letter)
  - Custom margins
  - Page numbers
  - Header/footer customization
  - Chapter breaks on new pages
- ✅ **HTML** - clean, semantic markup
- ✅ **ePub** - for e-readers (Kindle, Kobo, etc.)
- ✅ **RTF** - universal rich text format

#### **Export Options**
- ✅ Include/exclude comments and highlights
- ✅ Export selection only
- ✅ Export specific chapters
- ✅ Custom metadata (title, author, copyright)
- ✅ Cover page generation

#### **Publishing Integration** (Phase 2)
- ⚠️ Direct publish to Medium, Wattpad, AO3
- ⚠️ WordPress integration
- ⚠️ Substack integration

### 2.6 Version Control & History

#### **Auto-Save**
- ✅ Save every 10s (debounced)
- ✅ Save on focus loss (switching tabs)
- ✅ Save before export
- ✅ Visual indicator (header):
  - `...` = typing (pulsing dots)
  - `Saving...` = saving (spinner)
  - `✓ Saved 2m ago` = saved (timestamp)

#### **Version History**
- ✅ Automatic snapshots:
  - Every 1,000 words
  - Every milestone (25%, 50%, 75%, 100%)
  - Before major edits (>500 words deleted)
  - Manual save (Ctrl/Cmd+S creates named version)
- ✅ Version browser:
  - Timeline view (by date)
  - Side-by-side diff view
  - Restore to any version
  - Download specific version
- ✅ Keep last 100 versions (or 6 months)

#### **Local Backup**
- ✅ Auto-backup to browser localStorage every 30s
- ✅ IndexedDB for large documents (>5MB)
- ✅ Export entire project backup (.zip)
- ✅ Restore from backup file

### 2.7 Customization & Preferences

#### **Editor Appearance**
- ✅ **Font Family:**
  - Lora (default serif)
  - Crimson Text (literary serif)
  - Georgia (classic serif)
  - Inter (clean sans-serif)
  - OpenDyslexic (accessibility)
  - System font
- ✅ **Font Size:** 14px - 24px (slider)
- ✅ **Line Height:** 1.4x - 2.0x (slider)
- ✅ **Line Width:** 600px - 1000px (optimal reading width)
- ✅ **Editor Padding:** Compact / Normal / Spacious

#### **Color Themes**
- ✅ Light Mode (default)
- ✅ Dark Mode (OLED-friendly)
- ✅ Sepia (warm, paper-like)
- ✅ High Contrast (accessibility)
- ✅ Custom themes (Phase 2)

#### **Keyboard Shortcuts**
- ✅ View all shortcuts (Ctrl/Cmd+/)
- ✅ Customizable shortcuts (Phase 2)
- ✅ Vim mode (optional, for power users - Phase 2)

---

## 3. Technical Implementation (Lexical Framework)

### 3.1 Architecture Overview

```
src/
├── editor/
│   ├── LexicalEditor.tsx          # Main editor component
│   ├── plugins/
│   │   ├── AutoSavePlugin.tsx     # Debounced save
│   │   ├── ToolbarPlugin.tsx      # Floating/fixed toolbar
│   │   ├── MarkdownPlugin.tsx     # Markdown shortcuts
│   │   ├── WordCountPlugin.tsx    # Real-time stats
│   │   ├── TreeSyncPlugin.tsx     # Sync word count → tree
│   │   ├── FocusModePlugin.tsx    # Typewriter mode
│   │   ├── HistoryPlugin.tsx      # Undo/redo enhanced
│   │   ├── LinkPlugin.tsx         # Hyperlink handling
│   │   ├── TablePlugin.tsx        # Table editing
│   │   ├── CheckListPlugin.tsx    # Todo lists
│   │   └── GrammarPlugin.tsx      # LanguageTool integration
│   ├── nodes/
│   │   ├── FootnoteNode.tsx       # Custom footnote
│   │   ├── SceneDividerNode.tsx   # Scene breaks
│   │   └── ChapterNode.tsx        # Chapter markers
│   ├── themes/
│   │   ├── LightTheme.ts
│   │   ├── DarkTheme.ts
│   │   └── SepiaTheme.ts
│   └── utils/
│       ├── exportDocx.ts          # Word export
│       ├── exportPdf.ts           # PDF generation
│       ├── exportEpub.ts          # ePub creation
│       └── statistics.ts          # Word count, readability
├── components/
│   ├── DocumentOutline.tsx        # Chapter navigation
│   ├── FindReplaceModal.tsx       # Search UI
│   ├── VersionHistory.tsx         # Time machine
│   └── StatsPanel.tsx             # Writing analytics
└── hooks/
    ├── useAutoSave.ts
    ├── useWordCount.ts
    ├── useVersioning.ts
    └── useExport.ts
```

### 3.2 Core Editor Setup

```typescript
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

// Custom plugins
import AutoSavePlugin from './plugins/AutoSavePlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import WordCountPlugin from './plugins/WordCountPlugin';
import TreeSyncPlugin from './plugins/TreeSyncPlugin';
import FocusModePlugin from './plugins/FocusModePlugin';

// Custom nodes
import { FootnoteNode } from './nodes/FootnoteNode';
import { SceneDividerNode } from './nodes/SceneDividerNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

const editorConfig = {
  namespace: 'WritersTreeEditor',
  theme: {
    // Custom Lexical theme
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
    list: {
      nested: {
        listitem: 'editor-nested-listitem',
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
      listitem: 'editor-listitem',
      checklist: 'editor-checklist',
    },
    link: 'editor-link',
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
      underline: 'editor-text-underline',
      strikethrough: 'editor-text-strikethrough',
      code: 'editor-text-code',
    },
    code: 'editor-code',
    codeHighlight: {
      // Syntax highlighting for code blocks
      atrule: 'editor-tokenAttr',
      attr: 'editor-tokenAttr',
      boolean: 'editor-tokenProperty',
      builtin: 'editor-tokenSelector',
      cdata: 'editor-tokenComment',
      char: 'editor-tokenSelector',
      class: 'editor-tokenFunction',
      'class-name': 'editor-tokenFunction',
      comment: 'editor-tokenComment',
      constant: 'editor-tokenProperty',
      deleted: 'editor-tokenProperty',
      doctype: 'editor-tokenComment',
      entity: 'editor-tokenOperator',
      function: 'editor-tokenFunction',
      important: 'editor-tokenVariable',
      inserted: 'editor-tokenSelector',
      keyword: 'editor-tokenAttr',
      namespace: 'editor-tokenVariable',
      number: 'editor-tokenProperty',
      operator: 'editor-tokenOperator',
      prolog: 'editor-tokenComment',
      property: 'editor-tokenProperty',
      punctuation: 'editor-tokenPunctuation',
      regex: 'editor-tokenVariable',
      selector: 'editor-tokenSelector',
      string: 'editor-tokenSelector',
      symbol: 'editor-tokenProperty',
      tag: 'editor-tokenProperty',
      url: 'editor-tokenOperator',
      variable: 'editor-tokenVariable',
    },
  },
  onError(error: Error) {
    console.error('Lexical Error:', error);
    // Send to Sentry/error tracking
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
    TableNode,
    TableCellNode,
    TableRowNode,
    FootnoteNode,
    SceneDividerNode,
  ],
};

export default function WritersTreeEditor({ projectId, initialContent, wordGoal }) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        {/* Toolbar */}
        <ToolbarPlugin />
        
        {/* Main editor */}
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="editor-content" />
          }
          placeholder={
            <div className="editor-placeholder">
              Start writing... your tree grows with every word.
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        
        {/* Core plugins */}
        <HistoryPlugin />
        <AutoFocusPlugin />
        <LinkPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <MarkdownShortcutPlugin />
        
        {/* Custom plugins */}
        <AutoSavePlugin projectId={projectId} delay={10000} />
        <WordCountPlugin />
        <TreeSyncPlugin wordGoal={wordGoal} />
        <FocusModePlugin />
      </div>
    </LexicalComposer>
  );
}
```

### 3.3 Auto-Save Plugin Implementation

```typescript
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useCallback } from 'react';
import { $getRoot } from 'lexical';
import { debounce } from 'lodash';

interface AutoSavePluginProps {
  projectId: string;
  delay: number; // milliseconds
}

export default function AutoSavePlugin({ projectId, delay }: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();

  const saveContent = useCallback(async (content: string) => {
    try {
      // Save to localStorage immediately (instant backup)
      localStorage.setItem(`project-${projectId}-backup`, content);
      
      // Save to server
      const response = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          wordCount: countWords(content),
          timestamp: Date.now(),
        }),
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      // Update UI indicator
      updateSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save error:', error);
      updateSaveStatus('error');
      // Retry after 5s
      setTimeout(() => saveContent(content), 5000);
    }
  }, [projectId]);

  const debouncedSave = useCallback(
    debounce((content: string) => {
      saveContent(content);
    }, delay),
    [saveContent, delay]
  );

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const content = JSON.stringify(editorState.toJSON());
        
        // Trigger debounced save
        updateSaveStatus('typing');
        debouncedSave(content);
      });
    });
  }, [editor, debouncedSave]);

  // Save on unmount (page close)
  useEffect(() => {
    return () => {
      debouncedSave.flush(); // Execute immediately
    };
  }, [debouncedSave]);

  return null;
}
```

### 3.4 Word Count Plugin

```typescript
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';
import { $isTextNode } from 'lexical';

export default function WordCountPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        
        // Count words
        const words = countWords(text);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const sentences = countSentences(text);
        const paragraphs = countParagraphs(root);
        const readingTime = Math.ceil(words / 200); // 200 wpm
        
        // Dispatch to global state
        dispatchWordCountUpdate({
          words,
          characters,
          charactersNoSpaces,
          sentences,
          paragraphs,
          readingTime,
        });
      });
    });
  }, [editor]);

  return null;
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

function countParagraphs(root: RootNode): number {
  let count = 0;
  const children = root.getChildren();
  
  children.forEach(child => {
    if (child.getType() === 'paragraph' || child.getType() === 'heading') {
      count++;
    }
  });
  
  return count;
}
```

### 3.5 Tree Sync Plugin

```typescript
export default function TreeSyncPlugin({ wordGoal }: { wordGoal: number }) {
  const [editor] = useLexicalComposerContext();
  const { updateTreeGrowth } = useTreeContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        const wordCount = countWords(text);
        
        // Calculate growth percentage
        const growthPercentage = Math.min((wordCount / wordGoal) * 100, 100);
        
        // Update tree (debounced to every 2s for smooth animation)
        debouncedTreeUpdate(growthPercentage, wordCount);
        
        // Check for milestones
        checkMilestones(growthPercentage, wordCount);
      });
    });
  }, [editor, wordGoal, updateTreeGrowth]);

  return null;
}

const debouncedTreeUpdate = debounce((percentage: number, wordCount: number) => {
  updateTreeGrowth(percentage);
  
  // Trigger subtle tree animation
  if (wordCount % 50 === 0) {
    triggerLeafRustle();
  }
}, 2000);

function checkMilestones(percentage: number, wordCount: number) {
  const milestones = [25, 50, 75, 100];
  
  milestones.forEach(milestone => {
    if (
      percentage >= milestone &&
      percentage < milestone + 0.5 && // Narrow window
      !hasMilestoneBeenCelebrated(milestone)
    ) {
      triggerBloomAnimation(milestone);
      markMilestoneCelebrated(milestone);
    }
  });
}
```

---

## 4. Performance Optimization Strategies

### 4.1 Virtual Scrolling for Large Documents

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedEditor({ content }) {
  const parentRef = useRef(null);
  
  // Split content into paragraphs
  const paragraphs = useMemo(() => {
    return content.split('\n\n');
  }, [content]);
  
  const virtualizer = useVirtualizer({
    count: paragraphs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated paragraph height
    overscan: 20, // Render 20 extra paragraphs above/below
  });
  
  return (
    <div ref={parentRef} className="editor-scroll-container">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <Paragraph content={paragraphs[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 Web Workers for Heavy Computation

```typescript
// workers/statistics.worker.ts
self.addEventListener('message', (e) => {
  const { text } = e.data;
  
  // Compute expensive statistics in background thread
  const stats = {
    wordCount: countWords(text),
    readability: calculateFleschKincaid(text),
    vocabulary: countUniqueWords(text),
    sentenceStats: analyzeSentences(text),
  };
  
  self.postMessage(stats);
});

// Usage in main thread
const statsWorker = new Worker('/workers/statistics.worker.ts');

statsWorker.postMessage({ text: editorContent });

statsWorker.addEventListener('message', (e) => {
  setStatistics(e.data);
});
```

### 4.3 Lazy Loading Plugins

```typescript
import { lazy, Suspense } from 'react';

// Only load when needed
const FindReplaceModal = lazy(() => import('./FindReplaceModal'));
const VersionHistory = lazy(() => import('./VersionHistory'));
const StatsPanel = lazy(() => import('./StatsPanel'));
const ExportModal = lazy(() => import('./ExportModal'));

function Editor() {
  const [showFindReplace, setShowFindReplace] = useState(false);
  
  return (
    <>
      {/* Core editor always loaded */}
      <LexicalEditor />
      
      {/* Heavy features lazy loaded */}
      {showFindReplace && (
        <Suspense fallback={<LoadingSpinner />}>
          <FindReplaceModal />
        </Suspense>
      )}
    </>
  );
}
```

### 4.4 IndexedDB for Offline Storage

```typescript
import { openDB, DBSchema } from 'idb';

interface WritersTreeDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      content: string;
      wordCount: number;
      lastModified: number;
    };
  };
  versions: {
    key: string;
    value: {
      projectId: string;
      content: string;
      timestamp: number;
      wordCount: number;
    };
  };
}

// Open database
const db = await openDB<WritersTreeDB>('writers-tree', 1, {
  upgrade(db) {
    db.createObjectStore('projects', { keyPath: 'id' });
    db.createObjectStore('versions', { keyPath: 'timestamp' });
  },
});

// Save to IndexedDB (for offline mode)
async function saveOffline(projectId: string, content: string) {
  await db.put('projects', {
    id: projectId,
    content,
    wordCount: countWords(content),
    lastModified: Date.now(),
  });
}

// Load from IndexedDB
async function loadOffline(projectId: string) {
  return await db.get('projects', projectId);
}

// Sync queue (when back online)
async function syncWhenOnline() {
  if (!navigator.onLine) return;
  
  const unsyncedProjects = await db.getAll('projects');
  
  for (const project of unsyncedProjects) {
    try {
      await fetch(`/api/projects/${project.id}/content`, {
        method: 'PUT',
        body: JSON.stringify(project),
      });
      
      // Mark as synced (or remove from local if successful)
    } catch (error) {
      console.error('Sync failed for', project.id);
    }
  }
}

// Listen for online event
window.addEventListener('online', syncWhenOnline);
```

### 4.5 Code Splitting & Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'lexical-core': ['lexical', '@lexical/react'],
          'lexical-plugins': [
            '@lexical/rich-text',
            '@lexical/link',
            '@lexical/list',
            '@lexical/markdown',
            '@lexical/table',
          ],
          'export-utils': [
            'docx',
            'jspdf',
            'epub-gen',
          ],
          'ui-components': [
            './src/components/DocumentOutline',
            './src/components/VersionHistory',
            './src/components/StatsPanel',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Warn if chunk > 600KB
  },
  optimizeDeps: {
    include: ['lexical', '@lexical/react'],
  },
});
```

**Expected Bundle Sizes:**
```
lexical-core.js         ~120KB (gzipped: ~40KB)
lexical-plugins.js      ~80KB  (gzipped: ~25KB)
export-utils.js         ~150KB (gzipped: ~45KB) - lazy loaded
ui-components.js        ~60KB  (gzipped: ~18KB) - lazy loaded
main.js                 ~100KB (gzipped: ~30KB)
-------------------------------------------
Initial Load:           ~220KB gzipped
Full App (all features): ~158KB gzipped additional
```

### 4.6 Debouncing & Throttling Strategy

```typescript
// Custom hook for smart debouncing
function useSmartDebounce(callback: Function, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    // If called too frequently, just update the timeout
    if (timeSinceLastCall < delay) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay);
    } else {
      // If enough time has passed, execute immediately
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
}

// Usage
const updateWordCount = useSmartDebounce((text: string) => {
  setWordCount(countWords(text));
}, 500);

const saveToServer = useSmartDebounce((content: string) => {
  apiSave(content);
}, 10000);

const updateTree = useSmartDebounce((percentage: number) => {
  animateTreeGrowth(percentage);
}, 2000);
```

### 4.7 Memoization for Expensive Operations

```typescript
// Memoize readability calculations
const readabilityScore = useMemo(() => {
  if (wordCount < 100) return null; // Not enough text
  return calculateFleschKincaid(editorContent);
}, [editorContent]); // Only recalculate when content changes

// Memoize document outline
const documentOutline = useMemo(() => {
  return extractOutline(editorState);
}, [editorState]);

// Memoize statistics
const statistics = useMemo(() => {
  return {
    words: wordCount,
    sentences: countSentences(editorContent),
    paragraphs: countParagraphs(editorContent),
    avgSentenceLength: wordCount / countSentences(editorContent),
    readingTime: Math.ceil(wordCount / 200),
    uniqueWords: new Set(editorContent.toLowerCase().match(/\b\w+\b/g)).size,
  };
}, [editorContent, wordCount]);
```

### 4.8 Rendering Optimization

```typescript
// Use React.memo for expensive components
const DocumentOutline = React.memo(({ outline }) => {
  return (
    <nav className="outline">
      {outline.map((item) => (
        <OutlineItem key={item.id} item={item} />
      ))}
    </nav>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if outline actually changed
  return JSON.stringify(prevProps.outline) === JSON.stringify(nextProps.outline);
});

// Use useCallback for event handlers
const handleFormat = useCallback((format: string) => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
}, [editor]);

// Use useTransition for non-urgent updates (React 18+)
const [isPending, startTransition] = useTransition();

function updateStatistics(newStats: Statistics) {
  startTransition(() => {
    // This update is low priority - won't block typing
    setStatistics(newStats);
  });
}
```

---

## 5. Export Implementation

### 5.1 DOCX Export (Microsoft Word)

```typescript
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

async function exportToDocx(editorState: EditorState, metadata: ProjectMetadata) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch = 1440 twips
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: await convertEditorStateToDocx(editorState),
    }],
    creator: metadata.author,
    title: metadata.title,
    description: metadata.description,
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${metadata.title}.docx`);
}

function convertEditorStateToDocx(editorState: EditorState): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  editorState.read(() => {
    const root = $getRoot();
    
    root.getChildren().forEach((node) => {
      if ($isHeadingNode(node)) {
        paragraphs.push(new Paragraph({
          text: node.getTextContent(),
          heading: node.getTag() === 'h1' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { after: 240 },
        }));
      } else if ($isParagraphNode(node)) {
        const runs: TextRun[] = [];
        
        node.getChildren().forEach((child) => {
          if ($isTextNode(child)) {
            runs.push(new TextRun({
              text: child.getTextContent(),
              bold: child.hasFormat('bold'),
              italics: child.hasFormat('italic'),
              underline: child.hasFormat('underline') ? {} : undefined,
              strike: child.hasFormat('strikethrough'),
            }));
          }
        });
        
        paragraphs.push(new Paragraph({
          children: runs,
          spacing: { after: 120 },
        }));
      } else if ($isQuoteNode(node)) {
        paragraphs.push(new Paragraph({
          text: node.getTextContent(),
          italics: true,
          indent: { left: 720 }, // Indent quotes
          spacing: { after: 240 },
        }));
      }
    });
  });
  
  return paragraphs;
}
```

### 5.2 PDF Export

```typescript
import jsPDF from 'jspdf';

async function exportToPdf(editorState: EditorState, metadata: ProjectMetadata) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter', // 8.5 x 11 inches
  });
  
  // Set margins
  const margin = 1; // 1 inch
  const pageWidth = 8.5;
  const pageHeight = 11;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;
  
  // Add metadata
  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.text(metadata.title, margin, currentY);
  currentY += 0.5;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.text(`by ${metadata.author}`, margin, currentY);
  currentY += 1;
  
  // Process content
  editorState.read(() => {
    const root = $getRoot();
    
    root.getChildren().forEach((node) => {
      // Check if we need a new page
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
      
      if ($isHeadingNode(node)) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(node.getTag() === 'h1' ? 18 : 14);
        const lines = pdf.splitTextToSize(node.getTextContent(), contentWidth);
        pdf.text(lines, margin, currentY);
        currentY += (lines.length * 0.25) + 0.3;
      } else if ($isParagraphNode(node)) {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(node.getTextContent(), contentWidth);
        pdf.text(lines, margin, currentY);
        currentY += (lines.length * 0.2) + 0.2;
      }
    });
  });
  
  // Add page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`${i}`, pageWidth / 2, pageHeight - 0.5, { align: 'center' });
  }
  
  pdf.save(`${metadata.title}.pdf`);
}
```

### 5.3 ePub Export

```typescript
import Epub from 'epub-gen';

async function exportToEpub(editorState: EditorState, metadata: ProjectMetadata) {
  const chapters: any[] = [];
  let currentChapter: any = null;
  
  editorState.read(() => {
    const root = $getRoot();
    
    root.getChildren().forEach((node) => {
      if ($isHeadingNode(node) && node.getTag() === 'h1') {
        // Start new chapter
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: node.getTextContent(),
          data: '',
        };
      } else {
        // Add to current chapter
        if (!currentChapter) {
          currentChapter = {
            title: 'Chapter 1',
            data: '',
          };
        }
        
        if ($isHeadingNode(node)) {
          currentChapter.data += `<h2>${node.getTextContent()}</h2>`;
        } else if ($isParagraphNode(node)) {
          currentChapter.data += `<p>${node.getTextContent()}</p>`;
        } else if ($isQuoteNode(node)) {
          currentChapter.data += `<blockquote>${node.getTextContent()}</blockquote>`;
        }
      }
    });
    
    // Add last chapter
    if (currentChapter) {
      chapters.push(currentChapter);
    }
  });
  
  const options = {
    title: metadata.title,
    author: metadata.author,
    publisher: 'Writer\'s Tree',
    cover: metadata.coverImage || undefined,
    content: chapters,
    css: `
      body { font-family: 'Georgia', serif; font-size: 1.1em; line-height: 1.6; }
      h1 { font-size: 2em; margin-top: 1em; }
      h2 { font-size: 1.5em; margin-top: 0.8em; }
      p { margin-bottom: 1em; text-indent: 1.5em; }
      blockquote { font-style: italic; margin-left: 2em; }
    `,
  };
  
  const epub = new Epub(options, `${metadata.title}.epub`);
  await epub.promise;
}
```

### 5.4 Markdown Export

```typescript
function exportToMarkdown(editorState: EditorState): string {
  let markdown = '';
  
  editorState.read(() => {
    const root = $getRoot();
    
    root.getChildren().forEach((node) => {
      if ($isHeadingNode(node)) {
        const level = node.getTag() === 'h1' ? '#' : '##';
        markdown += `${level} ${node.getTextContent()}\n\n`;
      } else if ($isParagraphNode(node)) {
        let text = '';
        
        node.getChildren().forEach((child) => {
          if ($isTextNode(child)) {
            let content = child.getTextContent();
            
            if (child.hasFormat('bold')) content = `**${content}**`;
            if (child.hasFormat('italic')) content = `*${content}*`;
            if (child.hasFormat('strikethrough')) content = `~~${content}~~`;
            if (child.hasFormat('code')) content = `\`${content}\``;
            
            text += content;
          }
        });
        
        markdown += `${text}\n\n`;
      } else if ($isQuoteNode(node)) {
        markdown += `> ${node.getTextContent()}\n\n`;
      } else if ($isListNode(node)) {
        const isOrdered = node.getListType() === 'number';
        let index = 1;
        
        node.getChildren().forEach((listItem) => {
          const prefix = isOrdered ? `${index}. ` : '- ';
          markdown += `${prefix}${listItem.getTextContent()}\n`;
          index++;
        });
        markdown += '\n';
      } else if ($isCodeNode(node)) {
        markdown += `\`\`\`\n${node.getTextContent()}\n\`\`\`\n\n`;
      }
    });
  });
  
  return markdown;
}

function downloadMarkdown(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  saveAs(blob, `${filename}.md`);
}
```

---

## 6. Advanced Features Implementation

### 6.1 Find & Replace

```typescript
function FindReplaceModal({ editor }: { editor: LexicalEditor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<TextNode[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  const findMatches = useCallback(() => {
    if (!searchTerm) return;
    
    const foundMatches: TextNode[] = [];
    
    editor.getEditorState().read(() => {
      const root = $getRoot();
      
      root.getAllTextNodes().forEach((textNode) => {
        const text = textNode.getTextContent();
        const searchPattern = wholeWord 
          ? new RegExp(`\\b${searchTerm}\\b`, caseSensitive ? 'g' : 'gi')
          : new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
        
        if (searchPattern.test(text)) {
          foundMatches.push(textNode);
        }
      });
    });
    
    setMatches(foundMatches);
    setCurrentMatchIndex(0);
    
    if (foundMatches.length > 0) {
      highlightMatch(foundMatches[0]);
    }
  }, [editor, searchTerm, caseSensitive, wholeWord]);
  
  const replaceOne = useCallback(() => {
    if (matches.length === 0) return;
    
    const currentMatch = matches[currentMatchIndex];
    
    editor.update(() => {
      const text = currentMatch.getTextContent();
      const replaced = text.replace(
        caseSensitive ? searchTerm : new RegExp(searchTerm, 'i'),
        replaceTerm
      );
      currentMatch.setTextContent(replaced);
    });
    
    // Move to next match
    if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  }, [editor, matches, currentMatchIndex, searchTerm, replaceTerm, caseSensitive]);
  
  const replaceAll = useCallback(() => {
    editor.update(() => {
      matches.forEach((match) => {
        const text = match.getTextContent();
        const replaced = text.replace(
          new RegExp(searchTerm, caseSensitive ? 'g' : 'gi'),
          replaceTerm
        );
        match.setTextContent(replaced);
      });
    });
    
    setMatches([]);
    setCurrentMatchIndex(0);
  }, [editor, matches, searchTerm, replaceTerm, caseSensitive]);
  
  return (
    <div className="find-replace-modal">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Find..."
      />
      <input
        type="text"
        value={replaceTerm}
        onChange={(e) => setReplaceTerm(e.target.value)}
        placeholder="Replace with..."
      />
      
      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Case sensitive
        </label>
        <label>
          <input
            type="checkbox"
            checked={wholeWord}
            onChange={(e) => setWholeWord(e.target.checked)}
          />
          Whole word
        </label>
      </div>
      
      <div className="results">
        {matches.length > 0 && (
          <span>{currentMatchIndex + 1} of {matches.length}</span>
        )}
      </div>
      
      <div className="actions">
        <button onClick={findMatches}>Find</button>
        <button onClick={replaceOne} disabled={matches.length === 0}>
          Replace
        </button>
        <button onClick={replaceAll} disabled={matches.length === 0}>
          Replace All
        </button>
      </div>
    </div>
  );
}
```

### 6.2 Document Outline with Jump Navigation

```typescript
interface OutlineItem {
  id: string;
  level: number;
  text: string;
  nodeKey: string;
}

function DocumentOutline({ editor }: { editor: LexicalEditor }) {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const items: OutlineItem[] = [];
        
        root.getChildren().forEach((node) => {
          if ($isHeadingNode(node)) {
            const level = parseInt(node.getTag().replace('h', ''));
            items.push({
              id: node.getKey(),
              level,
              text: node.getTextContent(),
              nodeKey: node.getKey(),
            });
          }
        });
        
        setOutline(items);
      });
    });
  }, [editor]);
  
  const jumpToHeading = useCallback((nodeKey: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        const domElement = editor.getElementByKey(nodeKey);
        if (domElement) {
          domElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Highlight briefly
          domElement.classList.add('highlight-flash');
          setTimeout(() => {
            domElement.classList.remove('highlight-flash');
          }, 1000);
        }
      }
    });
  }, [editor]);
  
  return (
    <nav className="document-outline">
      <h3>Outline</h3>
      {outline.length === 0 ? (
        <p className="empty-state">No headings yet</p>
      ) : (
        <ul>
          {outline.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
              onClick={() => jumpToHeading(item.nodeKey)}
            >
              <span className={`level-${item.level}`}>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
```

### 6.3 Writing Sprint Timer

```typescript
function WritingSprintTimer() {
  const [duration, setDuration] = useState(15); // minutes
  const [wordGoal, setWordGoal] = useState(500);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [wordsAtStart, setWordsAtStart] = useState(0);
  const { wordCount } = useWordCount();
  
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          completeSprint();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  const startSprint = () => {
    setWordsAtStart(wordCount);
    setTimeRemaining(duration * 60);
    setIsActive(true);
  };
  
  const stopSprint = () => {
    setIsActive(false);
    completeSprint();
  };
  
  const completeSprint = () => {
    const wordsWritten = wordCount - wordsAtStart;
    const goalReached = wordsWritten >= wordGoal;
    
    // Show celebration modal
    showSprintResults({
      wordsWritten,
      goalReached,
      timeSpent: duration - (timeRemaining / 60),
    });
    
    // Optional: Play completion sound
    if (goalReached) {
      playSound('/sounds/success.mp3');
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((wordCount - wordsAtStart) / wordGoal) * 100;
  
  return (
    <div className="sprint-timer">
      {!isActive ? (
        <>
          <h3>Start a Writing Sprint</h3>
          <div className="sprint-config">
            <label>
              Duration:
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <label>
              Word Goal:
              <input
                type="number"
                value={wordGoal}
                onChange={(e) => setWordGoal(Number(e.target.value))}
                min={100}
                step={50}
              />
            </label>
          </div>
          <button onClick={startSprint} className="start-sprint-btn">
            Start Sprint
          </button>
        </>
      ) : (
        <>
          <div className="sprint-active">
            <div className="time-display">{formatTime(timeRemaining)}</div>
            <div className="word-progress">
              <span>{wordCount - wordsAtStart} / {wordGoal} words</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
            <button onClick={stopSprint} className="stop-sprint-btn">
              End Sprint
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 6.4 Grammar & Style Checking (LanguageTool Integration)

```typescript
import { useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

interface GrammarIssue {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: string;
  category: string;
}

function GrammarPlugin({ editor }: { editor: LexicalEditor }) {
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  
  const checkGrammar = useCallback(async (text: string) => {
    if (!text || text.length < 10) return;
    
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text,
          language: 'en-US',
          enabledOnly: 'false',
        }),
      });
      
      const data = await response.json();
      setIssues(data.matches);
      
      // Highlight issues in editor
      highlightGrammarIssues(editor, data.matches);
    } catch (error) {
      console.error('Grammar check failed:', error);
    }
  }, [editor]);
  
  const debouncedCheck = useMemo(
    () => debounce(checkGrammar, 3000),
    [checkGrammar]
  );
  
  useEffect(() => {
    if (!isEnabled) return;
    
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        debouncedCheck(text);
      });
    });
  }, [editor, isEnabled, debouncedCheck]);
  
  return (
    <div className="grammar-plugin">
      <label>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        Enable grammar checking
      </label>
      
      {isEnabled && issues.length > 0 && (
        <div className="grammar-issues">
          <h4>{issues.length} suggestions</h4>
          {issues.slice(0, 5).map((issue, i) => (
            <div key={i} className="issue">
              <p>{issue.message}</p>
              {issue.replacements.length > 0 && (
                <button onClick={() => applyFix(issue)}>
                  Replace with "{issue.replacements[0]}"
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Final Performance Benchmarks

### 7.1 Target Performance Metrics

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Initial Load Time | <2s | <3s | >3s |
| Time to Interactive | <3s | <4s | >4s |
| Typing Latency | <16ms (60fps) | <33ms (30fps) | >33ms |
| Auto-save Impact | <50ms | <100ms | >100ms |
| Word Count Update | <100ms | <200ms | >200ms |
| Tree Animation FPS | 60fps | 45fps | <30fps |
| Find/Replace (100k words) | <500ms | <1s | >1s |
| Export DOCX (100k words) | <3s | <5s | >5s |
| Memory Usage (idle) | <150MB | <250MB | >250MB |
| Memory Usage (500k words) | <300MB | <500MB | >500MB |

### 7.2 Performance Testing Commands

```bash
# Lighthouse CI
npm run lighthouse

# Bundle size analysis
npm run analyze

# Memory profiling
npm run profile

# Load testing (simulate 100 concurrent writers)
npm run load-test
```

---

## 8. Final Feature Checklist

### ✅ Must-Have (Launch Day)
- [x] Rich text formatting (bold, italic, underline, strikethrough)
- [x] Headings (H1, H2, H3)
- [x] Lists (bulleted, numbered, checklists)
- [x] Blockquotes
- [x] Hyperlinks
- [x] Auto-save (10s debounce)
- [x] Undo/Redo (50 states)
- [x] Word count (real-time)
- [x] Document outline
- [x] Find & Replace
- [x] Keyboard shortcuts
- [x] Export (.txt, .docx, .pdf, .md)
- [x] Version history
- [x] Offline mode
- [x] Dark mode
- [x] Focus mode
- [x] Writing sprints
- [x] Spell check
- [x] Smart quotes & auto-correct

### ⚠️ Nice-to-Have (Phase 2, 3-6 months)
- [ ] Tables
- [ ] Code blocks with syntax highlighting
- [ ] Footnotes
- [ ] Grammar checking (LanguageTool)
- [ ] Readability scores
- [ ] ePub export
- [ ] Markdown mode
- [ ] Custom themes
- [ ] Image insertion
- [ ] Comments & annotations
- [ ] Track changes
- [ ] Voice typing
- [ ] AI writing suggestions

### 🔮 Future (Phase 3, Year 2+)
- [ ] Real-time collaboration
- [ ] Mobile apps (iOS/Android)
- [ ] Publishing platform integrations
- [ ] Advanced AI features
- [ ] Custom dictionaries
- [ ] Project templates (novel, screenplay, etc.)

---

## 9. User Interface Components

### 9.1 Floating Toolbar (Selection-Based)

```typescript
function FloatingToolbar({ editor }: { editor: LexicalEditor }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          // Get selection rectangle
          const nativeSelection = window.getSelection();
          if (!nativeSelection || nativeSelection.rangeCount === 0) return;
          
          const range = nativeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Position toolbar above selection
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          
          // Detect active formats
          const formats = new Set<string>();
          if (selection.hasFormat('bold')) formats.add('bold');
          if (selection.hasFormat('italic')) formats.add('italic');
          if (selection.hasFormat('underline')) formats.add('underline');
          if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
          
          setActiveFormats(formats);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      });
    });
  }, [editor]);
  
  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };
  
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (!url) return;
    
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className="floating-toolbar"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <ToolbarButton
        onClick={() => formatText('bold')}
        active={activeFormats.has('bold')}
        tooltip="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => formatText('italic')}
        active={activeFormats.has('italic')}
        tooltip="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => formatText('underline')}
        active={activeFormats.has('underline')}
        tooltip="Underline (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => formatText('strikethrough')}
        active={activeFormats.has('strikethrough')}
        tooltip="Strikethrough (Ctrl+Shift+X)"
      >
        <s>S</s>
      </ToolbarButton>
      
      <div className="toolbar-divider" />
      
      <ToolbarButton
        onClick={insertLink}
        tooltip="Insert Link (Ctrl+K)"
      >
        🔗
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h1')}
        tooltip="Heading 1"
      >
        H1
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h2')}
        tooltip="Heading 2"
      >
        H2
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'quote')}
        tooltip="Quote"
      >
        " "
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({ 
  children, 
  onClick, 
  active, 
  tooltip 
}: { 
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  tooltip: string;
}) {
  return (
    <button
      className={`toolbar-button ${active ? 'active' : ''}`}
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
    >
      {children}
    </button>
  );
}
```

### 9.2 Status Bar (Bottom of Editor)

```typescript
function EditorStatusBar({ 
  wordCount, 
  wordGoal, 
  readingTime, 
  saveStatus 
}: StatusBarProps) {
  const progress = (wordCount / wordGoal) * 100;
  
  return (
    <div className="editor-status-bar">
      <div className="status-left">
        <span className="word-count">
          {wordCount.toLocaleString()} / {wordGoal.toLocaleString()} words
        </span>
        
        <span className="separator">•</span>
        
        <span className="reading-time">
          {readingTime} min read
        </span>
        
        <span className="separator">•</span>
        
        <div className="progress-indicator">
          <div 
            className="progress-bar" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      </div>
      
      <div className="status-right">
        <SaveIndicator status={saveStatus} />
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: 'typing' | 'saving' | 'saved' | 'error' }) {
  const icons = {
    typing: '•••',
    saving: '💾',
    saved: '✓',
    error: '⚠️',
  };
  
  const messages = {
    typing: 'Typing...',
    saving: 'Saving...',
    saved: 'All changes saved',
    error: 'Save failed - retrying...',
  };
  
  return (
    <div className={`save-indicator save-${status}`}>
      <span className="icon">{icons[status]}</span>
      <span className="message">{messages[status]}</span>
    </div>
  );
}
```

### 9.3 Settings Panel

```typescript
function EditorSettings({ editor }: { editor: LexicalEditor }) {
  const [settings, setSettings] = useLocalStorage('editor-settings', {
    fontFamily: 'Lora',
    fontSize: 18,
    lineHeight: 1.8,
    lineWidth: 800,
    theme: 'light',
    spellCheck: true,
    autoSave: true,
    wordSuggestions: true,
    grammarCheck: false,
    showWordCount: true,
    focusMode: false,
  });
  
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="editor-settings-panel">
      <h2>Editor Settings</h2>
      
      <section>
        <h3>Appearance</h3>
        
        <label>
          Font Family
          <select 
            value={settings.fontFamily}
            onChange={(e) => updateSetting('fontFamily', e.target.value)}
          >
            <option value="Lora">Lora (Default Serif)</option>
            <option value="Crimson Text">Crimson Text (Literary Serif)</option>
            <option value="Georgia">Georgia (Classic Serif)</option>
            <option value="Inter">Inter (Clean Sans-Serif)</option>
            <option value="OpenDyslexic">OpenDyslexic (Accessibility)</option>
          </select>
        </label>
        
        <label>
          Font Size: {settings.fontSize}px
          <input
            type="range"
            min={14}
            max={24}
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
          />
        </label>
        
        <label>
          Line Height: {settings.lineHeight}
          <input
            type="range"
            min={1.4}
            max={2.0}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
          />
        </label>
        
        <label>
          Line Width: {settings.lineWidth}px
          <input
            type="range"
            min={600}
            max={1000}
            step={50}
            value={settings.lineWidth}
            onChange={(e) => updateSetting('lineWidth', Number(e.target.value))}
          />
        </label>
        
        <label>
          Theme
          <select
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </label>
      </section>
      
      <section>
        <h3>Writing Aids</h3>
        
        <label>
          <input
            type="checkbox"
            checked={settings.spellCheck}
            onChange={(e) => updateSetting('spellCheck', e.target.checked)}
          />
          Spell Check
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.grammarCheck}
            onChange={(e) => updateSetting('grammarCheck', e.target.checked)}
          />
          Grammar Check (LanguageTool)
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.wordSuggestions}
            onChange={(e) => updateSetting('wordSuggestions', e.target.checked)}
          />
          Word Suggestions
        </label>
      </section>
      
      <section>
        <h3>Productivity</h3>
        
        <label>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => updateSetting('autoSave', e.target.checked)}
          />
          Auto-Save (every 10 seconds)
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.showWordCount}
            onChange={(e) => updateSetting('showWordCount', e.target.checked)}
          />
          Show Word Count
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.focusMode}
            onChange={(e) => updateSetting('focusMode', e.target.checked)}
          />
          Focus Mode
        </label>
      </section>
      
      <section>
        <h3>Keyboard Shortcuts</h3>
        <div className="shortcuts-list">
          <div className="shortcut">
            <kbd>Ctrl/Cmd + B</kbd>
            <span>Bold</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + I</kbd>
            <span>Italic</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + U</kbd>
            <span>Underline</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + K</kbd>
            <span>Insert Link</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + F</kbd>
            <span>Find</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + H</kbd>
            <span>Replace</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + S</kbd>
            <span>Force Save</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + Z</kbd>
            <span>Undo</span>
          </div>
          <div className="shortcut">
            <kbd>Ctrl/Cmd + Shift + Z</kbd>
            <span>Redo</span>
          </div>
        </div>
      </section>
      
      <button className="reset-settings" onClick={() => setSettings(defaultSettings)}>
        Reset to Defaults
      </button>
    </div>
  );
}
```

---

## 10. Complete CSS Styling

### 10.1 Editor Core Styles

```css
/* Editor Container */
.editor-container {
  width: 60%;
  height: calc(100vh - 64px - 80px);
  background: var(--background-primary);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* Editor Content Area */
.editor-content {
  max-width: var(--editor-line-width, 800px);
  margin: 0 auto;
  padding: 48px;
  font-family: var(--editor-font-family, 'Lora', serif);
  font-size: var(--editor-font-size, 18px);
  line-height: var(--editor-line-height, 1.8);
  color: var(--text-primary);
  min-height: 100%;
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  caret-color: var(--focus-accent);
}

/* Placeholder */
.editor-placeholder {
  position: absolute;
  top: 48px;
  left: 48px;
  max-width: 800px;
  color: var(--text-tertiary);
  font-style: italic;
  pointer-events: none;
  user-select: none;
}

/* Selection */
.editor-content::selection {
  background: rgba(74, 144, 226, 0.15);
}

/* Typography Styles */
.editor-paragraph {
  margin: 0 0 24px 0;
}

.editor-heading-h1 {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  margin: 48px 0 24px 0;
}

.editor-heading-h2 {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  margin: 32px 0 16px 0;
}

.editor-heading-h3 {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  margin: 24px 0 12px 0;
}

.editor-quote {
  margin: 24px 0;
  padding-left: 24px;
  border-left: 4px solid var(--text-tertiary);
  color: var(--text-secondary);
  font-style: italic;
}

.editor-code {
  background: var(--background-secondary);
  padding: 16px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  overflow-x: auto;
  margin: 24px 0;
}

/* Text Formatting */
.editor-text-bold {
  font-weight: 600;
}

.editor-text-italic {
  font-style: italic;
}

.editor-text-underline {
  text-decoration: underline;
}

.editor-text-strikethrough {
  text-decoration: line-through;
}

.editor-text-code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--background-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

/* Lists */
.editor-list-ol,
.editor-list-ul {
  margin: 16px 0;
  padding-left: 32px;
}

.editor-listitem {
  margin: 8px 0;
}

.editor-nested-listitem {
  list-style-type: circle;
}

.editor-checklist {
  list-style: none;
  padding-left: 0;
}

.editor-checklist li {
  display: flex;
  align-items: flex-start;
  margin: 8px 0;
}

.editor-checklist input[type="checkbox"] {
  margin-right: 12px;
  margin-top: 4px;
}

/* Links */
.editor-link {
  color: var(--focus-accent);
  text-decoration: underline;
  cursor: pointer;
}

.editor-link:hover {
  opacity: 0.8;
}

/* Floating Toolbar */
.floating-toolbar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 8px;
  display: flex;
  gap: 4px;
  z-index: 1000;
  animation: fadeInUp 150ms ease-out;
}

.toolbar-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 150ms ease;
}

.toolbar-button:hover {
  background: var(--background-secondary);
  color: var(--text-primary);
  transform: scale(1.05);
}

.toolbar-button.active {
  background: var(--focus-accent);
  color: white;
}

.toolbar-divider {
  width: 1px;
  background: var(--text-tertiary);
  margin: 4px 8px;
}

/* Status Bar */
.editor-status-bar {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 40%;
  background: var(--background-secondary);
  padding: 12px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-secondary);
}

.status-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.word-count {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

.separator {
  color: var(--text-tertiary);
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 100px;
  height: 4px;
  background: var(--background-primary);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--success-color);
  transition: width 300ms ease;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-typing .icon {
  animation: pulse 1s infinite;
}

.save-saving .icon {
  animation: spin 1s linear infinite;
}

.save-saved {
  color: var(--success-color);
}

.save-error {
  color: var(--error-color);
}

/* Dark Theme */
[data-theme="dark"] {
  --background-primary: #1a1a1a;
  --background-secondary: #242424;
  --text-primary: #e8e8e8;
  --text-secondary: #a8a8a8;
  --text-tertiary: #6b6b6b;
  --border-color: #3a3a3a;
}

[data-theme="dark"] .floating-toolbar {
  background: #2a2a2a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

/* Sepia Theme */
[data-theme="sepia"] {
  --background-primary: #f4ecd8;
  --background-secondary: #e8dfc5;
  --text-primary: #5c4a3a;
  --text-secondary: #8b7355;
}

/* Focus Mode */
.editor-content.focus-mode p:not(.active-paragraph) {
  opacity: 0.3;
  transition: opacity 300ms ease;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-100% - 4px));
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Highlight flash for jump navigation */
@keyframes highlightFlash {
  0%, 100% { background: transparent; }
  50% { background: rgba(74, 144, 226, 0.2); }
}

.highlight-flash {
  animation: highlightFlash 1s ease;
}
```

---

## 11. Final Implementation Summary

### 11.1 What We're Building

**A Production-Ready Writing Editor with:**

✅ **Complete Rich Text Editing** (Lexical framework)
- All formatting: bold, italic, underline, strikethrough, code
- Headings (H1, H2, H3)
- Lists (bulleted, numbered, checklists)
- Blockquotes, links, tables
- Undo/redo with 50-state history

✅ **Professional Writing Tools**
- Real-time word count & statistics
- Find & replace (with regex)
- Document outline with jump navigation
- Version history (100 versions)
- Writing sprint timer
- Daily goals & streaks

✅ **Export Everything**
- .txt, .md, .docx, .pdf, .epub, .html
- Custom formatting options
- Batch export

✅ **Smart Features**
- Auto-save (10s debounce)
- Offline mode (IndexedDB)
- Spell check (browser native)
- Grammar check (LanguageTool API)
- Smart typing (auto-correct, smart quotes)
- Markdown shortcuts (optional)

✅ **Performance Optimized**
- Handles 500,000+ words smoothly
- <16ms typing latency (60fps)
- Virtual scrolling for large docs
- Web workers for heavy computations
- Code splitting & lazy loading
- ~220KB gzipped initial bundle

✅ **Fully Customizable**
- 5 font families
- Font size (14-24px)
- Line height & width
- 4 color themes (light, dark, sepia, high-contrast)
- Focus mode
- Distraction-free mode

✅ **Accessibility First**
- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- Dyslexic-friendly fonts

### 11.2 Tech Stack Final Decision

```
Framework:  React 18 + TypeScript
Editor:     Lexical (Meta)
Styling:    CSS Modules + CSS Variables
State:      Zustand (lightweight)
Storage:    IndexedDB (idb library)
Export:     docx, jspdf, epub-gen
Tools:      Vite, ESLint, Prettier
Testing:    Jest, React Testing Library
```

### 11.3 Bundle Size Breakdown

```
Initial Load (Critical Path):
- Lexical Core:        40KB gzipped
- React + ReactDOM:    50KB gzipped
- App Code:            30KB gzipped
- Styles:              15KB gzipped
TOTAL INITIAL:         ~135KB gzipped ✅

Lazy Loaded (On Demand):
- Export Utils:        45KB gzipped
- Find/Replace:        10KB gzipped
- Version History:     15KB gzipped
- Grammar Check:       20KB gzipped
- Stats Panel:         12KB gzipped
TOTAL LAZY:            ~102KB gzipped

GRAND TOTAL:           ~237KB gzipped
```

### 11.4 Development Timeline

**Week 1-2: Core Editor**
- Set up Lexical with React
- Implement basic formatting
- Add toolbar
- Keyboard shortcuts

**Week 3-4: Writing Tools**
- Word count & statistics
- Find & replace
- Document outline
- Auto-save

**Week 5-6: Export & History**
- DOCX export
- PDF export
- Version history
- Offline mode

**Week 7-8: Polish & Testing**
- Performance optimization
- Accessibility audit
- User testing
- Bug fixes

**Total: 8 weeks to production-ready editor**

---

## 12. Success Criteria

### 12.1 Feature Parity with Competitors

| Feature | Scrivener | Google Docs | Notion | **Writer's Tree** |
|---------|-----------|-------------|---------|-------------------|
| Rich text editing | ✅ | ✅ | ✅ | ✅ |
| Offline mode | ✅ | ⚠️ | ⚠️ | ✅ |
| Version history | ⚠️ | ✅ | ✅ | ✅ |
| Export formats | ✅ | ⚠️ | ⚠️ | ✅ |
| Word goals | ✅ | ❌ | ❌ | ✅ |
| Distraction-free | ✅ | ❌ | ❌ | ✅ |
| Visual motivation | ❌ | ❌ | ❌ | ✅ (TREE) |

### 12.2 User Satisfaction Targets

- **No data loss:** 0 incidents in beta
- **Performance:** <16ms typing latency on 90% of devices
- **Reliability:** 99.9% auto-save success rate
- **Adoption:** 75% of users prefer our editor over their current tool
- **Retention:** 60% of users return weekly

---

**This editor will win users because it combines the power of Scrivener, the reliability of Google Docs, and the unique magic of watching their story grow into a tree. No compromises. No migrations. Just write.**