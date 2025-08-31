// ikootaapi/controllers/identityAdminControllers.js
// IDENTITY ADMIN CONTROLLERS - Super Admin Identity Management
// Handles identity masking, unmasking, and identity administration

import identityAdminServices from '../services/identityAdminServices.js';
import converseIdServices from '../services/converseIdServices.js';
import mentorIdServices from '../services/mentorIdServices.js';
import CustomError from '../utils/CustomError.js';

/**
 * Mask user identity when granting membership (Admin-only)
 * This is the core identity masking operation
 * POST /api/admin/identity/mask-identity
 */
export const maskUserIdentity = async (req, res) => {
    try {
        const { userId, mentorConverseId, classId, reason } = req.body;
        
        // Only admins can mask identities
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required', 403);
        }
        
        if (!userId || !classId) {
            throw new CustomError('User ID and Class ID are required', 400);
        }
        
        const result = await identityAdminServices.maskUserIdentity(
            userId,
            req.user.converse_id || req.user.username, // Admin identifier
            mentorConverseId,
            classId,
            reason
        );
        
        res.status(200).json({
            success: true,
            message: 'User identity masked successfully',
            result: {
                converseId: result.converseId,
                converseAvatar: result.converseAvatar,
                mentorAssigned: result.mentorId,
                classAssigned: result.classId,
                maskedBy: req.user.username
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error masking user identity:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to mask user identity' 
        });
    }
};

/**
 * Unmask user identity (Super Admin only)
 * Reveals real identity behind converse ID
 * POST /api/admin/identity/unmask
 */
export const unmaskUserIdentity = async (req, res) => {
    try {
        const { converseId, reason } = req.body;
        
        // Only super admins can unmask identities
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        if (!converseId) {
            throw new CustomError('Converse ID is required', 400);
        }
        
        const result = await identityAdminServices.unmaskUserIdentity(
            converseId,
            req.user.converse_id || req.user.username,
            reason
        );
        
        res.status(200).json({
            success: true,
            message: 'User identity unmasked successfully',
            identity: {
                converseId: result.converseId,
                originalUsername: result.originalUsername,
                originalEmail: result.originalEmail,
                originalPhone: result.originalPhone,
                memberSince: result.memberSince,
                lastActivity: result.lastActivity
            },
            unmaskedBy: req.user.username,
            reason: reason || 'Administrative review',
            timestamp: new Date().toISOString(),
            warning: 'This operation has been logged for security purposes'
        });
    } catch (error) {
        console.error('❌ Error unmasking user identity:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to unmask user identity' 
        });
    }
};

/**
 * Get identity masking audit trail (Super Admin only)
 * GET /api/admin/identity/audit-trail
 */
export const getIdentityAuditTrail = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const { page = 1, limit = 50, userId, converseId, adminId } = req.query;
        
        const auditTrail = await identityAdminServices.getIdentityAuditTrail({
            page: parseInt(page),
            limit: parseInt(limit),
            userId,
            converseId,
            adminId
        });
        
        res.status(200).json({
            success: true,
            message: 'Identity audit trail retrieved',
            pagination: auditTrail.pagination,
            auditEntries: auditTrail.entries.map(entry => ({
                id: entry.id,
                userId: entry.user_id,
                converseId: entry.converse_id,
                originalUsername: entry.original_username,
                maskedByAdmin: entry.masked_by_admin_id,
                reason: entry.reason,
                timestamp: entry.createdAt,
                action: 'identity_masked'
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting identity audit trail:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get identity audit trail' 
        });
    }
};

/**
 * Get all masked identities overview (Super Admin only)
 * GET /api/admin/identity/overview
 */
export const getIdentityOverview = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const overview = await identityAdminServices.getIdentityOverview();
        
        res.status(200).json({
            success: true,
            message: 'Identity overview retrieved',
            overview: {
                totalMaskedUsers: overview.totalMaskedUsers,
                totalUnmaskedUsers: overview.totalUnmaskedUsers,
                totalMentorRelationships: overview.totalMentorRelationships,
                totalClasses: overview.totalClasses,
                recentMaskingActions: overview.recentMaskingActions,
                privacyMetrics: overview.privacyMetrics
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting identity overview:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get identity overview' 
        });
    }
};

/**
 * Search masked identities (Super Admin only)
 * GET /api/admin/identity/search
 */
export const searchMaskedIdentities = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const { query, searchType = 'all', page = 1, limit = 20 } = req.query;
        
        if (!query || query.length < 2) {
            throw new CustomError('Search query must be at least 2 characters', 400);
        }
        
        const results = await identityAdminServices.searchMaskedIdentities({
            query,
            searchType, // 'converse_id', 'original_username', 'email', 'all'
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
        res.status(200).json({
            success: true,
            message: 'Identity search completed',
            searchQuery: query,
            searchType,
            pagination: results.pagination,
            results: results.identities.map(identity => ({
                userId: identity.user_id,
                converseId: identity.converse_id,
                originalUsername: identity.original_username,
                originalEmail: identity.original_email,
                memberSince: identity.member_since,
                lastActivity: identity.last_activity,
                mentorId: identity.mentor_id,
                classId: identity.class_id
            })),
            timestamp: new Date().toISOString(),
            warning: 'This sensitive data is only visible to Super Admins'
        });
    } catch (error) {
        console.error('❌ Error searching masked identities:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to search masked identities' 
        });
    }
};

/**
 * Generate bulk converse IDs (Admin-only)
 * POST /api/admin/identity/generate-bulk-ids
 */
export const generateBulkConverseIds = async (req, res) => {
    try {
        const { count, purpose } = req.body;
        
        // Only admins can generate bulk IDs
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required', 403);
        }
        
        if (!count || count < 1 || count > 100) {
            throw new CustomError('Count must be between 1 and 100', 400);
        }
        
        const result = await identityAdminServices.generateBulkConverseIds(
            count,
            req.user.id,
            purpose
        );
        
        res.status(201).json({
            success: true,
            message: `${count} converse IDs generated successfully`,
            generatedIds: result.converseIds,
            generatedBy: req.user.username,
            purpose: purpose || 'Bulk generation',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error generating bulk converse IDs:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to generate bulk converse IDs' 
        });
    }
};

/**
 * Verify identity integrity (Super Admin only)
 * GET /api/admin/identity/verify-integrity
 */
export const verifyIdentityIntegrity = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const integrityCheck = await identityAdminServices.verifyIdentityIntegrity();
        
        res.status(200).json({
            success: true,
            message: 'Identity integrity verification completed',
            integrity: {
                totalChecked: integrityCheck.totalChecked,
                integrityPassed: integrityCheck.integrityPassed,
                issuesFound: integrityCheck.issuesFound,
                orphanedProfiles: integrityCheck.orphanedProfiles,
                duplicateConverseIds: integrityCheck.duplicateConverseIds,
                missingEncryption: integrityCheck.missingEncryption
            },
            recommendations: integrityCheck.recommendations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error verifying identity integrity:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to verify identity integrity' 
        });
    }
};

/**
 * Get mentor assignment analytics (Admin only)
 * GET /api/admin/identity/mentor-analytics
 */
export const getMentorAnalytics = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required', 403);
        }
        
        const analytics = await identityAdminServices.getMentorAnalytics();
        
        res.status(200).json({
            success: true,
            message: 'Mentor analytics retrieved',
            analytics: {
                totalMentors: analytics.totalMentors,
                activeMentors: analytics.activeMentors,
                totalMentees: analytics.totalMentees,
                unassignedMembers: analytics.unassignedMembers,
                averageMenteesPerMentor: analytics.averageMenteesPerMentor,
                mentorshipDistribution: analytics.mentorshipDistribution,
                classDistribution: analytics.classDistribution
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting mentor analytics:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get mentor analytics' 
        });
    }
};

/**
 * Bulk assign mentors to mentees (Admin only)
 * POST /api/admin/identity/bulk-assign-mentors
 */
export const bulkAssignMentors = async (req, res) => {
    try {
        const { assignments, autoAssign = false } = req.body;
        
        // Only admins can bulk assign mentors
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required', 403);
        }
        
        if (!assignments || (!Array.isArray(assignments) && !autoAssign)) {
            throw new CustomError('Assignments array required or set autoAssign to true', 400);
        }
        
        const result = await identityAdminServices.bulkAssignMentors(
            assignments,
            req.user.id,
            autoAssign
        );
        
        res.status(200).json({
            success: true,
            message: 'Bulk mentor assignment completed',
            results: {
                successful: result.successful,
                failed: result.failed,
                totalProcessed: result.totalProcessed,
                assignments: result.assignments
            },
            assignedBy: req.user.username,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error bulk assigning mentors:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to bulk assign mentors' 
        });
    }
};

/**
 * Get identity management dashboard data (Admin only)
 * GET /api/admin/identity/dashboard
 */
export const getIdentityDashboard = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required', 403);
        }
        
        const dashboard = await identityAdminServices.getIdentityDashboard();
        
        res.status(200).json({
            success: true,
            message: 'Identity dashboard data retrieved',
            dashboard: {
                overview: dashboard.overview,
                recentActivity: dashboard.recentActivity,
                mentorshipMetrics: dashboard.mentorshipMetrics,
                classDistribution: dashboard.classDistribution,
                pendingActions: dashboard.pendingActions
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting identity dashboard:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get identity dashboard' 
        });
    }
};

/**
 * Export identity data (Super Admin only)
 * GET /api/admin/identity/export
 */
export const exportIdentityData = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const { format = 'json', includePersonalData = false } = req.query;
        
        const exportData = await identityAdminServices.exportIdentityData({
            format,
            includePersonalData: includePersonalData === 'true',
            exportedBy: req.user.id
        });
        
        // Set appropriate headers for file download
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=identity_export.csv');
            res.status(200).send(exportData.data);
        } else {
            res.status(200).json({
                success: true,
                message: 'Identity data exported successfully',
                export: {
                    totalRecords: exportData.totalRecords,
                    exportedAt: exportData.exportedAt,
                    exportedBy: req.user.username,
                    includesPersonalData: includePersonalData,
                    data: exportData.data
                },
                timestamp: new Date().toISOString(),
                warning: 'This export contains sensitive data - handle with care'
            });
        }
    } catch (error) {
        console.error('❌ Error exporting identity data:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to export identity data' 
        });
    }
};

/**
 * Manage mentor assignments (Admin only)
 * PUT /api/admin/identity/mentor-assignments/:menteeConverseId
 */
export const manageMentorAssignment = async (req, res) => {
    try {
        const { menteeConverseId } = req.params;
        const { mentorConverseId, action, reason } = req.body;
        
        // Only admins can manage mentor assignments
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Admin access required', 403);
        }
        
        if (!menteeConverseId) {
            throw new CustomError('Mentee converse ID is required', 400);
        }
        
        let result;
        
        switch (action) {
            case 'assign':
                if (!mentorConverseId) {
                    throw new CustomError('Mentor converse ID is required for assignment', 400);
                }
                result = await identityAdminServices.assignMentorToMentee(
                    mentorConverseId,
                    menteeConverseId,
                    req.user.id,
                    reason
                );
                break;
                
            case 'remove':
                result = await identityAdminServices.removeMentorFromMentee(
                    menteeConverseId,
                    req.user.id,
                    reason
                );
                break;
                
            case 'reassign':
                if (!mentorConverseId) {
                    throw new CustomError('New mentor converse ID is required for reassignment', 400);
                }
                result = await identityAdminServices.reassignMentor(
                    menteeConverseId,
                    mentorConverseId,
                    req.user.id,
                    reason
                );
                break;
                
            default:
                throw new CustomError('Invalid action. Must be: assign, remove, or reassign', 400);
        }
        
        res.status(200).json({
            success: true,
            message: `Mentor ${action} completed successfully`,
            result: {
                menteeConverseId,
                mentorConverseId: result.mentorConverseId,
                action,
                managedBy: req.user.username
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error managing mentor assignment:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to manage mentor assignment' 
        });
    }
};

/**
 * Generate unique converse ID (Admin utility)
 * POST /api/admin/identity/generate-converse-id
 */
// export const generateUniqueConverseId = async (req, res) => {
//     try {
//         // Only admins can generate converse IDs
//         if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
//             throw new CustomError('Unauthorized: Admin access required', 403);
//         }
        
//         const { purpose, count = 1 } = req.body;
        
//         if (count > 50) {
//             throw new CustomError('Cannot generate more than 50 IDs at once', 400);
//         }
        
//         const result = await identityAdminServices.generateUniqueConverseIds(
//             count,
//             req.user.id,
//             purpose
//         );
        
//         res.status(201).json({
//             success: true,
//             message: `${count} unique converse ID(s) generated`,
//             converseIds: result.converseIds,
//             generatedBy: req.user.username,
//             purpose: purpose || 'Administrative use',
//             timestamp: new Date().toISOString()
//         });
//     } catch (error) {
//         console.error('❌ Error generating unique converse ID:', error);
//         res.status(error.statusCode || 500).json({ 
//             success: false,
//             error: error.message || 'Failed to generate unique converse ID' 
//         });
//     }
// };

/**
 * Get user's complete identity record (Super Admin only)
 * GET /api/admin/identity/user/:userId/complete
 */
export const getCompleteUserIdentity = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const { userId } = req.params;
        
        if (!userId) {
            throw new CustomError('User ID is required', 400);
        }
        
        const identity = await identityAdminServices.getCompleteUserIdentity(userId);
        
        res.status(200).json({
            success: true,
            message: 'Complete user identity retrieved',
            identity: {
                userId: identity.userId,
                converseId: identity.converseId,
                realIdentity: {
                    username: identity.originalUsername,
                    email: identity.originalEmail,
                    phone: identity.originalPhone
                },
                membershipInfo: {
                    memberSince: identity.memberSince,
                    membershipStage: identity.membershipStage,
                    isMember: identity.isMember
                },
                relationships: {
                    mentorId: identity.mentorId,
                    mentees: identity.mentees,
                    classId: identity.classId
                },
                activity: {
                    lastActive: identity.lastActive,
                    totalLogins: identity.totalLogins,
                    contentCreated: identity.contentCreated
                }
            },
            accessedBy: req.user.username,
            timestamp: new Date().toISOString(),
            warning: 'This data contains personally identifiable information'
        });
    } catch (error) {
        console.error('❌ Error getting complete user identity:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to get complete user identity' 
        });
    }
};

/**
 * Update identity masking settings (Super Admin only)
 * PUT /api/admin/identity/masking-settings
 */
export const updateMaskingSettings = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            throw new CustomError('Unauthorized: Super Admin access required', 403);
        }
        
        const { settings } = req.body;
        
        if (!settings) {
            throw new CustomError('Masking settings are required', 400);
        }
        
        const result = await identityAdminServices.updateMaskingSettings(
            settings,
            req.user.id
        );
        
        res.status(200).json({
            success: true,
            message: 'Identity masking settings updated successfully',
            settings: result.settings,
            updatedBy: req.user.username,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error updating masking settings:', error);
        res.status(error.statusCode || 500).json({ 
            success: false,
            error: error.message || 'Failed to update masking settings' 
        });
    }
};