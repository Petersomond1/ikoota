// ikootaclient/src/mocks/mockApiService.js
// Mock API service to replace real API calls during development/testing

import { 
  mockClassDetails, 
  mockClassContent, 
  mockClassAnnouncements, 
  mockClassMembers,
  mockEmptyClass,
  mockEmptyContent,
  mockPrivateClass
} from './mockClassData';

// Configuration for different test scenarios
export const TEST_SCENARIOS = {
  NORMAL_CLASS: 'normal',
  EMPTY_CLASS: 'empty', 
  PRIVATE_CLASS: 'private',
  LOADING_ERROR: 'error'
};

// Current test scenario - change this to test different states
let currentScenario = TEST_SCENARIOS.NORMAL_CLASS;

// Helper function to simulate network delay
const simulateNetworkDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to simulate API errors
const simulateError = (message = 'Network Error', status = 500) => {
  const error = new Error(message);
  error.response = { 
    status, 
    data: { message, error: true }
  };
  throw error;
};

// Mock API functions that match the real API calls
export const mockApiService = {
  
  // Set test scenario
  setScenario: (scenario) => {
    currentScenario = scenario;
    console.log(`🧪 Mock API: Switched to ${scenario} scenario`);
  },

  // Helper function to normalize class ID (handle both OTU001234 and OTU#001234 formats)
  normalizeClassId: (classId) => {
    // URL decode first in case it's encoded
    const decoded = decodeURIComponent(classId);
    // Convert OTU#001234 to OTU001234 for URL safety
    const normalized = decoded.replace('#', '');
    console.log(`🔧 Class ID normalization: ${classId} -> ${decoded} -> ${normalized}`);
    return normalized;
  },

  // GET /classes/:classId - Fetch class details
  getClassDetails: async (classId) => {
    await simulateNetworkDelay(300);
    
    const normalizedId = mockApiService.normalizeClassId(classId);
    console.log(`🔍 Mock API: Fetching class details for ID: ${classId} (normalized: ${normalizedId})`);
    
    switch (currentScenario) {
      case TEST_SCENARIOS.EMPTY_CLASS:
        return { data: mockEmptyClass };
      case TEST_SCENARIOS.PRIVATE_CLASS:
        return { data: mockPrivateClass };
      case TEST_SCENARIOS.LOADING_ERROR:
        simulateError('Failed to load class details', 404);
        break;
      default:
        // Return data based on normalized ID
        if (normalizedId === 'OTU001234') {
          return { data: mockClassDetails };
        } else if (normalizedId === 'OTU001235') {
          return { data: mockEmptyClass };
        } else if (normalizedId === 'OTU001236') {
          return { data: mockPrivateClass };
        } else {
          // Default to main class for any other ID
          return { data: mockClassDetails };
        }
    }
  },

  // GET /classes/:classId/content - Fetch class content
  getClassContent: async (classId, params = {}) => {
    await simulateNetworkDelay(400);
    
    const normalizedId = mockApiService.normalizeClassId(classId);
    console.log(`📚 Mock API: Fetching class content for ID: ${classId} (normalized: ${normalizedId})`, params);
    
    if (currentScenario === TEST_SCENARIOS.LOADING_ERROR) {
      simulateError('Failed to load class content', 500);
    }
    
    if (currentScenario === TEST_SCENARIOS.EMPTY_CLASS || normalizedId === 'OTU001235') {
      return { data: mockEmptyContent };
    }

    // Filter content based on type parameter
    let filteredContent = [...mockClassContent.data];
    
    if (params.type && params.type !== 'all') {
      // Map frontend types to backend content_type
      const typeMapping = {
        'announcements': 'announcement',
        'discussions': 'chat', 
        'assignments': 'teaching',
        'resources': 'teaching'
      };
      
      const backendType = typeMapping[params.type] || params.type;
      filteredContent = filteredContent.filter(item => item.content_type === backendType);
    }

    // Filter by search query
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredContent = filteredContent.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.text?.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    if (params.limit) {
      filteredContent = filteredContent.slice(0, parseInt(params.limit));
    }

    return { data: { data: filteredContent } };
  },

  // GET /classes/:classId/announcements - Fetch class announcements
  getClassAnnouncements: async (classId) => {
    await simulateNetworkDelay(200);
    
    console.log(`📢 Mock API: Fetching announcements for class ID: ${classId}`);
    
    if (currentScenario === TEST_SCENARIOS.EMPTY_CLASS) {
      return { data: { data: [] } };
    }
    
    return { data: mockClassAnnouncements };
  },

  // GET /classes/:classId/members - Fetch class members
  getClassMembers: async (classId) => {
    await simulateNetworkDelay(350);
    
    console.log(`👥 Mock API: Fetching members for class ID: ${classId}`);
    
    if (currentScenario === TEST_SCENARIOS.EMPTY_CLASS) {
      return { data: { data: [] } };
    }
    
    return { data: mockClassMembers };
  },

  // POST /classes/:classId/feedback - Submit feedback
  submitFeedback: async (classId, feedbackData) => {
    await simulateNetworkDelay(600);
    
    console.log(`💬 Mock API: Submitting feedback for class ID: ${classId}`, feedbackData);
    
    if (currentScenario === TEST_SCENARIOS.LOADING_ERROR) {
      simulateError('Failed to submit feedback', 400);
    }
    
    return { 
      data: { 
        success: true, 
        message: 'Feedback submitted successfully',
        feedback_id: `feedback_${Date.now()}`
      }
    };
  },

  // POST /classes/:classId/attendance - Mark attendance
  markAttendance: async (classId, attendanceData) => {
    await simulateNetworkDelay(400);
    
    console.log(`📅 Mock API: Marking attendance for class ID: ${classId}`, attendanceData);
    
    if (currentScenario === TEST_SCENARIOS.LOADING_ERROR) {
      simulateError('Failed to mark attendance', 400);
    }
    
    return { 
      data: { 
        success: true, 
        message: 'Attendance marked successfully',
        attendance_id: `attendance_${Date.now()}`
      }
    };
  },

  // POST /classes/:classId/join - Join class
  joinClass: async (classId) => {
    await simulateNetworkDelay(800);
    
    console.log(`➕ Mock API: Joining class ID: ${classId}`);
    
    if (currentScenario === TEST_SCENARIOS.LOADING_ERROR) {
      simulateError('Failed to join class', 403);
    }
    
    if (currentScenario === TEST_SCENARIOS.PRIVATE_CLASS) {
      simulateError('This class requires approval to join', 403);
    }
    
    return { 
      data: { 
        success: true, 
        message: 'Successfully joined class',
        membership_id: `membership_${Date.now()}`
      }
    };
  },

  // POST /classes/:classId/leave - Leave class
  leaveClass: async (classId) => {
    await simulateNetworkDelay(500);
    
    console.log(`🚪 Mock API: Leaving class ID: ${classId}`);
    
    if (currentScenario === TEST_SCENARIOS.LOADING_ERROR) {
      simulateError('Failed to leave class', 400);
    }
    
    return { 
      data: { 
        success: true, 
        message: 'Successfully left class'
      }
    };
  }
};

// Development helper functions
export const mockApiHelpers = {
  
  // Log all available test scenarios
  listScenarios: () => {
    console.log('🧪 Available test scenarios:');
    Object.entries(TEST_SCENARIOS).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  },

  // Reset to normal scenario
  reset: () => {
    mockApiService.setScenario(TEST_SCENARIOS.NORMAL_CLASS);
  },

  // Test all scenarios quickly
  testAllScenarios: async (classId = '12345') => {
    for (const [name, scenario] of Object.entries(TEST_SCENARIOS)) {
      console.log(`\n🧪 Testing scenario: ${name}`);
      mockApiService.setScenario(scenario);
      
      try {
        if (scenario !== TEST_SCENARIOS.LOADING_ERROR) {
          const classDetails = await mockApiService.getClassDetails(classId);
          console.log(`✅ Class details loaded:`, classDetails.data.data?.class_name);
          
          const content = await mockApiService.getClassContent(classId);
          console.log(`✅ Content loaded: ${content.data.data?.length || 0} items`);
        }
      } catch (error) {
        console.log(`❌ Expected error:`, error.message);
      }
    }
    
    // Reset to normal
    mockApiService.reset();
  },

  // Get current scenario
  getCurrentScenario: () => currentScenario
};

// Export for use in development console
if (typeof window !== 'undefined') {
  window.mockApi = mockApiService;
  window.mockApiHelpers = mockApiHelpers;
  console.log('🧪 Mock API available in console as window.mockApi');
  console.log('🛠️  Helpers available as window.mockApiHelpers');
}