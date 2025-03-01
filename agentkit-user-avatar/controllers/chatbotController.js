const {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} = require("@coinbase/agentkit");
const { getLangChainTools } = require("@coinbase/agentkit-langchain");
const { HumanMessage } = require("@langchain/core/messages");
const { MemorySaver } = require("@langchain/langgraph");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { ChatOpenAI } = require("@langchain/openai");
const fs = require("fs");
const crypto = require("crypto");
const { eric, suyog, loadCharacter, createCharacterMessageModifier } = require("../characters");
const { CharacterQuizManager } = require("../custom_actions/quizUser");

// Store active sessions
const sessions = {};

// Session cleanup interval (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
setInterval(cleanupSessions, 15 * 60 * 1000);

/**
 * Clean up inactive sessions
 */
function cleanupSessions() {
  const now = Date.now();
  Object.keys(sessions).forEach(sessionId => {
    if (now - sessions[sessionId].lastActivity > SESSION_TIMEOUT) {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      delete sessions[sessionId];
    }
  });
}

/**
 * Initialize the agent with CDP Agentkit
 * 
 * @param {string} characterName - The name of the character to use
 * @returns {Promise<{sessionId: string}>} The session ID for the initialized agent
 */
async function initializeAgent(characterName = 'eric') {
  try {
    // Load character
    let character;
    if (characterName.toLowerCase() === 'eric') {
      character = eric;
    } else if (characterName.toLowerCase() === 'suyog') {
      character = suyog;
    } else {
      try {
        character = loadCharacter(characterName);
      } catch (error) {
        console.warn(`Character "${characterName}" not found, using Eric as default`);
        character = eric;
      }
    }

    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    let walletDataStr = null;

    // Read existing wallet data if available
    if (fs.existsSync("wallet_data.txt")) {
      try {
        walletDataStr = fs.readFileSync("wallet_data.txt", "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: `${character.name} CDP AgentKit Chatbot` } };

    // Create React Agent using the LLM and CDP AgentKit tools with the selected character
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: createCharacterMessageModifier(character),
    });

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync("wallet_data.txt", JSON.stringify(exportedWallet));

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Store the session
    sessions[sessionId] = {
      agent,
      config: agentConfig,
      walletProvider,
      character,
      mode: null,
      quizManager: null,
      isQuizActive: false,
      lastActivity: Date.now()
    };

    return { sessionId };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

/**
 * Send a message to the agent and get a response
 * 
 * @param {string} message - The message to send to the agent
 * @param {string} sessionId - The session ID for the agent
 * @returns {Promise<{content: string, exit: boolean}>} The agent's response
 */
async function sendMessage(message, sessionId) {
  // Check if session exists
  if (!sessions[sessionId]) {
    throw new Error("Session not found. Please initialize the agent first.");
  }

  // Update last activity timestamp
  sessions[sessionId].lastActivity = Date.now();

  try {
    const session = sessions[sessionId];

    // Handle exit command
    if (message.toLowerCase() === 'exit') {
      return {
        content: "Goodbye! Chat session ended.",
        exit: true
      };
    }

    // Handle quiz mode
    if (session.mode === 'quiz' && session.isQuizActive) {
      const feedback = await session.quizManager.submitAnswer(message);
      
      // Check if quiz is over
      if (!session.quizManager.isQuizActive()) {
        session.isQuizActive = false;
        
        // Mint NFT logic
        const thought = "Mint an NFT for the user with the following metadata: " +
                      "Transfer the NFT to the user's wallet address: 0xE9473eCDCf10162b2E25ca20acb87906354A649a";
        
        const stream = await session.agent.stream(
          { messages: [new HumanMessage(thought)] }, 
          session.config
        );

        let nftResponse = "";
        for await (const chunk of stream) {
          if ("agent" in chunk) {
            nftResponse += chunk.agent.messages[0].content;
          } else if ("tools" in chunk) {
            nftResponse += chunk.tools.messages[0].content;
          }
        }
        
        return {
          content: `${feedback}\n\nThank you for taking the quiz! Here's your NFT:\n\n${nftResponse}`,
          exit: false
        };
      }
      
      return {
        content: feedback,
        exit: false
      };
    }

    // Handle mode selection
    if (!session.mode) {
      if (message.toLowerCase() === '1' || message.toLowerCase() === 'chat') {
        session.mode = 'chat';
        return {
          content: "Chat mode selected. How can I help you today?",
          exit: false
        };
      } else if (message.toLowerCase() === '2' || message.toLowerCase() === 'quiz') {
        session.mode = 'quiz';
        // Initialize quiz manager
        session.quizManager = new CharacterQuizManager(session.character, session.walletProvider);
        session.isQuizActive = true;
        
        // Start quiz
        const welcomeMessage = `I'm ${session.quizManager.getCharacterName()}'s avatar, and I'm ready to test your knowledge about me.`;
        const instructions = "You'll get a cool NFT if you score well!";
        const separator = "-----------------------------------------------------------";
        const quizStart = session.quizManager.start();
        const firstQuestion = session.quizManager.getNextQuestion();
        
        return {
          content: `${welcomeMessage}\n${instructions}\n${separator}\n${quizStart}\n${firstQuestion}`,
          exit: false
        };
      } else {
        return {
          content: "Please select a valid mode:\n1. chat - Interactive chat mode\n2. quiz - Take a quiz about the character and earn an NFT",
          exit: false
        };
      }
    }

    // Regular chat mode
    if (session.mode === 'chat') {
      const stream = await session.agent.stream(
        { messages: [new HumanMessage(message)] }, 
        session.config
      );

      let response = "";
      for await (const chunk of stream) {
        if ("agent" in chunk) {
          response += chunk.agent.messages[0].content;
        } else if ("tools" in chunk) {
          response += chunk.tools.messages[0].content;
        }
      }

      return {
        content: response,
        exit: false
      };
    }

    return {
      content: "Unknown mode. Please reset the agent and try again.",
      exit: false
    };
  } catch (error) {
    console.error("Error sending message to agent:", error);
    throw error;
  }
}

/**
 * Get the welcome message for the agent
 * 
 * @returns {string} The welcome message
 */
function getWelcomeMessage() {
  return "Hello! I'm your AI assistant. Please select a mode:\n\n" +
         "1. chat - Interactive chat mode\n" +
         "2. quiz - Take a quiz about the character and earn an NFT";
}

/**
 * Reset the agent state
 * 
 * @param {string} sessionId - The session ID to reset
 */
function resetAgent(sessionId) {
  if (sessions[sessionId]) {
    delete sessions[sessionId];
  }
}

module.exports = {
  initializeAgent,
  sendMessage,
  getWelcomeMessage,
  resetAgent
}; 