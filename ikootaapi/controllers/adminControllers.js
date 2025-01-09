import {
    getPendingContentService,
    approveContentService,
    rejectContentService,
    manageUsersService,
    manageContentService,
    banUserService,
    unbanUserService,
    grantPostingRightsService,
    updateUserService
  } from '../services/adminServices.js';
  
  export const getPendingContent = async (req, res) => {
    try {
      const pendingContent = await getPendingContentService();
      res.status(200).json(pendingContent);
    } catch (error) {
      console.error('Error in getPendingContent:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching pending content.' });
    }
  };
  
  export const approveContent = async (req, res) => {
    try {
      const contentId = req.params.id;
      await approveContentService(contentId);
      res.status(200).json({ message: 'Content approved successfully' });
    } catch (error) {
      console.error('Error in approveContent:', error.message);
      res.status(500).json({ error: 'An error occurred while approving the content.' });
    }
  };
  
  export const rejectContent = async (req, res) => {
    try {
      const contentId = req.params.id;
      await rejectContentService(contentId);
      res.status(200).json({ message: 'Content rejected successfully' });
    } catch (error) {
      console.error('Error in rejectContent:', error.message);
      res.status(500).json({ error: 'An error occurred while rejecting the content.' });
    }
  };
  
  export const manageContent = async (req, res) => {
    try {
      const content = await manageContentService();
      res.status(200).json(content);
    } catch (error) {
      console.error('Error in manageContent:', error.message);
      res.status(500).json({ error: 'An error occurred while managing content.' });
    }
  };
  
  export const manageUsers = async (req, res) => {
    try {
      const users = await manageUsersService();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error in manageUsers:', error.message);
      res.status(500).json({ error: 'An error occurred while managing users.' });
    }
  };
  
  export const banUser = async (req, res) => {
    try {
      const { userId } = req.body;
      await banUserService(userId);
      res.status(200).json({ message: 'User banned successfully' });
    } catch (error) {
      console.error('Error in banUser:', error.message);
      res.status(500).json({ error: 'An error occurred while banning the user.' });
    }
  };
  
  export const unbanUser = async (req, res) => {
    try {
      const { userId } = req.body;
      await unbanUserService(userId);
      res.status(200).json({ message: 'User unbanned successfully' });
    } catch (error) {
      console.error('Error in unbanUser:', error.message);
      res.status(500).json({ error: 'An error occurred while unbanning the user.' });
    }
  };
  
  export const grantPostingRights = async (req, res) => {
    try {
      const { userId } = req.body;
      await grantPostingRightsService(userId);
      res.status(200).json({ message: 'Posting rights granted successfully' });
    } catch (error) {
      console.error('Error in grantPostingRights:', error.message);
      res.status(500).json({ error: 'An error occurred while granting posting rights.' });
    }
  };
  
  export const updateUser = async (req, res) => {
    try {
      const { userId, rating, userclass } = req.body;
      const updatedUser = await updateUserService(userId, rating, userclass);
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error in updateUser:', error.message);
      res.status(500).json({ error: 'An error occurred while updating the user.' });
    }
  };