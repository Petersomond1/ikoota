// ikootaapi/services/mentorIdServices.js
// MENTOR ID SERVICES - Mentorship System Business Logic
// Handles mentor-mentee relationships with privacy protection

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { validateIdFormat } from '../utils/idGenerator.js';

class MentorIdServices {
    
    /**
     * Get mentor status for a user
     * @param {number} userId - User's database ID
     * @returns {object} Mentor status and information
     */
    async getMentorStatus(userId) {
        try {
            const mentorRows = await db.query(`
                SELECT u.id, u.username, u.email, u.converse_id, u.mentor_id, 
                       u.is_identity_masked, u.createdAt,
                       COUNT(DISTINCT m.mentee_converse_id) as total_mentees,
                       COUNT(DISTINCT CASE WHEN m.is_active = 1 THEN m.mentee_converse_id END) as active_mentees
                FROM users u
                LEFT JOIN mentors m ON u.converse_id = m.mentor_converse_id
                WHERE u.id = ?
                GROUP BY u.id
            `, [userId]);
            
            if (!mentorRows.length) {
                throw new CustomError('User not found', 404);
            }
            
            const user = mentorRows[0];
            
            // Check if user has mentor role in system
            const mentorRoleRows = await db.query(`
                SELECT COUNT(*) as is_mentor
                FROM mentors
                WHERE mentor_converse_id = ? AND is_active = 1
            `, [user.converse_id]);
            
            const isMentor = mentorRoleRows[0]?.is_mentor > 0;
            
            return {
                isMentor,
                mentorConverseId: user.converse_id,
                totalMentees: parseInt(user.total_mentees) || 0,
                activeMentees: parseInt(user.active_mentees) || 0,
                mentorSince: user.createdAt,
                // Show real identity to user themselves
                realName: user.username,
                realEmail: user.email
            };
        } catch (error) {
            throw new CustomError(`Failed to get mentor status: ${error.message}`, 500);
        }
    }

    /**
     * Assign mentor role to a user
     * @param {number} targetUserId - User to make mentor
     * @param {number} adminId - Admin performing assignment
     * @param {string} mentorshipType - Type of mentorship
     * @returns {object} Assignment result
     */
    async assignMentorRole(targetUserId, adminId, mentorshipType = 'mentor') {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get target user's converse ID
            const userRows = await connection.query(
                'SELECT id, converse_id, username FROM users WHERE id = ? AND is_identity_masked = 1',
                [targetUserId]
            );
            
            if (!userRows.length) {
                throw new CustomError('User not found or identity not masked', 404);
            }
            
            const user = userRows[0];
            
            if (!user.converse_id) {
                throw new CustomError('User must have converse ID to become mentor', 400);
            }
            
            // Check if already a mentor
            const existingRows = await connection.query(
                'SELECT id FROM mentors WHERE mentor_converse_id = ? AND is_active = 1',
                [user.converse_id]
            );
            
            if (existingRows.length > 0) {
                throw new CustomError('User is already assigned as mentor', 409);
            }
            
            // Create mentor record (initial entry without mentees)
            await connection.query(`
                INSERT INTO mentors 
                (mentor_converse_id, mentee_converse_id, relationship_type, is_active)
                VALUES (?, NULL, ?, 1)
            `, [user.converse_id, mentorshipType]);
            
            // Log the mentor assignment
            await connection.query(`
                INSERT INTO audit_logs 
                (user_id, action, resource, details)
                VALUES (?, 'mentor_role_assigned', 'mentorship_system', ?)
            `, [
                adminId,
                JSON.stringify({
                    targetUserId,
                    mentorConverseId: user.converse_id,
                    mentorshipType,
                    assignedAt: new Date().toISOString()
                })
            ]);
            
            await connection.commit();
            
            return {
                mentorConverseId: user.converse_id,
                mentorshipType,
                assignedAt: new Date().toISOString()
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update mentor settings/preferences
     * @param {number} userId - Mentor's user ID
     * @param {object} mentorSettings - New settings
     * @returns {object} Updated settings
     */
    async updateMentorSettings(userId, mentorSettings) {
        try {
            // Get user's converse ID
            const userRows = await db.query(
                'SELECT converse_id FROM users WHERE id = ?',
                [userId]
            );
            
            if (!userRows.length) {
                throw new CustomError('User not found', 404);
            }
            
            const converseId = userRows[0].converse_id;
            
            // Update mentor preferences in user_communication_preferences
            await db.query(`
                INSERT INTO user_communication_preferences 
                (user_id, admin_notifications, content_notifications)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                admin_notifications = VALUES(admin_notifications),
                content_notifications = VALUES(content_notifications)
            `, [
                userId,
                mentorSettings.receiveNotifications ? 1 : 0,
                mentorSettings.allowMenteeContact ? 1 : 0
            ]);
            
            return {
                settings: mentorSettings,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new CustomError(`Failed to update mentor settings: ${error.message}`, 500);
        }
    }

    /**
     * Remove mentor role from user
     * @param {number} targetUserId - User to remove mentor role from
     * @param {number} adminId - Admin performing removal
     * @param {string} reason - Reason for removal
     * @returns {object} Removal result
     */
    async removeMentorRole(targetUserId, adminId, reason) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get user's converse ID and existing mentees
            const userRows = await connection.query(
                'SELECT converse_id FROM users WHERE id = ?',
                [targetUserId]
            );
            
            if (!userRows.length) {
                throw new CustomError('User not found', 404);
            }
            
            const mentorConverseId = userRows[0].converse_id;
            
            // Get list of affected mentees
            const menteeRows = await connection.query(
                'SELECT mentee_converse_id FROM mentors WHERE mentor_converse_id = ? AND is_active = 1',
                [mentorConverseId]
            );
            
            // Deactivate mentor relationships
            await connection.query(
                'UPDATE mentors SET is_active = 0 WHERE mentor_converse_id = ?',
                [mentorConverseId]
            );
            
            // Remove mentor assignments from users
            await connection.query(
                'UPDATE users SET mentor_id = NULL WHERE mentor_id = ?',
                [mentorConverseId]
            );
            
            // Log the removal
            await connection.query(`
                INSERT INTO audit_logs 
                (user_id, action, resource, details)
                VALUES (?, 'mentor_role_removed', 'mentorship_system', ?)
            `, [
                adminId,
                JSON.stringify({
                    targetUserId,
                    mentorConverseId,
                    affectedMentees: menteeRows.length,
                    reason,
                    removedAt: new Date().toISOString()
                })
            ]);
            
            await connection.commit();
            
            return {
                mentorConverseId,
                affectedMentees: menteeRows.length,
                removedAt: new Date().toISOString()
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get mentees for a mentor
     * @param {number} mentorUserId - Mentor's user ID
     * @returns {array} List of mentees with converse data only
     */
    async getMenteesByMentorId(mentorUserId) {
        try {
            // Get mentor's converse ID
            const mentorRows = await db.query(
                'SELECT converse_id FROM users WHERE id = ?',
                [mentorUserId]
            );
            
            if (!mentorRows.length) {
                throw new CustomError('Mentor not found', 404);
            }
            
            const mentorConverseId = mentorRows[0].converse_id;
            
            // Get mentees (converse data only)
            const menteeRows = await db.query(`
                SELECT u.converse_id, u.converse_avatar, u.class_id,
                       CONCAT('User_', u.converse_id) as display_name,
                       m.createdAt as relationshipSince, m.relationship_type,
                       u.updatedAt as lastActive
                FROM users u
                JOIN mentors m ON u.converse_id = m.mentee_converse_id
                WHERE m.mentor_converse_id = ? AND m.is_active = 1
                AND u.is_identity_masked = 1 AND u.membership_stage = 'member'
                ORDER BY m.createdAt DESC
            `, [mentorConverseId]);
            
            return menteeRows.map(mentee => ({
                converse_id: mentee.converse_id,
                display_name: mentee.display_name,
                converse_avatar: mentee.converse_avatar,
                class_id: mentee.class_id,
                relationshipSince: mentee.relationshipSince,
                relationshipType: mentee.relationship_type,
                lastActive: mentee.lastActive
                // Never expose real identity
            }));
        } catch (error) {
            throw new CustomError(`Failed to get mentees: ${error.message}`, 500);
        }
    }

    /**
     * Assign mentee to mentor
     * @param {number} mentorUserId - Mentor's user ID
     * @param {number} menteeUserId - Mentee's user ID
     * @param {number} adminId - Admin performing assignment
     * @param {string} relationshipType - Type of relationship
     * @returns {object} Assignment result
     */
    async assignMenteeToMentor(mentorUserId, menteeUserId, adminId, relationshipType = 'mentor') {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get mentor and mentee converse IDs
            const mentorRows = await connection.query(
                'SELECT converse_id, username FROM users WHERE id = ? AND is_identity_masked = 1',
                [mentorUserId]
            );
            
            const menteeRows = await connection.query(
                'SELECT converse_id, username FROM users WHERE id = ? AND is_identity_masked = 1',
                [menteeUserId]
            );
            
            if (!mentorRows.length) {
                throw new CustomError('Mentor not found or identity not masked', 404);
            }
            
            if (!menteeRows.length) {
                throw new CustomError('Mentee not found or identity not masked', 404);
            }
            
            const mentorConverseId = mentorRows[0].converse_id;
            const menteeConverseId = menteeRows[0].converse_id;
            
            // Check if mentee already has a mentor
            const existingRows = await connection.query(
                'SELECT mentor_converse_id FROM mentors WHERE mentee_converse_id = ? AND is_active = 1',
                [menteeConverseId]
            );
            
            if (existingRows.length > 0) {
                throw new CustomError('Mentee already has an assigned mentor', 409);
            }
            
            // Create mentor-mentee relationship
            await connection.query(`
                INSERT INTO mentors 
                (mentor_converse_id, mentee_converse_id, relationship_type, is_active)
                VALUES (?, ?, ?, 1)
            `, [mentorConverseId, menteeConverseId, relationshipType]);
            
            // Update mentee's mentor_id in users table
            await connection.query(
                'UPDATE users SET mentor_id = ? WHERE id = ?',
                [mentorConverseId, menteeUserId]
            );
            
            // Log the assignment
            await connection.query(`
                INSERT INTO audit_logs 
                (user_id, action, resource, details)
                VALUES (?, 'mentor_assigned', 'mentorship_system', ?)
            `, [
                adminId,
                JSON.stringify({
                    mentorUserId,
                    menteeUserId,
                    mentorConverseId,
                    menteeConverseId,
                    relationshipType,
                    assignedAt: new Date().toISOString()
                })
            ]);
            
            await connection.commit();
            
            return {
                mentorConverseId,
                menteeConverseId,
                relationshipType,
                assignedAt: new Date().toISOString()
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Check if user is mentor of specific mentee
     * @param {number} mentorUserId - Mentor's user ID
     * @param {string} menteeConverseId - Mentee's converse ID
     * @returns {boolean} True if mentor-mentee relationship exists
     */
    async isMentorOfMentee(mentorUserId, menteeConverseId) {
        try {
            const relationshipRows = await db.query(`
                SELECT m.id
                FROM mentors m
                JOIN users u ON u.converse_id = m.mentor_converse_id
                WHERE u.id = ? AND m.mentee_converse_id = ? AND m.is_active = 1
            `, [mentorUserId, menteeConverseId]);
            
            return relationshipRows.length > 0;
        } catch (error) {
            throw new CustomError(`Failed to check mentor relationship: ${error.message}`, 500);
        }
    }

    /**
     * Remove mentee from mentor
     * @param {string} menteeConverseId - Mentee's converse ID
     * @param {number} removedBy - User ID performing removal
     * @param {string} reason - Reason for removal
     * @returns {object} Removal result
     */
    async removeMenteeFromMentor(menteeConverseId, removedBy, reason) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            if (!validateIdFormat(menteeConverseId, 'user')) {
                throw new CustomError('Invalid mentee converse ID format', 400);
            }
            
            // Get current mentor-mentee relationship
            const relationshipRows = await connection.query(`
                SELECT m.mentor_converse_id, u.id as mentee_user_id
                FROM mentors m
                JOIN users u ON u.converse_id = m.mentee_converse_id
                WHERE m.mentee_converse_id = ? AND m.is_active = 1
            `, [menteeConverseId]);
            
            if (!relationshipRows.length) {
                throw new CustomError('Active mentor relationship not found', 404);
            }
            
            const relationship = relationshipRows[0];
            
            // Deactivate mentor relationship
            await connection.query(
                'UPDATE mentors SET is_active = 0 WHERE mentee_converse_id = ? AND is_active = 1',
                [menteeConverseId]
            );
            
            // Remove mentor assignment from user
            await connection.query(
                'UPDATE users SET mentor_id = NULL WHERE converse_id = ?',
                [menteeConverseId]
            );
            
            // Log the removal
            await connection.query(`
                INSERT INTO audit_logs 
                (user_id, action, resource, details)
                VALUES (?, 'mentee_removed', 'mentorship_system', ?)
            `, [
                removedBy,
                JSON.stringify({
                    menteeConverseId,
                    mentorConverseId: relationship.mentor_converse_id,
                    reason,
                    removedAt: new Date().toISOString()
                })
            ]);
            
            await connection.commit();
            
            return {
                menteeConverseId,
                mentorConverseId: relationship.mentor_converse_id,
                removedAt: new Date().toISOString()
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get mentor's class distribution (which classes their mentees are in)
     * @param {number} mentorUserId - Mentor's user ID
     * @returns {array} Class distribution data
     */
    async getMentorClassDistribution(mentorUserId) {
        try {
            // Get mentor's converse ID
            const mentorRows = await db.query(
                'SELECT converse_id FROM users WHERE id = ?',
                [mentorUserId]
            );
            
            if (!mentorRows.length) {
                throw new CustomError('Mentor not found', 404);
            }
            
            const mentorConverseId = mentorRows[0].converse_id;
            
            // Get class distribution of mentees
            const classRows = await db.query(`
                SELECT c.class_id, c.class_name, c.public_name, c.class_type, c.is_active,
                       COUNT(u.id) as mentee_count
                FROM classes c
                LEFT JOIN users u ON u.class_id = c.class_id AND u.mentor_id = ?
                WHERE c.is_active = 1
                GROUP BY c.class_id, c.class_name, c.public_name, c.class_type, c.is_active
                HAVING mentee_count > 0 OR c.class_id IN (
                    SELECT DISTINCT u2.class_id 
                    FROM users u2 
                    WHERE u2.mentor_id = ? AND u2.class_id IS NOT NULL
                )
                ORDER BY mentee_count DESC, c.class_name
            `, [mentorConverseId, mentorConverseId]);
            
            return classRows;
        } catch (error) {
            throw new CustomError(`Failed to get mentor class distribution: ${error.message}`, 500);
        }
    }

    /**
     * Get available mentors for assignment (Admin view)
     * @returns {array} Available mentors with capacity info
     */
    async getAvailableMentors() {
        try {
            const mentorRows = await db.query(`
                SELECT u.id, u.converse_id, 
                       CONCAT('Mentor_', u.converse_id) as display_name,
                       u.converse_avatar, u.class_id,
                       COUNT(m.mentee_converse_id) as current_mentees,
                       u.createdAt as mentor_since
                FROM users u
                JOIN mentors mentor_check ON u.converse_id = mentor_check.mentor_converse_id 
                                          AND mentor_check.is_active = 1
                LEFT JOIN mentors m ON u.converse_id = m.mentor_converse_id 
                                    AND m.mentee_converse_id IS NOT NULL 
                                    AND m.is_active = 1
                WHERE u.is_identity_masked = 1 AND u.membership_stage = 'member'
                GROUP BY u.id, u.converse_id, u.converse_avatar, u.class_id, u.createdAt
                ORDER BY current_mentees ASC, u.createdAt DESC
            `);
            
            return mentorRows.map(mentor => ({
                userId: mentor.id,
                converseId: mentor.converse_id,
                displayName: mentor.display_name,
                avatar: mentor.converse_avatar,
                classId: mentor.class_id,
                currentMentees: mentor.current_mentees,
                mentorSince: mentor.mentor_since,
                capacity: mentor.current_mentees < 5 ? 'available' : 'full' // Max 5 mentees
            }));
        } catch (error) {
            throw new CustomError(`Failed to get available mentors: ${error.message}`, 500);
        }
    }

    /**
     * Get unassigned members who need mentors
     * @returns {array} Members without mentors
     */
    async getUnassignedMembers() {
        try {
            const unassignedRows = await db.query(`
                SELECT u.id, u.converse_id,
                       CONCAT('User_', u.converse_id) as display_name,
                       u.converse_avatar, u.class_id, u.createdAt as member_since
                FROM users u
                WHERE u.is_identity_masked = 1 AND u.membership_stage = 'member'
                AND (u.mentor_id IS NULL OR u.mentor_id = '')
                AND NOT EXISTS (
                    SELECT 1 FROM mentors m 
                    WHERE m.mentee_converse_id = u.converse_id AND m.is_active = 1
                )
                ORDER BY u.createdAt ASC
            `);
            
            return unassignedRows.map(member => ({
                userId: member.id,
                converseId: member.converse_id,
                displayName: member.display_name,
                avatar: member.converse_avatar,
                classId: member.class_id,
                memberSince: member.member_since,
                needsMentor: true
            }));
        } catch (error) {
            throw new CustomError(`Failed to get unassigned members: ${error.message}`, 500);
        }
    }

    /**
     * Get mentor performance metrics
     * @param {number} mentorUserId - Mentor's user ID
     * @returns {object} Performance metrics
     */
    async getMentorPerformanceMetrics(mentorUserId) {
        try {
            const mentorRows = await db.query(
                'SELECT converse_id FROM users WHERE id = ?',
                [mentorUserId]
            );
            
            if (!mentorRows.length) {
                throw new CustomError('Mentor not found', 404);
            }
            
            const mentorConverseId = mentorRows[0].converse_id;
            
            // Get mentorship activity metrics
            const metricsRows = await db.query(`
                SELECT 
                    COUNT(DISTINCT m.mentee_converse_id) as total_mentees,
                    COUNT(DISTINCT CASE WHEN m.is_active = 1 THEN m.mentee_converse_id END) as active_mentees,
                    MIN(m.createdAt) as first_mentee_assigned,
                    MAX(m.createdAt) as last_mentee_assigned,
                    AVG(DATEDIFF(NOW(), m.createdAt)) as avg_relationship_duration
                FROM mentors m
                WHERE m.mentor_converse_id = ?
            `, [mentorConverseId]);
            
            return metricsRows[0] || {};
        } catch (error) {
            throw new CustomError(`Failed to get mentor performance metrics: ${error.message}`, 500);
        }
    }

    /**
     * Get mentorship system statistics
     * @returns {object} System-wide mentorship statistics
     */
    async getMentorshipSystemStats() {
        try {
            const statsRows = await db.query(`
                SELECT 
                    COUNT(DISTINCT mentor_converse_id) as total_mentors,
                    COUNT(DISTINCT CASE WHEN is_active = 1 THEN mentor_converse_id END) as active_mentors,
                    COUNT(DISTINCT mentee_converse_id) as total_mentees,
                    COUNT(DISTINCT CASE WHEN is_active = 1 THEN mentee_converse_id END) as active_mentees,
                    AVG(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_relationship_rate
                FROM mentors
                WHERE mentee_converse_id IS NOT NULL
            `);
            
            const unassignedRows = await db.query(`
                SELECT COUNT(*) as unassigned_members
                FROM users u
                WHERE u.is_identity_masked = 1 AND u.membership_stage = 'member'
                AND (u.mentor_id IS NULL OR u.mentor_id = '')
            `);
            
            return {
                ...statsRows[0],
                unassignedMembers: unassignedRows[0]?.unassigned_members || 0
            };
        } catch (error) {
            throw new CustomError(`Failed to get mentorship system stats: ${error.message}`, 500);
        }
    }
}

export default new MentorIdServices();