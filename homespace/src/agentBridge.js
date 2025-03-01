// agentBridge.js
// This file serves as a bridge between the frontend and the chatbot backend API

// Store agent state
let agentState = {
  sessionId: null,
  isInitialized: false,
};

// API endpoint for the chatbot backend
const API_BASE_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:3000/api/chatbot';
console.log('Using API URL:', API_BASE_URL);

/**
 * Initialize the agent with CDP Agentkit
 * 
 * @param {Object} options - Configuration options
 * @param {Function} messageCallback - Callback function to handle agent messages
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeAgent(options = {}, messageCallback) {
  try {
    const { character = 'eric' } = options;
    console.log('Initializing agent with character:', character);
    
    // Call the backend API to initialize the agent
    const initUrl = `${API_BASE_URL}/initialize`;
    console.log('Calling API endpoint:', initUrl);
    
    const response = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ character }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to initialize agent:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('Initialization successful, received session ID:', data.sessionId);
    
    // Store the session ID
    agentState.sessionId = data.sessionId;
    agentState.isInitialized = true;
    
    return true;
  } catch (error) {
    console.error('Error initializing agent:', error);
    return false;
  }
}

/**
 * Send a message to the agent and get a response
 * 
 * @param {string} message - The message to send to the agent
 * @param {Function} responseCallback - Callback function to handle agent responses
 */
export async function sendMessageToAgent(message, responseCallback) {
  if (!agentState.isInitialized || !agentState.sessionId) {
    console.error('Agent not initialized. Session ID:', agentState.sessionId);
    responseCallback("Agent not initialized. Please try again.");
    return { exit: false };
  }

  try {
    console.log('Sending message to agent. Session ID:', agentState.sessionId);
    
    // Call the backend API to send a message
    const messageUrl = `${API_BASE_URL}/message`;
    console.log('Calling API endpoint:', messageUrl);
    
    const response = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: agentState.sessionId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send message:', errorData);
      responseCallback("Sorry, there was an error processing your message. Please try again.");
      return { exit: false };
    }
    
    const data = await response.json();
    console.log('Message sent successfully, received response:', data);
    
    // Call the response callback with the agent's response
    responseCallback(data.response.content);
    
    return { exit: data.response.exit || false };
  } catch (error) {
    console.error('Error sending message to agent:', error);
    responseCallback("Sorry, there was an error processing your message. Please try again.");
    return { exit: false };
  }
}

/**
 * Get the welcome message for the agent
 * 
 * @returns {string} - The welcome message
 */
export function getWelcomeMessage() {
  return "Hello! I'm your AI assistant. Please select a mode:\n\n" +
         "1. chat - Interactive chat mode\n" +
         "2. quiz - Take a quiz about the character and earn an NFT";
}

/**
 * Reset the agent state
 */
export function resetAgent() {
  console.log('Resetting agent. Current session ID:', agentState.sessionId);
  
  if (agentState.sessionId) {
    // Call the backend API to reset the agent
    const resetUrl = `${API_BASE_URL}/reset`;
    console.log('Calling API endpoint:', resetUrl);
    
    fetch(resetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: agentState.sessionId,
      }),
    }).then(response => {
      if (response.ok) {
        console.log('Agent reset successful');
      } else {
        console.error('Error resetting agent:', response.status);
      }
    }).catch(error => {
      console.error('Error resetting agent:', error);
    });
  }
  
  // Reset local state
  agentState = {
    sessionId: null,
    isInitialized: false,
  };
  
  console.log('Agent state reset');
}