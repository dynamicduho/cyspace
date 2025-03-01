import { OktoClientConfig, OktoProvider } from "@okto_web3/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from "./App.tsx";
import "./index.css";

const config: OktoClientConfig = {
  environment: import.meta.env.VITE_OKTO_ENVIRONMENT,
  clientPrivateKey: import.meta.env.VITE_CLIENT_PRIVATE_KEY,
  clientSWA: import.meta.env.VITE_CLIENT_SWA,
};

const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/105689/cyspacenetwork-base/version/latest/',
  cache: new InMemoryCache(),
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ApolloProvider client={client}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <OktoProvider config={config}>
            <App />
          </OktoProvider>
        </GoogleOAuthProvider>
      </ApolloProvider>
    </BrowserRouter>
  </StrictMode>
);
