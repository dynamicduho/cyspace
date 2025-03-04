# CySpace

CySpace is a next-generation social media platform that redefines online interactions by prioritizing meaningful connections over superficial engagement metrics.

## 🌟 The Problem We Solve

Modern social media platforms encourage superficial interactions—users mindlessly like, comment, and move on without forming meaningful connections. Additionally, onboarding new users to Web3 is a complex and intimidating process, filled with technical jargon and barriers like wallet management and gas fees, which discourage mainstream adoption.

## 🚀 Our Solution

CySpace addresses these challenges by:

- **Incentivizing deeper social connections** — users are rewarded based on how well they truly know their friends, fostering more meaningful engagement
- **Seamlessly onboarding Web2 users into Web3** using an embedded wallet linked with Google Sign-in paired with gas sponsored account abstraction
- **Providing a familiar and engaging social media experience** with broad appeal, making Web3 adoption smoother and more intuitive

## 🔄 User Interaction and Data Flow

### Onboarding & Profile Setup
- Sign up using Google account for seamless authentication
- Choose a username and write a short bio including hobbies, personality traits, and interests
- Optional to connect to Twitter to allow AI agents to learn about you through your tweets, tweets are verified onchain using Flare FDC

### Social Media Interface
- View posts from friends and interact with content in the main feed
- Create two types of posts:
  - Pictures (standard social media posts)
  - Diaries (blog-like entries)
- All posts are stored on the blockchain for transparency and ownership

### Personal Homespace
- Enter your 3D Homespace, a virtual personal space where you can:
  - Update pictures and diaries
  - Customize your environment

### Visiting Another User's Homespace
When visiting a friend's Homespace, you'll find:
- **Whiteboard** – Draw on it and have your interactions stored on the blockchain as proof of visit
- **Bookshelf** – Browse your friend's diaries and written content
- **3D Model of the User** – Interact with an AI-driven avatar trained on the owner's personality:
  - Take quizzes to demonstrate how well you know them
  - Earn Soulbound NFTs and tokens as rewards for being a good friend

## 🏗️ Project Architecture and Development

### Core Components:

#### User Onboarding
- Leverages **Okto** for streamlined authentication with Google accounts
- Removes complexity of handling wallets and private keys

#### Social Media and Content Storage
- Content stored in a decentralized manner using **EthStorage** and **Walrus**
- Ensures data permanence and ownership

#### On-Chain Infrastructure
- Operates on the **Base blockchain** for low-cost, scalable transactions
- Securely records interactions like visit proofs, content, and AI engagements on-chain

### Development Stack:
- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: Supabase for off-chain user data, The Graph for indexing on-chain content

## 🔌 Product Integrations

### User Authentication & Wallet Management
- **Google Auth** – Frictionless user login
- **Okto** – Wallet abstraction without private key management

### Content Storage & Blockchain Integration
- **EthStorage** – Decentralized storage for user-generated content
- **Walrus** – Auto-deletion based on epochs for temporary homespace whiteboards
- **Base** – Layer 2 blockchain for low-cost, scalable transactions

### AI-Driven Social Experience
- **Coinbase SDK AgentKit** – Powers AI-driven 3D avatars with minting capabilities
- **Flare FDC** – Verifies tweets onchain, tweets are used to train the AI avatar (due to X API rate limits and cost, api responses are hard-coded for now)

## 🌈 Key Differentiators

### Meaningful Social Connections Through Rewards
- Interact with friends' AI-driven avatars that simulate their personalities
- Earn rewards by passing personalized "friend quizzes"
- Optimize for true social engagement rather than superficial activity metrics

### Seamless Web3 Integration for All Users
- Designed for both Web2 and Web3 users
- No need to manage wallets, private keys, or transactions
- Eliminates common barriers to Web3 adoption

### Decentralized & Scalable Data Handling
- Ensures user ownership of content
- Securely stores photos and diaries on EthStorage & Walrus
- Embraces blockchain technology while fostering real connections

## 🛠️ Trade-offs and Future Improvements

### Current Trade-offs
- Prioritized seamless onboarding over wallet flexibility
- Limited options for representing "good connections"

### Future Enhancements
- Support for direct wallet connections for crypto-native users
- Customizable profile badges or NFT-based friendship tokens
- Token drops or exclusive rewards for long-term meaningful interactions
- More media sources to train the AI avatar

## 🚀 How to Run CySpace on Your Local Machine

Follow these steps to set up and run CySpace locally:

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Git

### Clone the Repository

```bash
git clone https://github.com/yourusername/cyspace.git
cd cyspace
```

### Setting Up the Main Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Create .env file from example
cp env.example .env
# Configure your environment variables as needed

# Start the development server
npm run dev
# or
pnpm dev
```

The main frontend will be available at `http://localhost:5173` (or the port specified in your terminal).

### Setting Up the Homespace Frontend

```bash
# Navigate to the homespace directory from the project root
cd homespace

# Install dependencies
npm install

# Start the development server
npm run dev
```

The homespace frontend will be available at `http://localhost:5174` (or the port specified in your terminal).

### Setting Up the Main Backend

```bash
# Navigate to the backend directory from the project root
cd backend

# Install dependencies
npm install

# Start the server
node app.js
```

The main backend will be available at `http://localhost:3000`.

### Setting Up the AgentKit User Avatar Backend

```bash
# Navigate to the agentkit-user-avatar directory from the project root
cd agentkit-user-avatar

# Install dependencies
npm install

# Create .env file if it doesn't exist and configure as needed
# Make sure to set up any required API keys

# Start the server
npm start
# or
node server.js
```

The AgentKit User Avatar backend will be available at `http://localhost:3001`.

### Accessing the Application

Once all services are running, you can access the full CySpace application by navigating to the main frontend URL in your browser: `http://localhost:5173`

### Troubleshooting

- If you encounter port conflicts, you can modify the port settings in the respective configuration files.
- Make sure all required environment variables are properly set in the .env files.
- Check the console output for any error messages if a service fails to start.

---

*CySpace was built entirely during the BUIDLathon.*
