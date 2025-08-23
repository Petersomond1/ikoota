// // ikootaclient/src/service/api.js - MERGED VERSION WITH MOCK TOGGLE
// // This combines your existing working API with mock testing capabilities

// import axios from 'axios';

// // ✅ MOCK DATA IMPORTS (conditional)
// let mockApiService = null;
// try {
//   // Only import mock services if they exist
//   const mockModule = await import('../../mocks/mockApiService.js');
//   mockApiService = mockModule.mockApiService;
// } catch (error) {
//   console.log('📝 Mock services not available (this is normal in production)');
// }

// // ✅ CONFIGURATION FOR MOCK MODE
// const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
// const MOCK_MODE_ENABLED = USE_MOCK_DATA ||
//   (typeof window !== 'undefined' &&
//     window.localStorage.getItem('enableMockData') === 'true');

// // ✅ YOUR ORIGINAL API CONFIGURATION (PRESERVED)
// const api = axios.create({
//   baseURL: 'http://localhost:3000/api', // Your original proxy setup
//   timeout: 15000,
//   withCredentials: true, // Important for session cookies
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // ✅ YOUR ORIGINAL REQUEST INTERCEPTOR (PRESERVED)
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
        
//     console.log('🔍 API Request:', {
//       method: config.method?.toUpperCase(),
//       url: config.url,
//       baseURL: config.baseURL,
//       fullURL: `${config.baseURL}${config.url}`,
//       hasToken: !!token,
//       headers: config.headers,
//       mockMode: MOCK_MODE_ENABLED ? '🧪 MOCK' : '🌐 REAL'
//     });
        
//     return config;
//   },
//   (error) => {
//     console.error('❌ Request interceptor error:', error);
//     return Promise.reject(error);
//   }
// );

// // ✅ YOUR ORIGINAL RESPONSE INTERCEPTOR (ENHANCED)
// api.interceptors.response.use(
//   (response) => {
//     console.log('✅ API Response:', {
//       status: response.status,
//       url: response.config.url,
//       data: response.data,
//       mockMode: MOCK_MODE_ENABLED ? '🧪 MOCK' : '🌐 REAL'
//     });
//     return response;
//   },
//   (error) => {
//     console.error('❌ API Response Error:', {
//       status: error.response?.status,
//       url: error.config?.url,
//       data: error.response?.data,
//       message: error.message,
//       mockMode: MOCK_MODE_ENABLED ? '🧪 MOCK' : '🌐 REAL'
//     });
        
//     // ✅ YOUR ORIGINAL HTML DETECTION (PRESERVED)
//     if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
//       console.error('❌ Received HTML instead of JSON - this is a routing/proxy issue');
//       console.error('Full HTML response:', error.response.data.substring(0, 200));
//     }
        
//     // Handle authentication errors
//     if (error.response?.status === 401) {
//       console.log('🔐 Unauthorized - removing token');
//       localStorage.removeItem('token');
//       sessionStorage.removeItem('token');
//     }
        
//     // Enhance error object with useful info
//     const enhancedError = {
//       ...error,
//       message: error.response?.data?.message ||
//                 error.response?.data?.error ||
//                 error.message ||
//                 'Network Error',
//       status: error.response?.status,
//       url: error.config?.url
//     };
        
//     return Promise.reject(enhancedError);
//   }
// );

// // ✅ MOCK INTERCEPTOR SYSTEM
// // Override axios methods ONLY when mock mode is enabled and mock service exists

// const originalGet = api.get.bind(api);
// const originalPost = api.post.bind(api);
// const originalPut = api.put.bind(api);
// const originalDelete = api.delete.bind(api);

// // Enhanced GET method with mock support
// api.get = function(url, config) {
//   if (MOCK_MODE_ENABLED && mockApiService && url.includes('/classes/')) {
//     console.log('🧪 Intercepting GET request for mock:', url);
    
//     const classIdMatch = url.match(/\/classes\/([^\/]+)/);
//     if (classIdMatch) {
//       const classId = classIdMatch[1];
      
//       // Route to appropriate mock method
//       if (url.endsWith(`/classes/${classId}`) || url === `/classes/${classId}`) {
//         return mockApiService.getClassDetails(classId);
//       }
//       if (url.includes(`/classes/${classId}/content`)) {
//         const params = config?.params || {};
//         return mockApiService.getClassContent(classId, params);
//       }
//       if (url.includes(`/classes/${classId}/announcements`)) {
//         return mockApiService.getClassAnnouncements(classId);
//       }
//       if (url.includes(`/classes/${classId}/members`)) {
//         return mockApiService.getClassMembers(classId);
//       }
//     }
//   }
  
//   // Use original method for all other cases
//   return originalGet(url, config);
// };

// // Enhanced POST method with mock support
// api.post = function(url, data, config) {
//   if (MOCK_MODE_ENABLED && mockApiService && url.includes('/classes/')) {
//     console.log('🧪 Intercepting POST request for mock:', url);
    
//     const classIdMatch = url.match(/\/classes\/([^\/]+)/);
//     if (classIdMatch) {
//       const classId = classIdMatch[1];
      
//       // Route to appropriate mock method
//       if (url.includes(`/classes/${classId}/feedback`)) {
//         return mockApiService.submitFeedback(classId, data);
//       }
//       if (url.includes(`/classes/${classId}/attendance`)) {
//         return mockApiService.markAttendance(classId, data);
//       }
//       if (url.includes(`/classes/${classId}/join`)) {
//         return mockApiService.joinClass(classId);
//       }
//       if (url.includes(`/classes/${classId}/leave`)) {
//         return mockApiService.leaveClass(classId);
//       }
//       if (url.endsWith(`/classes/${classId}/content`)) {
//         return mockApiService.createContent(classId, data);
//       }
//     }
//   }
  
//   // Use original method for all other cases
//   return originalPost(url, data, config);
// };

// // Enhanced PUT method with mock support
// api.put = function(url, data, config) {
//   if (MOCK_MODE_ENABLED && mockApiService && url.includes('/classes/')) {
//     console.log('🧪 Intercepting PUT request for mock:', url);
    
//     const classIdMatch = url.match(/\/classes\/([^\/]+)\/content\/([^\/]+)/);
//     if (classIdMatch) {
//       const [, classId, contentId] = classIdMatch;
//       return mockApiService.updateContent(classId, contentId, data);
//     }
//   }
  
//   // Use original method for all other cases
//   return originalPut(url, data, config);
// };

// // Enhanced DELETE method with mock support
// api.delete = function(url, config) {
//   if (MOCK_MODE_ENABLED && mockApiService && url.includes('/classes/')) {
//     console.log('🧪 Intercepting DELETE request for mock:', url);
    
//     const classIdMatch = url.match(/\/classes\/([^\/]+)\/content\/([^\/]+)/);
//     if (classIdMatch) {
//       const [, classId, contentId] = classIdMatch;
//       return mockApiService.deleteContent(classId, contentId);
//     }
//   }
  
//   // Use original method for all other cases
//   return originalDelete(url, config);
// };

// // ✅ DEVELOPMENT UTILITIES
// const devUtils = {
  
//   // Toggle mock mode
//   toggleMockMode: () => {
//     const current = window.localStorage.getItem('enableMockData') === 'true';
//     const newValue = !current;
//     window.localStorage.setItem('enableMockData', newValue.toString());
//     console.log(`🧪 Mock mode ${newValue ? 'ENABLED' : 'DISABLED'}. Refresh page to apply.`);
//     console.log(`Current mode: ${MOCK_MODE_ENABLED ? '🧪 MOCK' : '🌐 REAL'}`);
//     console.log(`After refresh: ${newValue ? '🧪 MOCK' : '🌐 REAL'}`);
//     return newValue;
//   },

//   // Check if mock mode is enabled
//   isMockModeEnabled: () => MOCK_MODE_ENABLED,

//   // Get current mode info
//   getModeInfo: () => ({
//     mockModeEnabled: MOCK_MODE_ENABLED,
//     mockServiceAvailable: !!mockApiService,
//     environmentVariable: import.meta.env.VITE_USE_MOCK_DATA,
//     localStorageSetting: window.localStorage.getItem('enableMockData'),
//     effectiveMode: MOCK_MODE_ENABLED ? 'MOCK' : 'REAL'
//   }),

//   // Test API with current mode
//   testAPI: async (endpoint = '/classes/12345') => {
//     console.log(`🧪 Testing API ${MOCK_MODE_ENABLED ? '(MOCK MODE)' : '(REAL MODE)'}`);
//     try {
//       const response = await api.get(endpoint);
//       console.log('✅ API Test Success:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('❌ API Test Failed:', error.message);
//       throw error;
//     }
//   },

//   // Quick class API test (if mock service available)
//   testClassAPI: async (classId = '12345') => {
//     if (!mockApiService) {
//       console.log('📝 Mock service not available. Testing real API only.');
//       return devUtils.testAPI(`/classes/${classId}`);
//     }

//     console.log(`🧪 Testing Class API - Mode: ${MOCK_MODE_ENABLED ? 'MOCK' : 'REAL'}`);
    
//     try {
//       console.log('Testing class details...');
//       const classDetails = await api.get(`/classes/${classId}`);
//       console.log('✅ Class Details:', classDetails.data);
      
//       console.log('Testing class content...');
//       const content = await api.get(`/classes/${classId}/content`);
//       console.log('✅ Class Content:', content.data);
      
//       console.log('Testing class announcements...');
//       const announcements = await api.get(`/classes/${classId}/announcements`);
//       console.log('✅ Announcements:', announcements.data);
      
//       console.log('Testing class members...');
//       const members = await api.get(`/classes/${classId}/members`);
//       console.log('✅ Members:', members.data);
      
//       console.log('🎉 All Class API tests passed!');
//       return { classDetails, content, announcements, members };
//     } catch (error) {
//       console.error('❌ Class API test failed:', error);
//       throw error;
//     }
//   },

//   // Reset to real API mode
//   useRealAPI: () => {
//     window.localStorage.removeItem('enableMockData');
//     console.log('🌐 Real API mode enabled. Refresh page to apply.');
//   },

//   // Enable mock mode
//   useMockAPI: () => {
//     if (!mockApiService) {
//       console.error('❌ Mock service not available. Please add mock files first.');
//       return false;
//     }
//     window.localStorage.setItem('enableMockData', 'true');
//     console.log('🧪 Mock API mode enabled. Refresh page to apply.');
//     return true;
//   },

//   // Get mock API service (if available)
//   getMockAPI: () => mockApiService
// };

// // ✅ ENHANCED CONSOLE UTILITIES (DEVELOPMENT ONLY)
// if (process.env.NODE_ENV === 'development') {
//   // Make utilities available in browser console
//   if (typeof window !== 'undefined') {
//     window.apiDev = devUtils;
    
//     // Enhanced initialization logs
//     console.log('🚀 API Service initialized');
//     console.log(`🧪 Mock mode: ${MOCK_MODE_ENABLED ? 'ENABLED' : 'DISABLED'}`);
//     console.log(`🌐 Base URL: ${api.defaults.baseURL}`);
//     console.log(`📦 Mock service: ${mockApiService ? 'Available' : 'Not available'}`);
    
//     if (MOCK_MODE_ENABLED && mockApiService) {
//       console.log('📝 Mock data will intercept /classes/* routes');
//     }
    
//     console.log('🛠️  Development utilities available:');
//     console.log('  • window.apiDev.toggleMockMode() - Toggle between mock/real');
//     console.log('  • window.apiDev.getModeInfo() - Show current mode info');
//     console.log('  • window.apiDev.testClassAPI() - Test class endpoints');
//     console.log('  • window.apiDev.useMockAPI() - Enable mock mode');
//     console.log('  • window.apiDev.useRealAPI() - Enable real API mode');
    
//     // Quick status check
//     console.log('\n📊 Current Status:');
//     console.log(devUtils.getModeInfo());
//   }
// }

// export default api;











//ikootaclient\src\components\service\api.js - REPLACE YOUR EXISTING FILE WITH THIS
import axios from 'axios';

// ✅ CRITICAL CHANGE: Use /api instead of full URL to use proxy
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // This will use the Vite proxy to forward to localhost:3000/api
  timeout: 15000,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ SIMPLIFIED: Single request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🔍 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ ENHANCED: Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // ✅ SPECIFIC: Check for HTML response (routing issue)
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
      console.error('❌ Received HTML instead of JSON - this is a routing/proxy issue');
      console.error('Full HTML response:', error.response.data.substring(0, 200));
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - removing token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    
    // Enhance error object with useful info
    const enhancedError = {
      ...error,
      message: error.response?.data?.message || 
               error.response?.data?.error || 
               error.message || 
               'Network Error',
      status: error.response?.status,
      url: error.config?.url
    };
    
    return Promise.reject(enhancedError);
  }
);

export default api;



