#!/usr/bin/env node

// Test script to verify login authentication on hosted Ikoota app
const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_BASE = 'https://www.ikoota.com/api';
const TEST_EMAIL = 'petersomond@gmail.com';
const TEST_PASSWORD = 'abc123';

console.log('🧪 Testing Ikoota Login Authentication');
console.log('=====================================');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testLogin() {
  try {
    console.log('🔍 Testing API health endpoint...');

    // Test health endpoint first
    const healthResponse = await makeRequest(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`📊 Health endpoint status: ${healthResponse.status}`);

    if (healthResponse.status === 200) {
      try {
        const healthData = JSON.parse(healthResponse.data);
        console.log('✅ API Health:', healthData.message || 'Working');
      } catch (e) {
        console.log('✅ API Health endpoint responding (non-JSON)');
      }
    }

    console.log('\n🔍 Testing login endpoint...');

    // Test login endpoint
    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    console.log(`📊 Login endpoint status: ${loginResponse.status}`);
    console.log(`📊 Response headers:`, loginResponse.headers);

    console.log('\n📋 Raw response:');
    console.log(loginResponse.data.substring(0, 500));

    if (loginResponse.status === 200) {
      try {
        const jsonData = JSON.parse(loginResponse.data);
        console.log('\n✅ Login successful!');
        console.log('Token present:', !!jsonData.token);
        console.log('User data:', {
          id: jsonData.user?.id,
          username: jsonData.user?.username,
          email: jsonData.user?.email,
          role: jsonData.user?.role,
          membership_stage: jsonData.user?.membership_stage
        });

        if (jsonData.token) {
          console.log('\n🔍 Testing protected route with token...');

          const protectedResponse = await makeRequest(`${API_BASE}/auth/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jsonData.token}`,
              'Content-Type': 'application/json',
            }
          });

          console.log(`📊 Protected route status: ${protectedResponse.status}`);

          if (protectedResponse.status === 200) {
            try {
              const protectedData = JSON.parse(protectedResponse.data);
              console.log('✅ Protected route working!');
              console.log('User from protected route:', protectedData.user?.email);
            } catch (e) {
              console.log('❌ Protected route returned non-JSON:', protectedResponse.data.substring(0, 200));
            }
          } else {
            console.log('❌ Protected route failed:', protectedResponse.data.substring(0, 200));
          }
        }

      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
      }
    } else {
      console.log('❌ Login failed');
      console.log('Response body:', loginResponse.data);

      // Check if it's HTML response (routing issue)
      if (loginResponse.data.includes('<!doctype') || loginResponse.data.includes('<html')) {
        console.log('⚠️  ISSUE DETECTED: API returned HTML instead of JSON');
        console.log('⚠️  This indicates a routing/proxy configuration problem');
        console.log('⚠️  The request is not reaching the API backend');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Connection refused - API server may not be running');
    } else if (error.code === 'ENOTFOUND') {
      console.log('⚠️  DNS resolution failed - check domain name');
    } else if (error.code === 'ECONNRESET') {
      console.log('⚠️  Connection reset - possible proxy/load balancer issue');
    }
  }
}

// Run the test
testLogin().then(() => {
  console.log('\n✅ Test completed');
}).catch(error => {
  console.error('❌ Test script error:', error);
});