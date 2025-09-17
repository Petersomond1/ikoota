/**
 * Utility functions for converse_id handling and display
 * Maintains privacy by never exposing username or email in UI
 */

/**
 * Get secure display name from user object using converse_id
 * @param {Object} user - User object containing converse_id
 * @param {Object} options - Display options
 * @returns {string} - Privacy-safe display name
 */
export const getSecureDisplayName = (user, options = {}) => {
  const { prefix = '', showFullId = false } = options;

  // Since every user has a converse_id (compulsory on admission)
  if (!user?.converse_id) {
    console.error('❌ CRITICAL: User missing required converse_id!', user);
    return user?.converse_id || '';
  }

  const converseId = user.converse_id;

  // If showFullId is true, return the full converse_id
  if (showFullId) {
    return converseId;
  }

  // Extract readable part from converse_id format like "OTO#C002O2"
  if (converseId.includes('#')) {
    const suffix = converseId.split('#')[1];
    return prefix ? `${prefix} ${suffix}` : suffix;
  }

  // For non-standard formats, show last 4 characters
  const shortId = converseId.slice(-4);
  return prefix ? `${prefix} ${shortId}` : shortId;
};

/**
 * Get abbreviated converse_id for compact display
 * @param {Object} user - User object containing converse_id
 * @returns {string} - Abbreviated converse_id
 */
export const getAbbreviatedConverseId = (user) => {
  if (!user?.converse_id) {
    console.error('❌ CRITICAL: User missing required converse_id!', user);
    return '';
  }

  const converseId = user.converse_id;

  if (converseId.includes('#')) {
    return converseId.split('#')[1];
  }

  return converseId.slice(-4);
};

/**
 * Get full converse_id safely (for admin contexts only)
 * @param {Object} user - User object containing converse_id
 * @returns {string} - Full converse_id or fallback
 */
export const getFullConverseId = (user) => {
  if (!user?.converse_id) {
    console.error('❌ CRITICAL: User missing required converse_id!', user);
    return 'ERROR: Missing ID';
  }
  return user.converse_id;
};

/**
 * Check if user has valid converse_id
 * @param {Object} user - User object
 * @returns {boolean} - True if valid converse_id exists
 */
export const hasValidConverseId = (user) => {
  return user?.converse_id && typeof user.converse_id === 'string' && user.converse_id.length > 0;
};

/**
 * Generate display options for different contexts
 */
export const DISPLAY_CONTEXTS = {
  GREETING: { prefix: '', showFullId: false }, // Show just the ID part after # (e.g., "C002O2")
  ADMIN: { prefix: '', showFullId: true }, // Show full converse_id (e.g., "OTO#C002O2")
  COMPACT: { prefix: '', showFullId: false }, // Show just the suffix
  CHAT: { prefix: 'Member', showFullId: false }, // Show "Member C002O2"
  FULL_ID: { prefix: '', showFullId: true } // Show complete converse_id
};