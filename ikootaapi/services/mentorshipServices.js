// ikootaapi/services/mentorshipServices.js
// MENTORSHIP SYSTEM - Complete Implementation
// Admin assignment, reassignment, and capacity management

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import crypto from 'crypto';

class MentorshipServices {

    // =================================================================
    // ADMIN ASSIGNMENT OPERATIONS
    // =================================================================

    /**
     * Find available mentors with capacity
     * @param {object} criteria - Search criteria
     * @returns {array} Available mentors
     */
    async findAvailableMentors(criteria = {}) {
        try {
            const {
                preferredLevel = null,
                maxResults = 10,
                minSlots = 1,
                includePerformance = true
            } = criteria;

            const levelCondition = preferredLevel ? 'AND mct.mentor_level = ?' : '';
            const params = preferredLevel ? [preferredLevel, minSlots, maxResults] : [minSlots, maxResults];

            const availableMentors = await db.query(`
                SELECT 
                    mct.mentor_converse_id,
                    mct.mentor_level,
                    mct.direct_slots_filled,
                    mct.direct_slots_available,
                    COALESCE(mct.community_slots_available, 144) as community_slots_available,
                    COALESCE(mct.monthly_assignments, 0) as monthly_assignments,
                    COALESCE(mct.performance_score, 0.50) as performance_score,
                    mf.family_name,
                    mf.family_identifier,
                    COALESCE(mf.member_count, 0) as member_count,
                    u.username as mentor_username,
                    COALESCE(u.membership_stage, 'member') as membership_stage,
                    -- Calculate mentor desirability score
                    (
                        (mct.direct_slots_available / 12.0) * 0.4 +  -- Availability weight
                        0.3 +  -- Default recency weight
                        ((20 - COALESCE(mct.monthly_assignments, 0)) / 20.0) * 0.2 +  -- Workload weight
                        (COALESCE(mct.performance_score, 0.5) / 1.0) * 0.1  -- Performance weight
                    ) as desirability_score,
                    CASE mct.mentor_level
                        WHEN 5 THEN 'Grand Master'
                        WHEN 4 THEN 'Master Mentor'
                        WHEN 3 THEN 'Senior Mentor'
                        WHEN 2 THEN 'Advanced Mentor'
                        WHEN 1 THEN 'Foundation Mentor'
                        ELSE 'Unknown Level'
                    END as mentor_title
                FROM mentor_capacity_tracking mct
                LEFT JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id AND COALESCE(mf.is_active, 1) = 1
                LEFT JOIN users u ON mct.mentor_converse_id = u.converse_id
                WHERE COALESCE(mct.is_accepting_direct, 1) = 1 
                  AND mct.direct_slots_available >= ?
                  AND COALESCE(u.is_identity_masked, 1) = 1
                  ${levelCondition}
                ORDER BY desirability_score DESC, mct.direct_slots_available DESC
                LIMIT ?
            `, params);

            return availableMentors.map(mentor => ({
                ...mentor,
                canAcceptMentees: mentor.direct_slots_available > 0,
                workloadStatus: this.getWorkloadStatus(mentor.monthly_assignments),
                experienceLevel: this.getExperienceDescription(mentor.mentor_level),
                lastAssignment: mentor.last_assignment_date ? 
                    new Date(mentor.last_assignment_date).toLocaleDateString() : 'Never'
            }));
        } catch (error) {
            throw new CustomError(`Failed to find available mentors: ${error.message}`, 500);
        }
    }

    /**
     * Assign mentee to mentor (Admin operation)
     * @param {string} mentorConverseId - Mentor's converse ID
     * @param {string} menteeConverseId - Mentee's converse ID
     * @param {string} assignedBy - Admin converse ID
     * @param {string} reason - Assignment reason
     * @returns {object} Assignment result
     */
    async assignMenteeToMentor(mentorConverseId, menteeConverseId, assignedBy, reason) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Validate admin permissions
            const admin = await connection.query(
                'SELECT converse_id, role FROM users WHERE converse_id = ? AND role IN ("admin", "super_admin")',
                [assignedBy]
            );

            if (!admin.length) {
                throw new CustomError('Only admins can assign mentees to mentors', 403);
            }

            // Check if mentee already has a mentor
            const existingMentor = await connection.query(`
                SELECT mh.mentor_converse_id, mh.established_date
                FROM mentorship_hierarchy mh
                WHERE mh.mentee_converse_id = ? AND mh.is_active = 1
            `, [menteeConverseId]);

            if (existingMentor.length) {
                throw new CustomError(
                    `Mentee is already assigned to mentor: ${existingMentor[0].mentor_converse_id}`, 
                    409
                );
            }

            // Verify mentor exists and has capacity
            const mentorCapacity = await connection.query(`
                SELECT 
                    mct.*,
                    mf.family_identifier,
                    mf.family_name,
                    u.username as mentor_username
                FROM mentor_capacity_tracking mct
                LEFT JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id AND mf.is_active = 1
                LEFT JOIN users u ON mct.mentor_converse_id = u.converse_id
                WHERE mct.mentor_converse_id = ? 
                  AND mct.is_accepting_direct = 1
                  AND u.is_identity_masked = 1
            `, [mentorConverseId]);

            if (!mentorCapacity.length) {
                throw new CustomError('Mentor not found or not accepting mentees', 404);
            }

            const mentor = mentorCapacity[0];

            if (mentor.direct_slots_available <= 0) {
                throw new CustomError(
                    `Mentor has no available capacity (${mentor.direct_slots_filled}/12 filled)`, 
                    400
                );
            }

            // Verify mentee exists and can be assigned
            const mentee = await connection.query(`
                SELECT converse_id, username, membership_stage
                FROM users 
                WHERE converse_id = ? AND is_identity_masked = 1
            `, [menteeConverseId]);

            if (!mentee.length) {
                throw new CustomError('Mentee not found or identity not masked', 404);
            }

            // Generate assignment reference
            const assignmentRef = this.generateAssignmentRef();

            // Calculate next family position
            const familyPositionResult = await connection.query(`
                SELECT COALESCE(MAX(family_position), 0) + 1 as next_position
                FROM mentorship_hierarchy
                WHERE mentor_converse_id = ? 
                  AND relationship_type = 'direct_family'
                  AND is_active = 1
            `, [mentorConverseId]);

            const familyPosition = familyPositionResult[0].next_position;

            // Create family if it doesn't exist
            if (!mentor.family_identifier) {
                const newFamilyId = `L${mentor.mentor_level}_${mentorConverseId.replace('OTO#', '')}_FAMILY`;
                
                await connection.query(`
                    INSERT INTO mentorship_families (
                        family_identifier, mentor_converse_id, mentor_level,
                        family_name, established_date, direct_members
                    ) VALUES (?, ?, ?, ?, CURRENT_DATE, JSON_ARRAY())
                `, [
                    newFamilyId, mentorConverseId, mentor.mentor_level,
                    `Level ${mentor.mentor_level} Family`
                ]);

                mentor.family_identifier = newFamilyId;
            }

            // Create hierarchy entry
            await connection.query(`
                INSERT INTO mentorship_hierarchy (
                    mentor_converse_id, mentee_converse_id, mentor_level, mentee_level,
                    relationship_type, family_position, hierarchy_path, chain_of_command,
                    family_group_id, assignment_reason, assigned_by
                ) VALUES (?, ?, ?, 0, 'direct_family', ?, ?, ?, ?, ?, ?)
            `, [
                mentorConverseId, menteeConverseId, mentor.mentor_level,
                familyPosition,
                `L${mentor.mentor_level}.${mentorConverseId}.${menteeConverseId}`,
                JSON.stringify([mentorConverseId]),
                mentor.family_identifier,
                reason,
                assignedBy
            ]);

            // Update mentor capacity
            await connection.query(`
                UPDATE mentor_capacity_tracking
                SET direct_slots_filled = direct_slots_filled + 1,
                    last_assignment_date = CURRENT_DATE,
                    monthly_assignments = monthly_assignments + 1,
                    updatedAt = NOW()
                WHERE mentor_converse_id = ?
            `, [mentorConverseId]);

            // Update family member count and list
            await connection.query(`
                UPDATE mentorship_families
                SET member_count = member_count + 1,
                    direct_members = JSON_ARRAY_APPEND(
                        COALESCE(direct_members, JSON_ARRAY()), 
                        '$', ?
                    ),
                    updatedAt = NOW()
                WHERE family_identifier = ?
            `, [menteeConverseId, mentor.family_identifier]);

            // Create assignment history record
            await connection.query(`
                INSERT INTO mentorship_assignment_history (
                    assignment_ref, mentee_converse_id, action_type,
                    new_mentor_converse_id, assigned_by, assignment_reason,
                    affected_family_id, effective_date
                ) VALUES (?, ?, 'initial_assignment', ?, ?, ?, ?, CURRENT_DATE)
            `, [
                assignmentRef, menteeConverseId, mentorConverseId, 
                assignedBy, reason, mentor.family_identifier
            ]);

            // Update legacy mentors table for backward compatibility
            await connection.query(`
                INSERT INTO mentors (
                    mentor_converse_id, mentee_converse_id, relationship_type,
                    mentor_level, hierarchy_path, direct_family_count, family_name,
                    createdAt, is_active
                ) VALUES (?, ?, 'mentor', ?, ?, ?, ?, NOW(), 1)
            `, [
                mentorConverseId, menteeConverseId, mentor.mentor_level,
                `L${mentor.mentor_level}.${mentorConverseId}`,
                familyPosition,
                `Family Position #${familyPosition}`
            ]);

            await connection.commit();

            // Return assignment result
            return {
                success: true,
                assignmentRef,
                mentorConverseId,
                menteeConverseId,
                familyPosition,
                familyIdentifier: mentor.family_identifier,
                mentorLevel: mentor.mentor_level,
                mentorTitle: this.getMentorTitle(mentor.mentor_level),
                assignedBy,
                assignmentDate: new Date().toISOString(),
                message: `Successfully assigned mentee to family position #${familyPosition}`
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Reassign mentee from one mentor to another
     * @param {string} menteeConverseId - Mentee to reassign
     * @param {string} newMentorConverseId - New mentor
     * @param {string} assignedBy - Admin making the change
     * @param {string} reason - Reason for reassignment
     * @returns {object} Reassignment result
     */
    async reassignMentee(menteeConverseId, newMentorConverseId, assignedBy, reason) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Validate admin permissions
            const admin = await connection.query(
                'SELECT converse_id, role FROM users WHERE converse_id = ? AND role IN ("admin", "super_admin")',
                [assignedBy]
            );

            if (!admin.length) {
                throw new CustomError('Only admins can reassign mentees', 403);
            }

            // Get current mentorship details
            const currentRelationship = await connection.query(`
                SELECT 
                    mh.*,
                    mf.family_identifier as old_family_id,
                    mf.family_name as old_family_name
                FROM mentorship_hierarchy mh
                LEFT JOIN mentorship_families mf ON mh.family_group_id = mf.family_identifier
                WHERE mh.mentee_converse_id = ? AND mh.is_active = 1
            `, [menteeConverseId]);

            if (!currentRelationship.length) {
                throw new CustomError('Mentee has no current mentor assignment', 404);
            }

            const oldRelationship = currentRelationship[0];
            const oldMentorConverseId = oldRelationship.mentor_converse_id;

            // Check if reassigning to same mentor
            if (oldMentorConverseId === newMentorConverseId) {
                throw new CustomError('Mentee is already assigned to this mentor', 400);
            }

            // Verify new mentor has capacity
            const newMentorCapacity = await connection.query(`
                SELECT 
                    mct.*,
                    mf.family_identifier,
                    mf.family_name
                FROM mentor_capacity_tracking mct
                LEFT JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id AND mf.is_active = 1
                WHERE mct.mentor_converse_id = ? 
                  AND mct.is_accepting_direct = 1
                  AND mct.direct_slots_available > 0
            `, [newMentorConverseId]);

            if (!newMentorCapacity.length) {
                throw new CustomError('New mentor not found or has no available capacity', 404);
            }

            const newMentor = newMentorCapacity[0];

            // Generate reassignment reference
            const reassignmentRef = this.generateAssignmentRef('REASSIGN');

            // Calculate new family position
            const newFamilyPositionResult = await connection.query(`
                SELECT COALESCE(MAX(family_position), 0) + 1 as next_position
                FROM mentorship_hierarchy
                WHERE mentor_converse_id = ? 
                  AND relationship_type = 'direct_family'
                  AND is_active = 1
            `, [newMentorConverseId]);

            const newFamilyPosition = newFamilyPositionResult[0].next_position;

            // Create new family if needed
            if (!newMentor.family_identifier) {
                const newFamilyId = `L${newMentor.mentor_level}_${newMentorConverseId.replace('OTO#', '')}_FAMILY`;
                
                await connection.query(`
                    INSERT INTO mentorship_families (
                        family_identifier, mentor_converse_id, mentor_level,
                        family_name, established_date, direct_members
                    ) VALUES (?, ?, ?, ?, CURRENT_DATE, JSON_ARRAY())
                `, [
                    newFamilyId, newMentorConverseId, newMentor.mentor_level,
                    `Level ${newMentor.mentor_level} Family`
                ]);

                newMentor.family_identifier = newFamilyId;
            }

            // Deactivate old relationship
            await connection.query(`
                UPDATE mentorship_hierarchy
                SET is_active = 0, updatedAt = NOW()
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            // Create new relationship
            await connection.query(`
                INSERT INTO mentorship_hierarchy (
                    mentor_converse_id, mentee_converse_id, mentor_level, mentee_level,
                    relationship_type, family_position, hierarchy_path, chain_of_command,
                    family_group_id, assignment_reason, assigned_by
                ) VALUES (?, ?, ?, 0, 'direct_family', ?, ?, ?, ?, ?, ?)
            `, [
                newMentorConverseId, menteeConverseId, newMentor.mentor_level,
                newFamilyPosition,
                `L${newMentor.mentor_level}.${newMentorConverseId}.${menteeConverseId}`,
                JSON.stringify([newMentorConverseId]),
                newMentor.family_identifier,
                reason,
                assignedBy
            ]);

            // Update old mentor capacity (decrease)
            await connection.query(`
                UPDATE mentor_capacity_tracking
                SET direct_slots_filled = direct_slots_filled - 1,
                    updatedAt = NOW()
                WHERE mentor_converse_id = ?
            `, [oldMentorConverseId]);

            // Update new mentor capacity (increase)
            await connection.query(`
                UPDATE mentor_capacity_tracking
                SET direct_slots_filled = direct_slots_filled + 1,
                    last_assignment_date = CURRENT_DATE,
                    monthly_assignments = monthly_assignments + 1,
                    updatedAt = NOW()
                WHERE mentor_converse_id = ?
            `, [newMentorConverseId]);

            // Update old family (remove member)
            await connection.query(`
                UPDATE mentorship_families
                SET member_count = member_count - 1,
                    direct_members = JSON_REMOVE(
                        direct_members, 
                        REPLACE(JSON_SEARCH(direct_members, 'one', ?), '"', '')
                    ),
                    updatedAt = NOW()
                WHERE family_identifier = ?
            `, [menteeConverseId, oldRelationship.family_group_id]);

            // Update new family (add member)
            await connection.query(`
                UPDATE mentorship_families
                SET member_count = member_count + 1,
                    direct_members = JSON_ARRAY_APPEND(
                        COALESCE(direct_members, JSON_ARRAY()), 
                        '$', ?
                    ),
                    updatedAt = NOW()
                WHERE family_identifier = ?
            `, [menteeConverseId, newMentor.family_identifier]);

            // Create reassignment history record
            await connection.query(`
                INSERT INTO mentorship_assignment_history (
                    assignment_ref, mentee_converse_id, action_type,
                    old_mentor_converse_id, new_mentor_converse_id,
                    assigned_by, assignment_reason, affected_family_id,
                    cascade_changes, effective_date
                ) VALUES (?, ?, 'reassignment', ?, ?, ?, ?, ?, ?, CURRENT_DATE)
            `, [
                reassignmentRef, menteeConverseId, oldMentorConverseId,
                newMentorConverseId, assignedBy, reason, newMentor.family_identifier,
                JSON.stringify({
                    oldFamily: oldRelationship.family_group_id,
                    oldPosition: oldRelationship.family_position,
                    newFamily: newMentor.family_identifier,
                    newPosition: newFamilyPosition
                })
            ]);

            // Update legacy mentors table
            await connection.query(`
                UPDATE mentors 
                SET is_active = 0 
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            await connection.query(`
                INSERT INTO mentors (
                    mentor_converse_id, mentee_converse_id, relationship_type,
                    mentor_level, hierarchy_path, direct_family_count, family_name,
                    createdAt, is_active
                ) VALUES (?, ?, 'mentor', ?, ?, ?, ?, NOW(), 1)
            `, [
                newMentorConverseId, menteeConverseId, newMentor.mentor_level,
                `L${newMentor.mentor_level}.${newMentorConverseId}`,
                newFamilyPosition,
                `Reassigned to Position #${newFamilyPosition}`
            ]);

            await connection.commit();

            return {
                success: true,
                reassignmentRef,
                menteeConverseId,
                oldMentor: {
                    converseId: oldMentorConverseId,
                    familyId: oldRelationship.family_group_id,
                    position: oldRelationship.family_position
                },
                newMentor: {
                    converseId: newMentorConverseId,
                    familyId: newMentor.family_identifier,
                    position: newFamilyPosition,
                    level: newMentor.mentor_level,
                    title: this.getMentorTitle(newMentor.mentor_level)
                },
                assignedBy,
                reason,
                effectiveDate: new Date().toISOString(),
                message: `Successfully reassigned mentee from ${oldMentorConverseId} to ${newMentorConverseId}`
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Remove mentee from mentorship (graduation, dismissal, etc.)
     * @param {string} menteeConverseId - Mentee to remove
     * @param {string} removedBy - Admin making the change
     * @param {string} reason - Reason for removal
     * @param {string} removalType - Type of removal
     * @returns {object} Removal result
     */
    async removeMenteeFromMentorship(menteeConverseId, removedBy, reason, removalType = 'graduation') {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Validate admin permissions
            const admin = await connection.query(
                'SELECT converse_id, role FROM users WHERE converse_id = ? AND role IN ("admin", "super_admin")',
                [removedBy]
            );

            if (!admin.length) {
                throw new CustomError('Only admins can remove mentees from mentorship', 403);
            }

            // Get current mentorship details
            const currentRelationship = await connection.query(`
                SELECT 
                    mh.*,
                    mf.family_identifier,
                    mf.family_name
                FROM mentorship_hierarchy mh
                LEFT JOIN mentorship_families mf ON mh.family_group_id = mf.family_identifier
                WHERE mh.mentee_converse_id = ? AND mh.is_active = 1
            `, [menteeConverseId]);

            if (!currentRelationship.length) {
                throw new CustomError('Mentee has no current mentor assignment', 404);
            }

            const relationship = currentRelationship[0];
            const mentorConverseId = relationship.mentor_converse_id;

            // Generate removal reference
            const removalRef = this.generateAssignmentRef('REMOVE');

            // Deactivate relationship
            await connection.query(`
                UPDATE mentorship_hierarchy
                SET is_active = 0, updatedAt = NOW()
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            // Update mentor capacity
            await connection.query(`
                UPDATE mentor_capacity_tracking
                SET direct_slots_filled = direct_slots_filled - 1,
                    updatedAt = NOW()
                WHERE mentor_converse_id = ?
            `, [mentorConverseId]);

            // Update family
            await connection.query(`
                UPDATE mentorship_families
                SET member_count = member_count - 1,
                    direct_members = JSON_REMOVE(
                        direct_members, 
                        REPLACE(JSON_SEARCH(direct_members, 'one', ?), '"', '')
                    ),
                    updatedAt = NOW()
                WHERE family_identifier = ?
            `, [menteeConverseId, relationship.family_group_id]);

            // Create removal history record
            await connection.query(`
                INSERT INTO mentorship_assignment_history (
                    assignment_ref, mentee_converse_id, action_type,
                    old_mentor_converse_id, assigned_by, assignment_reason,
                    affected_family_id, effective_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
            `, [
                removalRef, menteeConverseId, removalType,
                mentorConverseId, removedBy, reason,
                relationship.family_group_id
            ]);

            // Update legacy mentors table
            await connection.query(`
                UPDATE mentors 
                SET is_active = 0 
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            await connection.commit();

            return {
                success: true,
                removalRef,
                menteeConverseId,
                formerMentor: {
                    converseId: mentorConverseId,
                    familyId: relationship.family_group_id,
                    position: relationship.family_position
                },
                removalType,
                removedBy,
                reason,
                effectiveDate: new Date().toISOString(),
                message: `Successfully removed mentee from mentorship (${removalType})`
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    generateAssignmentRef(prefix = 'ASSIGN') {
        const timestamp = Date.now();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}_${timestamp}_${random}`;
    }

    getMentorTitle(level) {
        const titles = {
            5: 'Grand Master',
            4: 'Master Mentor',
            3: 'Senior Mentor',
            2: 'Advanced Mentor',
            1: 'Foundation Mentor'
        };
        return titles[level] || 'Unknown Level';
    }

    getWorkloadStatus(monthlyAssignments) {
        if (monthlyAssignments >= 15) return 'Heavy';
        if (monthlyAssignments >= 10) return 'Moderate';
        if (monthlyAssignments >= 5) return 'Light';
        return 'Very Light';
    }

    getExperienceDescription(level) {
        const descriptions = {
            5: 'Highest level - manages entire communities and trains master mentors',
            4: 'Senior leadership - oversees multiple mentor families',
            3: 'Experienced - guides advanced practitioners',
            2: 'Skilled - mentors intermediate learners',
            1: 'Foundation - guides new members and beginners'
        };
        return descriptions[level] || 'Unknown experience level';
    }

    /**
     * Get comprehensive mentorship statistics
     * @returns {object} System statistics
     */
    async getMentorshipSystemStats() {
        try {
            const stats = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM mentor_capacity_tracking) as total_mentors,
                    (SELECT COUNT(*) FROM mentorship_hierarchy WHERE is_active = 1) as total_active_relationships,
                    (SELECT COUNT(*) FROM mentorship_families WHERE is_active = 1) as total_families,
                    (SELECT SUM(direct_slots_available) FROM mentor_capacity_tracking) as available_slots,
                    (SELECT AVG(member_count) FROM mentorship_families WHERE is_active = 1) as avg_family_size,
                    (SELECT COUNT(*) FROM mentorship_assignment_history WHERE assignment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as assignments_this_month
            `);

            const levelDistribution = await db.query(`
                SELECT 
                    mentor_level,
                    COUNT(*) as count,
                    AVG(direct_slots_filled) as avg_mentees,
                    SUM(direct_slots_available) as available_slots
                FROM mentor_capacity_tracking 
                GROUP BY mentor_level 
                ORDER BY mentor_level DESC
            `);

            const capacityOverview = await db.query(`
                SELECT 
                    CASE 
                        WHEN direct_slots_available = 0 THEN 'Full'
                        WHEN direct_slots_available <= 2 THEN 'Nearly Full'
                        WHEN direct_slots_available <= 5 THEN 'Moderate'
                        ELSE 'High Availability'
                    END as capacity_status,
                    COUNT(*) as mentor_count
                FROM mentor_capacity_tracking
                GROUP BY capacity_status
            `);

            return {
                overview: stats[0],
                levelDistribution,
                capacityOverview,
                systemHealth: {
                    totalCapacity: stats[0].total_mentors * 12,
                    utilizationRate: ((stats[0].total_active_relationships / (stats[0].total_mentors * 12)) * 100).toFixed(1),
                    averageWaitTime: '2-3 days', // This would be calculated from actual data
                    systemStatus: stats[0].available_slots > 100 ? 'Healthy' : 'Near Capacity'
                }
            };
        } catch (error) {
            throw new CustomError(`Failed to get system statistics: ${error.message}`, 500);
        }
    }
}

export default new MentorshipServices();