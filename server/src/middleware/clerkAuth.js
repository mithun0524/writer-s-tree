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

// Temporarily disabled authentication for testing
// export const clerkAuth = ClerkExpressRequireAuth({
//   // Optional: customize error handling
//   onError: (error) => {
//     console.error('Clerk auth error:', error);
//   },
// });

// Temporary no-auth middleware for testing
export const clerkAuth = (req, res, next) => {
  // Mock user for testing - simulates a logged-in user
  req.auth = {
    userId: 'test-user-123',
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    }
  };
  next();
};

/**
 * Optional: Middleware to verify JWT but don't require it
 * (useful for endpoints that work for both authenticated and anonymous users)
 */

// Temporarily disabled optional authentication for testing
// export const optionalClerkAuth = ClerkExpressRequireAuth({
//   onError: (error) => {
//     console.error('Optional auth error:', error);
//   },
// });

// Temporary no-auth middleware for testing
export const optionalClerkAuth = (req, res, next) => {
  // Mock user for testing - simulates a logged-in user
  req.auth = {
    userId: 'test-user-123',
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    }
  };
  next();
};