import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import type { Project } from '@/store/useStore';

interface ProjectContextType {
    project: Project | null;
    content: string;
    wordCount: number;
    version: number;
    lastSaved: Date | null;
    saving: boolean;
    error: string | null;
    settingsConfigured: boolean;
    setSettingsConfigured: (configured: boolean) => void;
    updateContent: (content: string) => void;
    updateSettings: (updates: Partial<Project>) => Promise<void>;
    saveNow: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ projectId: string; children: React.ReactNode }> = ({ projectId, children }) => {
    const projectData = useProject(projectId);
    const [settingsConfigured, setSettingsConfiguredState] = useState(() => {
        // Check localStorage for this specific project
        const stored = localStorage.getItem(`project-${projectId}-settings-configured`);
        return stored === 'true';
    });
    
    const setSettingsConfigured = (configured: boolean) => {
        setSettingsConfiguredState(configured);
        // Persist to localStorage
        localStorage.setItem(`project-${projectId}-settings-configured`, String(configured));
    };
    
    // Auto-set settings as configured when project loads with valid title and goal
    useEffect(() => {
        if (projectData.project && projectData.project.title && projectData.project.goal > 0 && !settingsConfigured) {
            setSettingsConfigured(true);
        }
    }, [projectData.project, settingsConfigured]);

    // Warn before closing if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (projectData.saving || projectData.content !== projectData.project?.content) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [projectData.saving, projectData.content, projectData.project?.content]);

    return (
        <ProjectContext.Provider value={{ ...projectData, settingsConfigured, setSettingsConfigured }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
};
