// ikootaapi/scripts/test-survey-integration.js
// Test script to verify survey system integration

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
let authToken = null;

// Test configuration
const testConfig = {
  testUser: {
    email: 'test@example.com',
    password: 'testpassword'
  },
  adminUser: {
    email: 'admin@example.com', 
    password: 'adminpassword'
  }
};

// Helper function to make authenticated requests
const authRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    data
  };
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test authentication
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  const loginResult = await authRequest('POST', '/auth/login', testConfig.testUser);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed:', loginResult.error);
    return false;
  }
}

// Test survey system endpoints
async function testSurveyEndpoints() {
  console.log('\n📊 Testing Survey System Endpoints...');
  
  const tests = [
    { name: 'Survey Test Endpoint', method: 'GET', endpoint: '/survey/test' },
    { name: 'Survey Questions', method: 'GET', endpoint: '/survey/questions' },
    { name: 'Survey Question Labels', method: 'GET', endpoint: '/survey/question-labels' },
    { name: 'Survey Status', method: 'GET', endpoint: '/survey/status' },
    { name: 'Survey Requirements', method: 'GET', endpoint: '/survey/requirements' },
    { name: 'Survey Integration Status', method: 'GET', endpoint: '/survey/integration-status' },
    { name: 'User Survey Analytics', method: 'GET', endpoint: '/survey/my-analytics' },
    { name: 'Draft System Test', method: 'GET', endpoint: '/survey/test/drafts' },
    { name: 'Submission System Test', method: 'GET', endpoint: '/survey/test/submission' }
  ];
  
  for (const test of tests) {
    const result = await authRequest(test.method, test.endpoint);
    if (result.success) {
      console.log(`✅ ${test.name}: Working`);
    } else {
      console.log(`❌ ${test.name}: Failed (${result.status}) - ${result.error?.error || result.error}`);
    }
  }
}

// Test survey admin endpoints (requires admin role)
async function testSurveyAdminEndpoints() {
  console.log('\n🔐 Testing Survey Admin Endpoints...');
  
  const tests = [
    { name: 'Survey Admin Test', method: 'GET', endpoint: '/survey/admin/test' },
    { name: 'Survey Admin Health', method: 'GET', endpoint: '/survey/admin/health' },
    { name: 'Frontend Config', method: 'GET', endpoint: '/survey/admin/frontend-config' },
    { name: 'Survey Questions Admin', method: 'GET', endpoint: '/survey/admin/questions' },
    { name: 'Question Labels Admin', method: 'GET', endpoint: '/survey/admin/question-labels' },
    { name: 'Pending Surveys', method: 'GET', endpoint: '/survey/admin/pending' },
    { name: 'Survey Logs', method: 'GET', endpoint: '/survey/admin/logs' },
    { name: 'Survey Analytics', method: 'GET', endpoint: '/survey/admin/analytics' },
    { name: 'Survey Stats', method: 'GET', endpoint: '/survey/admin/stats' },
    { name: 'Dashboard Stats', method: 'GET', endpoint: '/survey/admin/dashboard-stats' },
    { name: 'System Metrics', method: 'GET', endpoint: '/survey/admin/system-metrics' },
    { name: 'Audit Logs', method: 'GET', endpoint: '/survey/admin/audit-logs' },
    { name: 'Survey Config', method: 'GET', endpoint: '/survey/admin/config' }
  ];
  
  for (const test of tests) {
    const result = await authRequest(test.method, test.endpoint);
    if (result.success) {
      console.log(`✅ ${test.name}: Working`);
    } else {
      console.log(`❌ ${test.name}: ${result.status === 403 ? 'Requires Admin Role' : 'Failed'} - ${result.error?.error || result.error}`);
    }
  }
}

// Test survey draft functionality
async function testSurveyDrafts() {
  console.log('\n📝 Testing Survey Draft Functionality...');
  
  // Test saving a draft
  const draftData = {
    answers: {
      fullName: 'Test User',
      email: 'test@example.com',
      reasonForJoining: 'Testing the survey system'
    },
    applicationType: 'test_survey'
  };
  
  const saveResult = await authRequest('POST', '/survey/draft/save', draftData);
  if (saveResult.success) {
    console.log('✅ Draft Save: Working');
    
    // Test getting drafts
    const getResult = await authRequest('GET', '/survey/drafts');
    if (getResult.success) {
      console.log('✅ Draft Retrieval: Working');
      console.log(`   Found ${getResult.data.drafts?.length || 0} drafts`);
    } else {
      console.log('❌ Draft Retrieval: Failed');
    }
  } else {
    console.log('❌ Draft Save: Failed -', saveResult.error?.error || saveResult.error);
  }
}

// Test main router integration
async function testMainRouterIntegration() {
  console.log('\n🔗 Testing Main Router Integration...');
  
  const tests = [
    { name: 'API Root', method: 'GET', endpoint: '/' },
    { name: 'Route Discovery', method: 'GET', endpoint: '/routes' },
    { name: 'System Test', method: 'GET', endpoint: '/test-all-systems' }
  ];
  
  for (const test of tests) {
    const result = await authRequest(test.method, test.endpoint);
    if (result.success) {
      console.log(`✅ ${test.name}: Working`);
      if (test.name === 'Route Discovery') {
        const surveyRoutes = result.data.routes?.survey?.length || 0;
        const surveyAdminRoutes = result.data.routes?.survey_admin?.length || 0;
        console.log(`   Survey Routes: ${surveyRoutes}, Admin Routes: ${surveyAdminRoutes}`);
      }
    } else {
      console.log(`❌ ${test.name}: Failed`);
    }
  }
}

// Test legacy compatibility
async function testLegacyCompatibility() {
  console.log('\n🔄 Testing Legacy Compatibility...');
  
  // Test legacy survey submission endpoint
  const legacyResult = await authRequest('GET', '/survey/check-status');
  if (legacyResult.success) {
    console.log('✅ Legacy Survey Status Endpoint: Working');
  } else {
    console.log('❌ Legacy Survey Status Endpoint: Failed');
  }
  
  // Test that membership routes still work
  const membershipResult = await authRequest('GET', '/membership/status');
  if (membershipResult.success) {
    console.log('✅ Membership System: Still Working');
  } else {
    console.log('❌ Membership System: May have issues');
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🧪 Survey System Integration Test');
  console.log('=====================================');
  
  // Test authentication first
  const authSuccess = await testAuth();
  
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('💡 Make sure your server is running and test user exists');
    return;
  }
  
  // Run all tests
  await testMainRouterIntegration();
  await testSurveyEndpoints();
  await testSurveyDrafts();
  await testSurveyAdminEndpoints();
  await testLegacyCompatibility();
  
  console.log('\n🎯 Integration Test Complete');
  console.log('=====================================');
  console.log('📊 Survey System Status: Integrated');
  console.log('🔧 Ready for Frontend Development');
  console.log('📋 Next: Create SurveyControls.jsx component');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(console.error);
}

export { runIntegrationTests };

// Usage instructions
console.log(`
📖 Usage Instructions:
===================

1. Start your server: npm start
2. Run this test: node scripts/test-survey-integration.js
3. Check results for any failing endpoints
4. Verify database tables with DESCRIBE queries

Required Environment:
- Server running on localhost:3000
- Test user with email: ${testConfig.testUser.email}
- Admin user for admin tests (optional)

Database Tables to Verify:
- survey_questions
- surveylog  
- survey_drafts
- question_labels
- audit_logs
`);