import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, BookOpen, Calendar, Search, Loader2, Archive, ArchiveRestore } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useProjects } from '@/hooks/useProjects';

export const Dashboard: React.FC = () => {
    const { projects, createProject, deleteProject, archiveProject, unarchiveProject, loading } = useProjects();
    const navigate = useNavigate();
    const { user } = useUser();
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newGoal, setNewGoal] = useState<number>(50000);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesArchive = showArchived ? p.status === 'archived' : p.status !== 'archived';
        return matchesSearch && matchesArchive;
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const id = await createProject(newTitle || "Untitled Project", newGoal);
            if (id) {
                navigate(`/project/${id}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenProject = (id: string) => {
        navigate(`/project/${id}`);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            deleteProject(id);
        }
    };

    const handleArchive = (e: React.MouseEvent, id: string, isArchived: boolean) => {
        e.stopPropagation();
        if (isArchived) {
            unarchiveProject(id);
        } else {
            archiveProject(id);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-secondary flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-focus" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-secondary p-8">
            <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-serif text-text-primary">Welcome, {user?.firstName || 'Writer'}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            showArchived 
                                ? 'bg-accent-focus text-white' 
                                : 'bg-background-primary text-text-secondary hover:bg-border-light'
                        }`}
                    >
                        {showArchived ? 'Show Active' : 'Show Archived'}
                    </button>
                    <div className="relative w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                         <input 
                            type="text" 
                            placeholder="Search projects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background-primary rounded-full focus:outline-none focus:ring-2 focus:ring-accent-focus/30 text-sm shadow-level1"
                        />
                    </div>
                    <UserButton />
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card */}
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="group relative h-[240px] bg-background-primary rounded-xl flex flex-col items-center justify-center gap-4 hover:shadow-level3 transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-full bg-accent-focus/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-accent-focus" />
                        </div>
                        <span className="text-text-secondary font-medium">Start New Project</span>
                    </button>

                    {/* Project Cards */}
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => handleOpenProject(project.id)}
                            className="group relative h-[240px] bg-background-primary rounded-xl hover:shadow-level3 transition-all duration-300 cursor-pointer flex flex-col p-6"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-background-secondary rounded-lg">
                                        <BookOpen className="w-6 h-6 text-tree-leaves-mature" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => handleArchive(e, project.id, project.status === 'archived')}
                                            className="p-2 text-text-tertiary hover:text-accent-focus hover:bg-accent-focus/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title={project.status === 'archived' ? 'Unarchive' : 'Archive'}
                                        >
                                            {project.status === 'archived' ? 
                                                <ArchiveRestore className="w-5 h-5" /> : 
                                                <Archive className="w-5 h-5" />
                                            }
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="p-2 text-text-tertiary hover:text-accent-warning hover:bg-accent-warning/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-serif text-xl text-text-primary mb-2 line-clamp-2">{project.title}</h3>
                                <p className="text-text-tertiary text-sm line-clamp-2">{project.content || "No content yet..."}</p>
                            </div>
                            
                            <div className="mt-auto">
                                <div className="w-full bg-background-secondary h-2 rounded-full mb-3 overflow-hidden">
                                    <div 
                                        className="bg-tree-leaves-mature h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, (project.wordCount / project.goal) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-text-secondary font-mono">
                                    <span>{project.wordCount.toLocaleString()} words</span>
                                    <span>{Math.round((project.wordCount / project.goal) * 100)}%</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border-subtle flex items-center text-xs text-text-tertiary gap-2">
                                    <Calendar className="w-3 h-3" />
                                    <span>Last edited {new Date(project.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-background-primary rounded-2xl shadow-level4 w-full max-w-lg p-8">
                        <h2 className="text-2xl font-serif text-text-primary mb-6">Start a New Journey</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-text-secondary mb-2">Project Title</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full px-4 py-3 bg-background-secondary rounded shadow-level1 focus:outline-none focus:ring-2 focus:ring-accent-focus/50 text-text-primary placeholder:text-text-tertiary"
                                    placeholder="The Great American Novel"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-text-secondary mb-2">Word Goal</label>
                                <input 
                                    type="number" 
                                    className="w-full px-4 py-3 bg-background-secondary rounded shadow-level1 focus:outline-none focus:ring-2 focus:ring-accent-focus/50 text-text-primary placeholder:text-text-tertiary"
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(parseInt(e.target.value) || 50000)}
                                    min="1000"
                                    step="1000"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 px-6 py-3 rounded text-text-secondary hover:bg-background-secondary transition-colors shadow-level1"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 rounded bg-tree-leaves-mature text-white font-medium hover:bg-tree-trunk transition-colors shadow-level2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Planting...' : 'Plant Seed'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
