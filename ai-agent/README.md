# CySpace AI Agent

This is an AI agent for the CySpace Network, built using the ElizaOS framework. The agent provides custom actions for quizzing users about characters and minting NFTs on the CySpace Network.

## Features

- **Character Quiz**: Quiz users about any character's background, skills, experiences, personality, and hobbies.
- **MINT_NFT Action**: Mint NFTs on the CySpace Network with custom metadata.

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

## Running the Quiz

To start the quiz with the default character (Eric):
```bash
pnpm start
```

To start the quiz with a different character:
```bash
pnpm start [character-name]
```

## Quiz Questions

The quiz generates questions about the character based on their:
- Background and education
- Technical skills and expertise
- Notable achievements and experiences
- Personality and communication style
- Hobbies and interests outside of technology

The quiz includes both open-ended questions and true/false questions to test your knowledge about the character.

## Development

This project is built with:
- TypeScript
- ts-node for running TypeScript files directly

### Project Structure

- `src/characters/`: Contains character definitions in JSON format.
- `src/custom_actions/`: Contains custom action implementations.
- `src/index.ts`: Main entry point that runs the character quiz.
- `src/custom_actions/quizUser.ts`: Contains the `CharacterQuizManager` class that handles quiz functionality for any character.

### Creating New Characters

To create a new character for the quiz:
1. Create a JSON file in the `src/characters/` directory with the character's name (e.g., `alice.character.json`).
2. Include the following properties in the character file:
   - `name`: The character's name
   - `bio`: Array of biographical information
   - `knowledge`: Array of skills and expertise
   - `lore`: Array of notable experiences
   - `style`: Object containing communication style information
   - `topics`: Array of interests and topics

## Custom Actions

### Character Quiz

The quiz functionality is now generalized to work with any character, not just Eric. It generates questions based on the character's attributes and evaluates user answers using text similarity for open-ended questions.

### MINT_NFT

This action allows users to mint NFTs on the CySpace Network. It guides users through the process of providing metadata for their NFT, including name, description, and image URL, and then mints the NFT on the blockchain.

## Smart Contracts

The CySpace Network includes a smart contract for minting NFTs, located in the `smart-contracts/src/CySpaceNFT.sol` file. This contract implements the ERC721 standard and provides functionality for minting NFTs with custom metadata.

## License

ISC 