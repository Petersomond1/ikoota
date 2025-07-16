//ikootaapi\scripts\setupTestUsers.js
import db from '../config/db.js'; // ✅ FIXED: Import default export
import { 
    generateConverseId, 
    updateUserProfile, 
    assignConverseIdToUser, 
    assignConverseIdsToUsersWithoutThem,
    getUserById  
} from '../controllers/membershipControllers_1.js';

// ✅ FIXED: Use db.query instead of destructured query
const query = db.query;

const setupTestUsers = async () => {
    try {
        console.log('🚀 Starting test users setup...');
        
        // Step 1: Get all users
        const usersResult = await query('SELECT id, username, email, converse_id, role FROM users');
        
        // Handle result format
        let users = [];
        if (Array.isArray(usersResult)) {
            users = Array.isArray(usersResult[0]) ? usersResult[0] : usersResult;
        }
        
        console.log(`👥 Found ${users.length} users in database`);
        
        if (users.length === 0) {
            console.log('❌ No users found in database');
            return;
        }
        
        // Step 2: Assign converse IDs to users without them
        console.log('🔄 Assigning converse IDs to users without them...');
        const bulkResult = await assignConverseIdsToUsersWithoutThem();
        console.log(`✅ Assigned converse IDs to ${bulkResult.updated} users`);
        
        // Step 3: Update roles and membership status for test users
        console.log('🔄 Setting up test user roles and membership...');
        
        for (const user of users) {
            try {
                const updates = {};
                
                // Assign roles based on email or ID
                if (user.email.includes('admin') || user.id === 1) {
                    updates.role = 'admin';
                    updates.is_member = 'granted';
                    updates.membership_stage = 'member';
                    console.log(`👑 Setting user ${user.id} as admin`);
                } else if (user.email.includes('super') || user.id === 2) {
                    updates.role = 'super_admin';
                    updates.is_member = 'granted';
                    updates.membership_stage = 'member';
                    console.log(`👑 Setting user ${user.id} as super admin`);
                } else {
                    updates.role = 'user';
                    updates.is_member = 'applied';
                    updates.membership_stage = 'applicant';
                    console.log(`👤 Setting user ${user.id} as regular user`);
                }
                
                // Only update if there are changes
                if (Object.keys(updates).length > 0) {
                    await updateUserProfile(user.id, updates);
                    console.log(`✅ Updated user ${user.email}:`, updates);
                }
                
                // Ensure converse ID exists (in case bulk assignment missed any)
                if (!user.converse_id) {
                    await assignConverseIdToUser(user.id);
                    console.log(`🆔 Assigned converse ID to user ${user.id}`);
                }
                
            } catch (userError) {
                console.error(`❌ Error updating user ${user.id}:`, userError);
            }
        }
        
        // Step 4: Verify setup
        console.log('🔍 Verifying setup...');
        const verifyResult = await query(`
            SELECT 
                id, 
                username, 
                email, 
                converse_id, 
                role, 
                is_member, 
                membership_stage,
                is_identity_masked
            FROM users 
            ORDER BY id
        `);
        
        // Handle result format
        let verifiedUsers = [];
        if (Array.isArray(verifyResult)) {
            verifiedUsers = Array.isArray(verifyResult[0]) ? verifyResult[0] : verifyResult;
        }
        
        console.log('\n📊 Final User Setup Summary:');
        console.log('=====================================');
        
        verifiedUsers.forEach((user, index) => {
            console.log(`${index + 1}. User ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Username: ${user.username || 'N/A'}`);
            console.log(`   Converse ID: ${user.converse_id || 'MISSING'}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Membership: ${user.is_member}`);
            console.log(`   Stage: ${user.membership_stage}`);
            console.log(`   Identity Masked: ${user.is_identity_masked ? 'Yes' : 'No'}`);
            console.log('   ---');
        });
        
        const stats = {
            total: verifiedUsers.length,
            admins: verifiedUsers.filter(u => u.role === 'admin').length,
            superAdmins: verifiedUsers.filter(u => u.role === 'super_admin').length,
            users: verifiedUsers.filter(u => u.role === 'user').length,
            withConverseIds: verifiedUsers.filter(u => u.converse_id).length,
            members: verifiedUsers.filter(u => u.is_member === 'granted').length,
            applicants: verifiedUsers.filter(u => u.is_member === 'applied').length
        };
        
        console.log('\n📈 Statistics:');
        console.log(`Total Users: ${stats.total}`);
        console.log(`Admins: ${stats.admins}`);
        console.log(`Super Admins: ${stats.superAdmins}`);
        console.log(`Regular Users: ${stats.users}`);
        console.log(`With Converse IDs: ${stats.withConverseIds}/${stats.total}`);
        console.log(`Members: ${stats.members}`);
        console.log(`Applicants: ${stats.applicants}`);
        
        if (stats.withConverseIds < stats.total) {
            console.log('⚠️  Some users are missing converse IDs!');
        } else {
            console.log('✅ All users have converse IDs assigned');
        }
        
        console.log('\n✅ Test users setup complete!');
        
    } catch (error) {
        console.error('❌ Error setting up test users:', error);
        throw error;
    }
};

// Alternative: Setup individual user by ID
const setupIndividualUser = async (userId, role = 'user') => {
    try {
        console.log(`🔧 Setting up individual user ${userId} as ${role}...`);
        
        const user = await getUserById(userId);
        console.log('📝 Current user data:', {
            id: user.id,
            email: user.email,
            currentRole: user.role,
            currentMembership: user.is_member,
            hasConverseId: !!user.converse_id
        });
        
        const updates = {};
        
        // Assign role and corresponding membership
        switch (role) {
            case 'admin':
                updates.role = 'admin';
                updates.is_member = 'granted';
                updates.membership_stage = 'member';
                break;
            case 'super_admin':
                updates.role = 'super_admin';
                updates.is_member = 'granted';
                updates.membership_stage = 'member';
                break;
            default:
                updates.role = 'user';
                updates.is_member = 'applied';
                updates.membership_stage = 'applicant';
        }
        
        // Update user
        await updateUserProfile(userId, updates);
        
        // Ensure converse ID
        if (!user.converse_id) {
            await assignConverseIdToUser(userId);
        }
        
        const updatedUser = await getUserById(userId);
        console.log('✅ User setup complete:', {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            membership: updatedUser.is_member,
            converseId: updatedUser.converse_id
        });
        
        return updatedUser;
        
    } catch (error) {
        console.error(`❌ Error setting up user ${userId}:`, error);
        throw error;
    }
};

// Export functions
export { setupTestUsers, setupIndividualUser };

// Run the setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupTestUsers()
        .then(() => {
            console.log('🎉 Setup script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup script failed:', error);
            process.exit(1);
        });
}