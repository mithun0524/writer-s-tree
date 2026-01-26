import { useUser } from '@clerk/clerk-react';
import { API_BASE_URL } from '@/config';

export const useAnalytics = () => {
  const { user } = useUser();

  const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
    if (!user?.id) return;

    try {
      await fetch(`${API_BASE_URL}/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({
          eventType,
          metadata
        })
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const getStats = async () => {
    if (!user?.id) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/analytics/stats`, {
        headers: { 'x-clerk-user-id': user.id }
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  };

  const getStreaks = async () => {
    if (!user?.id) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/analytics/streaks`, {
        headers: { 'x-clerk-user-id': user.id }
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get streaks:', error);
      return null;
    }
  };

  return { trackEvent, getStats, getStreaks };
};