// agentBridge.js
// This file serves as a bridge between the frontend and the chatbot.ts functionality

// Remove the process polyfill as we'll use import.meta.env instead
// No need for this anymore:
// if (typeof window !== 'undefined' && !window.process) {
//   window.process = { env: {} };
// }

import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { eric } from "../ai-user-avatar/characters";
import { CharacterQuizManager } from "../ai-user-avatar/custom_actions/quizUser";

// Store agent state
let agentState = {
  agent: null,
  config: null,
  walletProvider: null,
  character: null,
  mode: null,
  quizManager: null,
  isInitialized: false,
  isQuizActive: false
};

/**
 * Initialize the agent with CDP Agentkit
 * 
 * @param {Object} options - Configuration options
 * @param {Function} messageCallback - Callback function to handle agent messages
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeAgent(options = {}, messageCallback) {
  try {
    // Use Eric as the default character
    agentState.character = eric;
    
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    // Get wallet data from localStorage if available
    let walletDataStr = localStorage.getItem('wallet_data');

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: import.meta.env.VITE_CDP_API_KEY_NAME,
      apiKeyPrivateKey: import.meta.env.VITE_CDP_API_KEY_PRIVATE_KEY,
      cdpWalletData: walletDataStr || undefined,
      networkId: import.meta.env.VITE_NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    agentState.walletProvider = walletProvider;

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: import.meta.env.VITE_CDP_API_KEY_NAME,
          apiKeyPrivateKey: import.meta.env.VITE_CDP_API_KEY_PRIVATE_KEY,
        }),
        cdpWalletActionProvider({
          apiKeyName: import.meta.env.VITE_CDP_API_KEY_NAME,
          apiKeyPrivateKey: import.meta.env.VITE_CDP_API_KEY_PRIVATE_KEY,
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { 
      configurable: { 
        thread_id: `${agentState.character.name} CDP AgentKit Chatbot` 
      } 
    };

    // Create React Agent using the LLM and CDP AgentKit tools with the selected character
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: createCharacterMessageModifier(agentState.character),
    });

    // Save agent and config to state
    agentState.agent = agent;
    agentState.config = agentConfig;
    agentState.isInitialized = true;

    // Save wallet data to localStorage
    const exportedWallet = await walletProvider.exportWallet();
    localStorage.setItem('wallet_data', JSON.stringify(exportedWallet));

    return true;
  } catch (error) {
    console.error("Failed to initialize agent:", error);
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
  if (!agentState.isInitialized) {
    responseCallback("Agent not initialized. Please try again.");
    return;
  }

  try {
    // Handle exit command
    if (message.toLowerCase() === 'exit') {
      responseCallback("Goodbye! Chat session ended.");
      return { exit: true };
    }

    // Handle quiz mode
    if (agentState.mode === 'quiz' && agentState.isQuizActive) {
      const feedback = await agentState.quizManager.submitAnswer(message);
      responseCallback(feedback);
      
      // Check if quiz is over
      if (!agentState.quizManager.isQuizActive()) {
        agentState.isQuizActive = false;
        responseCallback("\nThank you for taking the quiz! Here's your NFT:");
        
        // Mint NFT logic would go here
        const thought = "Mint an NFT for the user with the following metadata: " +
                        "Transfer the NFT to the user's wallet address: 0xE9473eCDCf10162b2E25ca20acb87906354A649a";
        
        const stream = await agentState.agent.stream(
          { messages: [new HumanMessage(thought)] }, 
          agentState.config
        );

        for await (const chunk of stream) {
          if ("agent" in chunk) {
            responseCallback(chunk.agent.messages[0].content);
          } else if ("tools" in chunk) {
            responseCallback(chunk.tools.messages[0].content);
          }
        }
      }
      return { exit: false };
    }

    // Handle mode selection
    if (!agentState.mode) {
      if (message.toLowerCase() === '1' || message.toLowerCase() === 'chat') {
        agentState.mode = 'chat';
        responseCallback("Chat mode selected. How can I help you today?");
      } else if (message.toLowerCase() === '2' || message.toLowerCase() === 'quiz') {
        agentState.mode = 'quiz';
        // Initialize quiz manager
        agentState.quizManager = new CharacterQuizManager(agentState.character, agentState.walletProvider);
        agentState.isQuizActive = true;
        
        // Start quiz
        responseCallback(`I'm ${agentState.quizManager.getCharacterName()}'s avatar, and I'm ready to test your knowledge about me.`);
        responseCallback("You'll get a cool NFT if you score well!");
        responseCallback("-----------------------------------------------------------");
        responseCallback(agentState.quizManager.start());
        responseCallback(agentState.quizManager.getNextQuestion());
      } else {
        responseCallback("Please select a valid mode:\n1. chat - Interactive chat mode\n2. quiz - Take a quiz about the character and earn an NFT");
      }
      return { exit: false };
    }

    // Regular chat mode
    if (agentState.mode === 'chat') {
      const stream = await agentState.agent.stream(
        { messages: [new HumanMessage(message)] }, 
        agentState.config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          responseCallback(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          responseCallback(chunk.tools.messages[0].content);
        }
      }
    }

    return { exit: false };
  } catch (error) {
    console.error("Error sending message to agent:", error);
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
  agentState = {
    agent: null,
    config: null,
    walletProvider: null,
    character: null,
    mode: null,
    quizManager: null,
    isInitialized: false,
    isQuizActive: false
  };
} 