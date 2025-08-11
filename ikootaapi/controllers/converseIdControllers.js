// ikootaapi/controllers/converseIdControllers.js
// CONVERSE ID CONTROLLERS - User Identity Privacy Layer
// Handles user's own converse identity operations (NOT revealing converse ID to user)

import converseIdServices from '../services/converseIdServices.js';
import CustomError from '../utils/CustomError.js';

/**
 * Get user's own identity status (WITHOUT revealing converse ID)
 * User sees only their real identity, never their converse ID
 * GET /api/identity/converse
 */
export const getConverseId = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const identityStatus = await converseIdServices.getUserIdentityStatus(userId);
        
        // CRITICAL: Never expose converse ID to the user themselves
        const response = {
            success: true,
            identity: {
                hasMaskedIdentity: identityStatus.hasMaskedIdentity,
                membershipStage: identityStatus.membershipStage,
                isMember: identityStatus.isMember,
                hasAssignedMentor: identityStatus.hasAssignedMentor,
                hasAssignedClass: identityStatus.hasAssignedClass,
                // Show real identity to user themselves
                username: identityStatus.realUsername,
                email: identityStatus.realEmail,
                phone: identityStatus.realPhone,
                avatar: identityStatus.realAvatar
            },
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Error getting converse identity status:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get identity status' 
        });
    }
};

/**
 * Generate converse ID (Admin-only operation)
 * Regular users cannot generate their own converse IDs
 * POST /api/identity/converse/generate
 */
export const generateConverseId = async (req, res) => {
    try {
        // Only admins can generate converse IDs
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required to generate converse IDs', 403);
        }
        
        const { targetUserId } = req.body;
        
        if (!targetUserId) {
            throw new CustomError('Target user ID is required', 400);
        }
        
        const result = await converseIdServices.generateConverseIdForUser(
            targetUserId,
            req.user.id
        );
        
        res.status(201).json({
            success: true,
            message: 'Converse ID generated successfully',
            converseId: result.converseId,
            maskedBy: req.user.username,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error generating converse ID:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to generate converse ID' 
        });
    }
};

/**
 * Update converse identity settings (user's own settings only)
 * PUT /api/identity/converse
 */
export const updateConverseId = async (req, res) => {
    try {
        const userId = req.user.id;
        const { settings } = req.body;
        
        const result = await converseIdServices.updateUserIdentitySettings(userId, settings);
        
        res.status(200).json({
            success: true,
            message: 'Identity settings updated successfully',
            settings: result.settings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating converse identity settings:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to update identity settings' 
        });
    }
};

/**
 * Request identity removal (user can request, admin approves)
 * DELETE /api/identity/converse
 */
export const deleteConverseId = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reason } = req.body;
        
        const result = await converseIdServices.requestIdentityRemoval(userId, reason);
        
        res.status(200).json({
            success: true,
            message: 'Identity removal request submitted',
            requestId: result.requestId,
            note: 'Request will be reviewed by administrators',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error requesting identity removal:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to request identity removal' 
        });
    }
};

/**
 * Get class members (returns only converse identities, never real names)
 * GET /api/identity/converse/class/:classId/members
 */
export const getClassMembers = async (req, res) => {
    try {
        const { classId } = req.params;
        const requestingUserId = req.user.id;
        
        if (!classId) {
            throw new CustomError('Class ID is required', 400);
        }
        
        const members = await converseIdServices.getClassMembersForUser(classId, requestingUserId);
        
        res.status(200).json({
            success: true,
            classId,
            memberCount: members.length,
            members: members.map(member => ({
                converseId: member.converse_id,
                displayName: member.display_name,
                avatar: member.converse_avatar,
                joinedDate: member.joinedAt,
                isOnline: member.isOnline || false
                // NEVER expose real identity
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting class members:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get class members' 
        });
    }
};

/**
 * Get public profile by converse ID (what others see)
 * GET /api/identity/converse/:converseId/profile
 */
export const getPublicProfile = async (req, res) => {
    try {
        const { converseId } = req.params;
        
        if (!converseId) {
            throw new CustomError('Converse ID is required', 400);
        }
        
        const profile = await converseIdServices.getPublicProfileByConverseId(converseId);
        
        res.status(200).json({
            success: true,
            profile: {
                converseId: profile.converseId,
                displayName: profile.displayName,
                avatar: profile.converseAvatar,
                memberSince: profile.memberSince,
                classId: profile.classId,
                // NEVER expose real identity data
                bio: profile.bio || 'No bio available',
                isOnline: profile.isOnline || false
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting public profile:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get public profile' 
        });
    }
};

/**
 * Search users by converse ID (returns masked results only)
 * GET /api/identity/converse/search
 */
export const searchConverseIds = async (req, res) => {
    try {
        const { query, classId, limit = 20 } = req.query;
        
        if (!query || query.length < 2) {
            throw new CustomError('Search query must be at least 2 characters', 400);
        }
        
        const results = await converseIdServices.searchConverseIdentities(
            query, 
            classId, 
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            query,
            resultCount: results.length,
            results: results.map(result => ({
                converseId: result.converse_id,
                displayName: result.display_name,
                avatar: result.converse_avatar,
                classId: result.class_id,
                memberSince: result.memberSince
                // NEVER expose real identity
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error searching converse IDs:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to search converse identities' 
        });
    }
};

/**
 * Get user's conversation/messaging privacy settings
 * GET /api/identity/converse/privacy
 */
export const getPrivacySettings = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const settings = await converseIdServices.getUserPrivacySettings(userId);
        
        res.status(200).json({
            success: true,
            privacy: {
                allowDirectMessages: settings.allowDirectMessages,
                allowClassMessages: settings.allowClassMessages,
                allowMentorContact: settings.allowMentorContact,
                showOnlineStatus: settings.showOnlineStatus,
                allowProfileViewing: settings.allowProfileViewing
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting privacy settings:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get privacy settings' 
        });
    }
};

/**
 * Update user's privacy settings
 * PUT /api/identity/converse/privacy
 */
export const updatePrivacySettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { privacySettings } = req.body;
        
        if (!privacySettings) {
            throw new CustomError('Privacy settings are required', 400);
        }
        
        const result = await converseIdServices.updateUserPrivacySettings(userId, privacySettings);
        
        res.status(200).json({
            success: true,
            message: 'Privacy settings updated successfully',
            settings: result.settings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating privacy settings:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to update privacy settings' 
        });
    }
};

/**
 * Get user's messaging/communication preferences
 * GET /api/identity/converse/preferences
 */
export const getCommunicationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const preferences = await converseIdServices.getUserCommunicationPreferences(userId);
        
        res.status(200).json({
            success: true,
            preferences: {
                emailNotifications: preferences.emailNotifications,
                smsNotifications: preferences.smsNotifications,
                contentNotifications: preferences.contentNotifications,
                surveyNotifications: preferences.surveyNotifications,
                adminNotifications: preferences.adminNotifications,
                preferredLanguage: preferences.preferredLanguage,
                timezone: preferences.timezone
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting communication preferences:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get communication preferences' 
        });
    }
};

/**
 * Update communication preferences
 * PUT /api/identity/converse/preferences
 */
export const updateCommunicationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;
        
        if (!preferences) {
            throw new CustomError('Communication preferences are required', 400);
        }
        
        const result = await converseIdServices.updateUserCommunicationPreferences(userId, preferences);
        
        res.status(200).json({
            success: true,
            message: 'Communication preferences updated successfully',
            preferences: result.preferences,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating communication preferences:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to update communication preferences' 
        });
    }
};