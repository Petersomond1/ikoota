// ikootaclient/src/components/classes/MyClassesPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import api from '../service/api';
import './MyClassesPage.css';

const fetchUserClasses = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-classes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserProgress = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-progress', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const leaveClass = async (classId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post(`/classes/${classId}/leave`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const MyClassesPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, active, completed

  // Fetch user's classes
  const { data: userClasses, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['userClasses'],
    queryFn: fetchUserClasses,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Fetch user's progress
  const { data: progressData } = useQuery({
    queryKey: ['userProgress'],
    queryFn: fetchUserProgress,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Leave class mutation
  const leaveClassMutation = useMutation({
    mutationFn: leaveClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      queryClient.invalidateQueries(['userProgress']);
      alert('Successfully left class!');
    },
    onError: (error) => {
      console.error('Failed to leave class:', error);
      alert(error.response?.data?.message || 'Failed to leave class');
    }
  });

  const handleLeaveClass = (classId, className) => {
    if (window.confirm(`Are you sure you want to leave "${className}"?`)) {
      leaveClassMutation.mutate(classId);
    }
  };

  const handleClassClick = (classItem) => {
    const classId = classItem.class_id || classItem.id;
    // URL encode the classId to handle # characters properly
    const encodedClassId = encodeURIComponent(classId);
    navigate(`/classes/${encodedClassId}`);
  };

  const classes = userClasses?.data || [];
  const progress = progressData?.progress || {};

  // Filter classes based on selected filter
  const filteredClasses = classes.filter(cls => {
    if (filter === 'active') return cls.is_active;
    if (filter === 'completed') return !cls.is_active;
    return true; // all
  });

  if (classesLoading) {
    return (
      <div className="my-classes-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading your classes...</h3>
        </div>
      </div>
    );
  }

  if (classesError) {
    return (
      <div className="my-classes-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error loading your classes</h3>
          <p>{classesError.message}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-classes-page">
      <div className="page-header">
        <div className="header-content">
          <h1>My Classes</h1>
          <p>Manage your enrolled classes and track your progress</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => navigate('/classes')}
            className="btn-browse"
          >
            🔍 Browse More Classes
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="progress-summary">
        <div className="summary-card">
          <div className="summary-icon">📚</div>
          <div className="summary-content">
            <h3>{classes.length}</h3>
            <p>Total Classes</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>{classes.filter(cls => cls.is_active).length}</h3>
            <p>Active Classes</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">🎯</div>
          <div className="summary-content">
            <h3>{progress.completion_rate || 0}%</h3>
            <p>Completion Rate</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>{progress.attendance_rate || 0}%</h3>
            <p>Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({classes.length})
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active ({classes.filter(cls => cls.is_active).length})
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed ({classes.filter(cls => !cls.is_active).length})
          </button>
        </div>
      </div>

      {/* Classes Section */}
      <div className="classes-section">
        {filteredClasses.length === 0 ? (
          <div className="empty-classes">
            <div className="empty-icon">
              {filter === 'all' ? '🎓' : 
               filter === 'active' ? '📚' : '🏆'}
            </div>
            <h3>
              {filter === 'all' ? 'No Classes Yet' :
               filter === 'active' ? 'No Active Classes' : 'No Completed Classes'}
            </h3>
            <p>
              {filter === 'all' 
                ? "You haven't joined any classes yet. Browse available classes to get started!"
                : `You don't have any ${filter} classes at the moment.`}
            </p>
            {filter === 'all' && (
              <button 
                onClick={() => navigate('/classes')}
                className="btn-browse-empty"
              >
                Explore Classes
              </button>
            )}
          </div>
        ) : (
          <div className="classes-grid">
            {filteredClasses.map(classItem => (
              <div 
                key={classItem.class_id} 
                className={`class-card ${!classItem.is_active ? 'inactive' : ''}`}
              >
                <div className="class-header">
                  <h3 onClick={() => handleClassClick(classItem)}>
                    {classItem.class_name}
                  </h3>
                  <div className="class-status">
                    <span className={`status-badge ${classItem.is_active ? 'active' : 'inactive'}`}>
                      {classItem.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="class-content">
                  <p className="class-description">
                    {classItem.description?.substring(0, 100)}
                    {classItem.description?.length > 100 ? '...' : ''}
                  </p>

                  <div className="class-meta">
                    <div className="meta-item">
                      <span className="meta-icon">🆔</span>
                      <span>{classItem.class_id}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📋</span>
                      <span>{classItem.class_type}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{classItem.total_members} members</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span>Joined {new Date(classItem.joinedAt || classItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if available) */}
                  {classItem.progress_percentage !== undefined && (
                    <div className="progress-container">
                      <div className="progress-header">
                        <span>Progress</span>
                        <span>{classItem.progress_percentage}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${classItem.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="class-actions">
                  <button 
                    onClick={() => handleClassClick(classItem)}
                    className="btn-view"
                  >
                    View Class
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveClass(classItem.class_id, classItem.class_name);
                    }}
                    className="btn-leave"
                    disabled={leaveClassMutation.isLoading}
                  >
                    Leave
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Page Footer */}
      <div className="page-footer">
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-back"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MyClassesPage;