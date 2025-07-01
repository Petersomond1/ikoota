// ikootaclient/src/components/service/idGenerationService.js
// This replaces the old generateRandomId.js

import api from './api';

/**
 * Generates a cryptographically secure 6-character alphanumeric ID
 * @returns {string} A random 6-character alphanumeric ID
 */
const generateSecureRandomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Use crypto.getRandomValues for better security in browser
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < 6; i++) {
        result += chars[array[i] % chars.length];
    }
    
    return result;
};

/**
 * Generates a preview converse ID for display purposes (not guaranteed unique)
 * Format: OTO#XXXXXX (total 10 characters)
 * @returns {string} A preview converse ID like "OTO#123ABC"
 */
export const generatePreviewConverseId = () => {
    const randomPart = generateSecureRandomId();
    return `OTO#${randomPart}`;
};

/**
 * Generates a preview class ID for display purposes (not guaranteed unique)
 * Format: OTU#XXXXXX (total 10 characters)
 * @returns {string} A preview class ID like "OTU#A1B2C3"
 */
export const generatePreviewClassId = () => {
    const randomPart = generateSecureRandomId();
    return `OTU#${randomPart}`;
};

/**
 * Requests a unique converse ID from the backend
 * @returns {Promise<string>} A unique converse ID from the server
 */
export const generateUniqueConverseId = async () => {
    try {
        const response = await api.post('/admin/generate-converse-id');
        return response.data.converseId;
    } catch (error) {
        console.error('Failed to generate unique converse ID:', error);
        // Fallback to preview ID (should be used carefully)
        return generatePreviewConverseId();
    }
};

/**
 * Requests a unique class ID from the backend
 * @returns {Promise<string>} A unique class ID from the server
 */
export const generateUniqueClassId = async () => {
    try {
        const response = await api.post('/admin/generate-class-id');
        return response.data.classId;
    } catch (error) {
        console.error('Failed to generate unique class ID:', error);
        // Fallback to preview ID (should be used carefully)
        return generatePreviewClassId();
    }
};

/**
 * Legacy function for backward compatibility
 * Generates a preview converse ID
 * @returns {string} A preview converse ID
 */
export const generateRandomId = () => {
    return generatePreviewConverseId();
};

/**
 * Validates if an ID follows the correct format
 * @param {string} id - The ID to validate
 * @param {string} type - Either 'user' or 'class'
 * @returns {boolean} True if valid format
 */
export const validateIdFormat = (id, type = 'user') => {
    if (!id || typeof id !== 'string') return false;
    
    if (type === 'user') {
        // Should be OTO# followed by 6 alphanumeric characters (total 10 chars)
        return /^OTO#[A-Z0-9]{6}$/.test(id);
    } else if (type === 'class') {
        // Should be OTU# followed by 6 alphanumeric characters (total 10 chars)
        return /^OTU#[A-Z0-9]{6}$/.test(id);
    }
    
    return false;
};

/**
 * Extracts the prefix from an ID
 * @param {string} id - The ID to analyze
 * @returns {string|null} The prefix ('OTO#' or 'OTU#') or null if invalid
 */
export const getIdPrefix = (id) => {
    if (!id || typeof id !== 'string' || id.length < 4) return null;
    
    const prefix = id.substring(0, 4);
    return ['OTO#', 'OTU#'].includes(prefix) ? prefix : null;
};

/**
 * Determines the entity type from an ID
 * @param {string} id - The ID to analyze
 * @returns {string|null} 'user', 'class', or null if invalid
 */
export const getEntityTypeFromId = (id) => {
    const prefix = getIdPrefix(id);
    
    if (prefix === 'OTO#') return 'user';
    if (prefix === 'OTU#') return 'class';
    
    return null;
};

/**
 * Extracts the random part from an ID (removes prefix)
 * @param {string} id - The ID to analyze
 * @returns {string|null} The 6-character random part or null if invalid
 */
export const getRandomPart = (id) => {
    if (!validateIdFormat(id, 'user') && !validateIdFormat(id, 'class')) {
        return null;
    }
    
    return id.substring(4); // Remove the 4-character prefix (OTO# or OTU#)
};

/**
 * Formats an ID for display with entity type indicator
 * @param {string} id - The ID to format
 * @returns {string} Formatted display string
 */
export const formatIdForDisplay = (id) => {
    const entityType = getEntityTypeFromId(id);
    
    if (entityType === 'user') {
        return `User ${id}`;
    } else if (entityType === 'class') {
        return `Class ${id}`;
    }
    
    return id; // Fallback to original ID
};

/**
 * Checks if two IDs are of compatible types for operations
 * @param {string} id1 - First ID
 * @param {string} id2 - Second ID
 * @param {string} operation - Type of operation ('mentor-assign', 'class-assign', etc.)
 * @returns {boolean} True if operation is valid
 */
export const validateIdCompatibility = (id1, id2, operation) => {
    const type1 = getEntityTypeFromId(id1);
    const type2 = getEntityTypeFromId(id2);
    
    switch (operation) {
        case 'mentor-assign':
            // Both should be users
            return type1 === 'user' && type2 === 'user';
        case 'class-assign':
            // One user, one class
            return (type1 === 'user' && type2 === 'class') || 
                   (type1 === 'class' && type2 === 'user');
        default:
            return true;
    }
};

/**
 * Generates a batch of preview IDs for testing or demonstration
 * @param {string} type - Either 'user' or 'class'
 * @param {number} count - Number of IDs to generate
 * @returns {string[]} Array of preview IDs
 */
export const generatePreviewIdBatch = (type = 'user', count = 5) => {
    const ids = [];
    
    for (let i = 0; i < count; i++) {
        if (type === 'user') {
            ids.push(generatePreviewConverseId());
        } else if (type === 'class') {
            ids.push(generatePreviewClassId());
        }
    }
    
    return ids;
};

/**
 * Converts old format IDs to new format (migration helper)
 * @param {string} oldId - Old format ID
 * @param {string} type - Entity type ('user' or 'class')
 * @returns {string} New format ID
 */
export const convertToNewFormat = (oldId, type = 'user') => {
    if (!oldId) return null;
    
    // If already in new format, return as is
    if (validateIdFormat(oldId, type)) {
        return oldId;
    }
    
    // Convert old format to new format
    const randomPart = generateSecureRandomId();
    
    if (type === 'user') {
        return `OTO#${randomPart}`;
    } else if (type === 'class') {
        return `OTU#${randomPart}`;
    }
    
    return null;
};