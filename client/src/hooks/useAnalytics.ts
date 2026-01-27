import { useUser, useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '@/config';

export const useAnalytics = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  // Helper function for authenticated API calls
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
    if (!user?.id) return;

    try {
      await authenticatedFetch(`${API_BASE_URL}/analytics/event`, {
        method: 'POST',
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
      const response = await authenticatedFetch(`${API_BASE_URL}/analytics/stats`);
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
      const response = await authenticatedFetch(`${API_BASE_URL}/analytics/streaks`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get streaks:', error);
      return null;
    }
  };

  return { trackEvent, getStats, getStreaks };
};