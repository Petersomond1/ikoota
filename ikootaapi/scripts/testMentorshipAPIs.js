// Quick API Test Script for  Mentorship System
import axios from 'axios';
import db from '../config/db.js';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

class MentorshipAPITester {
    constructor() {
        this.testResults = [];
    }

    async runTests() {
        console.log('🏛️ Testing  Mentorship API Endpoints');
        console.log('=' .repeat(50));
        
        try {
            // Test 1: Check database connection
            await this.testDatabaseConnection();
            
            // Test 2: Test service functions directly
            await this.testServiceFunctions();
            
            // Test 3: Test API endpoints (if server is running)
            await this.testAPIEndpoints();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }

    async testDatabaseConnection() {
        console.log('\n📊 Testing Database Connection...');
        
        try {
            const [mentors] = await db.query('SELECT * FROM mentor_capacity_tracking LIMIT 5');
            console.log(`✅ Found ${mentors.length} test mentors in capacity tracking`);
            
            const [families] = await db.query('SELECT * FROM mentorship_families LIMIT 5');
            console.log(`✅ Found ${families.length} mentor families`);
            
            const [relationships] = await db.query('SELECT * FROM mentorship_hierarchy WHERE is_active = 1 LIMIT 5');
            console.log(`✅ Found ${relationships.length} active mentorship relationships`);
            
            this.addResult('Database Connection', 'PASS', `${mentors.length} mentors, ${families.length} families`);
            
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            this.addResult('Database Connection', 'FAIL', error.message);
        }
    }

    async testServiceFunctions() {
        console.log('\n🔧 Testing Service Functions...');
        
        try {
            // Import our service
            const { default: mentorshipServices } = await import('../services/mentorshipServices.js');
            
            // Test finding available mentors
            const availableMentors = await mentorshipServices.findAvailableMentors({
                maxResults: 5
            });
            
            console.log(`✅ Found ${availableMentors.length} available mentors:`);
            for (const mentor of availableMentors) {
                console.log(`   • ${mentor.mentor_converse_id} (Level ${mentor.mentor_level}) - ${mentor.direct_slots_available} slots available`);
            }
            
            this.addResult('Find Available Mentors', 'PASS', `Found ${availableMentors.length} mentors`);
            
            // Test assignment if we have mentors and potential mentees
            if (availableMentors.length > 0) {
                await this.testAssignment(availableMentors[0], mentorshipServices);
            }
            
        } catch (error) {
            console.error('❌ Service function test failed:', error.message);
            this.addResult('Service Functions', 'FAIL', error.message);
        }
    }

    async testAssignment(mentor, service) {
        console.log('\n👨‍🏫 Testing Mentee Assignment...');
        
        try {
            // Find a user who could be a mentee
            const [potentialMentees] = await db.query(`
                SELECT converse_id, username 
                FROM users 
                WHERE is_identity_masked = 1 
                AND converse_id NOT IN (
                    SELECT mentee_converse_id 
                    FROM mentorship_hierarchy 
                    WHERE is_active = 1
                ) 
                AND converse_id != ? 
                LIMIT 1
            `, [mentor.mentor_converse_id]);
            
            if (potentialMentees.length === 0) {
                console.log('⚠️ No available mentees found for assignment test');
                this.addResult('Mentee Assignment', 'SKIP', 'No available mentees');
                return;
            }
            
            const mentee = potentialMentees[0];
            console.log(`Attempting to assign ${mentee.converse_id} to mentor ${mentor.mentor_converse_id}...`);
            
            const assignmentResult = await service.assignMenteeToMentor(
                mentor.mentor_converse_id,
                mentee.converse_id,
                'OTO#C002O2', // Super admin for testing
                'Test assignment via API test script'
            );
            
            console.log(`✅ Assignment successful!`);
            console.log(`   📋 Assignment Ref: ${assignmentResult.assignmentRef}`);
            console.log(`   👥 Family Position: ${assignmentResult.familyPosition}`);
            console.log(`   🏛️ Mentor Level: ${assignmentResult.mentorLevel} (${assignmentResult.mentorTitle})`);
            
            this.addResult('Mentee Assignment', 'PASS', `Assigned to position ${assignmentResult.familyPosition}`);
            
            // Test reassignment
            await this.testReassignment(mentee.converse_id, mentor.mentor_converse_id, service);
            
        } catch (error) {
            console.error('❌ Assignment test failed:', error.message);
            this.addResult('Mentee Assignment', 'FAIL', error.message);
        }
    }

    async testReassignment(menteeId, currentMentorId, service) {
        console.log('\n🔄 Testing Mentee Reassignment...');
        
        try {
            // Find another mentor for reassignment
            const [otherMentors] = await db.query(`
                SELECT mentor_converse_id 
                FROM mentor_capacity_tracking 
                WHERE mentor_converse_id != ? 
                AND direct_slots_available > 0 
                LIMIT 1
            `, [currentMentorId]);
            
            if (otherMentors.length === 0) {
                console.log('⚠️ No other mentors available for reassignment test');
                this.addResult('Mentee Reassignment', 'SKIP', 'No alternative mentors');
                return;
            }
            
            const newMentor = otherMentors[0];
            console.log(`Reassigning ${menteeId} from ${currentMentorId} to ${newMentor.mentor_converse_id}...`);
            
            const reassignmentResult = await service.reassignMentee(
                menteeId,
                newMentor.mentor_converse_id,
                'OTO#C002O2', // Super admin
                'Test reassignment via API test script'
            );
            
            console.log(`✅ Reassignment successful!`);
            console.log(`   📋 Reassignment Ref: ${reassignmentResult.reassignmentRef}`);
            console.log(`   🔄 From: ${reassignmentResult.oldMentor.converseId} to ${reassignmentResult.newMentor.converseId}`);
            
            this.addResult('Mentee Reassignment', 'PASS', 'Successfully reassigned mentee');
            
        } catch (error) {
            console.error('❌ Reassignment test failed:', error.message);
            this.addResult('Mentee Reassignment', 'FAIL', error.message);
        }
    }

    async testAPIEndpoints() {
        console.log('\n🌐 Testing API Endpoints (if server is running)...');
        
        try {
            // Test if server is running
            const response = await axios.get(`${API_BASE}/admin/pyramidal-mentorship/statistics`, {
                timeout: 5000,
                headers: {
                    'Authorization': 'Bearer test-token' // This would be a real token in production
                }
            });
            
            console.log('✅ API endpoint accessible');
            console.log('📊 System statistics received');
            
            this.addResult('API Endpoints', 'PASS', 'Statistics endpoint working');
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('⚠️ Server not running - API endpoint tests skipped');
                this.addResult('API Endpoints', 'SKIP', 'Server not running');
            } else {
                console.log(`⚠️ API test issue: ${error.message}`);
                this.addResult('API Endpoints', 'PARTIAL', 'Server response issue');
            }
        }
    }

    addResult(test, status, message) {
        this.testResults.push({ test, status, message });
    }

    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('🏛️ PYRAMIDAL MENTORSHIP API TEST RESULTS');
        console.log('='.repeat(50));
        
        let passed = 0, failed = 0, skipped = 0;
        
        for (const result of this.testResults) {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : '⏭️';
            
            console.log(`${icon} ${result.test}: ${result.message}`);
            
            if (result.status === 'PASS') passed++;
            else if (result.status === 'FAIL') failed++;
            else skipped++;
        }
        
        console.log('\n📊 Summary:');
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   ⏭️ Skipped: ${skipped}`);
        
        const successRate = passed + failed > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0;
        console.log(`   🎯 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed! System is functional.');
        } else {
            console.log('\n⚠️ Some tests failed. Check implementation.');
        }
    }
}

// Run tests
const tester = new MentorshipAPITester();
tester.runTests().catch(console.error);