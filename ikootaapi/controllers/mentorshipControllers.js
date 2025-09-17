// ikootaapi/controllers/mentorshipControllers.js
// MENTORSHIP ADMIN CONTROLLERS
// Admin operations for mentor-mentee assignments and management

import mentorshipServices from '../services/mentorshipServices.js';
import SimpleMentorshipServices from '../services/mentorshipServicesSimple.js';
import CustomError from '../utils/CustomError.js';
import db from '../config/db.js';

// =================================================================
// ADMIN ASSIGNMENT OPERATIONS
// =================================================================

/**
 * Find available mentors for assignment
 * GET /api/admin/mentorship/available-mentors
 */
export const getAvailableMentors = async (req, res) => {
    try {
        // Only admins can access this endpoint
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required', 403);
        }

        const {
            preferred_level,
            max_results = 20,
            min_slots = 1,
            include_performance = true
        } = req.query;

        const criteria = {
            preferredLevel: preferred_level ? parseInt(preferred_level) : null,
            maxResults: parseInt(max_results),
            minSlots: parseInt(min_slots),
            includePerformance: include_performance === 'true'
        };

        const availableMentors = await mentorshipServices.findAvailableMentors(criteria);

        res.status(200).json({
            success: true,
            data: availableMentors,
            count: availableMentors.length,
            filters: criteria,
            message: 'Available mentors retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error getting available mentors:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to get available mentors'
        });
    }
};

/**
 * Assign mentee to mentor
 * POST /api/admin/mentorship/assign
 */
export const assignMenteeToMentor = async (req, res) => {
    try {
        // Only admins can perform assignments
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required for mentorship assignments', 403);
        }

        const {
            mentor_converse_id,
            mentee_converse_id,
            assignment_reason,
            notify_users = true
        } = req.body;

        // Validate required fields
        if (!mentor_converse_id || !mentee_converse_id || !assignment_reason) {
            throw new CustomError('Mentor ID, mentee ID, and assignment reason are required', 400);
        }

        // Validate converse ID format
        const converseIdPattern = /^OTO#[A-Z0-9]{6}$/;
        if (!converseIdPattern.test(mentor_converse_id)) {
            throw new CustomError('Invalid mentor converse ID format', 400);
        }
        if (!converseIdPattern.test(mentee_converse_id)) {
            throw new CustomError('Invalid mentee converse ID format', 400);
        }

        const assignmentResult = await mentorshipServices.assignMenteeToMentor(
            mentor_converse_id,
            mentee_converse_id,
            req.user.converse_id,
            assignment_reason
        );

        // Log the admin action
        console.log(`✅ Mentorship Assignment: ${req.user.username} assigned ${mentee_converse_id} to ${mentor_converse_id}`);
        console.log(`📋 Assignment Ref: ${assignmentResult.assignmentRef}`);
        console.log(`👥 Family Position: #${assignmentResult.familyPosition}`);

        // TODO: Send notifications if notify_users is true
        // This would integrate with your notification system
        if (notify_users) {
            // await notificationService.notifyMentorshipAssignment(assignmentResult);
        }

        res.status(201).json({
            success: true,
            data: assignmentResult,
            message: `Mentee successfully assigned to ${assignmentResult.mentorTitle}`,
            admin_action: {
                performed_by: req.user.username,
                admin_converse_id: req.user.converse_id,
                timestamp: new Date().toISOString(),
                action_type: 'MENTORSHIP_ASSIGNMENT'
            }
        });

    } catch (error) {
        console.error('❌ Error assigning mentee to mentor:', error);
        
        // Log failed assignment attempt
        console.log(`❌ Failed Assignment: ${req.user?.username} attempted to assign ${req.body.mentee_converse_id} to ${req.body.mentor_converse_id}`);
        console.log(`❌ Error: ${error.message}`);

        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to assign mentee to mentor',
            admin_action: {
                performed_by: req.user?.username,
                attempted_at: new Date().toISOString(),
                action_type: 'MENTORSHIP_ASSIGNMENT_FAILED'
            }
        });
    }
};

/**
 * Reassign mentee to different mentor
 * POST /api/admin/mentorship/reassign
 */
export const reassignMentee = async (req, res) => {
    try {
        // Only admins can perform reassignments
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required for mentorship reassignments', 403);
        }

        const {
            mentee_converse_id,
            new_mentor_converse_id,
            reassignment_reason,
            notify_users = true,
            requires_approval = false
        } = req.body;

        // Validate required fields
        if (!mentee_converse_id || !new_mentor_converse_id || !reassignment_reason) {
            throw new CustomError('Mentee ID, new mentor ID, and reassignment reason are required', 400);
        }

        // Super Admin check for sensitive reassignments
        if (requires_approval && req.user.role !== 'super_admin') {
            throw new CustomError('Super Admin approval required for this type of reassignment', 403);
        }

        const reassignmentResult = await mentorshipServices.reassignMentee(
            mentee_converse_id,
            new_mentor_converse_id,
            req.user.converse_id,
            reassignment_reason
        );

        // Log the admin action
        console.log(`🔄 Mentorship Reassignment: ${req.user.username} reassigned ${mentee_converse_id}`);
        console.log(`📋 From: ${reassignmentResult.oldMentor.converseId} to ${reassignmentResult.newMentor.converseId}`);
        console.log(`📋 Reassignment Ref: ${reassignmentResult.reassignmentRef}`);

        res.status(200).json({
            success: true,
            data: reassignmentResult,
            message: 'Mentee successfully reassigned',
            admin_action: {
                performed_by: req.user.username,
                admin_converse_id: req.user.converse_id,
                timestamp: new Date().toISOString(),
                action_type: 'MENTORSHIP_REASSIGNMENT'
            }
        });

    } catch (error) {
        console.error('❌ Error reassigning mentee:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to reassign mentee',
            admin_action: {
                performed_by: req.user?.username,
                attempted_at: new Date().toISOString(),
                action_type: 'MENTORSHIP_REASSIGNMENT_FAILED'
            }
        });
    }
};

/**
 * Remove mentee from mentorship system
 * POST /api/admin/mentorship/remove
 */
export const removeMenteeFromMentorship = async (req, res) => {
    try {
        // Only admins can remove mentees
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required to remove mentees from mentorship', 403);
        }

        const {
            mentee_converse_id,
            removal_reason,
            removal_type = 'graduation',
            notify_users = true
        } = req.body;

        // Validate required fields
        if (!mentee_converse_id || !removal_reason) {
            throw new CustomError('Mentee ID and removal reason are required', 400);
        }

        // Validate removal type
        const validRemovalTypes = ['graduation', 'dismissal', 'voluntary_exit', 'transfer', 'promotion'];
        if (!validRemovalTypes.includes(removal_type)) {
            throw new CustomError(`Invalid removal type. Must be one of: ${validRemovalTypes.join(', ')}`, 400);
        }

        const removalResult = await mentorshipServices.removeMenteeFromMentorship(
            mentee_converse_id,
            req.user.converse_id,
            removal_reason,
            removal_type
        );

        // Log the admin action
        console.log(`🚪 Mentorship Removal: ${req.user.username} removed ${mentee_converse_id} (${removal_type})`);
        console.log(`📋 Removal Ref: ${removalResult.removalRef}`);

        res.status(200).json({
            success: true,
            data: removalResult,
            message: `Mentee successfully removed from mentorship (${removal_type})`,
            admin_action: {
                performed_by: req.user.username,
                admin_converse_id: req.user.converse_id,
                timestamp: new Date().toISOString(),
                action_type: 'MENTORSHIP_REMOVAL'
            }
        });

    } catch (error) {
        console.error('❌ Error removing mentee from mentorship:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to remove mentee from mentorship',
            admin_action: {
                performed_by: req.user?.username,
                attempted_at: new Date().toISOString(),
                action_type: 'MENTORSHIP_REMOVAL_FAILED'
            }
        });
    }
};

// =================================================================
// MENTORSHIP OVERVIEW AND STATISTICS
// =================================================================

/**
 * Get comprehensive mentorship system statistics
 * GET /api/admin/mentorship/statistics
 */
export const getMentorshipStatistics = async (req, res) => {
    try {
        // Only admins can view system statistics
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required to view mentorship statistics', 403);
        }

        const statistics = await mentorshipServices.getMentorshipSystemStats();

        res.status(200).json({
            success: true,
            data: statistics,
            generated_at: new Date().toISOString(),
            generated_by: req.user.username,
            message: 'Mentorship system statistics retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error getting mentorship statistics:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to get mentorship statistics'
        });
    }
};

/**
 * Search for mentees in the system
 * GET /api/admin/mentorship/search-mentees
 */
export const searchMentees = async (req, res) => {
    try {
        // Only admins can search mentees
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required', 403);
        }

        const {
            search_term,
            has_mentor,
            mentor_level,
            family_position,
            limit = 50
        } = req.query;

        let query = `
            SELECT 
                u.converse_id as mentee_converse_id,
                u.username as mentee_username,
                u.membership_stage,
                u.createdAt as member_since,
                mh.mentor_converse_id,
                mh.mentor_level,
                mh.family_position,
                mh.established_date,
                mf.family_name,
                mf.family_identifier,
                CASE mh.mentor_level
                    WHEN 5 THEN 'Grand Master'
                    WHEN 4 THEN 'Master Mentor'
                    WHEN 3 THEN 'Senior Mentor'
                    WHEN 2 THEN 'Advanced Mentor'
                    WHEN 1 THEN 'Foundation Mentor'
                    ELSE 'No Mentor'
                END as mentor_title,
                CASE 
                    WHEN mh.mentee_converse_id IS NOT NULL THEN 'Assigned'
                    ELSE 'Unassigned'
                END as mentorship_status
            FROM users u
            LEFT JOIN mentorship_hierarchy mh ON u.converse_id = mh.mentee_converse_id AND mh.is_active = 1
            LEFT JOIN mentorship_families mf ON mh.family_group_id = mf.family_identifier
            WHERE u.is_identity_masked = 1
        `;

        const params = [];

        if (search_term) {
            query += ` AND (u.converse_id LIKE ? OR u.username LIKE ?)`;
            params.push(`%${search_term}%`, `%${search_term}%`);
        }

        if (has_mentor === 'true') {
            query += ` AND mh.mentee_converse_id IS NOT NULL`;
        } else if (has_mentor === 'false') {
            query += ` AND mh.mentee_converse_id IS NULL`;
        }

        if (mentor_level) {
            query += ` AND mh.mentor_level = ?`;
            params.push(parseInt(mentor_level));
        }

        if (family_position) {
            query += ` AND mh.family_position = ?`;
            params.push(parseInt(family_position));
        }

        query += ` ORDER BY u.createdAt DESC LIMIT ?`;
        params.push(parseInt(limit));

        const mentees = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: mentees,
            count: mentees.length,
            search_criteria: {
                search_term,
                has_mentor,
                mentor_level,
                family_position,
                limit
            },
            message: 'Mentee search completed successfully'
        });

    } catch (error) {
        console.error('❌ Error searching mentees:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to search mentees'
        });
    }
};

/**
 * Get detailed mentor information
 * GET /api/admin/mentorship/mentor/:mentorConverseId
 */
export const getMentorDetails = async (req, res) => {
    try {
        // Only admins can view detailed mentor info
        if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
            throw new CustomError('Admin access required', 403);
        }

        const { mentorConverseId } = req.params;

        if (!mentorConverseId) {
            throw new CustomError('Mentor converse ID is required', 400);
        }

        // Get mentor details with family and capacity info
        const mentorDetails = await db.query(`
            SELECT 
                mct.*,
                mf.family_name,
                mf.family_identifier,
                mf.member_count,
                mf.family_motto,
                mf.established_date as family_established,
                u.username as mentor_username,
                u.membership_stage,
                u.createdAt as member_since,
                CASE mct.mentor_level
                    WHEN 5 THEN 'Grand Master'
                    WHEN 4 THEN 'Master Mentor'
                    WHEN 3 THEN 'Senior Mentor'
                    WHEN 2 THEN 'Advanced Mentor'
                    WHEN 1 THEN 'Foundation Mentor'
                END as mentor_title
            FROM mentor_capacity_tracking mct
            LEFT JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id AND mf.is_active = 1
            LEFT JOIN users u ON mct.mentor_converse_id = u.converse_id
            WHERE mct.mentor_converse_id = ?
        `, [mentorConverseId]);

        if (!mentorDetails.length) {
            throw new CustomError('Mentor not found', 404);
        }

        const mentor = mentorDetails[0];

        // Get family members
        const familyMembers = await db.query(`
            SELECT 
                mh.mentee_converse_id,
                mh.family_position,
                mh.established_date,
                mh.assignment_reason,
                u.username as mentee_username,
                u.membership_stage,
                DATEDIFF(NOW(), mh.established_date) as days_under_mentorship
            FROM mentorship_hierarchy mh
            LEFT JOIN users u ON mh.mentee_converse_id = u.converse_id
            WHERE mh.mentor_converse_id = ? 
              AND mh.relationship_type = 'direct_family'
              AND mh.is_active = 1
            ORDER BY mh.family_position
        `, [mentorConverseId]);

        // Get recent assignments
        const recentAssignments = await db.query(`
            SELECT 
                mah.*,
                u.username as admin_username
            FROM mentorship_assignment_history mah
            LEFT JOIN users u ON mah.assigned_by = u.converse_id
            WHERE mah.new_mentor_converse_id = ? OR mah.old_mentor_converse_id = ?
            ORDER BY mah.assignment_date DESC
            LIMIT 10
        `, [mentorConverseId, mentorConverseId]);

        res.status(200).json({
            success: true,
            data: {
                mentor: mentor,
                familyMembers: familyMembers,
                recentAssignments: recentAssignments,
                summary: {
                    totalMentees: mentor.direct_slots_filled,
                    availableSlots: mentor.direct_slots_available,
                    familySize: mentor.member_count || 0,
                    performanceScore: mentor.performance_score,
                    workloadStatus: mentor.monthly_assignments >= 15 ? 'Heavy' : 
                                  mentor.monthly_assignments >= 10 ? 'Moderate' : 'Light'
                }
            },
            message: 'Mentor details retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error getting mentor details:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to get mentor details'
        });
    }
};

// =================================================================
// BATCH OPERATIONS
// =================================================================

/**
 * Batch assign multiple mentees to mentors
 * POST /api/admin/mentorship/batch-assign
 */
export const batchAssignMentees = async (req, res) => {
    try {
        // Only super admins can perform batch operations
        if (!req.user || req.user.role !== 'super_admin') {
            throw new CustomError('Super Admin access required for batch operations', 403);
        }

        const {
            assignments, // Array of {mentor_converse_id, mentee_converse_id, reason}
            notify_users = true
        } = req.body;

        if (!Array.isArray(assignments) || assignments.length === 0) {
            throw new CustomError('Assignments array is required and must not be empty', 400);
        }

        if (assignments.length > 50) {
            throw new CustomError('Maximum 50 assignments per batch operation', 400);
        }

        const results = [];
        const errors = [];

        // Process each assignment
        for (const assignment of assignments) {
            try {
                const result = await mentorshipServices.assignMenteeToMentor(
                    assignment.mentor_converse_id,
                    assignment.mentee_converse_id,
                    req.user.converse_id,
                    assignment.reason || 'Batch assignment operation'
                );
                results.push({
                    ...result,
                    original_request: assignment
                });
            } catch (error) {
                errors.push({
                    assignment: assignment,
                    error: error.message
                });
            }
        }

        // Log batch operation
        console.log(`📦 Batch Assignment: ${req.user.username} processed ${assignments.length} assignments`);
        console.log(`✅ Successful: ${results.length}, ❌ Failed: ${errors.length}`);

        res.status(200).json({
            success: true,
            data: {
                successful: results,
                failed: errors,
                summary: {
                    total_requested: assignments.length,
                    successful: results.length,
                    failed: errors.length,
                    success_rate: ((results.length / assignments.length) * 100).toFixed(1) + '%'
                }
            },
            message: `Batch assignment completed: ${results.length}/${assignments.length} successful`,
            admin_action: {
                performed_by: req.user.username,
                admin_converse_id: req.user.converse_id,
                timestamp: new Date().toISOString(),
                action_type: 'BATCH_MENTORSHIP_ASSIGNMENT'
            }
        });

    } catch (error) {
        console.error('❌ Error in batch assignment:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to process batch assignments'
        });
    }
};

// =================================================================
// SIMPLE CONTROLLER METHODS (MERGED FROM SIMPLE CONTROLLER)
// =================================================================

class SimpleMentorshipController {
    /**
     * Get available mentors
     */
    async getAvailableMentorsSimple(req, res, next) {
        try {
            const { preferredLevel, maxResults = 10, minSlots = 1 } = req.query;

            const criteria = {
                preferredLevel: preferredLevel ? parseInt(preferredLevel) : null,
                maxResults: parseInt(maxResults),
                minSlots: parseInt(minSlots)
            };

            const mentors = await SimpleMentorshipServices.findAvailableMentors(criteria);

            res.status(200).json({
                success: true,
                data: {
                    mentors,
                    count: mentors.length,
                    criteria
                },
                message: `Found ${mentors.length} available mentors`
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Assign mentee to mentor
     */
    async assignMenteeToMentorSimple(req, res, next) {
        try {
            const { mentorConverseId, menteeConverseId, reason } = req.body;
            const assignedBy = req.user.converse_id;

            // Validate input
            if (!mentorConverseId || !menteeConverseId || !reason) {
                throw new CustomError('Missing required fields: mentorConverseId, menteeConverseId, reason', 400);
            }

            const result = await SimpleMentorshipServices.assignMenteeToMentor(
                mentorConverseId,
                menteeConverseId,
                assignedBy,
                reason
            );

            res.status(201).json({
                success: true,
                data: result,
                message: `Successfully assigned ${menteeConverseId} to mentor ${mentorConverseId}`
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Reassign mentee to new mentor
     */
    async reassignMenteeSimple(req, res, next) {
        try {
            const { menteeConverseId, newMentorConverseId, reason } = req.body;
            const assignedBy = req.user.converse_id;

            // Validate input
            if (!menteeConverseId || !newMentorConverseId || !reason) {
                throw new CustomError('Missing required fields: menteeConverseId, newMentorConverseId, reason', 400);
            }

            const result = await SimpleMentorshipServices.reassignMentee(
                menteeConverseId,
                newMentorConverseId,
                assignedBy,
                reason
            );

            res.status(200).json({
                success: true,
                data: result,
                message: `Successfully reassigned ${menteeConverseId} to mentor ${newMentorConverseId}`
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get system statistics
     */
    async getSystemStatistics(req, res, next) {
        try {
            const stats = await SimpleMentorshipServices.getSystemStatistics();

            res.status(200).json({
                success: true,
                data: stats,
                message: 'System statistics retrieved successfully'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Get mentorship hierarchy
     */
    async getMentorshipHierarchy(req, res, next) {
        try {
            const { mentorConverseId } = req.params;
            
            // Simple query to get mentor's mentees
            const mentees = await db.query(`
                SELECT 
                    mentee_converse_id,
                    mentor_level,
                    family_position,
                    established_date,
                    is_active
                FROM mentorship_hierarchy
                WHERE mentor_converse_id = ? AND is_active = 1
                ORDER BY family_position
            `, [mentorConverseId]);

            res.status(200).json({
                success: true,
                data: {
                    mentorConverseId,
                    mentees,
                    familySize: mentees.length
                },
                message: `Retrieved hierarchy for mentor ${mentorConverseId}`
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Health check for mentorship system
     */
    async healthCheck(req, res, next) {
        try {
            const stats = await SimpleMentorshipServices.getSystemStatistics();
            
            res.status(200).json({
                success: true,
                system: 'Mentorship System',
                status: 'operational',
                timestamp: new Date().toISOString(),
                data: {
                    ...stats,
                    endpoints: [
                        'GET /api/admin/mentorship/mentors/available',
                        'POST /api/admin/mentorship/assign',
                        'POST /api/admin/mentorship/reassign',
                        'GET /api/admin/mentorship/statistics',
                        'GET /api/admin/mentorship/hierarchy/:mentorConverseId'
                    ]
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

// =================================================================
// USER ASSIGNMENTS OPERATIONS
// =================================================================

/**
 * Get user's mentorship assignments
 * GET /api/users/mentorship/assignments
 */
export const getUserAssignments = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await mentorshipServices.getUserAssignments(userId);

        res.status(200).json({
            success: true,
            data: result.data,
            message: 'Mentorship assignments retrieved successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ getUserAssignments controller error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mentorship assignments',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Create instance for simple controller methods
const simpleMentorshipController = new SimpleMentorshipController();

export default {
    getAvailableMentors,
    assignMenteeToMentor,
    reassignMentee,
    removeMenteeFromMentorship,
    getMentorshipStatistics,
    searchMentees,
    getMentorDetails,
    batchAssignMentees,
    getUserAssignments,
    // Simple controller methods
    getAvailableMentorsSimple: simpleMentorshipController.getAvailableMentorsSimple,
    assignMenteeToMentorSimple: simpleMentorshipController.assignMenteeToMentorSimple,
    reassignMenteeSimple: simpleMentorshipController.reassignMenteeSimple,
    getSystemStatistics: simpleMentorshipController.getSystemStatistics,
    getMentorshipHierarchy: simpleMentorshipController.getMentorshipHierarchy,
    healthCheck: simpleMentorshipController.healthCheck
};