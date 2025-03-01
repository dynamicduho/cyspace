# Chatbot Backend Server

This is a Node.js backend server for the AI User Avatar chatbot. It provides API endpoints for the frontend to communicate with the chatbot.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env-local` to `.env` if you haven't already
   - Make sure the following variables are set in your `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key
     CDP_API_KEY_NAME=your_cdp_api_key_name
     CDP_API_KEY_PRIVATE_KEY=your_cdp_api_key_private_key
     NETWORK_ID=base-sepolia
     PORT=3000
     FRONTEND_URL=http://localhost:5173
     ```

## Running the Server

### JavaScript Version (Recommended)

To run the JavaScript version of the server (avoids TypeScript compilation issues):

```bash
npm run server:js
```

For development mode with hot reloading:

```bash
npm run server:js:dev
```

### TypeScript Version

If you prefer to use the TypeScript version, you'll need to compile it first:

```bash
npm run build
```

Then run the server:

```bash
npm run server
```

For development mode with hot reloading:

```bash
npm run server:dev
```

## API Endpoints

The server exposes the following API endpoints:

### Initialize Agent

```
POST /api/chatbot/initialize
```

Request body:
```json
{
  "character": "eric" // Optional, defaults to "eric"
}
```

Response:
```json
{
  "success": true,
  "message": "Agent initialized successfully",
  "welcomeMessage": "Hello! I'm your AI assistant...",
  "sessionId": "unique-session-id"
}
```

### Send Message

```
POST /api/chatbot/message
```

Request body:
```json
{
  "message": "Hello, how are you?",
  "sessionId": "unique-session-id"
}
```

Response:
```json
{
  "success": true,
  "response": {
    "content": "I'm doing well, thank you for asking!",
    "exit": false
  }
}
```

### Reset Agent

```
POST /api/chatbot/reset
```

Request body:
```json
{
  "sessionId": "unique-session-id"
}
```

Response:
```json
{
  "success": true,
  "message": "Agent reset successfully"
}
```

## Frontend Integration

The frontend should be configured to communicate with this backend server. Make sure the frontend's `.env` file has the following variable:

```
VITE_CHATBOT_API_URL=http://localhost:3000/api/chatbot
```

## Session Management

The server maintains active sessions for each client. Sessions will automatically expire after 30 minutes of inactivity. 