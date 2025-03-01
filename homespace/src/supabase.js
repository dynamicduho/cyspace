import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://lahunnoxepttqdlyfsnf.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHVubm94ZXB0dHFkbHlmc25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3OTU2NzEsImV4cCI6MjA1NjM3MTY3MX0.lRw62UGO9D7UqkGiKdBWWy_X1bo6oRLjnURMHAVD8mo";

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);


export async function getBaseWallet(username) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('username', username)
      .single();

    if (error) {
      // If no data found, just return null instead of throwing an error
      if (error.code === 'PGRST116') {
        console.log(`No BASE wallet data found for user: ${username}`);
        return null;
      }

      console.error('Error retrieving BASE wallet from Supabase:', error);
      throw new Error(`Failed to retrieve wallet data: ${error.message}`);
    }

    // Return the wallet address if found
    return data?.wallet_address || null;
  } catch (error) {
    console.error('Exception retrieving wallet from Supabase:', error);
    throw error;
  }
}



/**
 * Save whiteboard blob ID to Supabase for a specific user
 * @param {string} blobId - The Walrus blob ID for the whiteboard
 * @param {string} username - The username of the whiteboard owner
 * @returns {Promise<Object>} - Result of the operation
 */
export async function saveBlobIdToSupabase(blobId, username) {
  try {
    // First check if an entry already exists for this username
    const { data: existingData, error: queryError } = await supabase
      .from('users')
      .select('username, whiteboard_blobid')
      .eq('username', username)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 is the code for "no rows returned" which is expected if user doesn't exist yet
      console.error('Error checking for existing user:', queryError);
      throw new Error(`Failed to check if user exists: ${queryError.message}`);
    }

    let result;

    // If user exists, update their record
    if (existingData) {
      result = await supabase
        .from('users')
        .update({ whiteboard_blobid: blobId })
        .eq('username', username);
    } else {
      // If user doesn't exist, create a new record
      result = await supabase
        .from('users')
        .insert([{ 
          username: username, 
          whiteboard_blobid: blobId
        }]);
    }

    const { error } = result;
    
    if (error) {
      console.error('Error saving blob ID to Supabase:', error);
      throw new Error(`Failed to save whiteboard data: ${error.message}`);
    }

    console.log(`Successfully saved whiteboard blob ID for user: ${username}`);
    return { success: true, blobId };
  } catch (error) {
    console.error('Exception saving blob ID to Supabase:', error);
    throw error;
  }
}

/**
 * Retrieve whiteboard blob ID from Supabase for a specific user
 * @param {string} username - The username to fetch whiteboard for
 * @returns {Promise<string|null>} - The blob ID if found, null otherwise
 */
export async function getBlobIdFromSupabase(username) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('whiteboard_blobid')
      .eq('username', username)
      .single();

    if (error) {
      // If no data found, just return null instead of throwing an error
      if (error.code === 'PGRST116') {
        console.log(`No whiteboard data found for user: ${username}`);
        return null;
      }
      
      console.error('Error retrieving blob ID from Supabase:', error);
      throw new Error(`Failed to retrieve whiteboard data: ${error.message}`);
    }

    // Return the blob ID if found
    return data?.whiteboard_blobid || null;
  } catch (error) {
    console.error('Exception retrieving blob ID from Supabase:', error);
    throw error;
  }
}

/**
 * Delete whiteboard blob ID from Supabase for a specific user
 * @param {string} username - The username of the whiteboard to delete
 * @returns {Promise<Object>} - Result of the operation
 */
export async function deleteBlobIdFromSupabase(username) {
  try {
    // Only update the whiteboard_blobid field to null, don't delete the entire user record
    const { error } = await supabase
      .from('users')
      .update({ 
        whiteboard_blobid: null
      })
      .eq('username', username);

    if (error) {
      console.error('Error deleting blob ID from Supabase:', error);
      throw new Error(`Failed to delete whiteboard data: ${error.message}`);
    }

    console.log(`Successfully deleted whiteboard blob ID for user: ${username}`);
    return { success: true };
  } catch (error) {
    console.error('Exception deleting blob ID from Supabase:', error);
    throw error;
  }
}
