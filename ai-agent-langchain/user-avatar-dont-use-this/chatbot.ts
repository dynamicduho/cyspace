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
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
// Import character functionality
import { eric, createCharacterMessageModifier } from "./characters";
import { CharacterQuizManager } from "./custom_actions/quizUser";
import NFTMinter from "./custom_actions/mintNFT";

dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = ["OPENAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
    });

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
      // Only use wallet data if it's valid JSON
      cdpWalletData: walletDataStr && walletDataStr.trim() !== '{}' ? walletDataStr : undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    // If we don't have valid wallet data, create a new wallet
    let walletProvider;
    try {
      walletProvider = await CdpWalletProvider.configureWithWallet(config);
    } catch (error) {
      console.log("Unable to load existing wallet, creating a new one...");
      walletProvider = await CdpWalletProvider.configureWithWallet({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
        networkId: process.env.NETWORK_ID || "base-sepolia",
      });
    }

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
    
    // Simple configuration without MemorySaver
    const agentConfig = { thread_id: `${eric.name} Chatbot` };

    // Create a simpler agent structure compatible with our version
    const agent = {
      stream: async ({ messages }: { messages: any[] }, config: any) => {
        const response = await llm.call(messages, {
          ...config,
          // Add any additional config here
        });
        
        // Return a generator that yields the response
        async function* generator() {
          yield {
            agent: {
              messages: [response]
            }
          };
        }
        
        return generator();
      }
    };

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent in quiz mode, testing the user's knowledge about the character
 * and minting an NFT based on their score
 * 
 * @param walletProvider - CDP wallet provider for minting NFTs
 */
async function runQuizMode(walletProvider: CdpWalletProvider) {
  console.log("Starting quiz mode...");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // Create quiz manager with Eric character and wallet provider
    const quizManager = new CharacterQuizManager(eric, walletProvider);
    
    // Display welcome message
    console.log(`I'm ${quizManager.getCharacterName()}'s avatar, and I'm ready to test your knowledge about me.`);
    console.log("You'll get a cool NFT if you score well!");
    console.log("-----------------------------------------------------------");
    
    // Ask for wallet address
    let walletAddress = "0xE9473eCDCf10162b2E25ca20acb87906354A649a";
    quizManager.setWalletAddress(walletAddress);
    
    // Start the quiz
    console.log(quizManager.start());
    let currentQuestion = quizManager.getNextQuestion();
    console.log(currentQuestion);
    
    // Quiz loop
    while (quizManager.isQuizActive()) {
      const answer = await question("> ");
      
      if (answer.toLowerCase() === 'exit') {
        console.log("Exiting quiz. Goodbye!");
        rl.close();
        return;
      }
      
      const feedback = await quizManager.submitAnswer(answer);
      console.log(feedback);
      
      // Get and display the next question if the quiz is still active
      if (quizManager.isQuizActive()) {
        const nextQuestion = quizManager.getNextQuestion();
        if (nextQuestion) {
          console.log("\n" + nextQuestion);
        }
      }
    }
    
    console.log("\nThank you for taking the quiz! Goodbye!");
    setTimeout(() => {
      rl.close();
      process.exit(0);
    }, 1500);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    rl.close();
    process.exit(1);
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Choose whether to run in chat or quiz mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode(): Promise<"chat" | "quiz"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. quiz    - Take a quiz about the character and earn an NFT");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "quiz") {
      rl.close();
      return "quiz";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    const mode = await chooseMode();

    if (mode === "chat") {
      await runChatMode(agent, config);
    } else if (mode === "quiz") {
      // Configure CDP Wallet Provider for NFT minting
      const walletConfig = {
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
        networkId: process.env.NETWORK_ID || "base-sepolia",
      };
      
      const walletProvider = await CdpWalletProvider.configureWithWallet(walletConfig);
      await runQuizMode(walletProvider);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
