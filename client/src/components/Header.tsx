import React, { useState, useEffect } from 'react';
import { Settings, Sprout, Maximize, Minimize } from 'lucide-react';
import { UserButton } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '@/context/ProjectContext';
import { ExportMenu } from './ExportMenu';
import { exportToDocx, exportToPdf, exportTreeAsPng } from '@/utils/exportUtils';

export const Header: React.FC = () => {
  const { project, updateSettings, wordCount, content, settingsConfigured, setSettingsConfigured } = useProjectContext();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(!settingsConfigured);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Open settings automatically if not configured yet
  useEffect(() => {
    if (!settingsConfigured) {
      setIsSettingsOpen(true);
    }
  }, [settingsConfigured]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf' | 'tree-png') => {
    if (isExporting) return; // Prevent multiple simultaneous exports
    
    setIsExporting(true);
    const projectTitle = project?.title || 'untitled';

    try {
      if (format === 'tree-png') {
        await exportTreeAsPng(projectTitle);
      } else if (format === 'docx') {
        await exportToDocx(content, projectTitle);
      } else if (format === 'pdf') {
        await exportToPdf(content, projectTitle);
      } else if (format === 'txt') {
        // Simple text export
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectTitle}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
      alert(`Export failed. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!project) return null;

  return (
    <>
    <header className="h-16 bg-background-primary border-b border-border-subtle shadow-level1 flex items-center justify-between px-8 z-20 relative">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/dashboard')}
      >
        <Sprout className="w-8 h-8 text-tree-leaves-mature" />
        <span className="font-sans font-medium text-sm text-text-primary hidden sm:block">Writer's Tree</span>
      </div>

      <div className="flex-1 max-w-75 mx-4">
        <input 
          type="text" 
          value={project?.title || ''}
          onChange={(e) => updateSettings({ title: e.target.value })}
          className="w-full bg-transparent text-text-primary font-sans font-semibold text-base text-center placeholder:text-text-tertiary focus:outline-none"
          placeholder="Untitled Project"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="bg-background-secondary px-3 py-1 rounded-full">
            <span className="font-mono text-sm text-text-secondary">
            {(wordCount || 0).toLocaleString()} <span className="text-text-tertiary">/</span> {(project.goal || 0).toLocaleString()}
            </span>
        </div>
        <button
          onClick={toggleFullscreen}
          className="text-text-secondary hover:text-text-primary transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
        <ExportMenu onExport={handleExport} />
        <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-text-secondary hover:text-text-primary transition-colors hover:rotate-45 duration-300"
        >
          <Settings className="w-5 h-5" />
        </button>
        <UserButton />
      </div>
    </header>

    {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsSettingsOpen(false)}>
            <div className="bg-white rounded-xl shadow-level4 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="font-serif text-xl text-text-primary mb-4">Project Settings</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Project Title</label>
                        <input 
                            type="text" 
                            value={project?.title || ''} 
                            onChange={(e) => updateSettings({ title: e.target.value })}
                            className="w-full px-3 py-2 bg-background-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-focus"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Word Count Goal</label>
                        <input 
                            type="number" 
                            value={project?.goal || 0} 
                            onChange={(e) => updateSettings({ goal: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-focus"
                        />
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button 
                            onClick={() => {
                                setSettingsConfigured(true);
                                setIsSettingsOpen(false);
                            }}
                            className="px-4 py-2 bg-tree-leaves-mature text-white rounded hover:bg-tree-trunk transition-colors text-sm"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
