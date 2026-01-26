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
    const user = await findUserById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
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
    const user = await updateUserPreferences(req.userId, preferences);

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
    await deleteUser(req.userId);

    res.json({
      success: true,
      message: 'User data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
