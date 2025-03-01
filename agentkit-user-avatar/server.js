const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeAgent, sendMessage, getWelcomeMessage, resetAgent } = require('./controllers/chatbotController');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:9999', process.env.FRONTEND_URL].filter(Boolean), // Allow requests from both frontend URLs
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Routes
app.post('/api/chatbot/initialize', async (req, res) => {
  try {
    const { character = 'eric' } = req.body;
    const result = await initializeAgent(character);
    res.status(200).json({
      success: true,
      message: 'Agent initialized successfully',
      welcomeMessage: getWelcomeMessage(),
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Error initializing agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    const response = await sendMessage(message, sessionId);
    res.status(200).json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/chatbot/reset', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    resetAgent(sessionId);
    res.status(200).json({
      success: true,
      message: 'Agent reset successfully'
    });
  } catch (error) {
    console.error('Error resetting agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 