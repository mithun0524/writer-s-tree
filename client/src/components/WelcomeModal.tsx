import React, { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary rounded-2xl shadow-level4 w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-tree-leaves-young/10 rounded-full flex items-center justify-center">
            <Sprout className="w-10 h-10 text-tree-leaves-young" />
          </div>
        </div>
        
        <h2 className="text-2xl font-serif text-text-primary mb-6">Welcome to Writer's Tree</h2>
        
        <div className="space-y-4 text-text-secondary mb-8">
          <p className="text-base leading-relaxed">
            <strong className="text-text-primary">Your words grow a tree.</strong><br />
            Watch it flourish from seed to ancient giant as you write.
          </p>
          <p className="text-base leading-relaxed">
            <strong className="text-text-primary">Reach milestones to see it bloom.</strong><br />
            Celebrate your progress with beautiful animations.
          </p>
          <p className="text-base leading-relaxed">
            <strong className="text-text-primary">Every story is unique.</strong><br />
            Your tree grows in its own special way.
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="w-full px-6 py-3 bg-tree-leaves-mature text-white rounded-lg font-medium hover:bg-tree-trunk transition-colors shadow-level2"
        >
          Start Writing
        </button>
      </div>
    </div>
  );
};
