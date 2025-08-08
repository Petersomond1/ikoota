// ikootaapi/controllers/identityController.js

import identityMaskingService from '../services/old.identityMaskingService.js';
import CustomError from '../utils/CustomError.js';

/**
 * Mask user identity when granting membership
 */
export const maskUserIdentity = async (req, res) => {
    try {
        const { userId, adminConverseId, mentorConverseId, classId } = req.body;

        if (!userId || !adminConverseId || !classId) {
            throw new CustomError('Missing required fields: userId, adminConverseId, classId', 400);
        }

        const result = await identityMaskingService.maskUserIdentity(
            userId, 
            adminConverseId, 
            mentorConverseId, 
            classId
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error masking user identity:', error);
        res.status(error.statusCode || 500).json({ 
            error: error.message || 'Failed to mask user identity' 
        });
    }
};

/**
 * Unmask user identity (super admin only)
 */
export const unmaskUserIdentity = async (req, res) => {
    try {
        const { converseId, adminConverseId } = req.body;

        if (!converseId || !adminConverseId) {
            throw new CustomError('Missing required fields: converseId, adminConverseId', 400);
        }

        const result = await identityMaskingService.unmaskUserIdentity(
            converseId, 
            adminConverseId
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error unmasking user identity:', error);
        res.status(error.statusCode || 500).json({ 
            error: error.message || 'Failed to unmask user identity' 
        });
    }
};

/**
 * Get class members (converse data only)
 */
export const getClassMembers = async (req, res) => {
    try {
        const { classId } = req.params;

        if (!classId) {
            throw new CustomError('Class ID is required', 400);
        }

        const members = await identityMaskingService.getClassMembers(classId);
        res.status(200).json(members);
    } catch (error) {
        console.error('Error fetching class members:', error);
        res.status(error.statusCode || 500).json({ 
            error: error.message || 'Failed to fetch class members' 
        });
    }
};

/**
 * Get mentees for a mentor
 */
export const getMentees = async (req, res) => {
    try {
        const { mentorConverseId } = req.params;

        if (!mentorConverseId) {
            throw new CustomError('Mentor converse ID is required', 400);
        }

        const mentees = await identityMaskingService.getMentees(mentorConverseId);
        res.status(200).json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(error.statusCode || 500).json({ 
            error: error.message || 'Failed to fetch mentees' 
        });
    }
};