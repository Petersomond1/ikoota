import db from '../config/db.js';

async function checkTables() {
    console.log('📊 Checking table structures...');
    
    try {
        console.log('\n🏛️ mentor_capacity_tracking:');
        const mentorCols = await db.query('DESCRIBE mentor_capacity_tracking');
        for (const col of mentorCols) {
            console.log(`  • ${col.Field} (${col.Type})`);
        }

        console.log('\n🏛️ mentorship_hierarchy:');
        const hierarchyCols = await db.query('DESCRIBE mentorship_hierarchy');
        for (const col of hierarchyCols) {
            console.log(`  • ${col.Field} (${col.Type})`);
        }

        console.log('\n🏛️ mentorship_families:');
        const familyCols = await db.query('DESCRIBE mentorship_families');
        for (const col of familyCols) {
            console.log(`  • ${col.Field} (${col.Type})`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkTables();