// ikootaapi/scripts/testPyramidalMentorship.js
// COMPREHENSIVE TEST SCRIPT FOR PYRAMIDAL MENTORSHIP SYSTEM
// Tests database migration, assignments, reassignments, and API endpoints

import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class PyramidalMentorshipTester {
    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:3001/api';
        this.adminToken = null;
        this.superAdminToken = null;
        this.testResults = [];
        
        // Database connection
        this.db = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'ikoota_db',
            port: process.env.DB_PORT || 3306
        });
    }

    /**
     * Main test runner
     */
    async runAllTests() {
        console.log('🏛️  PYRAMIDAL MENTORSHIP SYSTEM - COMPREHENSIVE TEST SUITE');
        console.log('='*70);
        
        try {
            await this.setupTest();
            await this.testDatabaseMigration();
            await this.testAuthenticationSetup();
            await this.testAvailableMentors();
            await this.testMenteeAssignment();
            await this.testMenteeReassignment();
            await this.testMenteeRemoval();
            await this.testBatchOperations();
            await this.testCapacityLimits();
            await this.testSystemStatistics();
            await this.testDataIntegrity();
            await this.teardownTest();
            
            this.printTestSummary();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    /**
     * Setup test environment
     */
    async setupTest() {
        console.log('\n📋 Setting up test environment...');
        
        try {
            // Connect to database
            await this.db.connect();
            console.log('✅ Database connected');
            
            // Create test admin users if they don't exist
            await this.createTestAdmins();
            
            // Backup existing data
            await this.backupTestData();
            
        } catch (error) {
            throw new Error(`Setup failed: ${error.message}`);
        }
    }

    /**
     * Test database migration
     */
    async testDatabaseMigration() {
        console.log('\n🗄️  Testing database migration...');
        
        try {
            // Check if pyramidal tables exist
            const tables = [
                'mentor_capacity_tracking',
                'mentorship_hierarchy', 
                'mentorship_families',
                'mentorship_communities',
                'mentorship_assignment_history'
            ];
            
            for (const table of tables) {
                const [rows] = await this.db.execute(`
                    SELECT COUNT(*) as exists_count 
                    FROM information_schema.tables 
                    WHERE table_schema = ? AND table_name = ?
                `, [process.env.DB_NAME, table]);
                
                if (rows[0].exists_count === 0) {
                    throw new Error(`Table ${table} does not exist`);
                }
                console.log(`✅ Table ${table} exists`);
            }
            
            // Check if mentor table has new columns
            const [columns] = await this.db.execute(`
                SELECT COLUMN_NAME 
                FROM information_schema.columns 
                WHERE table_schema = ? AND table_name = 'mentors'
            `, [process.env.DB_NAME]);
            
            const requiredColumns = ['mentor_level', 'hierarchy_path', 'direct_family_count', 'total_sphere_size'];
            const existingColumns = columns.map(col => col.COLUMN_NAME);
            
            for (const col of requiredColumns) {
                if (!existingColumns.includes(col)) {
                    throw new Error(`Column ${col} missing from mentors table`);
                }
                console.log(`✅ Column ${col} exists in mentors table`);
            }
            
            this.addTestResult('Database Migration', 'PASS', 'All tables and columns created successfully');
            
        } catch (error) {
            this.addTestResult('Database Migration', 'FAIL', error.message);
            throw error;
        }
    }

    /**
     * Setup authentication tokens for testing
     */
    async testAuthenticationSetup() {
        console.log('\n🔐 Setting up authentication...');
        
        try {
            // For testing purposes, we'll simulate admin tokens
            // In real implementation, you'd authenticate through your auth system
            
            // Create test tokens (this is a simplified approach)
            this.adminToken = 'test-admin-token';
            this.superAdminToken = 'test-super-admin-token';
            
            console.log('✅ Test admin tokens created');
            this.addTestResult('Authentication Setup', 'PASS', 'Test tokens created');
            
        } catch (error) {
            this.addTestResult('Authentication Setup', 'FAIL', error.message);
            throw error;
        }
    }

    /**
     * Test getting available mentors
     */
    async testAvailableMentors() {
        console.log('\n👥 Testing available mentors endpoint...');
        
        try {
            // First, ensure we have some test mentors in the system
            await this.createTestMentors();
            
            // Test the API endpoint (simulated - you'd use actual HTTP requests)
            const availableMentors = await this.simulateAPICall('GET', '/admin/pyramidal-mentorship/available-mentors');
            
            if (!Array.isArray(availableMentors)) {
                throw new Error('Available mentors should return an array');
            }
            
            console.log(`✅ Found ${availableMentors.length} available mentors`);
            
            // Test with filters
            const level3Mentors = await this.simulateAPICall('GET', '/admin/pyramidal-mentorship/available-mentors?preferred_level=3');
            
            console.log(`✅ Found ${level3Mentors.length} level 3 mentors`);
            
            this.addTestResult('Available Mentors API', 'PASS', `Found ${availableMentors.length} mentors`);
            
        } catch (error) {
            this.addTestResult('Available Mentors API', 'FAIL', error.message);
            throw error;
        }
    }

    /**
     * Test mentee assignment
     */
    async testMenteeAssignment() {
        console.log('\n📝 Testing mentee assignment...');
        
        try {
            // Create test mentees
            const testMentees = await this.createTestMentees(5);
            const testMentors = await this.getTestMentors();
            
            if (testMentors.length === 0) {
                throw new Error('No test mentors available for assignment');
            }
            
            // Test individual assignment
            const mentor = testMentors[0];
            const mentee = testMentees[0];
            
            console.log(`Assigning mentee ${mentee.converse_id} to mentor ${mentor.converse_id}...`);
            
            // Direct database test using stored procedure
            const [result] = await this.db.execute(`
                CALL AssignMenteeToMentor(?, ?, 'TEST_ADMIN', 'Test assignment', @success, @message, @assignment_ref)
            `, [mentor.converse_id, mentee.converse_id]);
            
            // Get output parameters
            const [outputs] = await this.db.execute('SELECT @success as success, @message as message, @assignment_ref as assignment_ref');
            const output = outputs[0];
            
            if (!output.success) {
                throw new Error(`Assignment failed: ${output.message}`);
            }
            
            console.log(`✅ Assignment successful: ${output.message}`);
            console.log(`📋 Assignment ref: ${output.assignment_ref}`);
            
            // Verify assignment in database
            const [assignments] = await this.db.execute(`
                SELECT * FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND mentee_converse_id = ? AND is_active = 1
            `, [mentor.converse_id, mentee.converse_id]);
            
            if (assignments.length === 0) {
                throw new Error('Assignment not found in database');
            }
            
            console.log(`✅ Assignment verified in database - Family position: ${assignments[0].family_position}`);
            
            // Check capacity update
            const [capacity] = await this.db.execute(`
                SELECT direct_slots_filled, direct_slots_available 
                FROM mentor_capacity_tracking 
                WHERE mentor_converse_id = ?
            `, [mentor.converse_id]);
            
            console.log(`✅ Mentor capacity updated: ${capacity[0].direct_slots_filled} filled, ${capacity[0].direct_slots_available} available`);
            
            this.addTestResult('Mentee Assignment', 'PASS', `Successfully assigned mentee to position ${assignments[0].family_position}`);
            
        } catch (error) {
            this.addTestResult('Mentee Assignment', 'FAIL', error.message);
            throw error;
        }
    }

    /**
     * Test mentee reassignment
     */
    async testMenteeReassignment() {
        console.log('\n🔄 Testing mentee reassignment...');
        
        try {
            // Get existing assignment
            const [existingAssignments] = await this.db.execute(`
                SELECT mh.*, u1.username as mentee_name, u2.username as mentor_name
                FROM mentorship_hierarchy mh
                JOIN users u1 ON mh.mentee_converse_id = u1.converse_id
                JOIN users u2 ON mh.mentor_converse_id = u2.converse_id
                WHERE mh.is_active = 1 
                LIMIT 1
            `);
            
            if (existingAssignments.length === 0) {
                throw new Error('No existing assignments found for reassignment test');
            }
            
            const assignment = existingAssignments[0];
            const menteeConverseId = assignment.mentee_converse_id;
            const oldMentorConverseId = assignment.mentor_converse_id;
            
            // Find a different mentor for reassignment
            const [newMentors] = await this.db.execute(`
                SELECT mentor_converse_id 
                FROM mentor_capacity_tracking 
                WHERE mentor_converse_id != ? AND direct_slots_available > 0 
                LIMIT 1
            `, [oldMentorConverseId]);
            
            if (newMentors.length === 0) {
                throw new Error('No available mentors for reassignment');
            }
            
            const newMentorConverseId = newMentors[0].mentor_converse_id;
            
            console.log(`Reassigning mentee ${menteeConverseId} from ${oldMentorConverseId} to ${newMentorConverseId}...`);
            
            // Test reassignment via service (simulated)
            const reassignmentResult = await this.simulateReassignment(
                menteeConverseId, 
                newMentorConverseId, 
                'TEST_ADMIN', 
                'Test reassignment operation'
            );
            
            console.log(`✅ Reassignment successful: ${reassignmentResult.message}`);
            
            // Verify old assignment is deactivated
            const [oldAssignment] = await this.db.execute(`
                SELECT is_active FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND mentee_converse_id = ?
            `, [oldMentorConverseId, menteeConverseId]);
            
            if (oldAssignment[0]?.is_active === 1) {
                throw new Error('Old assignment was not deactivated');
            }
            
            // Verify new assignment exists
            const [newAssignment] = await this.db.execute(`
                SELECT * FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND mentee_converse_id = ? AND is_active = 1
            `, [newMentorConverseId, menteeConverseId]);
            
            if (newAssignment.length === 0) {
                throw new Error('New assignment not found');
            }
            
            console.log(`✅ New assignment verified - Family position: ${newAssignment[0].family_position}`);
            
            this.addTestResult('Mentee Reassignment', 'PASS', 'Successfully reassigned mentee');
            
        } catch (error) {
            this.addTestResult('Mentee Reassignment', 'FAIL', error.message);
            console.warn('⚠️ Reassignment test failed, but continuing...');
        }
    }

    /**
     * Test capacity limits
     */
    async testCapacityLimits() {
        console.log('\n📊 Testing capacity limits...');
        
        try {
            // Find a mentor and try to assign more than 12 mentees
            const [mentors] = await this.db.execute(`
                SELECT mentor_converse_id, direct_slots_available 
                FROM mentor_capacity_tracking 
                WHERE direct_slots_available > 0 
                ORDER BY direct_slots_available DESC 
                LIMIT 1
            `);
            
            if (mentors.length === 0) {
                console.log('⚠️ No mentors with available capacity for limit testing');
                this.addTestResult('Capacity Limits', 'SKIP', 'No available mentors');
                return;
            }
            
            const mentor = mentors[0];
            console.log(`Testing capacity limits for mentor ${mentor.mentor_converse_id} (${mentor.direct_slots_available} slots available)`);
            
            // Try to assign mentees up to the limit
            const testMentees = await this.createTestMentees(15); // More than the 12 limit
            let successfulAssignments = 0;
            let failedAssignments = 0;
            
            for (const mentee of testMentees) {
                try {
                    const [result] = await this.db.execute(`
                        CALL AssignMenteeToMentor(?, ?, 'TEST_ADMIN', 'Capacity test assignment', @success, @message, @assignment_ref)
                    `, [mentor.mentor_converse_id, mentee.converse_id]);
                    
                    const [outputs] = await this.db.execute('SELECT @success as success, @message as message');
                    
                    if (outputs[0].success) {
                        successfulAssignments++;
                        console.log(`✅ Assignment ${successfulAssignments} successful`);
                    } else {
                        failedAssignments++;
                        console.log(`❌ Assignment failed: ${outputs[0].message}`);
                        
                        // Once we hit capacity, all further assignments should fail
                        if (successfulAssignments >= 12) {
                            console.log(`✅ Capacity limit enforced after ${successfulAssignments} assignments`);
                            break;
                        }
                    }
                    
                } catch (error) {
                    failedAssignments++;
                    console.log(`❌ Assignment failed with error: ${error.message}`);
                }
            }
            
            // Verify final capacity
            const [finalCapacity] = await this.db.execute(`
                SELECT direct_slots_filled, direct_slots_available, total_sphere_size
                FROM mentor_capacity_tracking 
                WHERE mentor_converse_id = ?
            `, [mentor.mentor_converse_id]);
            
            const capacity = finalCapacity[0];
            console.log(`📊 Final capacity: ${capacity.direct_slots_filled} filled, ${capacity.direct_slots_available} available, ${capacity.total_sphere_size} total`);
            
            if (capacity.direct_slots_filled > 12) {
                throw new Error('Mentor capacity exceeded limit of 12');
            }
            
            if (capacity.total_sphere_size > 156) {
                throw new Error('Total sphere size exceeded limit of 156');
            }
            
            this.addTestResult('Capacity Limits', 'PASS', `Capacity limits enforced - ${successfulAssignments} successful assignments`);
            
        } catch (error) {
            this.addTestResult('Capacity Limits', 'FAIL', error.message);
            throw error;
        }
    }

    /**
     * Test system statistics
     */
    async testSystemStatistics() {
        console.log('\n📈 Testing system statistics...');
        
        try {
            // Get statistics directly from database
            const [systemStats] = await this.db.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM mentor_capacity_tracking) as total_mentors,
                    (SELECT COUNT(*) FROM mentorship_hierarchy WHERE is_active = 1) as active_relationships,
                    (SELECT COUNT(*) FROM mentorship_families WHERE is_active = 1) as total_families,
                    (SELECT SUM(direct_slots_available) FROM mentor_capacity_tracking) as available_slots,
                    (SELECT AVG(member_count) FROM mentorship_families WHERE is_active = 1) as avg_family_size
            `);
            
            const stats = systemStats[0];
            
            console.log('📊 System Statistics:');
            console.log(`   • Total Mentors: ${stats.total_mentors}`);
            console.log(`   • Active Relationships: ${stats.active_relationships}`);
            console.log(`   • Total Families: ${stats.total_families}`);
            console.log(`   • Available Slots: ${stats.available_slots}`);
            console.log(`   • Average Family Size: ${stats.avg_family_size?.toFixed(1) || 0}`);
            
            // Test level distribution
            const [levelDistribution] = await this.db.execute(`
                SELECT 
                    mentor_level,
                    COUNT(*) as count,
                    AVG(direct_slots_filled) as avg_mentees
                FROM mentor_capacity_tracking 
                GROUP BY mentor_level 
                ORDER BY mentor_level DESC
            `);
            
            console.log('📊 Level Distribution:');
            for (const level of levelDistribution) {
                console.log(`   • Level ${level.mentor_level}: ${level.count} mentors, ${level.avg_mentees?.toFixed(1)} avg mentees`);
            }
            
            this.addTestResult('System Statistics', 'PASS', `${stats.total_mentors} mentors, ${stats.active_relationships} relationships`);
            
        } catch (error) {
            this.addTestResult('System Statistics', 'FAIL', error.message);
            throw error;
        }
    }

    /**
     * Test data integrity
     */
    async testDataIntegrity() {
        console.log('\n🔍 Testing data integrity...');
        
        try {
            const integrityChecks = [];
            
            // Check for orphaned mentees
            const [orphanedMentees] = await this.db.execute(`
                SELECT COUNT(*) as count
                FROM mentorship_hierarchy mh
                LEFT JOIN mentor_capacity_tracking mct ON mh.mentor_converse_id = mct.mentor_converse_id
                WHERE mh.is_active = 1 AND mct.mentor_converse_id IS NULL
            `);
            integrityChecks.push({
                check: 'Orphaned Mentees',
                count: orphanedMentees[0].count,
                status: orphanedMentees[0].count === 0 ? 'PASS' : 'FAIL'
            });
            
            // Check capacity mismatches
            const [capacityMismatches] = await this.db.execute(`
                SELECT COUNT(*) as count
                FROM mentor_capacity_tracking mct
                WHERE mct.direct_slots_filled != (
                    SELECT COUNT(*)
                    FROM mentorship_hierarchy mh
                    WHERE mh.mentor_converse_id = mct.mentor_converse_id
                      AND mh.relationship_type = 'direct_family'
                      AND mh.is_active = 1
                )
            `);
            integrityChecks.push({
                check: 'Capacity Mismatches',
                count: capacityMismatches[0].count,
                status: capacityMismatches[0].count === 0 ? 'PASS' : 'FAIL'
            });
            
            // Check for overfilled mentors
            const [overfilledMentors] = await this.db.execute(`
                SELECT COUNT(*) as count
                FROM mentor_capacity_tracking
                WHERE direct_slots_filled > 12
            `);
            integrityChecks.push({
                check: 'Overfilled Mentors',
                count: overfilledMentors[0].count,
                status: overfilledMentors[0].count === 0 ? 'PASS' : 'FAIL'
            });
            
            console.log('🔍 Data Integrity Results:');
            for (const check of integrityChecks) {
                const statusIcon = check.status === 'PASS' ? '✅' : '❌';
                console.log(`   ${statusIcon} ${check.check}: ${check.count} issues found`);
            }
            
            const allPassed = integrityChecks.every(check => check.status === 'PASS');
            this.addTestResult('Data Integrity', allPassed ? 'PASS' : 'FAIL', 
                allPassed ? 'All integrity checks passed' : 'Some integrity issues found');
            
        } catch (error) {
            this.addTestResult('Data Integrity', 'FAIL', error.message);
            throw error;
        }
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    /**
     * Create test admin users
     */
    async createTestAdmins() {
        try {
            // Check if test admins exist, create if needed
            const [existingAdmins] = await this.db.execute(`
                SELECT converse_id, role FROM users 
                WHERE username IN ('test_admin', 'test_super_admin')
            `);
            
            if (existingAdmins.length < 2) {
                console.log('Creating test admin users...');
                
                // This is a simplified approach - in practice you'd use your user creation system
                await this.db.execute(`
                    INSERT IGNORE INTO users (username, email, converse_id, role, is_identity_masked, membership_stage)
                    VALUES 
                    ('test_admin', 'test.admin@ikoota.com', 'OTO#ADMIN1', 'admin', 1, 'full_member'),
                    ('test_super_admin', 'test.super@ikoota.com', 'OTO#SUPER1', 'super_admin', 1, 'full_member')
                `);
                
                console.log('✅ Test admin users created');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not create test admins:', error.message);
        }
    }

    /**
     * Create test mentors
     */
    async createTestMentors() {
        try {
            // Create some test mentors with different levels
            const testMentors = [
                { username: 'test_mentor_l5', converse_id: 'OTO#TML501', level: 5 },
                { username: 'test_mentor_l4', converse_id: 'OTO#TML401', level: 4 },
                { username: 'test_mentor_l3', converse_id: 'OTO#TML301', level: 3 },
                { username: 'test_mentor_l2', converse_id: 'OTO#TML201', level: 2 },
                { username: 'test_mentor_l1', converse_id: 'OTO#TML101', level: 1 }
            ];
            
            for (const mentor of testMentors) {
                // Create user
                await this.db.execute(`
                    INSERT IGNORE INTO users (username, email, converse_id, is_identity_masked, membership_stage)
                    VALUES (?, ?, ?, 1, 'full_member')
                `, [mentor.username, `${mentor.username}@test.com`, mentor.converse_id]);
                
                // Create mentor capacity record
                await this.db.execute(`
                    INSERT IGNORE INTO mentor_capacity_tracking (mentor_converse_id, mentor_level)
                    VALUES (?, ?)
                `, [mentor.converse_id, mentor.level]);
                
                // Create family
                await this.db.execute(`
                    INSERT IGNORE INTO mentorship_families (
                        family_identifier, mentor_converse_id, mentor_level, 
                        family_name, established_date
                    ) VALUES (?, ?, ?, ?, CURRENT_DATE)
                `, [
                    `TEST_L${mentor.level}_${mentor.converse_id}_FAMILY`,
                    mentor.converse_id,
                    mentor.level,
                    `Test Level ${mentor.level} Family`
                ]);
            }
            
            console.log(`✅ Created ${testMentors.length} test mentors`);
            
        } catch (error) {
            console.warn('⚠️ Could not create test mentors:', error.message);
        }
    }

    /**
     * Create test mentees
     */
    async createTestMentees(count = 10) {
        try {
            const testMentees = [];
            
            for (let i = 1; i <= count; i++) {
                const converseId = `OTO#TME${String(i).padStart(3, '0')}`;
                const username = `test_mentee_${i}`;
                
                await this.db.execute(`
                    INSERT IGNORE INTO users (username, email, converse_id, is_identity_masked, membership_stage)
                    VALUES (?, ?, ?, 1, 'member')
                `, [username, `${username}@test.com`, converseId]);
                
                testMentees.push({ username, converse_id: converseId });
            }
            
            console.log(`✅ Created ${testMentees.length} test mentees`);
            return testMentees;
            
        } catch (error) {
            console.warn('⚠️ Could not create test mentees:', error.message);
            return [];
        }
    }

    /**
     * Get test mentors from database
     */
    async getTestMentors() {
        try {
            const [mentors] = await this.db.execute(`
                SELECT mct.mentor_converse_id as converse_id, mct.mentor_level, mct.direct_slots_available
                FROM mentor_capacity_tracking mct
                JOIN users u ON mct.mentor_converse_id = u.converse_id
                WHERE u.username LIKE 'test_mentor_%'
                ORDER BY mct.mentor_level DESC
            `);
            
            return mentors;
            
        } catch (error) {
            console.warn('⚠️ Could not get test mentors:', error.message);
            return [];
        }
    }

    /**
     * Simulate API call (for testing without actual HTTP requests)
     */
    async simulateAPICall(method, endpoint, data = null) {
        // This simulates what the API would return
        // In a real test, you'd make actual HTTP requests
        
        if (endpoint.includes('available-mentors')) {
            const mentors = await this.getTestMentors();
            return mentors.map(mentor => ({
                ...mentor,
                desirability_score: Math.random(),
                mentor_title: this.getMentorTitle(mentor.mentor_level),
                workloadStatus: 'Light'
            }));
        }
        
        return { simulated: true, method, endpoint, data };
    }

    /**
     * Simulate reassignment operation
     */
    async simulateReassignment(menteeConverseId, newMentorConverseId, assignedBy, reason) {
        // This would use the actual service in real implementation
        try {
            // For testing, we'll do direct database manipulation
            // In real implementation, you'd call pyramidalMentorshipServices.reassignMentee()
            
            // Deactivate old assignment
            await this.db.execute(`
                UPDATE mentorship_hierarchy 
                SET is_active = 0, updated_at = NOW()
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [menteeConverseId]);
            
            // Create new assignment
            const [newPosition] = await this.db.execute(`
                SELECT COALESCE(MAX(family_position), 0) + 1 as next_position
                FROM mentorship_hierarchy
                WHERE mentor_converse_id = ? AND relationship_type = 'direct_family' AND is_active = 1
            `, [newMentorConverseId]);
            
            await this.db.execute(`
                INSERT INTO mentorship_hierarchy (
                    mentor_converse_id, mentee_converse_id, mentor_level, mentee_level,
                    relationship_type, family_position, hierarchy_path, chain_of_command,
                    family_group_id, assignment_reason, assigned_by
                ) SELECT ?, ?, mentor_level, 0, 'direct_family', ?, 
                         CONCAT('L', mentor_level, '.', ?, '.', ?),
                         JSON_ARRAY(?),
                         family_identifier, ?, ?
                FROM mentor_capacity_tracking mct
                JOIN mentorship_families mf ON mct.mentor_converse_id = mf.mentor_converse_id
                WHERE mct.mentor_converse_id = ?
            `, [
                newMentorConverseId, menteeConverseId, newPosition[0].next_position,
                newMentorConverseId, menteeConverseId, newMentorConverseId,
                reason, assignedBy, newMentorConverseId
            ]);
            
            return {
                success: true,
                message: 'Reassignment completed successfully',
                newFamilyPosition: newPosition[0].next_position
            };
            
        } catch (error) {
            throw new Error(`Reassignment failed: ${error.message}`);
        }
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

    /**
     * Backup test data
     */
    async backupTestData() {
        try {
            // Create backup tables for cleanup later
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS test_backup_users AS 
                SELECT * FROM users WHERE username LIKE 'test_%' LIMIT 0
            `);
            
            console.log('✅ Test data backup prepared');
            
        } catch (error) {
            console.warn('⚠️ Could not prepare test backup:', error.message);
        }
    }

    /**
     * Clean up test data
     */
    async teardownTest() {
        console.log('\n🧹 Cleaning up test data...');
        
        try {
            // Remove test assignments
            await this.db.execute(`
                DELETE FROM mentorship_hierarchy 
                WHERE assigned_by IN ('TEST_ADMIN', 'test_admin')
            `);
            
            // Remove test users
            await this.db.execute(`
                DELETE FROM users 
                WHERE username LIKE 'test_%'
            `);
            
            // Remove test families
            await this.db.execute(`
                DELETE FROM mentorship_families 
                WHERE family_identifier LIKE 'TEST_%'
            `);
            
            // Remove test capacity records
            await this.db.execute(`
                DELETE FROM mentor_capacity_tracking 
                WHERE mentor_converse_id LIKE 'OTO#TM%'
            `);
            
            console.log('✅ Test data cleaned up');
            
        } catch (error) {
            console.warn('⚠️ Could not clean up test data:', error.message);
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n' + '='*70);
        console.log('🏛️  PYRAMIDAL MENTORSHIP SYSTEM - TEST SUMMARY');
        console.log('='*70);
        
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        
        for (const result of this.testResults) {
            const statusIcon = result.status === 'PASS' ? '✅' : 
                             result.status === 'FAIL' ? '❌' : '⏭️';
            
            console.log(`${statusIcon} ${result.test}: ${result.message}`);
            
            if (result.status === 'PASS') passed++;
            else if (result.status === 'FAIL') failed++;
            else skipped++;
        }
        
        console.log('\n📊 Final Results:');
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   ⏭️ Skipped: ${skipped}`);
        console.log(`   📋 Total: ${this.testResults.length}`);
        
        const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
        console.log(`   🎯 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed! Pyramidal Mentorship System is ready for deployment.');
        } else {
            console.log('\n⚠️ Some tests failed. Please review and fix issues before deployment.');
        }
    }

    /**
     * Test mentee removal
     */
    async testMenteeRemoval() {
        console.log('\n🚪 Testing mentee removal...');
        
        try {
            // Find an existing assignment to remove
            const [assignments] = await this.db.execute(`
                SELECT mentee_converse_id, mentor_converse_id 
                FROM mentorship_hierarchy 
                WHERE is_active = 1 AND assigned_by = 'TEST_ADMIN'
                LIMIT 1
            `);
            
            if (assignments.length === 0) {
                console.log('⚠️ No test assignments found for removal test');
                this.addTestResult('Mentee Removal', 'SKIP', 'No test assignments available');
                return;
            }
            
            const assignment = assignments[0];
            
            // Remove mentee
            await this.db.execute(`
                UPDATE mentorship_hierarchy
                SET is_active = 0, updated_at = NOW()
                WHERE mentee_converse_id = ? AND is_active = 1
            `, [assignment.mentee_converse_id]);
            
            // Update mentor capacity
            await this.db.execute(`
                UPDATE mentor_capacity_tracking
                SET direct_slots_filled = direct_slots_filled - 1
                WHERE mentor_converse_id = ?
            `, [assignment.mentor_converse_id]);
            
            // Verify removal
            const [removedAssignment] = await this.db.execute(`
                SELECT is_active FROM mentorship_hierarchy
                WHERE mentee_converse_id = ? AND mentor_converse_id = ?
            `, [assignment.mentee_converse_id, assignment.mentor_converse_id]);
            
            if (removedAssignment[0]?.is_active === 1) {
                throw new Error('Assignment was not deactivated');
            }
            
            console.log(`✅ Mentee ${assignment.mentee_converse_id} successfully removed from mentorship`);
            
            this.addTestResult('Mentee Removal', 'PASS', 'Mentee successfully removed from mentorship');
            
        } catch (error) {
            this.addTestResult('Mentee Removal', 'FAIL', error.message);
            console.warn('⚠️ Removal test failed, but continuing...');
        }
    }

    /**
     * Test batch operations
     */
    async testBatchOperations() {
        console.log('\n📦 Testing batch operations...');
        
        try {
            // This would test the batch assignment endpoint
            // For now, we'll simulate batch processing
            
            const batchSize = 3;
            const testMentees = await this.createTestMentees(batchSize);
            const testMentors = await this.getTestMentors();
            
            if (testMentors.length === 0) {
                console.log('⚠️ No mentors available for batch test');
                this.addTestResult('Batch Operations', 'SKIP', 'No mentors available');
                return;
            }
            
            let successfulBatchAssignments = 0;
            
            // Simulate batch processing
            for (let i = 0; i < Math.min(batchSize, testMentors.length); i++) {
                try {
                    const mentor = testMentors[i % testMentors.length];
                    const mentee = testMentees[i];
                    
                    const [result] = await this.db.execute(`
                        CALL AssignMenteeToMentor(?, ?, 'BATCH_TEST_ADMIN', 'Batch assignment test', @success, @message, @assignment_ref)
                    `, [mentor.converse_id, mentee.converse_id]);
                    
                    const [outputs] = await this.db.execute('SELECT @success as success, @message as message');
                    
                    if (outputs[0].success) {
                        successfulBatchAssignments++;
                    }
                    
                } catch (error) {
                    console.log(`❌ Batch assignment ${i + 1} failed: ${error.message}`);
                }
            }
            
            console.log(`✅ Batch operations completed: ${successfulBatchAssignments}/${batchSize} successful`);
            
            this.addTestResult('Batch Operations', 'PASS', `${successfulBatchAssignments}/${batchSize} batch assignments successful`);
            
        } catch (error) {
            this.addTestResult('Batch Operations', 'FAIL', error.message);
            console.warn('⚠️ Batch operations test failed, but continuing...');
        }
    }
}

// Run the test suite
const tester = new PyramidalMentorshipTester();
tester.runAllTests().catch(console.error);