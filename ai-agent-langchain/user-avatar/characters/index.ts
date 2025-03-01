import * as fs from 'fs';
import * as path from 'path';

/**
 * Character interface defining the structure of a character configuration
 */
export interface Character {
  name: string;
  bio?: string[];
  knowledge?: string[];
  topics?: string[];
  lore?: string[];
  style?: {
    all?: string[];
  };
  system?: string;
  messageExamples?: [string, string][];
}

/**
 * Load a character from a JSON file
 * @param characterName Name of the character to load
 * @returns Character configuration
 */
export function loadCharacter(characterName: string): Character {
  try {
    // Try to load from the local characters directory first
    const localPath = path.join(__dirname, `${characterName}.json`);
    if (fs.existsSync(localPath)) {
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    }

    // Try to load from the eliza directory if not found locally
    const elizaPath = path.join(process.cwd(), '..', '..', '..', 'eliza', 'characters', `${characterName}.character.json`);
    if (fs.existsSync(elizaPath)) {
      return JSON.parse(fs.readFileSync(elizaPath, 'utf8'));
    }

    throw new Error(`Character ${characterName} not found`);
  } catch (error) {
    console.error(`Error loading character ${characterName}:`, error);
    throw error;
  }
}

/**
 * Generate a system prompt for a character
 * @param character Character configuration
 * @returns System prompt string
 */
export function generateSystemPrompt(character: Character): string {
  // Use existing system prompt if available
  if (character.system) {
    return character.system;
  }

  // Generate a system prompt based on character attributes
  let systemPrompt = `You are ${character.name}, `;

  if (character.bio && character.bio.length > 0) {
    systemPrompt += `a character with the following background: ${character.bio.join(' ')} `;
  }

  if (character.knowledge && character.knowledge.length > 0) {
    systemPrompt += `\n\nYou have knowledge about: ${character.knowledge.join(', ')} `;
  }

  if (character.style && character.style.all && character.style.all.length > 0) {
    systemPrompt += `\n\nYour communication style is: ${character.style.all.join(' ')} `;
  }

  // Add CDP wallet capabilities
  systemPrompt += `\n\nYou are also empowered with blockchain capabilities through Coinbase Developer Platform. 
  You can interact with blockchain networks, manage wallets, and execute transactions.
  Before performing any blockchain actions, always check your wallet details to see what network you're on.
  If you need funds, you can request them from a faucet if you're on a testnet like base-sepolia.`;

  return systemPrompt;
}

/**
 * Create a character-specific message modifier for the agent
 * @param character Character configuration
 * @returns Message modifier string
 */
export function createCharacterMessageModifier(character: Character): string {
  return `
    You are ${character.name}. ${character.bio ? character.bio.join(' ') : ''}
    
    You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
    empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
    faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request 
    funds from the user. Before executing your first action, get the wallet details to see what network 
    you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later.
    
    ${character.style && character.style.all ? `Your communication style is: ${character.style.all.join(' ')}` : ''}
    
    Be concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
  `;
}

// Export Eric character by default
export const eric = loadCharacter('eric');
export default eric; 