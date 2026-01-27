import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

/**
 * Middleware to verify Clerk JWT and extract user ID
 *
 * Usage:
 *   app.get('/projects', clerkAuth, async (req, res) => {
 *     const userId = req.auth.userId;
 *     // ... fetch user's projects
 *   });
 */
export const clerkAuth = ClerkExpressRequireAuth({
  // Optional: customize error handling
  onError: (error) => {
    console.error('Clerk auth error:', error);
  },
});

/**
 * Optional: Middleware to verify JWT but don't require it
 * (useful for endpoints that work for both authenticated and anonymous users)
 */
export const optionalClerkAuth = ClerkExpressRequireAuth({
  onError: (error) => {
    console.error('Optional auth error:', error);
  },
});