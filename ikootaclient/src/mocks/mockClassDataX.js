// ikootaclient/src/mocks/mockClassData.js
// Mock data for testing ClassContentViewer component

export const mockClassDetails = {
  data: {
    id: 123,                                    // Primary key from database
    class_id: "OTU001234",                      // Special class ID (URL-safe version)
    original_class_id: "OTU#001234",            // Original format with #
    class_name: "Advanced React Development",
    public_name: "React Development Masterclass",
    description: "Learn advanced React patterns, hooks, state management, and performance optimization techniques. This comprehensive course covers everything from basic concepts to enterprise-level application development.",
    class_type: "subject",                      // enum: demographic, subject, public, special
    is_public: false,
    is_active: true,
    max_members: 50,
    privacy_level: "members_only",              // enum: public, members_only, admin_only
    created_by: 1,                              // User ID of creator
    user_is_class_member: true,                 // Current user class membership status
    total_members: 25,
    moderators: 2,
    pending_members: 3,
    instructor: "Sarah Johnson",
    instructor_id: 1,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-08-20T15:30:00Z",
    // Additional fields that might be computed/joined
    schedule: "Monday, Wednesday, Friday - 2:00 PM EST",
    duration: "12 weeks",
    level: "Advanced",
    user_role_in_class: "member",               // User's role in this class
    can_see_class_name: true,
    receive_notifications: true
  }
};

export const mockClassContent = {
  data: [
    {
      id: 1,                                      // Primary key from database
      content_id: 1,                              // From class_content_access table
      content_type: "announcement",               // enum: chat, teaching, announcement
      class_id: "OTU001234",                      // Matches the class
      title: "Welcome to Advanced React Development!",
      content: "Welcome everyone! I'm excited to have you in this advanced React course. We'll be covering a lot of ground over the next 12 weeks, including hooks, context, performance optimization, and testing strategies. Please make sure you have Node.js 16+ installed and are familiar with ES6+ JavaScript features.",
      text: "Welcome everyone! I'm excited to have you in this advanced React course...", // From chats/teachings table
      author: "Sarah Johnson",
      author_id: 1,
      user_id: 1,                                 // From chats/teachings table
      created_at: "2024-08-19T09:00:00Z",
      createdAt: "2024-08-19T09:00:00Z",          // Database field name
      updated_at: "2024-08-19T09:00:00Z",
      updatedAt: "2024-08-19T09:00:00Z",          // Database field name
      priority: "high",
      status: "approved",                         // From chats/teachings table
      approval_status: "approved",                // From chats/teachings table
      approval_date: "2024-08-19T09:00:00Z",
      approved_by: 1,
      access_level: "read",                       // From class_content_access table
      attachments: [
        {
          name: "Course_Syllabus.pdf",
          url: "/api/files/course_syllabus.pdf",
          size: "2.5 MB",
          media_type: "file"
        },
        {
          name: "Setup_Instructions.md", 
          url: "/api/files/setup_instructions.md",
          size: "15 KB",
          media_type: "file"
        }
      ],
      media_url1: "/api/files/course_syllabus.pdf",  // From chats/teachings table
      media_type1: "file",
      is_pinned: true,
      is_featured: true,                          // From chats/teachings table
      is_public: true,                            // From chats/teachings table
      view_count: 45,                             // From chats/teachings table
      like_count: 12,                             // From chats/teachings table
      comment_count: 8                            // From chats/teachings table
    },
    {
      id: 2,
      content_id: 2,
      content_type: "teaching",
      class_id: "OTU001234",
      title: "Week 1: Custom Hooks Implementation",
      content: "Create three custom hooks: useLocalStorage, useDebounce, and useFetch. Each hook should be properly typed with TypeScript and include comprehensive tests. Submit your solution via GitHub repository link.",
      topic: "Custom Hooks Implementation",        // From teachings table
      lessonNumber: "Week 1",                     // From teachings table
      subjectMatter: "React Hooks",               // From teachings table
      author: "Sarah Johnson",
      author_id: 1,
      user_id: 1,
      created_at: "2024-08-20T14:00:00Z",
      createdAt: "2024-08-20T14:00:00Z",
      due_date: "2024-08-27T23:59:00Z",
      priority: "medium",
      status: "approved",
      approval_status: "approved",
      difficulty_level: "intermediate",           // From teachings table
      estimated_duration: 240,                    // Minutes, from teachings table
      learning_objectives: "Students will learn to create reusable custom hooks",
      attachments: [
        {
          name: "Assignment_1_Requirements.pdf",
          url: "/api/files/assignment_1_requirements.pdf", 
          size: "1.2 MB",
          media_type: "file"
        },
        {
          name: "starter_code.zip",
          url: "/api/files/starter_code.zip",
          size: "45 KB",
          media_type: "file"
        }
      ],
      submissions_count: 12,
      max_score: 100,
      view_count: 38,
      like_count: 15,
      comment_count: 22
    },
    {
      id: 3,
      content_id: 3,
      content_type: "chat",
      class_id: "OTU001234", 
      title: "Best Practices for State Management",
      content: "Let's discuss different approaches to state management in React applications. What are your experiences with useState, useReducer, Context API, and external libraries like Redux or Zustand? Share your thoughts and real-world examples!",
      text: "Let's discuss different approaches to state management...",
      author: "Sarah Johnson",
      author_id: 1,
      user_id: 1,
      created_at: "2024-08-18T16:30:00Z",
      createdAt: "2024-08-18T16:30:00Z",
      replies_count: 18,
      last_reply_at: "2024-08-21T08:15:00Z",
      priority: "low",
      status: "approved",
      approval_status: "approved",
      participants: [
        "Alex Chen",
        "Maria Rodriguez",
        "David Park", 
        "Emma Wilson"
      ],
      view_count: 67,
      like_count: 24,
      comment_count: 18
    },
    {
      id: 4,
      content_id: 4,
      content_type: "teaching",
      class_id: "OTU001234",
      title: "Essential React Documentation & Tools", 
      content: "Here's a curated list of essential resources for React development. These include official documentation, useful tools, testing libraries, and community resources that will help you throughout the course.",
      topic: "React Resources and Tools",
      lessonNumber: "Resource Guide",
      subjectMatter: "Development Tools",
      author: "Sarah Johnson",
      author_id: 1,
      user_id: 1,
      created_at: "2024-08-17T11:00:00Z",
      createdAt: "2024-08-17T11:00:00Z",
      difficulty_level: "beginner",
      attachments: [
        {
          name: "React_Resources_Checklist.pdf",
          url: "/api/files/react_resources.pdf",
          size: "890 KB",
          media_type: "file"
        },
        {
          name: "VSCode_Extensions.json",
          url: "/api/files/vscode_extensions.json",
          size: "5 KB", 
          media_type: "file"
        }
      ],
      category: "Documentation",
      tags: "react,documentation,tools,resources",  // From teachings table
      view_count: 52,
      like_count: 19,
      comment_count: 7
    },
    {
      id: 5,
      content_id: 5,
      content_type: "announcement",
      class_id: "OTU001234",
      title: "Class Schedule Update - Week 3",
      content: "Important update: Our Wednesday session for Week 3 (August 28th) will be moved to Thursday, August 29th at the same time due to the instructor's conference attendance. The session will cover React Performance Optimization techniques.",
      author: "Sarah Johnson",
      author_id: 1,
      user_id: 1,
      created_at: "2024-08-21T07:45:00Z",
      createdAt: "2024-08-21T07:45:00Z",
      priority: "high",
      status: "approved",
      is_urgent: true,
      view_count: 73,
      like_count: 8,
      comment_count: 4
    },
    {
      id: 6,
      content_id: 6,
      content_type: "teaching",
      class_id: "OTU001234",
      title: "Week 2: Context API & useReducer Project",
      content: "Build a small e-commerce cart application using Context API and useReducer. The app should allow adding/removing items, calculating totals, and persisting cart state. Include proper error handling and loading states.",
      topic: "Context API & useReducer",
      lessonNumber: "Week 2",
      subjectMatter: "State Management",
      author: "Sarah Johnson",
      author_id: 1,
      user_id: 1,
      created_at: "2024-08-21T13:20:00Z",
      createdAt: "2024-08-21T13:20:00Z",
      due_date: "2024-09-03T23:59:00Z",
      priority: "medium",
      status: "approved",
      difficulty_level: "intermediate",
      estimated_duration: 900,  // 15 hours in minutes
      attachments: [
        {
          name: "Project_2_Specifications.pdf",
          url: "/api/files/project_2_specs.pdf",
          size: "3.1 MB",
          media_type: "file"
        },
        {
          name: "design_mockups.png",
          url: "/api/files/design_mockups.png", 
          size: "2.8 MB",
          media_type: "image"
        },
        {
          name: "api_endpoints.json",
          url: "/api/files/api_endpoints.json",
          size: "12 KB",
          media_type: "file"
        }
      ],
      estimated_hours: 15,
      difficulty: "intermediate",
      view_count: 29,
      like_count: 11,
      comment_count: 15
    },
    {
      id: 7,
      content_id: 7,
      content_type: "chat",
      class_id: "OTU001234",
      title: "Testing Strategies Discussion",
      content: "What testing approaches do you prefer for React components? Let's share experiences with Jest, React Testing Library, Cypress, and other testing tools. What challenges have you faced and how did you overcome them?",
      author: "Alex Chen",
      author_id: 2,
      user_id: 2,
      created_at: "2024-08-20T19:30:00Z",
      createdAt: "2024-08-20T19:30:00Z",
      replies_count: 7,
      last_reply_at: "2024-08-21T06:22:00Z",
      priority: "low",
      status: "approved",
      view_count: 34,
      like_count: 16,
      comment_count: 7
    },
    {
      id: 8,
      content_id: 8,
      content_type: "teaching",
      class_id: "OTU001234",
      title: "Performance Optimization Techniques",
      content: "Comprehensive guide to React performance optimization including memo, useMemo, useCallback, code splitting, lazy loading, and bundle optimization strategies.",
      topic: "Performance Optimization",
      lessonNumber: "Advanced Topic 1",
      subjectMatter: "Performance",
      author: "Sarah Johnson", 
      author_id: 1,
      user_id: 1,
      created_at: "2024-08-16T14:15:00Z",
      createdAt: "2024-08-16T14:15:00Z",
      difficulty_level: "advanced",
      estimated_duration: 180,  // 3 hours
      attachments: [
        {
          name: "Performance_Guide.pdf",
          url: "/api/files/performance_guide.pdf",
          size: "4.2 MB",
          media_type: "file"
        },
        {
          name: "benchmark_examples.zip",
          url: "/api/files/benchmark_examples.zip",
          size: "156 KB",
          media_type: "file"
        }
      ],
      category: "Performance",
      tags: "performance,optimization,memoization,bundling",
      view_count: 41,
      like_count: 22,
      comment_count: 12
    }
  ]
};

export const mockClassAnnouncements = {
  data: [
    {
      id: "ann_1",
      title: "Welcome to Advanced React Development!",
      content: "Welcome everyone! I'm excited to have you in this advanced React course.",
      created_at: "2024-08-19T09:00:00Z",
      priority: "high",
      is_pinned: true
    },
    {
      id: "ann_2", 
      title: "Class Schedule Update - Week 3",
      content: "Important update: Our Wednesday session for Week 3 (August 28th) will be moved to Thursday.",
      created_at: "2024-08-21T07:45:00Z",
      priority: "high",
      is_urgent: true
    }
  ]
};

export const mockClassMembers = {
  data: [
    {
      id: 1,                                      // Primary key from user_class_memberships
      user_id: 1,                                 // From user_class_memberships
      class_id: "OTU001234",                      // From user_class_memberships
      name: "Sarah Johnson",
      username: "sarah.instructor",
      email: "sarah@example.com",
      role: "instructor",                         // User's general role
      role_in_class: "assistant",                 // From user_class_memberships.role_in_class
      membership_status: "active",                // From user_class_memberships.membership_status
      avatar_url: "https://i.pravatar.cc/150?img=1",
      converse_avatar: "https://i.pravatar.cc/150?img=1", // From users table
      is_active: true,
      user_is_class_member: true,
      membership_stage: "member",                 // From users table
      joinedAt: "2024-01-15T10:00:00Z",          // From user_class_memberships
      joined_at: "2024-01-15T10:00:00Z",         // Alias
      assigned_by: null,                          // From user_class_memberships
      expiresAt: null,                            // From user_class_memberships
      can_see_class_name: true,                   // From user_class_memberships
      receive_notifications: true,                // From user_class_memberships
      last_seen: "2024-08-21T09:00:00Z",
      lastLogin: "2024-08-21T09:00:00Z",         // From users table
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-08-21T09:00:00Z"
    },
    {
      id: 2,
      user_id: 2,
      class_id: "OTU001234", 
      name: "Alex Chen",
      username: "alex.chen",
      email: "alex@example.com",
      role: "user",
      role_in_class: "member",
      membership_status: "active",
      avatar_url: "https://i.pravatar.cc/150?img=2",
      is_active: true,
      user_is_class_member: true,
      membership_stage: "member",
      joinedAt: "2024-08-01T14:30:00Z",
      joined_at: "2024-08-01T14:30:00Z",
      assigned_by: 1,
      can_see_class_name: true,
      receive_notifications: true,
      last_seen: "2024-08-21T08:45:00Z",
      lastLogin: "2024-08-21T08:45:00Z"
    },
    {
      id: 3,
      user_id: 3,
      class_id: "OTU001234",
      name: "Maria Rodriguez", 
      username: "maria.r",
      email: "maria@example.com",
      role: "user",
      role_in_class: "member",
      membership_status: "active",
      avatar_url: "https://i.pravatar.cc/150?img=3",
      is_active: false,
      user_is_class_member: true,
      membership_stage: "member", 
      joinedAt: "2024-08-02T11:15:00Z",
      joined_at: "2024-08-02T11:15:00Z",
      assigned_by: 1,
      can_see_class_name: true,
      receive_notifications: true,
      last_seen: "2024-08-20T22:30:00Z",
      lastLogin: "2024-08-20T22:30:00Z"
    },
    {
      id: 4,
      user_id: 4,
      class_id: "OTU001234",
      name: "David Park",
      username: "david.park",
      email: "david@example.com", 
      role: "user",
      role_in_class: "moderator",
      membership_status: "active",
      avatar_url: "https://i.pravatar.cc/150?img=4",
      is_active: true,
      user_is_class_member: true,
      membership_stage: "member",
      joinedAt: "2024-07-28T16:00:00Z",
      joined_at: "2024-07-28T16:00:00Z",
      assigned_by: 1,
      can_see_class_name: true,
      receive_notifications: true,
      last_seen: "2024-08-21T09:15:00Z",
      lastLogin: "2024-08-21T09:15:00Z"
    },
    {
      id: 5,
      user_id: 5,
      class_id: "OTU001234",
      name: "Emma Wilson",
      username: "emma.w",
      email: "emma@example.com",
      role: "user",
      role_in_class: "member",
      membership_status: "active",
      avatar_url: null,
      converse_avatar: null,
      is_active: true,
      user_is_class_member: true,
      membership_stage: "pre_member",
      joinedAt: "2024-08-03T09:45:00Z",
      joined_at: "2024-08-03T09:45:00Z",
      assigned_by: 1,
      can_see_class_name: true,
      receive_notifications: false,
      last_seen: "2024-08-21T07:30:00Z",
      lastLogin: "2024-08-21T07:30:00Z"
    },
    {
      id: 6,
      user_id: 6,
      class_id: "OTU001234",
      name: "James Thompson",
      username: "james.t",
      email: "james@example.com",
      role: "user",
      role_in_class: "member", 
      membership_status: "suspended",
      avatar_url: "https://i.pravatar.cc/150?img=6",
      is_active: false,
      user_is_class_member: true,
      membership_stage: "member",
      joinedAt: "2024-08-01T13:20:00Z",
      joined_at: "2024-08-01T13:20:00Z", 
      assigned_by: 1,
      expiresAt: "2024-09-01T00:00:00Z",
      can_see_class_name: false,
      receive_notifications: false,
      last_seen: "2024-08-19T18:45:00Z",
      lastLogin: "2024-08-19T18:45:00Z"
    }
  ]
};

// Additional mock data for different scenarios
export const mockEmptyClass = {
  data: {
    id: 124,
    class_id: "OTU001235",
    original_class_id: "OTU#001235",
    class_name: "New Empty Class",
    public_name: "Empty Class Example",
    description: "This is a newly created class with no content yet.",
    class_type: "public",
    is_active: true,
    is_public: true,
    max_members: 30,
    privacy_level: "public",
    created_by: 1,
    user_is_class_member: false,
    total_members: 0,
    moderators: 0,
    pending_members: 0,
    instructor: "John Doe",
    instructor_id: 2,
    createdAt: "2024-08-21T10:00:00Z",
    updatedAt: "2024-08-21T10:00:00Z",
    user_role_in_class: null,
    can_see_class_name: true,
    receive_notifications: false
  }
};

export const mockEmptyContent = {
  data: []
};

export const mockPrivateClass = {
  data: {
    id: 125,
    class_id: "OTU001236", 
    original_class_id: "OTU#001236",
    class_name: "Exclusive Advanced Topics",
    public_name: "Advanced Topics (Private)",
    description: "This is a private class for selected members only.",
    class_type: "special",
    is_active: true,
    is_public: false,
    max_members: 10,
    privacy_level: "admin_only",
    created_by: 1,
    user_is_class_member: false,
    total_members: 5,
    moderators: 1,
    pending_members: 2,
    instructor: "Expert Teacher",
    instructor_id: 3,
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-08-20T15:00:00Z",
    user_role_in_class: null,
    can_see_class_name: false,
    receive_notifications: false
  }
};

// Mock user data for testing different user roles
export const mockUsers = {
  student: {
    id: "user_student",
    name: "Student User",
    username: "student",
    role: "student",
    email: "student@example.com"
  },
  instructor: {
    id: "user_instructor", 
    name: "Instructor User",
    username: "instructor",
    role: "instructor",
    email: "instructor@example.com"
  },
  admin: {
    id: "user_admin",
    name: "Admin User", 
    username: "admin",
    role: "admin",
    email: "admin@example.com"
  },
  moderator: {
    id: "user_moderator",
    name: "Moderator User",
    username: "moderator", 
    role: "moderator",
    email: "moderator@example.com"
  }
};

// Export all mock data as a single object for easy importing
export const mockClassData = {
  classDetails: mockClassDetails,
  classContent: mockClassContent,
  classAnnouncements: mockClassAnnouncements,
  classMembers: mockClassMembers,
  emptyClass: mockEmptyClass,
  emptyContent: mockEmptyContent,
  privateClass: mockPrivateClass,
  users: mockUsers
};