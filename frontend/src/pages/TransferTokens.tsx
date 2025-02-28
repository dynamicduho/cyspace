"use client";
import { useState } from "react";
import { Address, tokenTransfer, useOkto } from "@okto_web3/react-sdk";
import { useNavigate } from "react-router-dom";

function TransferTokens() {
  const oktoClient = useOkto();

  const [networkName, setNetworkName] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [quantity, setQuantity] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [userOp, setUserOp] = useState<any | null>(null);
  const [userOpString, setUserOpString] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const transferParams = {
        caip2Id: networkName,
        recipientWalletAddress: recipientAddress as `0x{string}`,
        tokenAddress: tokenAddress as `0x{string}`,
        amount: Number(quantity),
      };

      console.log("Transfer params: ", transferParams);

      const userOpTmp = await tokenTransfer(oktoClient, {
        caip2Id: networkName,
        recipient: recipientAddress as Address,
        token: tokenAddress as Address,
        amount: Number(quantity),
      });
      setUserOp(userOpTmp);
      setUserOpString(JSON.stringify(userOpTmp, null, 2));
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setModalMessage("Error: " + error.message);
      setModalVisible(true);
    }
  };

  const handleSubmitUserOp = async () => {
    if (!userOpString) return;
    try {
      const editedUserOp = JSON.parse(userOpString);
      const signedUserOp = await oktoClient.signUserOp(editedUserOp);
      const tx = await oktoClient.executeUserOp(signedUserOp);
      setModalMessage("Transfer Submitted: " + JSON.stringify(tx, null, 2));
      setModalVisible(true);
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setModalMessage("Error: " + error.message);
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => setModalVisible(false);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-900 w-full">
      <button
        onClick={() => navigate("/home")}
        className="w-fit py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black mb-8"
      >
        Home
      </button>
      <h1 className="text-white font-bold text-3xl mb-8">Transfer Tokens</h1>
      <div className="flex flex-col gap-4 w-full max-w-2xl">
        <div className="flex flex-col items-center bg-black p-6 rounded-lg shadow-xl border border-gray-800">
          <input
            className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={networkName}
            onChange={(e) => setNetworkName(e.target.value)}
            placeholder="Enter Network ChainId"
          />

          <input
            className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Enter Token Address"
          />

          <input
            className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter Quantity (in smallest unit)"
          />

          <input
            className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Enter Recipient Address"
          />

          <button
            className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            onClick={handleSubmit}
          >
            Create Transfer
          </button>

          {userOp && (
            <>
              <div className="w-full mt-4">
                <textarea
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm resize-vertical focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={userOpString}
                  onChange={(e) => setUserOpString(e.target.value)}
                  rows={10}
                />
              </div>
              <button
                className="w-full p-3 mt-4 bg-green-500 text-white rounded hover:bg-green-600 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
                onClick={handleSubmitUserOp}
              >
                Sign and Send Transaction
              </button>
            </>
          )}

          {modalVisible && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
              <div className="bg-black rounded-lg w-11/12 max-w-2xl p-6 border border-gray-800 shadow-xl">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                  <div className="text-white text-lg font-semibold">
                    Transfer Status
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-200 transition-colors text-2xl"
                    onClick={handleCloseModal}
                  >
                    &times;
                  </button>
                </div>
                <div className="text-left">
                  <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded text-white">
                    {modalMessage}
                  </pre>
                </div>
                <div className="mt-4 text-right">
                  <button
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default TransferTokens;
