/* Generates a 6-character alphanumeric ID.* @returns { string} A random 6-character alphanumeric ID. */
export const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  
 