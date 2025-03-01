# Character-Based CDP Chatbot

This example demonstrates how to create a character-based chatbot using LangChain and Coinbase Developer Platform (CDP).

## Features

- Character-based AI agent using the Eric character profile
- Blockchain interaction capabilities through CDP
- Interactive chat mode and autonomous mode
- Persistent wallet data storage

## Setup

1. Install dependencies:
   ```
   pnpm install
   ```

2. Set up environment variables in `.env`:
   ```
   OPENAI_API_KEY=your_openai_api_key
   CDP_API_KEY_NAME=your_cdp_api_key_name
   CDP_API_KEY_PRIVATE_KEY=your_cdp_api_key_private_key
   NETWORK_ID=base-sepolia
   ```

3. Run the chatbot:
   ```
   pnpm start
   ```

## Character Configuration

The chatbot uses character configurations from the `characters` directory. You can modify existing characters or add new ones by creating JSON files in this directory.

## Modes

- **Chat Mode**: Interactive conversation with the AI agent
- **Auto Mode**: The agent performs autonomous actions at regular intervals

## Ask the chatbot to engage in the Web3 ecosystem!

- "Transfer a portion of your ETH to a random address"
- "What is the price of BTC?"
- "Deploy an NFT that will go super viral!"
- "Deploy an ERC-20 token with total supply 1 billion"

## Prerequisites

### Checking Node Version

Before using the example, ensure that you have the correct version of Node.js installed. The example requires Node.js 18 or higher. You can check your Node version by running:

```bash
node --version
```

If you don't have the correct version, you can install it using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install node
```

This will automatically install and use the latest version of Node.

### API Keys

You'll need the following API keys:
- [CDP API Key](https://portal.cdp.coinbase.com/access/api)
- [OpenAI API Key](https://platform.openai.com/docs/quickstart#create-and-export-an-api-key)

Once you have them, rename the `.env-local` file to `.env` and make sure you set the API keys to their corresponding environment variables:

- "CDP_API_KEY_NAME"
- "CDP_API_KEY_PRIVATE_KEY"
- "OPENAI_API_KEY"

## License

Apache-2.0
