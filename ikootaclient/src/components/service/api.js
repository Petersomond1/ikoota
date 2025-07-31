//ikootaclient\src\components\service\api.js - REPLACE YOUR EXISTING FILE WITH THIS
import axios from 'axios';

// ✅ CRITICAL CHANGE: Use /api instead of full URL to use proxy
const api = axios.create({
  baseURL: '/api', // This will use the Vite proxy to forward to localhost:3000/api
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





// //ikootaclient\src\components\service\api.js
// // Create this file: /service/api.js (or wherever your path expects it)

// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:3000/api';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });


// // Add auth interceptor
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add request interceptor to include token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     console.log('🔍 API Request:', {
//       method: config.method?.toUpperCase(),
//       url: config.url,
//       fullURL: config.baseURL + config.url,
//       hasToken: !!token
//     });
    
//     return config;
//   },
//   (error) => {
//     console.error('❌ Request interceptor error:', error);
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor to handle errors
// api.interceptors.response.use(
//   (response) => {
//     console.log('✅ API Response:', {
//       status: response.status,
//       url: response.config.url,
//       data: response.data
//     });
//     return response;
//   },
//   (error) => {
//     console.error('❌ API Response Error:', {
//       status: error.response?.status,
//       url: error.config?.url,
//       data: error.response?.data,
//       message: error.message
//     });
    
//     // If we get HTML instead of JSON, it's likely a routing issue
//     if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
//       console.error('❌ Received HTML instead of JSON - this is likely a routing issue');
//     }
    
//     return Promise.reject(error);
//   }
// );

// export default api;