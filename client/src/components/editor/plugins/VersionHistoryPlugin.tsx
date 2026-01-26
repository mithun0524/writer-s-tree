import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect, useCallback } from 'react';
import { History, Trash2, RotateCcw } from 'lucide-react';
import { saveSnapshot, getAllSnapshots, deleteSnapshot, clearAllSnapshots } from '../../../utils/versionHistoryDB';
import { $getRoot } from 'lexical';

interface Snapshot {
  id: number;
  timestamp: number;
  editorState: any;
  wordCount: number;
  preview: string;
}


interface VersionHistoryPluginProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  anyPanelOpen: boolean;
}

export function VersionHistoryPlugin({ isOpen, onOpen, onClose, anyPanelOpen }: VersionHistoryPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [lastWordCount, setLastWordCount] = useState(0);

  // Load snapshots on open
  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen]);

  // Auto-save every 1000 words
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

        if (wordCount >= lastWordCount + 1000) {
          const preview = text.slice(0, 100) + (text.length > 100 ? '...' : '');
          
          saveSnapshot(
            editor.getEditorState().toJSON(),
            wordCount,
            preview
          ).then(() => {
            setLastWordCount(wordCount);
          });
        }
      });
    });
  }, [editor, lastWordCount]);

  const loadSnapshots = async () => {
    const snaps = await getAllSnapshots();
    setSnapshots(snaps.reverse()); // Most recent first
  };

  const restoreSnapshot = useCallback((snapshot: Snapshot) => {
    const editorState = editor.parseEditorState(snapshot.editorState);
    editor.setEditorState(editorState);
    onClose();
  }, [editor, onClose]);

  const deleteSnap = async (id: number) => {
    await deleteSnapshot(id);
    loadSnapshots();
  };

  const clearAll = async () => {
    if (confirm('Delete all version history? This cannot be undone.')) {
      await clearAllSnapshots();
      loadSnapshots();
    }
  };

  const manualSnapshot = () => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const preview = text.slice(0, 100) + (text.length > 100 ? '...' : '');

      saveSnapshot(editor.getEditorState().toJSON(), wordCount, preview).then(() => {
        loadSnapshots();
      });
    });
  };

  if (!isOpen && !anyPanelOpen) {
    return (
      <button
        onClick={onOpen}
        className="absolute right-4 top-20 p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow z-20 border border-border-light"
        title="Version History"
      >
        <History size={20} className="text-text-secondary" />
      </button>
    );
  }
  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-20 w-80 bg-white rounded-lg shadow-2xl z-20 border border-border-light max-h-[60vh] flex flex-col">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <History size={18} />
          Version History
        </h3>
        <div className="flex gap-2">
          <button
            onClick={manualSnapshot}
            className="text-xs px-3 py-1 bg-accent-focus text-white rounded hover:bg-accent-focus/90"
          >
            Save Now
          </button>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-sm"
          >
            Close
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-2 flex-1">
        {snapshots.length === 0 ? (
          <p className="text-text-tertiary text-sm italic">
            No snapshots yet. Snapshots are auto-saved every 1000 words.
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-text-tertiary">
                {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear All
              </button>
            </div>

            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="border border-border-light rounded p-3 hover:border-accent-focus transition-colors group"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-text-secondary mt-0.5">
                      {snapshot.wordCount} words
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restoreSnapshot(snapshot)}
                      className="p-1.5 text-accent-focus hover:bg-accent-focus hover:text-white rounded transition-colors"
                      title="Restore"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => deleteSnap(snapshot.id)}
                      className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-text-tertiary line-clamp-2 mt-2">
                  {snapshot.preview}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
