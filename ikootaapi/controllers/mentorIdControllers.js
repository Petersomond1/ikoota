// ikootaapi/controllers/mentorIdControllers.js
// MENTOR ID CONTROLLERS - Mentorship System Management
// Handles mentor-mentee relationships with converse identity protection

import mentorIdServices from '../services/mentorIdServices.js';
import CustomError from '../utils/CustomError.js';

/**
 * Get user's mentor identity status (if they are a mentor)
 * Shows mentees by converse ID only, never real names
 * GET /api/identity/mentor
 */
export const getMentorId = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const mentorStatus = await mentorIdServices.getMentorStatus(userId);
        
        res.status(200).json({
            success: true,
            mentor: {
                isMentor: mentorStatus.isMentor,
                mentorConverseId: mentorStatus.mentorConverseId,
                totalMentees: mentorStatus.totalMentees,
                activeMentees: mentorStatus.activeMentees,
                mentorSince: mentorStatus.mentorSince,
                // Show user their real identity, not converse
                realName: mentorStatus.realName,
                realEmail: mentorStatus.realEmail
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting mentor status:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get mentor status' 
        });
    }
};

/**
 * Generate mentor ID (Admin-only operation)
 * POST /api/identity/mentor/generate
 */
export const generateMentorId = async (req, res) => {
    try {
        // Only admins can assign mentor roles
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required to generate mentor IDs', 403);
        }
        
        const { targetUserId, mentorshipType = 'mentor' } = req.body;
        
        if (!targetUserId) {
            throw new CustomError('Target user ID is required', 400);
        }
        
        const result = await mentorIdServices.assignMentorRole(
            targetUserId,
            req.user.id,
            mentorshipType
        );
        
        res.status(201).json({
            success: true,
            message: 'Mentor role assigned successfully',
            mentorConverseId: result.mentorConverseId,
            assignedBy: req.user.username,
            mentorshipType: result.mentorshipType,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error generating mentor ID:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to generate mentor ID' 
        });
    }
};

/**
 * Update mentor settings/preferences
 * PUT /api/identity/mentor
 */
export const updateMentorId = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mentorSettings } = req.body;
        
        // Verify user is actually a mentor
        const mentorStatus = await mentorIdServices.getMentorStatus(userId);
        if (!mentorStatus.isMentor) {
            throw new CustomError('User is not assigned as a mentor', 403);
        }
        
        const result = await mentorIdServices.updateMentorSettings(userId, mentorSettings);
        
        res.status(200).json({
            success: true,
            message: 'Mentor settings updated successfully',
            settings: result.settings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating mentor settings:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to update mentor settings' 
        });
    }
};

/**
 * Remove mentor role (Admin-only)
 * DELETE /api/identity/mentor
 */
export const deleteMentorId = async (req, res) => {
    try {
        const { targetUserId, reason } = req.body;
        
        // Only admins can remove mentor roles
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required to remove mentor roles', 403);
        }
        
        if (!targetUserId) {
            throw new CustomError('Target user ID is required', 400);
        }
        
        const result = await mentorIdServices.removeMentorRole(
            targetUserId,
            req.user.id,
            reason
        );
        
        res.status(200).json({
            success: true,
            message: 'Mentor role removed successfully',
            removedBy: req.user.username,
            affectedMentees: result.affectedMentees,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error removing mentor role:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to remove mentor role' 
        });
    }
};

/**
 * Get mentor's mentees (shows converse IDs only)
 * GET /api/identity/mentor/mentees
 */
export const getMentees = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Verify user is a mentor
        const mentorStatus = await mentorIdServices.getMentorStatus(userId);
        if (!mentorStatus.isMentor) {
            throw new CustomError('User is not assigned as a mentor', 403);
        }
        
        const mentees = await mentorIdServices.getMenteesByMentorId(userId);
        
        res.status(200).json({
            success: true,
            mentorConverseId: mentorStatus.mentorConverseId,
            totalMentees: mentees.length,
            mentees: mentees.map(mentee => ({
                converseId: mentee.converse_id,
                displayName: mentee.display_name,
                avatar: mentee.converse_avatar,
                classId: mentee.class_id,
                relationshipSince: mentee.relationshipSince,
                lastActive: mentee.lastActive,
                isOnline: mentee.isOnline || false
                // NEVER expose real identity
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting mentees:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get mentees' 
        });
    }
};

/**
 * Assign mentee to mentor (Admin-only)
 * POST /api/identity/mentor/mentees/assign
 */
export const assignMentee = async (req, res) => {
    try {
        const { mentorUserId, menteeUserId, relationshipType = 'mentor' } = req.body;
        
        // Only admins can assign mentor relationships
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required to assign mentees', 403);
        }
        
        if (!mentorUserId || !menteeUserId) {
            throw new CustomError('Both mentor and mentee user IDs are required', 400);
        }
        
        const result = await mentorIdServices.assignMenteeToMentor(
            mentorUserId,
            menteeUserId,
            req.user.id,
            relationshipType
        );
        
        res.status(201).json({
            success: true,
            message: 'Mentee assigned successfully',
            relationship: {
                mentorConverseId: result.mentorConverseId,
                menteeConverseId: result.menteeConverseId,
                relationshipType: result.relationshipType,
                assignedBy: req.user.username
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error assigning mentee:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to assign mentee' 
        });
    }
};

/**
 * Remove mentee from mentor (Admin or mentor themselves)
 * DELETE /api/identity/mentor/mentees/:menteeConverseId
 */
export const removeMentee = async (req, res) => {
    try {
        const { menteeConverseId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;
        
        if (!menteeConverseId) {
            throw new CustomError('Mentee converse ID is required', 400);
        }
        
        // Check if user is admin or the actual mentor
        const canRemove = req.user.role === 'admin' || 
                         req.user.role === 'super_admin' ||
                         await mentorIdServices.isMentorOfMentee(userId, menteeConverseId);
        
        if (!canRemove) {
            throw new CustomError('Unauthorized: Must be admin or the assigned mentor', 403);
        }
        
        const result = await mentorIdServices.removeMenteeFromMentor(
            menteeConverseId,
            userId,
            reason
        );
        
        res.status(200).json({
            success: true,
            message: 'Mentee removed successfully',
            removedMentee: result.menteeConverseId,
            removedBy: req.user.username,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error removing mentee:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to remove mentee' 
        });
    }
};

/**
 * Get mentor's assigned classes and mentee distribution
 * GET /api/identity/mentor/classes
 */
export const getMentorClasses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Verify user is a mentor
        const mentorStatus = await mentorIdServices.getMentorStatus(userId);
        if (!mentorStatus.isMentor) {
            throw new CustomError('User is not assigned as a mentor', 403);
        }
        
        const classes = await mentorIdServices.getMentorClassDistribution(userId);
        
        res.status(200).json({
            success: true,
            mentorConverseId: mentorStatus.mentorConverseId,
            totalClasses: classes.length,
            classes: classes.map(classInfo => ({
                classId: classInfo.class_id,
                className: classInfo.class_name,
                menteeCount: classInfo.mentee_count,
                classType: classInfo.class_type,
                isActive: classInfo.is_active
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting mentor classes:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get mentor classes' 
        });
    }
};