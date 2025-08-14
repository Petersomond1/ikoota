// scripts/get-token.js - Get a real JWT token for testing
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

const getToken = async () => {
    try {
        console.log('🔐 Getting JWT Token for API Testing');
        console.log('=====================================');
        
        // Generate unique test user
        const timestamp = Date.now();
        const testUser = {
            username: `testuser${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'TestPassword123!',
            phone: '+1234567890'
        };
        
        // Step 1: Send verification code
        console.log('📧 Step 1: Sending verification code...');
        const verifyResponse = await fetch(`${API_BASE}/auth/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                method: 'email'
            })
        });
        
        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
            throw new Error(`Verification failed: ${verifyData.error}`);
        }
        
        const verificationCode = verifyData.devCode;
        console.log(`✅ Verification code: ${verificationCode}`);
        
        // Step 2: Register user
        console.log('👤 Step 2: Registering user...');
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser.username,
                email: testUser.email,
                password: testUser.password,
                phone: testUser.phone,
                verificationCode: verificationCode,
                verificationMethod: 'email'
            })
        });
        
        const registerData = await registerResponse.json();
        
        if (!registerResponse.ok) {
            throw new Error(`Registration failed: ${registerData.error}`);
        }
        
        const token = registerData.token || registerData.data?.token;
        
        if (!token) {
            throw new Error('No token received from registration');
        }
        
        console.log('✅ User registered successfully!');
        console.log('📊 User Details:');
        console.log(`   Username: ${testUser.username}`);
        console.log(`   Email: ${testUser.email}`);
        console.log(`   User ID: ${registerData.user?.id || registerData.data?.user?.id}`);
        
        console.log('\n🔑 JWT TOKEN:');
        console.log('=====================================');
        console.log(token);
        console.log('=====================================');
        
        console.log('\n🧪 Test Commands:');
        console.log('=====================================');
        console.log('# Test user dashboard:');
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/user/dashboard`);
        
        console.log('\n# Test authenticated user:');
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/auth/`);
        
        console.log('\n# Test user status:');
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/user/status`);
        
        console.log('\n# Save token to file for reuse:');
        console.log(`echo "${token}" > token.txt`);
        
        // Save token to file for easy reuse
        const fs = await import('fs');
        fs.writeFileSync('token.txt', token);
        console.log('\n💾 Token saved to token.txt file');
        
        return token;
        
    } catch (error) {
        console.error('❌ Error getting token:', error.message);
        process.exit(1);
    }
};

// Run the script
getToken();