// ikootaclient/src/components/utils/IdDisplay.jsx
// Utility component for displaying entity IDs

import React from 'react';
import { validateIdFormat, getEntityTypeFromId } from '../service/idGenerationService';
import api from '../service/api';

export const EntityIdDisplay = ({ id, entityName }) => {
  const entityType = getEntityTypeFromId(id);
  const isValid = validateIdFormat(id, entityType);
  
  return (
    <div className="entity-id-display">
      <span className="entity-name">{entityName}:</span>
      <span className={`entity-id ${isValid ? 'valid-id' : 'invalid-id'}`}>
        {id}
      </span>
      <span className="entity-type">
        ({entityType === 'user' ? 'Person' : 'Class'})
      </span>
      {!isValid && <span className="error-indicator"> ⚠️ Invalid format</span>}
    </div>
  );
};

// Hook for bulk ID operations
export const useBulkIdOperations = () => {
  const handleBulkIdGeneration = async (count, type) => {
    try {
      const response = await api.post('/admin/identity/generate-bulk-ids', {
        count,
        type
      });
      
      console.log('Generated IDs:', response.data.ids);
      return response.data.ids;
    } catch (error) {
      console.error('Bulk generation failed:', error);
      throw error;
    }
  };

  return { handleBulkIdGeneration };
};

// Hook for ID format migration
export const useIdMigration = () => {
  const migrateOldIds = (users) => {
    const usersNeedingMigration = users.filter(user => 
      user.converse_id && user.converse_id.length !== 10
    );
    
    usersNeedingMigration.forEach(user => {
      console.log(`User ${user.id} needs ID migration: ${user.converse_id}`);
    });
    
    return usersNeedingMigration;
  };

  return { migrateOldIds };
};

// Example component using utility functions
export const UserIdCard = ({ user }) => {
  return (
    <div className="user-id-card">
      <EntityIdDisplay id={user.converse_id} entityName="User ID" />
      {user.class_id && (
        <EntityIdDisplay id={user.class_id} entityName="Class ID" />
      )}
      {user.mentor_id && (
        <EntityIdDisplay id={user.mentor_id} entityName="Mentor ID" />
      )}
    </div>
  );
};