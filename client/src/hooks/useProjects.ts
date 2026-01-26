import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '@/config';
import type { Project } from '@/store/useStore';

export const useProjects = () => {
    const { user } = useUser();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = async () => {
        if (!user?.id) return;
        
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/projects`, {
                headers: { 'x-clerk-user-id': user.id }
            });
            const data = await res.json();
            
            if (data.success) {
                // Map API response to typical Project interface if needed
                // The API returns snake_case keys like current_word_count probably? 
                // Let's check API docs. Docs say:
                // "current_word_count": 15230
                // "word_goal": 50000
                // But our store uses camelCase. We should map it.
                
                const mappedProjects = data.data.projects.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    content: p.content || '',
                    wordCount: p.current_word_count,
                    goal: p.word_goal,
                    lastModified: new Date(p.updated_at).getTime(),
                    createdAt: new Date(p.created_at).getTime(),
                    status: p.status
                }));
                
                setProjects(mappedProjects);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (title: string, wordGoal: number) => {
        if (!user?.id) return null;

        try {
            const res = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-clerk-user-id': user.id
                },
                body: JSON.stringify({
                    title,
                    wordGoal
                })
            });
            
            const data = await res.json();
            if (data.success) {
                // Refresh list
                fetchProjects();
                return data.data.project.id;
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteProject = async (id: string) => {
         if (!user?.id) return;
         
         try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: { 'x-clerk-user-id': user.id }
            });
            const data = await res.json();
            if (data.success) {
                setProjects(prev => prev.filter(p => p.id !== id));
            }
         } catch (err) {
            console.error(err);
         }
    };

    const archiveProject = async (id: string) => {
        if (!user?.id) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-clerk-user-id': user.id
                },
                body: JSON.stringify({ status: 'archived' })
            });
            const data = await res.json();
            if (data.success) {
                fetchProjects();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const unarchiveProject = async (id: string) => {
        if (!user?.id) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-clerk-user-id': user.id
                },
                body: JSON.stringify({ status: 'active' })
            });
            const data = await res.json();
            if (data.success) {
                fetchProjects();
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    return { projects, loading, error, fetchProjects, createProject, deleteProject, archiveProject, unarchiveProject };
};
