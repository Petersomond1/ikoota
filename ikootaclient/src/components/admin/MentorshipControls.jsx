// MentorshipControls.jsx - Admin Control Panel for Organizational Mentorship System
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../service/api';
import { getSecureDisplayName, getFullConverseId, DISPLAY_CONTEXTS } from '../../utils/converseIdUtils';
import './admin.css';

const MentorshipControls = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [searchMentorTerm, setSearchMentorTerm] = useState('');
  const [searchMenteeTerm, setSearchMenteeTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all'); // all, 1, 2, 3

  // Fetch mentorship statistics
  const { data: mentorshipStats, isLoading: statsLoading } = useQuery({
    queryKey: ['mentorship-stats'],
    queryFn: async () => {
      const { data } = await api.get('/users/mentorship/statistics');
      return data?.data || data;
    },
    refetchInterval: 30000
  });

  // Fetch available mentors
  const { data: availableMentors, isLoading: mentorsLoading } = useQuery({
    queryKey: ['available-mentors', searchMentorTerm, filterLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchMentorTerm) params.append('search', searchMentorTerm);
      if (filterLevel !== 'all') params.append('level', filterLevel);
      
      const { data } = await api.get(`/users/mentorship/mentors/available?${params}`);
      return data?.data || data || [];
    }
  });

  // Fetch all mentors with their hierarchies
  const { data: allMentors } = useQuery({
    queryKey: ['all-mentors'],
    queryFn: async () => {
      const { data } = await api.get('/users/mentorship/mentors/available');
      return data?.data || data || [];
    }
  });

  // Search mentees
  const { data: searchedMentees } = useQuery({
    queryKey: ['searched-mentees', searchMenteeTerm],
    queryFn: async () => {
      if (!searchMenteeTerm) return [];
      const { data } = await api.get(`/users/admin/search?search=${searchMenteeTerm}`);
      return data?.data || data || [];
    },
    enabled: searchMenteeTerm.length > 2
  });

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['mentorship-health'],
    queryFn: async () => {
      const { data } = await api.get('/users/mentorship/health');
      return data?.data || data;
    }
  });

  // Assign mentee mutation
  const assignMenteeMutation = useMutation({
    mutationFn: async ({ mentorConverseId, menteeUserId, reason }) => {
      const { data } = await api.post('/users/mentorship/assign', {
        mentorConverseId,
        menteeUserId,
        reason
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentorship-stats']);
      queryClient.invalidateQueries(['available-mentors']);
      setShowAssignModal(false);
      setSelectedMentor(null);
      setSelectedMentee(null);
      setAssignmentReason('');
    }
  });

  // Reassign mentee mutation
  const reassignMenteeMutation = useMutation({
    mutationFn: async ({ menteeUserId, newMentorConverseId, reason }) => {
      const { data } = await api.post('/users/mentorship/reassign', {
        menteeUserId,
        newMentorConverseId,
        reason
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentorship-stats']);
      queryClient.invalidateQueries(['available-mentors']);
      setShowReassignModal(false);
    }
  });

  // Remove mentee mutation
  const removeMenteeMutation = useMutation({
    mutationFn: async ({ mentorConverseId, menteeUserId, reason }) => {
      const { data } = await api.delete(`/users/mentor/mentees/${menteeUserId}`, {
        data: { mentorConverseId, reason }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentorship-stats']);
      queryClient.invalidateQueries(['available-mentors']);
    }
  });

  // Batch assign mutation
  const batchAssignMutation = useMutation({
    mutationFn: async ({ assignments }) => {
      const { data } = await api.post('/users/admin/mentorship/batch-assign', {
        assignments
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentorship-stats']);
      queryClient.invalidateQueries(['available-mentors']);
    }
  });

  // Get mentor hierarchy
  const getMentorHierarchy = async (mentorConverseId) => {
    const { data } = await api.get(`/users/mentorship/hierarchy/${mentorConverseId}`);
    return data?.data || data;
  };

  // Handle assign mentee
  const handleAssignMentee = () => {
    if (selectedMentor && selectedMentee && assignmentReason) {
      assignMenteeMutation.mutate({
        mentorConverseId: selectedMentor.converse_id,
        menteeUserId: selectedMentee.user_id,
        reason: assignmentReason
      });
    }
  };

  // Calculate statistics
  const totalMentors = mentorshipStats?.total_mentors || 0;
  const totalMentees = mentorshipStats?.total_mentees || 0;
  const activeRelationships = mentorshipStats?.active_relationships || 0;
  const averageCapacityUsed = mentorshipStats?.average_capacity_used || 0;
  const levelDistribution = mentorshipStats?.level_distribution || {};
  
  // Ensure arrays for safe mapping
  const safeMentors = Array.isArray(availableMentors) ? availableMentors : [];
  const safeAllMentors = Array.isArray(allMentors) ? allMentors : [];
  const safeMentees = Array.isArray(searchedMentees) ? searchedMentees : [];

  return (
    <div className="mentorship-controls">
      <div className="controls-header">
        <h2>🏛️ Organizational Mentorship Management</h2>
        <div className="header-stats">
          <span className="stat-badge">
            <strong>{totalMentors}</strong> Mentors
          </span>
          <span className="stat-badge">
            <strong>{totalMentees}</strong> Mentees
          </span>
          <span className="stat-badge">
            <strong>{activeRelationships}</strong> Active Pairs
          </span>
          <span className={`health-badge ${systemHealth?.status || 'healthy'}`}>
            System: {systemHealth?.status || 'Healthy'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="control-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'mentors' ? 'active' : ''}
          onClick={() => setActiveTab('mentors')}
        >
          👨‍🏫 Mentors
        </button>
        <button 
          className={activeTab === 'assignments' ? 'active' : ''}
          onClick={() => setActiveTab('assignments')}
        >
          🔗 Assignments
        </button>
        <button 
          className={activeTab === 'hierarchy' ? 'active' : ''}
          onClick={() => setActiveTab('hierarchy')}
        >
          🏛️ Hierarchy View
        </button>
        <button 
          className={activeTab === 'operations' ? 'active' : ''}
          onClick={() => setActiveTab('operations')}
        >
          ⚙️ Bulk Operations
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h3>Mentorship System Overview</h3>
            
            {/* Statistics Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👨‍🏫</div>
                <div className="stat-details">
                  <div className="stat-value">{totalMentors}</div>
                  <div className="stat-label">Total Mentors</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-details">
                  <div className="stat-value">{totalMentees}</div>
                  <div className="stat-label">Total Mentees</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🔗</div>
                <div className="stat-details">
                  <div className="stat-value">{activeRelationships}</div>
                  <div className="stat-label">Active Relationships</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-details">
                  <div className="stat-value">{averageCapacityUsed.toFixed(1)}%</div>
                  <div className="stat-label">Avg Capacity Used</div>
                </div>
              </div>
            </div>

            {/* Level Distribution */}
            <div className="level-distribution">
              <h4>Organizational Level Distribution</h4>
              <div className="level-bars">
                <div className="level-bar">
                  <span className="level-label">Level 3 (Top)</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill level-3"
                      style={{ width: `${(levelDistribution['3'] || 0) * 10}%` }}
                    ></div>
                  </div>
                  <span className="level-count">{levelDistribution['3'] || 0} mentors</span>
                </div>
                
                <div className="level-bar">
                  <span className="level-label">Level 2 (Mid)</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill level-2"
                      style={{ width: `${(levelDistribution['2'] || 0) * 5}%` }}
                    ></div>
                  </div>
                  <span className="level-count">{levelDistribution['2'] || 0} mentors</span>
                </div>
                
                <div className="level-bar">
                  <span className="level-label">Level 1 (Base)</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill level-1"
                      style={{ width: `${(levelDistribution['1'] || 0) * 2}%` }}
                    ></div>
                  </div>
                  <span className="level-count">{levelDistribution['1'] || 0} mentors</span>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="system-health">
              <h4>System Health Status</h4>
              <div className="health-indicators">
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.database === 'connected' ? 'green' : 'red'}`}></span>
                  <span>Database: {systemHealth?.database || 'Unknown'}</span>
                </div>
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.capacity_balanced ? 'green' : 'yellow'}`}></span>
                  <span>Capacity Balance: {systemHealth?.capacity_balanced ? 'Balanced' : 'Unbalanced'}</span>
                </div>
                <div className="health-item">
                  <span className={`indicator ${systemHealth?.orphaned_mentees === 0 ? 'green' : 'yellow'}`}></span>
                  <span>Orphaned Mentees: {systemHealth?.orphaned_mentees || 0}</span>
                </div>
                <div className="health-item">
                  <span className={`indicator green`}></span>
                  <span>Assignment Queue: {systemHealth?.pending_assignments || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h4>Quick Actions</h4>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setShowAssignModal(true)}
                >
                  🔗 Assign Mentee
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('mentors')}
                >
                  🔍 Find Mentor
                </button>
                <button 
                  className="action-btn warning"
                  onClick={() => setActiveTab('operations')}
                >
                  📦 Bulk Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mentors Tab */}
        {activeTab === 'mentors' && (
          <div className="mentors-section">
            <h3>Mentor Management</h3>
            
            {/* Search and Filter */}
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search mentors by converse ID..."
                value={searchMentorTerm}
                onChange={(e) => setSearchMentorTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={filterLevel} 
                onChange={(e) => setFilterLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>

            {/* Available Mentors List */}
            <div className="mentors-list">
              <h4>Available Mentors with Capacity</h4>
              {mentorsLoading ? (
                <div className="loading">Loading mentors...</div>
              ) : !Array.isArray(availableMentors) || availableMentors.length === 0 ? (
                <div className="no-data">No mentors available</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Converse ID</th>
                      <th>Mentor ID</th>
                      <th>Level</th>
                      <th>Current/Max</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(availableMentors) ? availableMentors : []).map(mentor => (
                      <tr key={mentor.converse_id}>
                        <td>
                          <span className="converse-id">
                            {mentor.converse_id}
                          </span>
                        </td>
                        <td>{mentor.mentor_id}</td>
                        <td>
                          <span className={`level-badge level-${mentor.mentor_level}`}>
                            Level {mentor.mentor_level}
                          </span>
                        </td>
                        <td>
                          {mentor.current_mentees_count}/{mentor.max_mentees}
                        </td>
                        <td>
                          <div className="capacity-bar">
                            <div 
                              className="capacity-fill"
                              style={{ 
                                width: `${(mentor.current_mentees_count / mentor.max_mentees) * 100}%`,
                                backgroundColor: mentor.current_mentees_count / mentor.max_mentees > 0.8 ? '#ff6b6b' : '#4CAF50'
                              }}
                            ></div>
                          </div>
                          <span className="capacity-text">
                            {mentor.available_capacity} slots available
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-small primary"
                              onClick={() => {
                                setSelectedMentor(mentor);
                                setShowAssignModal(true);
                              }}
                            >
                              Assign
                            </button>
                            <button 
                              className="btn-small secondary"
                              onClick={() => getMentorHierarchy(mentor.converse_id)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="assignments-section">
            <h3>Mentorship Assignments</h3>
            
            {/* Search Mentees */}
            <div className="search-section">
              <h4>Search for Mentees</h4>
              <input
                type="text"
                placeholder="Search mentees by converse ID..."
                value={searchMenteeTerm}
                onChange={(e) => setSearchMenteeTerm(e.target.value)}
                className="search-input"
              />
              
              {searchedMentees && searchedMentees.length > 0 && (
                <div className="search-results">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Converse ID</th>
                        <th>Current Mentor</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(searchedMentees) ? searchedMentees : []).map(mentee => (
                        <tr key={mentee.user_id}>
                          <td>{mentee.user_id}</td>
                          <td>{getFullConverseId(mentee) || 'N/A'}</td>
                          <td>
                            {mentee.current_mentor ? (
                              <span className="mentor-badge">
                                {mentee.current_mentor}
                              </span>
                            ) : (
                              <span className="no-mentor">No Mentor</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${mentee.has_mentor ? 'assigned' : 'unassigned'}`}>
                              {mentee.has_mentor ? 'Assigned' : 'Unassigned'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {!mentee.has_mentor ? (
                                <button 
                                  className="btn-small primary"
                                  onClick={() => {
                                    setSelectedMentee(mentee);
                                    setShowAssignModal(true);
                                  }}
                                >
                                  Assign
                                </button>
                              ) : (
                                <>
                                  <button 
                                    className="btn-small secondary"
                                    onClick={() => {
                                      setSelectedMentee(mentee);
                                      setShowReassignModal(true);
                                    }}
                                  >
                                    Reassign
                                  </button>
                                  <button 
                                    className="btn-small warning"
                                    onClick={() => removeMenteeMutation.mutate({
                                      mentorConverseId: mentee.current_mentor,
                                      menteeUserId: mentee.user_id,
                                      reason: 'Admin action'
                                    })}
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Assignments */}
            <div className="recent-assignments">
              <h4>Recent Assignments</h4>
              <div className="assignments-timeline">
                {(Array.isArray(mentorshipStats?.recent_assignments) ? mentorshipStats.recent_assignments : []).map((assignment, index) => (
                  <div key={index} className="assignment-item">
                    <div className="assignment-time">
                      {new Date(assignment.assignedAt).toLocaleString()}
                    </div>
                    <div className="assignment-details">
                      <span className="mentee">{assignment.mentee_name}</span>
                      <span className="arrow">→</span>
                      <span className="mentor">{assignment.mentor_name}</span>
                    </div>
                    <div className="assignment-admin">
                      by {assignment.assigned_by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy Tab */}
        {activeTab === 'hierarchy' && (
          <div className="hierarchy-section">
            <h3>Organizational Hierarchy View</h3>
            
            <div className="hierarchy-visualization">
              {/* Level 3 - Top */}
              <div className="hierarchy-level level-3">
                <h4>Level 3 - Senior Mentors</h4>
                <div className="mentor-cards">
                  {(Array.isArray(allMentors) ? allMentors : []).filter(m => m.mentor_level === 3).map(mentor => (
                    <div key={mentor.converse_id} className="mentor-card level-3">
                      <div className="mentor-header">
                        <span className="mentor-id">{mentor.converse_id}</span>
                        <span className="capacity">
                          {mentor.current_mentees_count}/{mentor.max_mentees}
                        </span>
                      </div>
                      <div className="mentee-list">
                        {(Array.isArray(mentor.mentees) ? mentor.mentees : []).map(mentee => (
                          <div key={mentee.user_id} className="mentee-item">
                            {getSecureDisplayName(mentee, DISPLAY_CONTEXTS.COMPACT) || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 2 - Middle */}
              <div className="hierarchy-level level-2">
                <h4>Level 2 - Intermediate Mentors</h4>
                <div className="mentor-cards">
                  {(Array.isArray(allMentors) ? allMentors : []).filter(m => m.mentor_level === 2).map(mentor => (
                    <div key={mentor.converse_id} className="mentor-card level-2">
                      <div className="mentor-header">
                        <span className="mentor-id">{mentor.converse_id}</span>
                        <span className="capacity">
                          {mentor.current_mentees_count}/{mentor.max_mentees}
                        </span>
                      </div>
                      <div className="mentee-list">
                        {(Array.isArray(mentor.mentees) ? mentor.mentees : []).map(mentee => (
                          <div key={mentee.user_id} className="mentee-item">
                            {getSecureDisplayName(mentee, DISPLAY_CONTEXTS.COMPACT) || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 1 - Base */}
              <div className="hierarchy-level level-1">
                <h4>Level 1 - Junior Mentors</h4>
                <div className="mentor-cards">
                  {(Array.isArray(allMentors) ? allMentors : []).filter(m => m.mentor_level === 1).map(mentor => (
                    <div key={mentor.converse_id} className="mentor-card level-1">
                      <div className="mentor-header">
                        <span className="mentor-id">{mentor.converse_id}</span>
                        <span className="capacity">
                          {mentor.current_mentees_count}/{mentor.max_mentees}
                        </span>
                      </div>
                      <div className="mentee-list">
                        {(Array.isArray(mentor.mentees) ? mentor.mentees : []).map(mentee => (
                          <div key={mentee.user_id} className="mentee-item">
                            {getSecureDisplayName(mentee, DISPLAY_CONTEXTS.COMPACT) || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="operations-section">
            <h3>Bulk Operations</h3>
            
            <div className="operation-cards">
              {/* Bulk Assignment */}
              <div className="operation-card">
                <h4>📦 Bulk Mentee Assignment</h4>
                <p>Assign multiple mentees to mentors automatically</p>
                <textarea
                  placeholder="Enter mentee user IDs (comma-separated)..."
                  className="bulk-input"
                  rows={3}
                />
                <select className="mentor-select">
                  <option value="">Auto-assign to available mentors</option>
                  <option value="level1">Assign to Level 1 mentors only</option>
                  <option value="level2">Assign to Level 2 mentors only</option>
                  <option value="level3">Assign to Level 3 mentors only</option>
                </select>
                <button 
                  className="btn primary"
                  onClick={() => {
                    // Handle bulk assignment
                  }}
                >
                  Execute Bulk Assignment
                </button>
              </div>

              {/* Capacity Adjustment */}
              <div className="operation-card">
                <h4>⚖️ Rebalance Capacity</h4>
                <p>Automatically redistribute mentees for optimal balance</p>
                <div className="rebalance-options">
                  <label>
                    <input type="radio" name="rebalance" value="all" />
                    Rebalance all levels
                  </label>
                  <label>
                    <input type="radio" name="rebalance" value="overloaded" />
                    Only rebalance overloaded mentors
                  </label>
                </div>
                <button className="btn secondary">
                  Start Rebalancing
                </button>
              </div>

              {/* Orphaned Mentees */}
              <div className="operation-card">
                <h4>🔧 Handle Orphaned Mentees</h4>
                <p>Reassign mentees without active mentors</p>
                <div className="orphan-stats">
                  <span>Orphaned Mentees: {systemHealth?.orphaned_mentees || 0}</span>
                </div>
                <button 
                  className="btn warning"
                  disabled={!systemHealth?.orphaned_mentees}
                >
                  Auto-Assign Orphans
                </button>
              </div>

              {/* Level Promotion */}
              <div className="operation-card">
                <h4>📈 Mentor Level Promotion</h4>
                <p>Promote mentors to higher pyramid levels</p>
                <input
                  type="text"
                  placeholder="Mentor Converse ID..."
                  className="mentor-input"
                />
                <select className="level-select">
                  <option value="">Select new level</option>
                  <option value="2">Promote to Level 2</option>
                  <option value="3">Promote to Level 3</option>
                </select>
                <button className="btn success">
                  Promote Mentor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🔗 Assign Mentee to Mentor</h3>
            
            <div className="modal-section">
              <label>Selected Mentor:</label>
              <div className="selected-item">
                {selectedMentor ? (
                  <>
                    <span>{selectedMentor.converse_id}</span>
                    <span className="badge">Level {selectedMentor.mentor_level}</span>
                    <span className="capacity">
                      {selectedMentor.available_capacity} slots available
                    </span>
                  </>
                ) : (
                  <span>No mentor selected</span>
                )}
              </div>
            </div>

            <div className="modal-section">
              <label>Selected Mentee:</label>
              <div className="selected-item">
                {selectedMentee ? (
                  <>
                    <span>{getFullConverseId(selectedMentee) || 'Unknown'}</span>
                    <span className="badge">ID: {selectedMentee.user_id}</span>
                  </>
                ) : (
                  <span>No mentee selected</span>
                )}
              </div>
            </div>

            <div className="modal-section">
              <label>Assignment Reason:</label>
              <textarea
                placeholder="Provide reason for this assignment..."
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignmentReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn primary"
                onClick={handleAssignMentee}
                disabled={!selectedMentor || !selectedMentee || !assignmentReason}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🔄 Reassign Mentee</h3>
            
            <div className="modal-section">
              <label>Mentee to Reassign:</label>
              <div className="selected-item">
                {selectedMentee && (
                  <>
                    <span>{getFullConverseId(selectedMentee) || 'Unknown'}</span>
                    <span className="badge">Current: {selectedMentee.current_mentor}</span>
                  </>
                )}
              </div>
            </div>

            <div className="modal-section">
              <label>Select New Mentor:</label>
              <select className="mentor-select">
                <option value="">Choose a mentor...</option>
                {(Array.isArray(availableMentors) ? availableMentors : []).map(mentor => (
                  <option key={mentor.converse_id} value={mentor.converse_id}>
                    {mentor.converse_id} (Level {mentor.mentor_level}, {mentor.available_capacity} slots)
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-section">
              <label>Reassignment Reason:</label>
              <textarea
                placeholder="Provide reason for reassignment..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn secondary"
                onClick={() => setShowReassignModal(false)}
              >
                Cancel
              </button>
              <button className="btn primary">
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipControls;