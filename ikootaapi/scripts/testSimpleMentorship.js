// Test script for simplified mentorship services
import db from '../config/db.js';
import SimpleMentorshipServices from '../services/mentorshipServicesSimple.js';

class SimpleMentorshipTester {
    constructor() {
        this.testResults = [];
    }

    async runTests() {
        console.log('🏛️ Testing Simplified Mentorship System');
        console.log('=' .repeat(50));
        
        try {
            // Test 1: Find available mentors
            await this.testFindMentors();
            
            // Test 2: Test assignment
            await this.testAssignment();
            
            // Test 3: Test system statistics
            await this.testStatistics();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        } finally {
            process.exit(0);
        }
    }

    async testFindMentors() {
        console.log('\n👥 Testing Find Available Mentors...');
        
        try {
            const mentors = await SimpleMentorshipServices.findAvailableMentors({ maxResults: 5 });
            
            console.log(`✅ Found ${mentors.length} available mentors:`);
            for (const mentor of mentors) {
                console.log(`   • ${mentor.mentor_converse_id} (${mentor.mentor_title}) - ${mentor.direct_slots_available} slots available`);
            }
            
            this.addResult('Find Available Mentors', 'PASS', `Found ${mentors.length} mentors`);
            
        } catch (error) {
            console.error('❌ Find mentors failed:', error.message);
            this.addResult('Find Available Mentors', 'FAIL', error.message);
        }
    }

    async testAssignment() {
        console.log('\n🔗 Testing Mentee Assignment...');
        
        try {
            // Get available mentor
            const mentors = await SimpleMentorshipServices.findAvailableMentors({ maxResults: 1 });
            if (mentors.length === 0) {
                console.log('⚠️ No mentors available for assignment test');
                this.addResult('Mentee Assignment', 'SKIP', 'No available mentors');
                return;
            }
            
            // Get a potential mentee
            const potentialMentees = await db.query(`
                SELECT converse_id, username 
                FROM users 
                WHERE is_identity_masked = 1 
                AND converse_id != ?
                LIMIT 1
            `, [mentors[0].mentor_converse_id]);
            
            if (potentialMentees.length === 0) {
                console.log('⚠️ No mentees available for assignment test');
                this.addResult('Mentee Assignment', 'SKIP', 'No available mentees');
                return;
            }
            
            const mentor = mentors[0];
            const mentee = potentialMentees[0];
            
            console.log(`Assigning ${mentee.converse_id} to ${mentor.mentor_converse_id}...`);
            
            const result = await SimpleMentorshipServices.assignMenteeToMentor(
                mentor.mentor_converse_id,
                mentee.converse_id,
                'OTO#C002O2', // Super admin for testing
                'Test assignment via simple API test'
            );
            
            console.log(`✅ Assignment successful!`);
            console.log(`   📋 Assignment Ref: ${result.assignmentRef}`);
            console.log(`   👥 Family Position: ${result.familyPosition}`);
            console.log(`   🏛️ Mentor Level: ${result.mentorLevel} (${result.mentorTitle})`);
            
            this.addResult('Mentee Assignment', 'PASS', `Assigned to position ${result.familyPosition}`);
            
        } catch (error) {
            console.error('❌ Assignment test failed:', error.message);
            this.addResult('Mentee Assignment', 'FAIL', error.message);
        }
    }

    async testStatistics() {
        console.log('\n📊 Testing System Statistics...');
        
        try {
            const stats = await SimpleMentorshipServices.getSystemStatistics();
            
            console.log(`✅ System statistics retrieved:`);
            console.log(`   • Total Mentors: ${stats.totalMentors}`);
            console.log(`   • Active Relationships: ${stats.activeRelationships}`);
            console.log(`   • Total Families: ${stats.totalFamilies}`);
            console.log(`   • Available Slots: ${stats.availableSlots}`);
            console.log(`   • Utilization Rate: ${stats.systemCapacity.utilizationRate}%`);
            
            this.addResult('System Statistics', 'PASS', `${stats.activeRelationships} relationships tracked`);
            
        } catch (error) {
            console.error('❌ Statistics test failed:', error.message);
            this.addResult('System Statistics', 'FAIL', error.message);
        }
    }

    addResult(test, status, message) {
        this.testResults.push({ test, status, message });
    }

    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('🏛️ SIMPLIFIED MENTORSHIP TEST RESULTS');
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
            console.log('\n🎉 All tests passed! Simplified system is functional.');
        } else {
            console.log('\n⚠️ Some tests failed. Check implementation.');
        }
    }
}

// Run tests
const tester = new SimpleMentorshipTester();
tester.runTests().catch(console.error);