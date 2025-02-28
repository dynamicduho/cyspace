import React, { useEffect, useState } from "react";
import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";

export default function LoginPage() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Authenticate with Okto using the provided Google ID token.
  const authenticateWithOkto = async (idToken: string) => {
    try {
      setIsLoading(true);
      const user = await oktoClient.loginUsingOAuth({
        idToken,
        provider: "google",
      });
      console.log("Authenticated with Okto:", user);
      navigate("/home");
    } catch (error) {
      console.error("Authentication failed:", error);
      localStorage.removeItem("googleIdToken");
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status on component mount.
  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true);
      try {
        if (oktoClient.isLoggedIn()) {
          console.log("User already logged in");
          navigate("/home");
        } else {
          const storedToken = localStorage.getItem("googleIdToken");
          if (storedToken) {
            console.log("Found stored token:", storedToken);
            await authenticateWithOkto(storedToken);
          }
        }
      } catch (error) {
        console.error("Error during authentication check", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkAuthentication();
  }, [oktoClient, navigate]);  

  // Handle successful Google login.
  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    const idToken = credentialResponse.credential || "";
    if (idToken) {
      localStorage.setItem("googleIdToken", idToken);
      authenticateWithOkto(idToken);
    }
  };

  if(isLoading) return <LoadingScreen />

  return (
    <main className="min-h-screen flex items-center justify-center bg-cyworld-pink">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 cyworld-notebook">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-3 px-2 py-1 bg-gray-100 rounded-t-md border-b border-gray-300">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex items-center text-xs text-gray-500 font-pixel">
            <span>TODAY</span>
            <span className="mx-1 text-yellow-500">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Left Column - Profile Area */}
          <div className="border-r border-gray-200 pr-4 md:col-span-1">
            <div className="bg-white p-2 rounded mb-3 border border-gray-200">
              <h2 className="font-bubbly text-center text-blue-500 mb-2 border-b border-gray-200 pb-1 text-lg">TODAY is...</h2>
              <div className="pixel-avatar bg-gray-100 h-24 w-24 mx-auto mb-2 relative overflow-hidden">
                <div className="pixel-character"></div>
              </div>
              <p className="text-center font-comic text-xs text-gray-700">
                Please login
              </p>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <h3 className="font-bubbly text-xs text-center mb-1">STATUS</h3>
              <div className="flex justify-center space-x-1 text-xs">
                <span className="bg-green-100 px-1 rounded-sm">💖 0</span>
                <span className="bg-blue-100 px-1 rounded-sm">🌟 0</span>
                <span className="bg-yellow-100 px-1 rounded-sm">🔔 0</span>
              </div>
            </div>
          </div>

          {/* Middle & Right Columns - Main Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded border border-gray-200 p-5 mb-4">
              <h1 className="text-2xl font-rounded font-bold text-center text-blue-600 mb-4 border-b border-gray-200 pb-2">
                HomeSpace
              </h1>
              <p className="text-center text-sm font-comic mb-6 text-gray-700">
                Sign in with your account to enter your mini-homepage!
              </p>

              {/* Pixelated Room Preview */}
              <div className="pixel-room mb-6 h-64 bg-blue-50 rounded border border-gray-200 relative">
                <div className="absolute bottom-6 right-8 pixel-character-standing"></div>
                <div className="absolute top-4 left-4 pixel-computer"></div>
                <div className="absolute bottom-4 left-28 pixel-plant"></div>
                <div className="absolute top-4 right-4 pixel-window"></div>
              </div>

              {/* Login Options */}
              <div className="flex flex-col items-center space-y-6 mt-8">
                <div className="google-pixel-button">
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    theme="filled_black"
                    size="large"
                    shape="rectangular"
                  />
                </div>
                <button
                  onClick={() => navigate("/home")}
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bubbly rounded-full border-2 border-b-4 border-r-4 border-yellow-600 transition duration-200 text-sm"
                >
                  Continue as Guest
                </button>
              </div>
            </div>

            {/* Footer Section */}
            <div className="flex justify-between items-center text-xs font-comic text-gray-500">
              <span>Made with love by Alex, Suyog, Josh, Eric</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
