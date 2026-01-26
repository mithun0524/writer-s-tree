import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isHeadingNode, $isQuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Quote, Link, List, ListOrdered, Undo2, Redo2 } from 'lucide-react';

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update link state
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else if ($isQuoteNode(element)) {
        setBlockType('quote');
      } else if ($isListNode(element)) {
        setBlockType(element.getListType());
      } else {
        setBlockType('paragraph');
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  const insertLink = useCallback(() => {
    if (!isLink) {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  const formatHeading = (headingSize: 'h1' | 'h2') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const element = selection.anchor.getNode().getTopLevelElementOrThrow();
          const newHeading = $createHeadingNode(headingSize);
          element.replace(newHeading);
          newHeading.selectEnd();
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const element = selection.anchor.getNode().getTopLevelElementOrThrow();
          const quote = $createQuoteNode();
          element.replace(quote);
          quote.selectEnd();
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="toolbar flex items-center gap-1 p-2 border-b border-(--border-primary) bg-(--background-primary) sticky top-0 z-10">
      {/* Undo/Redo */}
      <button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="toolbar-btn"
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="toolbar-btn"
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Text formatting */}
      <button
        onClick={formatBold}
        className={`toolbar-btn ${isBold ? 'active' : ''}`}
        aria-label="Format Bold"
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={formatItalic}
        className={`toolbar-btn ${isItalic ? 'active' : ''}`}
        aria-label="Format Italic"
        title="Italic (Ctrl+I)"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={formatUnderline}
        className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
        aria-label="Format Underline"
        title="Underline (Ctrl+U)"
      >
        <Underline size={18} />
      </button>
      <button
        onClick={formatStrikethrough}
        className={`toolbar-btn ${isStrikethrough ? 'active' : ''}`}
        aria-label="Format Strikethrough"
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Block formatting */}
      <button
        onClick={() => formatHeading('h1')}
        className={`toolbar-btn ${blockType === 'h1' ? 'active' : ''}`}
        aria-label="Heading 1"
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => formatHeading('h2')}
        className={`toolbar-btn ${blockType === 'h2' ? 'active' : ''}`}
        aria-label="Heading 2"
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={formatQuote}
        className={`toolbar-btn ${blockType === 'quote' ? 'active' : ''}`}
        aria-label="Quote"
        title="Quote"
      >
        <Quote size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button
        onClick={formatBulletList}
        className={`toolbar-btn ${blockType === 'ul' ? 'active' : ''}`}
        aria-label="Bullet List"
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={formatNumberedList}
        className={`toolbar-btn ${blockType === 'ol' ? 'active' : ''}`}
        aria-label="Numbered List"
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Link */}
      <button
        onClick={insertLink}
        className={`toolbar-btn ${isLink ? 'active' : ''}`}
        aria-label="Insert Link"
        title="Insert Link (Ctrl+K)"
      >
        <Link size={18} />
      </button>
    </div>
  );
}
