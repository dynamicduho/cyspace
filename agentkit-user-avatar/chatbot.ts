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
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
// Import character functionality
import { eric, suyog, loadCharacter, createCharacterMessageModifier, Character } from "./characters";
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
 * @param character - The character to use for the agent
 * @returns Agent executor and config
 */
async function initializeAgent(character: Character) {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
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
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig, walletProvider };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const thought =
        "Be creative and do something interesting on the blockchain. " +
        "Choose an action or set of actions and execute it that highlights your abilities.";

      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
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
      const userInput = await question("User: ");

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
 * Run the agent in quiz mode, testing the user's knowledge about the character
 * and minting an NFT based on their score
 * 
 * @param walletProvider - CDP wallet provider for minting NFTs
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param character - The character being used
 */
async function runQuizMode(
  walletProvider: CdpWalletProvider, 
  agent: any, 
  config: any,
  character: Character
) {
  console.log("Starting quiz mode...");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // Create quiz manager with selected character and wallet provider
    const quizManager = new CharacterQuizManager(character, walletProvider);
    
    // Display welcome message
    console.log(`I'm ${quizManager.getCharacterName()}'s avatar, and I'm ready to test your knowledge about me.`);
    console.log("You'll get a cool NFT if you score well!");
    console.log("-----------------------------------------------------------");
    
    // Ask for wallet address
    const walletAddress = "0xE9473eCDCf10162b2E25ca20acb87906354A649a"; // set to suyog's wallet address for now
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
      
      // If quiz is over, exit the loop
      if (!quizManager.isQuizActive()) {
        break;
      }
    }
    
    console.log("\nThank you for taking the quiz! You scored over 50%! Here's your NFT:");

    try {
      const thought =
        "Mint an NFT with the smart contract address of 0x03f2B60F4530b864b1F447d8F032817D0CD0A2Ab and the following abi: " +
        '[{"type":"function","name":"mint","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"friend","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"}]' +
        "Transfer the newly minted NFT to the user's wallet address: " + walletAddress;

      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
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

// /**
//  * Choose a character to use for the agent
//  *
//  * @returns Selected character
//  */
// async function chooseCharacter(): Promise<Character> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   const question = (prompt: string): Promise<string> =>
//     new Promise(resolve => rl.question(prompt, resolve));

//   // eslint-disable-next-line no-constant-condition
//   while (true) {
//     console.log("\nAvailable characters:");
//     console.log("1. Eric    - University student passionate about tech and blockchain");
//     console.log("2. Suyog   - Math and physics graduate with diverse interests");
//     console.log("3. Custom  - Load a custom character by name");

//     const choice = (await question("\nChoose a character (enter number or name): "))
//       .toLowerCase()
//       .trim();

//     if (choice === "1" || choice === "eric") {
//       rl.close();
//       return eric;
//     } else if (choice === "2" || choice === "suyog") {
//       rl.close();
//       return suyog;
//     } else if (choice === "3" || choice === "custom") {
//       const customName = await question("Enter the name of your custom character: ");
//       try {
//         const customCharacter = loadCharacter(customName);
//         rl.close();
//         return customCharacter;
//       } catch (error) {
//         console.log(`Character "${customName}" not found. Please try again.`);
//         continue;
//       }
//     }
//     console.log("Invalid choice. Please try again.");
//   }
// }

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
    console.log("1. chat    - Chat with me!");
    console.log("2. quiz    - Take a quiz about me and earn an NFT");

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
 * Main function to start the chatbot
 */
async function main() {
  try {
    // Choose character
    const character = eric;
    console.log(`Selected character: ${character.name}`);
    
    // Initialize agent
    const { agent, config, walletProvider } = await initializeAgent(character);
    
    // Choose mode
    const mode = await chooseMode();
    
    // Run in selected mode
    if (mode === "chat") {
      await runChatMode(agent, config);
    } else if (mode === "quiz") {
      await runQuizMode(walletProvider, agent, config, character);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { initializeAgent };