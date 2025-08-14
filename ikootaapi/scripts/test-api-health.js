// test-api-health.js
// Run this to test your API endpoints

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const testEndpoints = [
  { method: 'GET', url: '/health', name: 'Health Check' },
  { method: 'GET', url: '/api/health', name: 'API Health Check' },
  { method: 'GET', url: '/api/info', name: 'API Info' },
  { method: 'GET', url: '/api/auth/test-simple', name: 'Auth Routes Test' },
  { method: 'GET', url: '/api/debug', name: 'API Debug', requiresAuth: true }
];

async function testAPI() {
  console.log('🚀 API Health Check Starting...');
  console.log('=====================================\n');
  
  for (const endpoint of testEndpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${API_BASE}${endpoint.url}`,
        timeout: 5000
      };
      
      // Skip auth-required endpoints for now
      if (endpoint.requiresAuth) {
        console.log(`⏭️ ${endpoint.name}: Skipped (requires authentication)`);
        continue;
      }
      
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const response = await axios(config);
      
      console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (response.data) {
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
        if (response.data.version) {
          console.log(`   Version: ${response.data.version}`);
        }
        if (response.data.database) {
          console.log(`   Database: ${response.data.database}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
        console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.log(`   Error: No response received (server may be down)`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 API Health Check Complete');
}

// Run the test
testAPI().catch(console.error);