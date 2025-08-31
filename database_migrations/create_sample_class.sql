-- Create sample class OTU#001001 for testing
INSERT INTO classes (
    class_id, 
    class_name, 
    public_name, 
    description, 
    class_type, 
    category, 
    difficulty_level, 
    is_public, 
    max_members, 
    estimated_duration, 
    prerequisites, 
    learning_objectives, 
    tags, 
    privacy_level, 
    created_by, 
    is_active,
    allow_self_join,
    require_full_membership,
    auto_approve_members,
    require_approval,
    allow_preview
) VALUES (
    'OTU#001001',
    'Introduction to Computer Science',
    'Intro to CS',
    'A comprehensive introduction to computer science fundamentals including programming, algorithms, and data structures.',
    'subject',
    'Computer Science',
    'beginner',
    1,
    50,
    480,
    'Basic mathematics and logical thinking skills',
    'Understand programming fundamentals, Learn basic algorithms, Master data structures, Develop problem-solving skills',
    'programming,algorithms,data-structures,computer-science,beginner',
    'public',
    1,
    1,
    1,
    0,
    1,
    0,
    1
) ON DUPLICATE KEY UPDATE
    class_name = VALUES(class_name),
    description = VALUES(description);

-- Create sample membership for user ID 2 (the user that's testing)
INSERT INTO user_class_memberships (
    user_id,
    class_id,
    membership_status,
    role_in_class,
    joinedAt,
    assigned_by,
    can_see_class_name,
    receive_notifications
) VALUES (
    2,
    'OTU#001001',
    'active',
    'member',
    NOW(),
    1,
    1,
    1
) ON DUPLICATE KEY UPDATE
    membership_status = VALUES(membership_status);