// ikootaclient/src/components/classes/ClassContentViewer.jsx
// LIVE CLASSROOM HUB - Interactive teaching environment (Stage 2 of class experience)
// Features: Live teaching board, video/audio, charts, real-time interactions, collaborative learning

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './ClassContentViewer.css';
// ✅ NEW: AI Features Panel
import AIFeaturesPanel from '../shared/AIFeaturesPanel';

const ClassContentViewer = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();
  
  // Debug the actual URL and params received
  console.log('🔍 ClassContentViewer Raw Debug:', {
    classIdFromParams: classId,
    windowLocationHref: window.location.href,
    windowLocationPathname: window.location.pathname,
    windowLocationHash: window.location.hash,
    useParamsResult: useParams()
  });
  
  // Helper function to handle class ID formats with proper URL handling
  const normalizeClassId = (id) => {
    if (!id) return null;
    
    try {
      // First, handle URL decoding
      let decoded = decodeURIComponent(id);
      
      console.log('🔍 normalizeClassId input:', { original: id, decoded });
      
      // Check if we have a complete class ID with hash
      const hasHash = decoded.includes('#');
      let classId = decoded;
      
      // If we don't have a hash and the ID looks incomplete, try to reconstruct
      if (!hasHash && decoded.length <= 4) {
        console.log('🔧 Attempting to reconstruct incomplete class ID:', decoded);
        
        // Try to get the full URL path and extract the class ID
        const currentPath = window.location.pathname;
        console.log('🔍 Current pathname:', currentPath);
        
        // Look for encoded class ID in the URL path
        const pathSegments = currentPath.split('/');
        const classesIndex = pathSegments.indexOf('classes');
        
        if (classesIndex !== -1 && pathSegments[classesIndex + 1]) {
          const urlClassId = decodeURIComponent(pathSegments[classesIndex + 1]);
          console.log('🔍 URL class ID from path:', urlClassId);
          
          if (urlClassId.includes('#') || urlClassId.length > decoded.length) {
            classId = urlClassId;
            console.log('✅ Reconstructed class ID from URL path:', classId);
          }
        }
      }
      
      // Parse the class ID components
      const finalHasHash = classId.includes('#');
      const withoutHash = classId.replace('#', '');
      
      // Construct proper formats
      let forApi, forDisplay;
      
      if (finalHasHash) {
        // Already has hash, use as-is
        forApi = classId;
        forDisplay = classId;
      } else if (withoutHash.length > 3) {
        // No hash but looks complete, add hash in the right place
        const prefix = withoutHash.substring(0, 3);
        const suffix = withoutHash.substring(3);
        forApi = `${prefix}#${suffix}`;
        forDisplay = `${prefix}#${suffix}`;
      } else {
        // Incomplete ID, use as-is (will likely fail validation)
        forApi = classId;
        forDisplay = classId;
      }
      
      // Validation
      const isValidFormat = /^[A-Z]{2,4}#[0-9A-Z]{3,10}$/i.test(forApi);
      
      console.log('🔍 normalizeClassId result:', {
        input: id,
        decoded,
        reconstructed: classId,
        forApi,
        forDisplay,
        isValidFormat
      });
      
      return {
        forApi,
        forDisplay,
        isOriginalFormat: finalHasHash,
        isValid: isValidFormat
      };
      
    } catch (error) {
      console.error('❌ Error normalizing class ID:', error);
      return {
        forApi: id,
        forDisplay: id,
        isOriginalFormat: false,
        isValid: false
      };
    }
  };

  const classIdInfo = normalizeClassId(classId);
  const apiClassId = classIdInfo?.forApi || classId;
  const displayClassId = classIdInfo?.forDisplay || classId;
  
  // Debug logging
  console.log('🔍 ClassContentViewer Debug:', {
    originalClassId: classId,
    windowLocationHref: window.location.href,
    windowLocationHash: window.location.hash,
    classIdInfo,
    apiClassId,
    displayClassId
  });
  
  // Early return for invalid class IDs
  if (!classId || classId.trim() === '') {
    return (
      <div className="class-content-viewer error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Class</h3>
          <p>No class ID provided.</p>
          <button onClick={() => navigate('/classes')} className="btn-back">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  // Check for URL fragment issue and show helpful error
  if (classIdInfo && !classIdInfo.isValid && classId.length <= 3) {
    return (
      <div className="class-content-viewer error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Invalid Class ID Format</h3>
          <p>The class ID "{classId}" appears incomplete. Expected format: OTU#XXXXXX</p>
          <p>This may be due to a URL parsing issue. Please navigate to this class from the class list.</p>
          <button onClick={() => navigate('/classes')} className="btn-back">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  // State management
  const [activeTab, setActiveTab] = useState('announcements');
  const [selectedContent, setSelectedContent] = useState(null);
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [newContent, setNewContent] = useState({
    type: 'announcement',
    title: '',
    content: '',
    attachments: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [contentFilter, setContentFilter] = useState('all');
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ DATA FETCHING
  
  // Fetch class details
  const { data: classData, isLoading: classLoading, error: classError } = useQuery({
    queryKey: ['classDetails', apiClassId],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      const { data } = await api.get(`/classes/${encodedClassId}`);
      return data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Fetch class content
  const { data: contentData, isLoading: contentLoading, refetch: refetchContent } = useQuery({
    queryKey: ['classContent', apiClassId, activeTab],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      const params = new URLSearchParams({
        type: activeTab !== 'all' ? activeTab : '',
        limit: '50',
        ...(searchQuery && { search: searchQuery })
      });
      const { data } = await api.get(`/classes/${encodedClassId}/content?${params}`);
      return data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 30 * 1000,
    retry: 1
  });

  // Fetch class announcements
  const { data: announcementsData } = useQuery({
    queryKey: ['classAnnouncements', apiClassId],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      const { data } = await api.get(`/classes/${encodedClassId}/announcements`);
      return data;
    },
    enabled: !!apiClassId && isAuthenticated,
    staleTime: 1 * 60 * 1000,
    retry: 1
  });

  // Fetch class members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['classMembers', apiClassId],
    queryFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      const { data } = await api.get(`/classes/${encodedClassId}/members`);
      return data;
    },
    enabled: !!apiClassId && isAuthenticated && showParticipants,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // ✅ MUTATIONS

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData) => {
      const encodedClassId = encodeURIComponent(apiClassId);
      return await api.post(`/classes/${encodedClassId}/feedback`, feedbackData);
    },
    onSuccess: () => {
      alert('Feedback submitted successfully!');
      queryClient.invalidateQueries(['classContent']);
    },
    onError: (error) => {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  });

  // Mark attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (attendanceData) => {
      const encodedClassId = encodeURIComponent(apiClassId);
      return await api.post(`/classes/${encodedClassId}/attendance`, attendanceData);
    },
    onSuccess: () => {
      alert('Attendance marked successfully!');
      queryClient.invalidateQueries(['classContent']);
    },
    onError: (error) => {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  });

  // Join class mutation
  const joinClassMutation = useMutation({
    mutationFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      return await api.post(`/classes/${encodedClassId}/join`);
    },
    onSuccess: () => {
      alert('Successfully joined class!');
      queryClient.invalidateQueries(['classDetails']);
      queryClient.invalidateQueries(['classMembers']);
    },
    onError: (error) => {
      console.error('Failed to join class:', error);
      alert(error.response?.data?.message || 'Failed to join class');
    }
  });

  // Leave class mutation
  const leaveClassMutation = useMutation({
    mutationFn: async () => {
      const encodedClassId = encodeURIComponent(apiClassId);
      return await api.post(`/classes/${encodedClassId}/leave`);
    },
    onSuccess: () => {
      alert('Successfully left class!');
      navigate('/classes/my-classes');
    },
    onError: (error) => {
      console.error('Failed to leave class:', error);
      alert(error.response?.data?.message || 'Failed to leave class');
    }
  });

  // ✅ HANDLERS

  const handleSubmitFeedback = (content, rating = 5) => {
    feedbackMutation.mutate({
      content,
      rating,
      timestamp: new Date().toISOString()
    });
  };

  const handleMarkAttendance = () => {
    attendanceMutation.mutate({
      session_id: `session_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleJoinClass = () => {
    if (window.confirm('Do you want to join this class?')) {
      joinClassMutation.mutate();
    }
  };

  const handleLeaveClass = () => {
    if (window.confirm('Are you sure you want to leave this class?')) {
      leaveClassMutation.mutate();
    }
  };

  const handleContentCreate = () => {
    // This would be handled by admin/moderator content creation
    setShowCreateContent(true);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setNewContent(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [contentData]);

  // Process data safely with proper field mapping
  const classInfo = classData?.data || classData || {};
  const content = contentData?.data?.data || contentData?.data || [];
  const announcements = announcementsData?.data?.data || announcementsData?.data || [];
  const members = membersData?.data?.data || membersData?.data || [];

  // Check if user is a member (updated to match database structure)
  const isClassMember = classInfo.is_member || 
                       members.some(m => m.user_id === user?.id || m.id === user?.id);
  
  const canCreateContent = user?.role === 'admin' || user?.role === 'super_admin' || 
                          members.find(m => (m.user_id === user?.id || m.id === user?.id) && 
                                          (m.role_in_class === 'moderator' || m.role_in_class === 'assistant'));

  // Filter content based on search and type (updated for database structure)
  const filteredContent = content.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Map frontend tabs to backend content types
    const typeMapping = {
      'announcements': 'announcement',
      'discussions': 'chat',
      'assignments': 'teaching',
      'resources': 'teaching'
    };
    
    if (contentFilter === 'all' || activeTab === 'all') {
      return matchesSearch;
    }
    
    const expectedType = typeMapping[activeTab] || activeTab;
    const matchesFilter = item.content_type === expectedType || item.type === expectedType;
    
    return matchesSearch && matchesFilter;
  });

  // ✅ LOADING AND ERROR STATES

  if (!isAuthenticated) {
    return (
      <div className="class-content-error">
        <div className="error-container">
          <div className="error-icon">🔐</div>
          <h3>Authentication Required</h3>
          <p>Please log in to view class content</p>
          <button onClick={() => navigate('/login')} className="btn-login">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (classLoading) {
    return (
      <div className="class-content-loading">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <h3>Loading class content...</h3>
          <p>Please wait while we fetch the latest content</p>
        </div>
      </div>
    );
  }

  if (classError) {
    return (
      <div className="class-content-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Class</h3>
          <p>{classError.message}</p>
          <button onClick={() => navigate('/classes')} className="btn-back">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  if (!isClassMember && !classInfo.is_public) {
    return (
      <div className="class-content-restricted">
        <div className="restriction-container">
          <div className="restriction-icon">🔒</div>
          <h3>Private Class</h3>
          <p>This class is private. You need to be a member to view its content.</p>
          <div className="class-info">
            <h4>{classInfo.class_name}</h4>
            <p>{classInfo.description}</p>
            <div className="class-meta">
              <span>Type: {classInfo.class_type}</span>
              <span>Members: {classInfo.total_members || 0}</span>
            </div>
          </div>
          <div className="action-buttons">
            <button onClick={handleJoinClass} className="btn-join" disabled={joinClassMutation.isLoading}>
              {joinClassMutation.isLoading ? 'Joining...' : 'Request to Join'}
            </button>
            <button onClick={() => navigate('/classes')} className="btn-back">
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ MAIN RENDER

  return (
    <div className="class-content-viewer">
      {/* ✅ CLASS HEADER */}
      <div className="class-header">
        <div className="class-info-header">
          <div className="class-title-section">
            <button onClick={() => navigate(`/classes/${encodeURIComponent(apiClassId)}`)} className="btn-back-small">
              ← Back to Preview
            </button>
            <div className="class-title">
              <h1>🎓 {classInfo.class_name} - Live Classroom</h1>
              <div className="class-meta">
                <span className={`class-status ${classInfo.is_active ? 'active' : 'inactive'}`}>
                  {classInfo.is_active ? '🔴 Live' : '⚫ Offline'}
                </span>
                <span className="class-type">{classInfo.class_type}</span>
                <span className="class-visibility">{classInfo.is_public ? 'Public' : 'Private'}</span>
                <span className="class-id">ID: {displayClassId}</span>
              </div>
            </div>
          </div>
          
          <div className="class-actions">
            {isClassMember ? (
              <>
                <button onClick={handleMarkAttendance} className="btn-attendance" disabled={attendanceMutation.isLoading}>
                  📅 Mark Attendance
                </button>
                <button onClick={() => setShowParticipants(!showParticipants)} className="btn-members">
                  👥 Members ({members.length})
                </button>
                <button onClick={handleLeaveClass} className="btn-leave" disabled={leaveClassMutation.isLoading}>
                  🚪 Leave Class
                </button>
              </>
            ) : classInfo.is_public && classInfo.allow_self_join ? (
              <button onClick={handleJoinClass} className="btn-join" disabled={joinClassMutation.isLoading}>
                {joinClassMutation.isLoading ? 'Joining...' : '➕ Join Class'}
              </button>
            ) : null}
          </div>
        </div>

        {classInfo.description && (
          <div className="class-description">
            <p>{classInfo.description}</p>
          </div>
        )}

        {/* Important Announcements */}
        {announcements.length > 0 && (
          <div className="important-announcements">
            <h3>📢 Important Announcements</h3>
            <div className="announcements-list">
              {announcements.slice(0, 2).map(announcement => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-content">
                    <h4>{announcement.title}</h4>
                    <p>{announcement.content}</p>
                    <span className="announcement-date">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ✅ MAIN CONTENT AREA */}
      <div className="class-content-main">
        {/* Sidebar - Members Panel */}
        {showParticipants && (
          <div className="members-sidebar">
            <div className="sidebar-header">
              <h3>Class Members</h3>
              <button onClick={() => setShowParticipants(false)} className="btn-close-sidebar">
                ✕
              </button>
            </div>
            <div className="members-list">
              {membersLoading ? (
                <div className="loading-small">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="empty-members">No members found</div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      {member.avatar_url || member.converse_avatar ? (
                        <img src={member.avatar_url || member.converse_avatar} alt={member.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {(member.name || member.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.name || member.username}</div>
                      <div className="member-role">{member.role_in_class || member.role || 'Member'}</div>
                      {member.membership_status && member.membership_status !== 'active' && (
                        <div className="member-status-badge">{member.membership_status}</div>
                      )}
                    </div>
                    <div className={`member-status ${member.is_active ? 'online' : 'offline'}`}>
                      {member.is_active ? '🟢' : '⚫'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="content-area">
          {/* Content Navigation */}
          <div className="content-nav">
            <div className="content-tabs">
              <button 
                className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                onClick={() => setActiveTab('announcements')}
              >
                📢 Announcements
              </button>
              <button 
                className={`tab-btn ${activeTab === 'discussions' ? 'active' : ''}`}
                onClick={() => setActiveTab('discussions')}
              >
                💬 Discussions
              </button>
              <button 
                className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
                onClick={() => setActiveTab('assignments')}
              >
                📝 Assignments
              </button>
              <button 
                className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveTab('resources')}
              >
                📚 Resources
              </button>
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                📋 All Content
              </button>
            </div>

            <div className="content-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              {canCreateContent && (
                <button onClick={handleContentCreate} className="btn-create-content">
                  ➕ Add Content
                </button>
              )}
            </div>
          </div>

          {/* Content Display */}
          <div className="content-display">
            {contentLoading ? (
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p>Loading {activeTab}...</p>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="empty-content">
                <div className="empty-icon">
                  {activeTab === 'announcements' ? '📢' :
                   activeTab === 'discussions' ? '💬' :
                   activeTab === 'assignments' ? '📝' :
                   activeTab === 'resources' ? '📚' : '📄'}
                </div>
                <h3>No {activeTab} Yet</h3>
                <p>
                  {activeTab === 'all' ? 'No content has been added to this class yet.' :
                   `No ${activeTab} have been posted in this class yet.`}
                </p>
                {canCreateContent && (
                  <button onClick={handleContentCreate} className="btn-create-first">
                    Create First {activeTab.slice(0, -1)}
                  </button>
                )}
              </div>
            ) : (
              <div className="content-list">
                {filteredContent.map(item => (
                  <div key={item.id} className={`content-item ${item.content_type || item.type}`}>
                    <div className="content-header">
                      <div className="content-meta">
                        <span className="content-type-icon">
                          {item.content_type === 'announcement' || item.type === 'announcement' ? '📢' :
                           item.content_type === 'chat' || item.type === 'discussion' ? '💬' :
                           item.content_type === 'teaching' || item.type === 'assignment' || item.type === 'resource' ? '📝' :
                           item.type === 'resource' ? '📚' : '📄'}
                        </span>
                        <div className="content-info">
                          <h4 className="content-title">{item.title}</h4>
                          <div className="content-details">
                            <span className="content-author">{item.author || 'Unknown'}</span>
                            <span className="content-date">
                              {new Date(item.created_at || item.createdAt).toLocaleString()}
                            </span>
                            <span className="content-type-label">
                              {item.content_type || item.type}
                              {item.lessonNumber && ` - ${item.lessonNumber}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {item.priority && (
                        <div className="content-priority">
                          <span className={`priority-badge ${item.priority}`}>
                            {item.priority === 'high' ? '🔴' :
                             item.priority === 'medium' ? '🟡' : '🟢'}
                            {item.priority}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="content-body">
                      <div className="content-text">
                        {item.content || item.text || item.description}
                      </div>
                      
                      {/* ✅ NEW: AI Features Panel for each content item */}
                      <AIFeaturesPanel 
                        content={item.content || item.text || item.description}
                        contentType={item.content_type || item.type || 'class-content'}
                        contentId={item.id}
                        contentTitle={item.title}
                        position="inline"
                        showButton={true}
                      />
                      
                      {/* Display teaching-specific fields */}
                      {item.content_type === 'teaching' && (
                        <div className="teaching-details">
                          {item.difficulty_level && (
                            <span className="difficulty-badge">{item.difficulty_level}</span>
                          )}
                          {item.estimated_duration && (
                            <span className="duration-info">
                              ⏱️ {Math.round(item.estimated_duration / 60)} hours
                            </span>
                          )}
                          {item.learning_objectives && (
                            <div className="learning-objectives">
                              <strong>Objectives:</strong> {item.learning_objectives}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="content-attachments">
                          <h5>Attachments:</h5>
                          <div className="attachments-list">
                            {item.attachments.map((attachment, index) => (
                              <a 
                                key={index} 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                📎 {attachment.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Handle media URLs from database */}
                      {(item.media_url1 || item.media_url2 || item.media_url3) && (
                        <div className="content-media">
                          <h5>Media:</h5>
                          <div className="media-list">
                            {item.media_url1 && (
                              <a href={item.media_url1} target="_blank" rel="noopener noreferrer" className="media-link">
                                {item.media_type1 === 'image' ? '🖼️' : 
                                 item.media_type1 === 'video' ? '🎥' : 
                                 item.media_type1 === 'audio' ? '🎵' : '📄'} Media 1
                              </a>
                            )}
                            {item.media_url2 && (
                              <a href={item.media_url2} target="_blank" rel="noopener noreferrer" className="media-link">
                                {item.media_type2 === 'image' ? '🖼️' : 
                                 item.media_type2 === 'video' ? '🎥' : 
                                 item.media_type2 === 'audio' ? '🎵' : '📄'} Media 2
                              </a>
                            )}
                            {item.media_url3 && (
                              <a href={item.media_url3} target="_blank" rel="noopener noreferrer" className="media-link">
                                {item.media_type3 === 'image' ? '🖼️' : 
                                 item.media_type3 === 'video' ? '🎥' : 
                                 item.media_type3 === 'audio' ? '🎵' : '📄'} Media 3
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {item.due_date && (
                        <div className="content-due-date">
                          <span className="due-date-label">Due Date:</span>
                          <span className={`due-date ${new Date(item.due_date) < new Date() ? 'overdue' : ''}`}>
                            {new Date(item.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {/* Display engagement metrics */}
                      {(item.view_count || item.like_count || item.comment_count) && (
                        <div className="content-metrics">
                          {item.view_count > 0 && <span>👁️ {item.view_count} views</span>}
                          {item.like_count > 0 && <span>❤️ {item.like_count} likes</span>}
                          {item.comment_count > 0 && <span>💬 {item.comment_count} comments</span>}
                        </div>
                      )}
                    </div>

                    <div className="content-actions">
                      <button 
                        onClick={() => setSelectedContent(item)}
                        className="btn-view-details"
                      >
                        View Details
                      </button>
                      
                      {(item.content_type === 'chat' || item.type === 'discussion') && (
                        <button className="btn-reply">
                          Reply ({item.replies_count || item.comment_count || 0})
                        </button>
                      )}
                      
                      {(item.content_type === 'teaching' || item.type === 'assignment') && item.due_date && (
                        <button className="btn-submit">
                          Submit Work
                        </button>
                      )}
                      
                      {/* Show approval status for admin users */}
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <span className={`approval-status ${item.approval_status || item.status}`}>
                          {item.approval_status || item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ FEEDBACK SECTION */}
      {isClassMember && (
        <div className="feedback-section">
          <div className="feedback-header">
            <h3>Share Your Feedback</h3>
          </div>
          <div className="feedback-form">
            <textarea
              placeholder="Share your thoughts about this class..."
              className="feedback-textarea"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmitFeedback(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <div className="feedback-actions">
              <span className="feedback-hint">Press Ctrl+Enter to submit</span>
              <button 
                onClick={(e) => {
                  const textarea = e.target.parentElement.previousElementSibling;
                  if (textarea.value.trim()) {
                    handleSubmitFeedback(textarea.value);
                    textarea.value = '';
                  }
                }}
                className="btn-submit-feedback"
                disabled={feedbackMutation.isLoading}
              >
                {feedbackMutation.isLoading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODALS */}
      
      {/* Content Details Modal */}
      {selectedContent && (
        <div className="modal-overlay" onClick={() => setSelectedContent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedContent.title}</h3>
              <button onClick={() => setSelectedContent(null)} className="btn-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="content-full-details">
                <div className="content-meta-full">
                  <span>Type: {selectedContent.content_type || selectedContent.type}</span>
                  <span>Author: {selectedContent.author}</span>
                  <span>Posted: {new Date(selectedContent.created_at || selectedContent.createdAt).toLocaleString()}</span>
                  {selectedContent.approval_status && (
                    <span>Status: {selectedContent.approval_status}</span>
                  )}
                </div>
                <div className="content-full-text">
                  {selectedContent.content || selectedContent.text || selectedContent.description}
                </div>
                {selectedContent.attachments && selectedContent.attachments.length > 0 && (
                  <div className="attachments-section">
                    <h4>Attachments</h4>
                    {selectedContent.attachments.map((attachment, index) => (
                      <a 
                        key={index} 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-download"
                      >
                        📎 Download {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
                {/* Display teaching-specific details in modal */}
                {selectedContent.content_type === 'teaching' && (
                  <div className="teaching-modal-details">
                    {selectedContent.lessonNumber && (
                      <div><strong>Lesson:</strong> {selectedContent.lessonNumber}</div>
                    )}
                    {selectedContent.difficulty_level && (
                      <div><strong>Difficulty:</strong> {selectedContent.difficulty_level}</div>
                    )}
                    {selectedContent.estimated_duration && (
                      <div><strong>Duration:</strong> {Math.round(selectedContent.estimated_duration / 60)} hours</div>
                    )}
                    {selectedContent.learning_objectives && (
                      <div><strong>Learning Objectives:</strong> {selectedContent.learning_objectives}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedContent(null)} className="btn-close-modal">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Content Modal */}
      {showCreateContent && canCreateContent && (
        <div className="modal-overlay" onClick={() => setShowCreateContent(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Content</h3>
              <button onClick={() => setShowCreateContent(false)} className="btn-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="create-content-form">
                <div className="form-group">
                  <label>Content Type</label>
                  <select 
                    value={newContent.type} 
                    onChange={(e) => setNewContent(prev => ({ ...prev, type: e.target.value }))}
                    className="form-select"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="discussion">Discussion</option>
                    <option value="assignment">Assignment</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text"
                    value={newContent.title}
                    onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter content title"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Content</label>
                  <textarea 
                    value={newContent.content}
                    onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter content details..."
                    rows="8"
                    className="form-textarea"
                  />
                </div>
                
                <div className="form-group">
                  <label>Attachments</label>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileUpload}
                    className="form-file"
                  />
                  {newContent.attachments.length > 0 && (
                    <div className="attached-files">
                      {newContent.attachments.map((file, index) => (
                        <div key={index} className="attached-file">
                          <span>{file.name}</span>
                          <button 
                            onClick={() => setNewContent(prev => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== index)
                            }))}
                            className="btn-remove-file"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateContent(false)} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={() => {
                  // This would typically submit to an admin endpoint
                  console.log('Creating content:', newContent);
                  alert('Content creation would be handled by admin endpoint');
                  setShowCreateContent(false);
                  setNewContent({ type: 'announcement', title: '', content: '', attachments: [] });
                }}
                className="btn-create"
                disabled={!newContent.title.trim() || !newContent.content.trim()}
              >
                Create Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassContentViewer;