import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '@/config';

export const UserSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        const syncUser = async () => {
            if (!isLoaded || !user) return;

            try {
                const res = await fetch(`${API_BASE_URL}/users/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        clerkUserId: user.id,
                        email: user.primaryEmailAddress?.emailAddress || '',
                        fullName: user.fullName || user.firstName || 'Anonymous Writer'
                    })
                });

                const data = await res.json();
                if (!data.success) {
                    console.error('Failed to sync user:', data.message);
                }
            } catch (error) {
                console.error('Error syncing user:', error);
            }
        };

        syncUser();
    }, [user, isLoaded]);

    return <>{children}</>;
};
