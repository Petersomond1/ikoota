// Simplified mentorship services to avoid collation issues
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import crypto from 'crypto';

class SimpleMentorshipServices {

    /**
     * Find available mentors with capacity (simplified)
     */
    async findAvailableMentors(criteria = {}) {
        try {
            const {
                preferredLevel = null,
                maxResults = 10,
                minSlots = 1
            } = criteria;

            // Simple query to avoid collation issues
            const availableMentors = await db.query(`
                SELECT 
                    mentor_converse_id,
                    mentor_level,
                    direct_slots_filled,
                    direct_slots_available,
                    COALESCE(monthly_assignments, 0) as monthly_assignments,
                    COALESCE(performance_score, 0.5) as performance_score,
                    CASE mentor_level
                        WHEN 5 THEN 'Grand Master'
                        WHEN 4 THEN 'Master Mentor'
                        WHEN 3 THEN 'Senior Mentor'
                        WHEN 2 THEN 'Advanced Mentor'
                        WHEN 1 THEN 'Foundation Mentor'
                        ELSE 'Unknown Level'
                    END as mentor_title
                FROM mentor_capacity_tracking
                WHERE direct_slots_available >= ?
                  AND COALESCE(is_accepting_direct, 1) = 1
                ORDER BY mentor_level DESC, direct_slots_available DESC
                LIMIT ?
            `, [minSlots, maxResults]);

            return availableMentors;

        } catch (error) {
            throw new CustomError(`Failed to find available mentors: ${error.message}`, 500);
        }
    }

    /**
     * Assign mentee to mentor
     */
    async assignMenteeToMentor(mentorConverseId, menteeConverseId, assignedBy, reason) {
        try {
            // Generate assignment reference
            const assignmentRef = this.generateAssignmentRef();

            // Get mentor info
            const mentorInfo = await db.query(
                'SELECT mentor_level FROM mentor_capacity_tracking WHERE mentor_converse_id = ?',
                [mentorConverseId]
            );

            if (mentorInfo.length === 0) {
                throw new CustomError('Mentor not found in capacity tracking', 404);
            }

            const mentorLevel = mentorInfo[0].mentor_level;

            // Get next family position
            const positionResult = await db.query(`
                SELECT COALESCE(MAX(family_position), 0) + 1 as next_position
                FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND relationship_type = 'direct_family'
            `, [mentorConverseId]);

            const familyPosition = positionResult[0].next_position;

            // Create assignment (using only existing columns)
            await db.query(`
                INSERT INTO mentorship_hierarchy (
                    mentor_converse_id, mentee_converse_id, mentor_level, 
                    relationship_type, family_position, established_date, is_active
                ) VALUES (?, ?, ?, 'direct_family', ?, CURRENT_DATE, 1)
            `, [mentorConverseId, menteeConverseId, mentorLevel, familyPosition]);

            // Update mentor capacity
            await db.query(`
                UPDATE mentor_capacity_tracking 
                SET direct_slots_filled = direct_slots_filled + 1,
                    monthly_assignments = COALESCE(monthly_assignments, 0) + 1
                WHERE mentor_converse_id = ?
            `, [mentorConverseId]);

            // Record assignment history (commented out for now to avoid column issues)
            // await db.query(`
            //     INSERT INTO mentorship_assignment_history (
            //         assignment_ref, mentee_converse_id, action_type,
            //         new_mentor_converse_id, assigned_by, assignment_reason,
            //         effective_date
            //     ) VALUES (?, ?, 'initial_assignment', ?, ?, ?, CURRENT_DATE)
            // `, [assignmentRef, menteeConverseId, mentorConverseId, assignedBy, reason]);

            return {
                success: true,
                assignmentRef,
                mentorLevel,
                familyPosition,
                mentorTitle: this.getMentorTitle(mentorLevel)
            };

        } catch (error) {
            throw new CustomError(`Assignment failed: ${error.message}`, 500);
        }
    }

    /**
     * Reassign mentee to new mentor
     */
    async reassignMentee(menteeConverseId, newMentorConverseId, assignedBy, reason) {
        try {
            // Generate reassignment reference
            const reassignmentRef = this.generateAssignmentRef();

            // Get current assignment
            const currentAssignment = await db.query(`
                SELECT mentor_converse_id, mentor_level, family_position
                FROM mentorship_hierarchy 
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            if (currentAssignment.length === 0) {
                throw new CustomError('Mentee not currently assigned to any mentor', 404);
            }

            const oldMentorId = currentAssignment[0].mentor_converse_id;

            // Deactivate old assignment
            await db.query(`
                UPDATE mentorship_hierarchy 
                SET is_active = 0 
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);

            // Update old mentor capacity
            await db.query(`
                UPDATE mentor_capacity_tracking 
                SET direct_slots_filled = direct_slots_filled - 1
                WHERE mentor_converse_id = ?
            `, [oldMentorId]);

            // Create new assignment
            const newAssignment = await this.assignMenteeToMentor(
                newMentorConverseId, menteeConverseId, assignedBy, reason
            );

            // Record reassignment history (commented out for now to avoid column issues)
            // await db.query(`
            //     INSERT INTO mentorship_assignment_history (
            //         assignment_ref, mentee_converse_id, action_type,
            //         old_mentor_converse_id, new_mentor_converse_id,
            //         assigned_by, assignment_reason, effective_date
            //     ) VALUES (?, ?, 'reassignment', ?, ?, ?, ?, CURRENT_DATE)
            // `, [reassignmentRef, menteeConverseId, oldMentorId, newMentorConverseId, assignedBy, reason]);

            return {
                success: true,
                reassignmentRef,
                oldMentor: { converseId: oldMentorId },
                newMentor: { converseId: newMentorConverseId },
                ...newAssignment
            };

        } catch (error) {
            throw new CustomError(`Reassignment failed: ${error.message}`, 500);
        }
    }

    /**
     * Generate assignment reference
     */
    generateAssignmentRef() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `MS${timestamp}${random}`;
    }

    /**
     * Get mentor title by level
     */
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

    /**
     * Get system statistics
     */
    async getSystemStatistics() {
        try {
            const stats = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM mentor_capacity_tracking) as total_mentors,
                    (SELECT COUNT(*) FROM mentorship_hierarchy WHERE is_active = 1) as active_relationships,
                    (SELECT COUNT(*) FROM mentorship_families) as total_families,
                    (SELECT SUM(direct_slots_available) FROM mentor_capacity_tracking) as available_slots,
                    (SELECT SUM(direct_slots_filled) FROM mentor_capacity_tracking) as filled_slots
            `);

            return {
                totalMentors: stats[0].total_mentors,
                activeRelationships: stats[0].active_relationships,
                totalFamilies: stats[0].total_families,
                availableSlots: stats[0].available_slots,
                filledSlots: stats[0].filled_slots,
                systemCapacity: {
                    directSlots: stats[0].filled_slots + stats[0].available_slots,
                    utilizationRate: ((stats[0].filled_slots / (stats[0].filled_slots + stats[0].available_slots)) * 100).toFixed(1)
                }
            };

        } catch (error) {
            throw new CustomError(`Failed to get statistics: ${error.message}`, 500);
        }
    }
}

export default new SimpleMentorshipServices();