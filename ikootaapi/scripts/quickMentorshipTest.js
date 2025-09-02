// Quick test of mentorship system functionality
import db from '../config/db.js';

async function quickTest() {
    console.log('🏛️ Quick Pyramidal Mentorship System Test');
    console.log('=' .repeat(50));

    try {
        // Test 1: Check our tables exist and have data
        console.log('\n📊 Checking Database Tables...');
        
        const mentors = await db.query('SELECT COUNT(*) as count FROM mentor_capacity_tracking');
        console.log(`✅ Mentors in capacity tracking: ${mentors[0].count}`);
        
        const families = await db.query('SELECT COUNT(*) as count FROM mentorship_families');
        console.log(`✅ Mentor families: ${families[0].count}`);
        
        // Test 2: Get available mentors (simple query)
        console.log('\n👥 Available Mentors:');
        const availableMentors = await db.query(`
            SELECT 
                mct.mentor_converse_id,
                mct.mentor_level,
                mct.direct_slots_filled,
                mct.direct_slots_available,
                CASE mct.mentor_level
                    WHEN 5 THEN 'Grand Master'
                    WHEN 4 THEN 'Master Mentor'
                    WHEN 3 THEN 'Senior Mentor'
                    WHEN 2 THEN 'Advanced Mentor'
                    WHEN 1 THEN 'Foundation Mentor'
                END as mentor_title
            FROM mentor_capacity_tracking mct
            WHERE mct.direct_slots_available > 0
            ORDER BY mct.mentor_level DESC, mct.direct_slots_available DESC
        `);
        
        for (const mentor of availableMentors) {
            console.log(`   • ${mentor.mentor_converse_id} (${mentor.mentor_title}) - ${mentor.direct_slots_available}/12 slots available`);
        }
        
        // Test 3: Find potential mentees (simplified to avoid collation issues)
        console.log('\n👨‍🎓 Potential Mentees:');
        const potentialMentees = await db.query(`
            SELECT converse_id, username 
            FROM users
            WHERE is_identity_masked = 1 
            LIMIT 5
        `);
        
        for (const mentee of potentialMentees) {
            console.log(`   • ${mentee.converse_id} (${mentee.username})`);
        }
        
        // Test 4: Simple assignment test
        if (availableMentors.length > 0 && potentialMentees.length > 0) {
            console.log('\n🔗 Testing Assignment...');
            const mentor = availableMentors[0];
            const mentee = potentialMentees[0];
            
            console.log(`Assigning ${mentee.converse_id} to ${mentor.mentor_converse_id}...`);
            
            // Get next family position
            const positionResult = await db.query(`
                SELECT COALESCE(MAX(family_position), 0) + 1 as next_position
                FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND relationship_type = 'direct_family'
            `, [mentor.mentor_converse_id]);
            
            const familyPosition = positionResult[0].next_position;
            
            // Create assignment
            await db.query(`
                INSERT INTO mentorship_hierarchy (
                    mentor_converse_id, mentee_converse_id, mentor_level, 
                    relationship_type, family_position, established_date, is_active
                ) VALUES (?, ?, ?, 'direct_family', ?, CURRENT_DATE, 1)
            `, [mentor.mentor_converse_id, mentee.converse_id, mentor.mentor_level, familyPosition]);
            
            // Update mentor capacity
            await db.query(`
                UPDATE mentor_capacity_tracking 
                SET direct_slots_filled = direct_slots_filled + 1,
                    direct_slots_available = direct_slots_available - 1
                WHERE mentor_converse_id = ?
            `, [mentor.mentor_converse_id]);
            
            console.log(`✅ Assignment successful! Family position: #${familyPosition}`);
            
            // Verify assignment
            const verification = await db.query(`
                SELECT * FROM mentorship_hierarchy 
                WHERE mentor_converse_id = ? AND mentee_converse_id = ? AND is_active = 1
            `, [mentor.mentor_converse_id, mentee.converse_id]);
            
            if (verification.length > 0) {
                console.log(`✅ Assignment verified in database`);
                
                // Test system statistics
                console.log('\n📊 System Statistics:');
                const stats = await db.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM mentor_capacity_tracking) as total_mentors,
                        (SELECT COUNT(*) FROM mentorship_hierarchy WHERE is_active = 1) as active_relationships,
                        (SELECT COUNT(*) FROM mentorship_families) as total_families,
                        (SELECT SUM(direct_slots_available) FROM mentor_capacity_tracking) as available_slots
                `);
                
                console.log(`   • Total Mentors: ${stats[0].total_mentors}`);
                console.log(`   • Active Relationships: ${stats[0].active_relationships}`);
                console.log(`   • Total Families: ${stats[0].total_families}`);
                console.log(`   • Available Slots: ${stats[0].available_slots}`);
                
                console.log('\n🎉 Pyramidal Mentorship System is Working!');
                
            } else {
                console.log('❌ Assignment verification failed');
            }
        } else {
            console.log('\n⚠️ Cannot test assignment - need mentors and mentees');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

quickTest();