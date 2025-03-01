import express, { Request, Response, Router } from 'express';
import { initializeAgent, sendMessage, getWelcomeMessage, resetAgent } from '../controllers/chatbotController';

const router: Router = express.Router();

/**
 * @route   POST /api/chatbot/initialize
 * @desc    Initialize the chatbot agent
 * @access  Public
 */
router.post('/initialize', async (req: Request, res: Response) => {
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

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot and get a response
 * @access  Public
 */
router.post('/message', async (req: Request, res: Response) => {
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

/**
 * @route   POST /api/chatbot/reset
 * @desc    Reset the chatbot agent
 * @access  Public
 */
router.post('/reset', (req: Request, res: Response) => {
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

export default router; 