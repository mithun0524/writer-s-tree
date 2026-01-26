import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  goal: number;
  lastModified: number;
  createdAt: number;
  treeSpecies?: string;
  treeSeason?: string;
  status?: string;
}

interface WriterState {
  projects: Project[];
  activeProjectId: string | null;
  isTreePanelOpen: boolean;
  isKeyboardPanelVisible: boolean;
  
  // Actions
  createProject: (title?: string, goal?: number) => string;
  deleteProject: (id: string) => void;
  updateProjectContent: (id: string, content: string) => void;
  updateProjectSettings: (id: string, updates: Partial<Project>) => void;
  setActiveProject: (id: string | null) => void;
  toggleTreePanel: () => void;
  toggleKeyboardPanel: () => void;
  getActiveProject: () => Project | undefined;
}

export const useStore = create<WriterState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isTreePanelOpen: true,
      isKeyboardPanelVisible: false,

      createProject: (title = "Untitled Project", goal = 50000) => {
        const id = crypto.randomUUID();
        const newProject: Project = {
          id,
          title,
          content: '',
          wordCount: 0,
          goal,
          lastModified: Date.now(),
          createdAt: Date.now(),
        };
        set((state) => ({ 
          projects: [newProject, ...state.projects],
          activeProjectId: id 
        }));
        return id;
      },

      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
      })),

      updateProjectContent: (id, content) => {
        // Simple word count regex
        const count = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
        
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === id 
              ? { ...p, content, wordCount: count, lastModified: Date.now() } 
              : p
          )
        }));
      },

      updateProjectSettings: (id, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...updates, lastModified: Date.now() } : p
        )
      })),
      
      setActiveProject: (id) => set({ activeProjectId: id }),
      toggleTreePanel: () => set((state) => ({ isTreePanelOpen: !state.isTreePanelOpen })),
      toggleKeyboardPanel: () => set((state) => ({ isKeyboardPanelVisible: !state.isKeyboardPanelVisible })),
      getActiveProject: () => {
        const state = get();
        return state.projects.find(p => p.id === state.activeProjectId);
      }
    }),
    {
      name: 'writerstree-storage',
    }
  )
);
