import { createOrUpdateUser, findUserById, updateUserPreferences, deleteUser } from '../models/User.js';

export const syncUser = async (req, res, next) => {
  try {
    const { clerkUserId, email, fullName } = req.body;

    const user = await createOrUpdateUser({ clerkUserId, email, fullName });

    res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    let user = await findUserById(req.auth.userId);
    
    if (!user) {
      // Create test user if not found (for testing)
      user = await createOrUpdateUser({
        clerkUserId: req.auth.userId,
        email: req.auth.user.email || 'test@example.com',
        fullName: req.auth.user.firstName + ' ' + req.auth.user.lastName || 'Test User'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    const user = await updateUserPreferences(req.auth.userId, preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await deleteUser(req.auth.userId);

    res.json({
      success: true,
      message: 'User data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
