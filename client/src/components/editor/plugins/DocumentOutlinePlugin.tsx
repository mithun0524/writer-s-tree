import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect } from 'react';
import { $getRoot, type LexicalEditor } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { List, ChevronRight, ChevronDown } from 'lucide-react';

interface HeadingItem {
  key: string;
  text: string;
  level: 1 | 2 | 3;
  children: HeadingItem[];
}


interface DocumentOutlinePluginProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  anyPanelOpen: boolean;
}

export function DocumentOutlinePlugin({ isOpen, onOpen, onClose, anyPanelOpen }: DocumentOutlinePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [outline, setOutline] = useState<HeadingItem[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const headings = extractHeadings(editor);
        setOutline(buildHierarchy(headings));
      });
    });
  }, [editor]);

  const scrollToHeading = (key: string) => {
    editor.update(() => {
      const root = $getRoot();
      const node = root.getChildAtIndex(parseInt(key));
      
      if (node) {
        const element = editor.getElementByKey(node.getKey());
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Flash highlight animation
          element.classList.add('outline-highlight');
          setTimeout(() => {
            element.classList.remove('outline-highlight');
          }, 1000);
        }
      }
    });
  };

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  if (!isOpen && !anyPanelOpen) {
    return (
      <button
        onClick={onOpen}
        className="absolute right-4 top-4 p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow z-20 border border-border-light"
        title="Document Outline"
      >
        <List size={20} className="text-text-secondary" />
      </button>
    );
  }
  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-4 w-72 bg-white rounded-lg shadow-2xl z-20 border border-border-light max-h-[70vh] flex flex-col">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <List size={18} />
          Document Outline
        </h3>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary text-sm"
        >
          Close
        </button>
      </div>

      <div className="overflow-y-auto p-4 space-y-1">
        {outline.length === 0 ? (
          <p className="text-text-tertiary text-sm italic">
            No headings found. Add headings to see the outline.
          </p>
        ) : (
          <OutlineTree
            items={outline}
            collapsed={collapsed}
            onToggle={toggleCollapse}
            onNavigate={scrollToHeading}
          />
        )}
      </div>
    </div>
  );
}

function OutlineTree({
  items,
  collapsed,
  onToggle,
  onNavigate,
  level = 0,
}: {
  items: HeadingItem[];
  collapsed: Set<string>;
  onToggle: (key: string) => void;
  onNavigate: (key: string) => void;
  level?: number;
}) {
  return (
    <>
      {items.map((item) => {
        const isCollapsed = collapsed.has(item.key);
        const hasChildren = item.children.length > 0;

        return (
          <div key={item.key}>
            <div
              className="flex items-start gap-1 py-1 px-2 hover:bg-background-secondary rounded cursor-pointer group"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => onToggle(item.key)}
                  className="mt-0.5 text-text-tertiary hover:text-text-primary"
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
              ) : (
                <span className="w-3.5" />
              )}
              
              <span
                onClick={() => onNavigate(item.key)}
                className={`flex-1 text-sm ${
                  item.level === 1
                    ? 'font-semibold text-text-primary'
                    : item.level === 2
                    ? 'font-medium text-text-secondary'
                    : 'text-text-tertiary'
                } group-hover:text-accent-focus transition-colors`}
              >
                {item.text || '(Empty heading)'}
              </span>
            </div>

            {!isCollapsed && hasChildren && (
              <OutlineTree
                items={item.children}
                collapsed={collapsed}
                onToggle={onToggle}
                onNavigate={onNavigate}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

function extractHeadings(_editor: LexicalEditor): Array<{ key: string; text: string; level: 1 | 2 | 3 }> {
  const headings: Array<{ key: string; text: string; level: 1 | 2 | 3 }> = [];

  const root = $getRoot();
  const children = root.getChildren();

  children.forEach((node, index) => {
    if ($isHeadingNode(node)) {
      const tag = node.getTag();
      const level = parseInt(tag.charAt(1)) as 1 | 2 | 3;
      
      if (level >= 1 && level <= 3) {
        headings.push({
          key: index.toString(),
          text: node.getTextContent(),
          level,
        });
      }
    }
  });

  return headings;
}

function buildHierarchy(headings: Array<{ key: string; text: string; level: 1 | 2 | 3 }>): HeadingItem[] {
  const root: HeadingItem[] = [];
  const stack: { item: HeadingItem; level: number }[] = [];

  headings.forEach((heading) => {
    const item: HeadingItem = { ...heading, children: [] };

    // Pop items from stack with level >= current
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].item.children.push(item);
    }

    stack.push({ item, level: heading.level });
  });

  return root;
}
