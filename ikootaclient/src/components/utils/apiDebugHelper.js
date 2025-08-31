// ikootaclient/src/components/utils/apiDebugHelper.js
// Utility to help debug API response issues
import api from "../service/api";

export const debugApiResponse = (response, endpoint = 'unknown') => {
  console.group(`🔍 API Debug: ${endpoint}`);
  
  console.log('📡 Full Response:', response);
  console.log('📋 Response Status:', response?.status);
  console.log('📄 Response Headers:', response?.headers);
  console.log('💾 Response Data:', response?.data);
  console.log('🔧 Data Type:', typeof response?.data);
  console.log('📏 Is Array:', Array.isArray(response?.data));
  
  if (response?.data && typeof response.data === 'object') {
    console.log('🗂️ Object Keys:', Object.keys(response.data));
    
    // Check for common array properties
    const commonArrayKeys = ['data', 'teachings', 'results', 'items', 'list'];
    commonArrayKeys.forEach(key => {
      if (response.data[key]) {
        console.log(`📂 Found "${key}":`, response.data[key]);
        console.log(`📂 "${key}" is array:`, Array.isArray(response.data[key]));
      }
    });
  }
  
  console.groupEnd();
  return response;
};

export const normalizeTeachingsResponse = (response) => {
  console.log('🔄 Normalizing teachings response...');
  
  let teachingsData = [];
  
  try {
    if (!response || !response.data) {
      console.warn('⚠️ No response data found');
      return [];
    }
    
    const data = response.data;
    
    // Try different possible structures
    if (Array.isArray(data)) {
      console.log('✅ Data is direct array');
      teachingsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      console.log('✅ Data found in data.data');
      teachingsData = data.data;
    } else if (data.teachings && Array.isArray(data.teachings)) {
      console.log('✅ Data found in data.teachings');
      teachingsData = data.teachings;
    } else if (data.results && Array.isArray(data.results)) {
      console.log('✅ Data found in data.results');
      teachingsData = data.results;
    } else if (data.items && Array.isArray(data.items)) {
      console.log('✅ Data found in data.items');
      teachingsData = data.items;
    } else if (typeof data === 'object') {
      console.log('⚠️ Data is object, checking for array properties...');
      
      // Find any array property
      const arrayProp = Object.keys(data).find(key => Array.isArray(data[key]));
      if (arrayProp) {
        console.log(`✅ Found array in property: ${arrayProp}`);
        teachingsData = data[arrayProp];
      } else {
        console.log('⚠️ No array found, wrapping single object');
        teachingsData = [data];
      }
    } else {
      console.error('❌ Unknown data structure:', typeof data);
      teachingsData = [];
    }
    
    console.log(`📊 Normalized to ${teachingsData.length} teachings`);
    return teachingsData;
    
  } catch (error) {
    console.error('❌ Error normalizing response:', error);
    return [];
  }
};

export const enhanceTeaching = (teaching, index = 0) => {
  return {
    ...teaching,
    // Ensure required fields exist
    id: teaching.id || `temp-${index}`,
    content_type: 'teaching',
    content_title: teaching.topic || teaching.title || 'Untitled Teaching',
    prefixed_id: teaching.prefixed_id || `t${teaching.id || index}`,
    display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
    author: teaching.author || teaching.user_id || teaching.created_by || 'Admin',
    topic: teaching.topic || teaching.title || 'Untitled',
    description: teaching.description || 'No description available',
    subjectMatter: teaching.subjectMatter || teaching.subject || 'Not specified',
    audience: teaching.audience || 'General'
  };
};

// Test function to check API endpoint
export const testTeachingsEndpoint = async (api) => {
  console.group('🧪 Testing Teachings Endpoint');
  
  try {
    console.log('📡 Making request to /teachings...');
    const response = await api.get('/content/teachings');
    
    debugApiResponse(response, '/teachings');
    
    const normalized = normalizeTeachingsResponse(response);
    console.log('📊 Normalized data:', normalized);
    
    if (normalized.length > 0) {
      console.log('📋 Sample teaching:', normalized[0]);
      console.log('🔧 Enhanced sample:', enhanceTeaching(normalized[0]));
    }
    
    console.log('✅ Endpoint test completed successfully');
    return normalized;
    
  } catch (error) {
    console.error('❌ Endpoint test failed:', error);
    console.error('📋 Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return [];
  } finally {
    console.groupEnd();
  }
};