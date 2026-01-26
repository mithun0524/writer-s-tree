import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileType, Image } from 'lucide-react';

interface ExportMenuProps {
  onExport: (format: 'txt' | 'docx' | 'pdf' | 'tree-png') => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = (format: 'txt' | 'docx' | 'pdf' | 'tree-png') => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Export"
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <Download className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-level3 border border-border-light py-1 z-50">
          <button
            onClick={() => handleExport('txt')}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-background-secondary transition-colors"
          >
            <FileText size={16} className="text-text-tertiary" />
            <span>Export as .txt</span>
          </button>
          <button
            onClick={() => handleExport('docx')}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-background-secondary transition-colors"
          >
            <FileType size={16} className="text-text-tertiary" />
            <span>Export as .docx</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-background-secondary transition-colors"
          >
            <FileText size={16} className="text-text-tertiary" />
            <span>Export as .pdf</span>
          </button>
          <div className="h-px bg-border-light my-1" />
          <button
            onClick={() => handleExport('tree-png')}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-background-secondary transition-colors"
          >
            <Image size={16} className="text-text-tertiary" />
            <span>Export tree as PNG</span>
          </button>
        </div>
      )}
    </div>
  );
};
