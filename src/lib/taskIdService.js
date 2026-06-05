/**
 * Task ID Service
 * 
 * Handles task ID generation via Cloud Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Initialize functions with us-central1 region (where functions are deployed)
const functions = getFunctions(app, 'us-central1');

/**
 * Generate a unique task ID from the server
 * Format: ABCD1234 (4 uppercase letters + 4 digits)
 * 
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<string>} Unique task ID
 */
export async function generateTaskId(workspaceId) {
  try {
    const generateId = httpsCallable(functions, 'generateTaskId');
    const result = await generateId({ workspaceId });
    return result.data.taskId;
  } catch (error) {

    // Parse Firebase error codes
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be signed in to generate task IDs.');
    }
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to create tasks in this workspace.');
    }
    if (error.code === 'functions/invalid-argument') {
      throw new Error(error.message || 'Invalid workspace ID.');
    }
    
    // Fallback to client-side generation if Cloud Function fails

    return generateTaskIdFallback();
  }
}

/**
 * Fallback: Generate task ID on client side
 * Use this only if Cloud Function is not available
 * 
 * @returns {string} Task ID with 4 letters and 4 digits in random positions (e.g., A1BC2D34)
 */
function generateTaskIdFallback() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  // Create array of 8 positions
  const positions = Array(8).fill(null);
  
  // Randomly select 4 positions for letters
  const letterPositions = [];
  while (letterPositions.length < 4) {
    const pos = Math.floor(Math.random() * 8);
    if (!letterPositions.includes(pos)) {
      letterPositions.push(pos);
    }
  }
  
  // Fill letter positions
  letterPositions.forEach(pos => {
    positions[pos] = letters.charAt(Math.floor(Math.random() * letters.length));
  });
  
  // Fill remaining positions with digits
  for (let i = 0; i < 8; i++) {
    if (positions[i] === null) {
      positions[i] = digits.charAt(Math.floor(Math.random() * digits.length));
    }
  }
  
  return positions.join('');
}
