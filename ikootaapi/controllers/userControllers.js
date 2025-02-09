import { getUserProfileService, updateUserProfileService, updateUser } from '../services/userServices.js';

export const getUserProfile = async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const userProfile = await getUserProfileService(user_id);
      res.status(200).json(userProfile);
    } catch (error) {
      console.error('Error in getUserProfile:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching the user profile.' });
    }
  };

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const updatedProfile = await updateUserProfileService(userId, req.body);
        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error('Error in updateUserProfile:', error.message);
        res.status(500).json({ error: 'An error occurred while updating the user profile.' });
    }
};

export const updateUserRole = async (req, res) => {
    try {
      const { userId, role } = req.body;
      await updateUser(userId, role);
      res.status(200).json({ message: 'User role updated successfully.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  