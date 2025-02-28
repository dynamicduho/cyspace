import {
    getAccount,
    getChains,
    getOrdersHistory,
    getPortfolio,
    getPortfolioActivity,
    getPortfolioNFT,
    getTokens,
    useOkto,
  } from "@okto_web3/react-sdk";
  import { googleLogout } from "@react-oauth/google";
  import { useNavigate } from "react-router-dom";
  import GetButton from "./GetButton";
  import { useRef, useState } from "react";
  import { ChevronLeft, ChevronRight } from "lucide-react";

export default function OktoIntents() {
const oktoClient = useOkto();
const navigate = useNavigate();
const isloggedIn = oktoClient.isLoggedIn();
const userSWA = oktoClient.userSWA;

// handles user logout process
    async function handleLogout() {
        try {
        // Perform Google OAuth logout and remove stored token
        googleLogout();
        localStorage.removeItem("googleIdToken");
        navigate("/");
        return { result: "logout success" };
        } catch (error) {
        console.error("Logout failed:", error);
        return { result: "logout failed" };
        }
    }

    return (
        <main className="bg-gradient-to-b from-violet-100 to-violet-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">

        {/* <div className="space-y-4">
            <h2 className="text-violet-900 font-bold text-2xl">Env Config</h2>
            <pre className="whitespace-pre-wrap break-words bg-white p-6 rounded-xl text-gray-800 w-full border border-violet-200 shadow-lg">
            {isloggedIn ? JSON.stringify(envconfig, null, 2) : "not signed in"}
            </pre>
        </div> */}
        <div className="space-y-4">
            <h2 className="text-violet-900 font-bold text-2xl">User Details</h2>
            <pre className="whitespace-pre-wrap break-words bg-white p-6 rounded-xl text-gray-800 w-full border border-violet-200 shadow-lg">
            {isloggedIn ? `Logged in. userSWA: ${userSWA}` : "not signed in"}
            </pre>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-violet-200 p-6 mb-8">
            <h2 className="text-violet-900 font-semibold text-2xl mb-6">
            Explorer Functions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <GetButton title="Okto Log out" apiFn={handleLogout} />
            <GetButton title="getAccount" apiFn={getAccount} />
            <GetButton title="getChains" apiFn={getChains} />
            <GetButton title="getOrdersHistory" apiFn={getOrdersHistory} />
            <GetButton title="getPortfolio" apiFn={getPortfolio} />
            <GetButton
                title="getPortfolioActivity"
                apiFn={getPortfolioActivity}
            />
            <GetButton title="getPortfolioNFT" apiFn={getPortfolioNFT} />
            <GetButton title="getTokens" apiFn={getTokens} />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-violet-200 p-6">
            <h2 className="text-violet-900 font-semibold text-2xl mb-6">
            Intents
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
                onClick={() => navigate("/transfertoken")}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-center font-medium"
            >
                Transfer Token
            </button>
            <button
                onClick={() => navigate("/transfernft")}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-center font-medium"
            >
                Transfer NFT
            </button>
            <button
                onClick={() => navigate("/rawtransaction")}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-center font-medium"
            >
                Raw Transaction
            </button>
            </div>
        </div>
        </div>
        </main>
    )
}
