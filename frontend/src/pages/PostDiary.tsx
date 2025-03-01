import React, { useState } from 'react';
import { useOkto, evmRawTransaction } from '@okto_web3/react-sdk';
import { Interface } from 'ethers';
import { CySpaceNetworkAbi } from '../abi/CySpaceNetworkAbi';

const CONTRACT_ADDRESS = "0x297eCc73d6029a16f3B0166e3C6A5F1fA0F56b1B";

const PostDiary = () => {
  const [diaryText, setDiaryText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  // Initialize Okto client
  const oktoClient = useOkto();

  const handleTextChange = (e) => {
    setDiaryText(e.target.value);
  };

  const handlePostDiary = async () => {
    if (!diaryText) {
      setError("Please enter your diary entry.");
      return;
    }
    setError('');
    setPosting(true);

    try {
      const contractInterface = new Interface(CySpaceNetworkAbi);
      const data = contractInterface.encodeFunctionData("createDiary", [diaryText]);
      const userAddress = oktoClient.userSWA;
      
      const rawTxParams = {
        caip2Id: "eip155:84532", // Use the appropriate chain ID
        transaction: {
          from: userAddress,
          to: CONTRACT_ADDRESS,
          data: data,
          value: BigInt(0) // No ETH is sent with this transaction
        }
      };

      // Execute the transaction using evmRawTransaction
      const jobId = await evmRawTransaction(oktoClient, rawTxParams);
      console.log('Transaction Job ID:', jobId);

      setTxResult({
        status: 'success',
        jobId: jobId,
        message: 'Your diary entry has been posted to the blockchain!'
      });
    } catch (err) {
      console.error("Error posting diary:", err);
      setError(`Failed to post diary: ${err.message}`);
      setTxResult({
        status: 'failed',
        message: err.message
      });
    } finally {
      setPosting(false);
    }
  };

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
          <div className="flex items-center text-xs text-gray-500">
            <span>TODAY</span>
            <span className="mx-1 text-yellow-500">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="bg-white rounded border border-gray-200 p-5 mb-4">
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-4 border-b border-gray-200 pb-2">
            Post Diary Entry
          </h1>
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Diary Entry:
              </label>
              <textarea
                value={diaryText}
                onChange={handleTextChange}
                placeholder="Write your diary entry here..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePostDiary} 
                disabled={posting}
                className="w-full py-2 bg-green-400 hover:bg-green-500 text-white rounded-full border-2 border-b-4 border-r-4 border-green-600 transition duration-200 text-sm disabled:opacity-50"
              >
                {posting ? 'Posting Diary...' : 'Post Diary'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            {txResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                txResult.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h2 className="text-lg font-semibold mb-2">
                  {txResult.status === 'success' ? '🎉 Posted Successfully!' : '❌ Posting Failed'}
                </h2>
                <p className="text-sm text-gray-700">{txResult.message}</p>
                {txResult.jobId && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Transaction Job ID:</strong> {txResult.jobId}
                  </p>
                )}
                {txResult.status === 'success' && (
                  <button 
                    onClick={() => {
                      setDiaryText('');
                      setTxResult(null);
                    }}
                    className="mt-4 w-full py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full border-2 border-b-4 border-r-4 border-blue-600 transition duration-200 text-sm"
                  >
                    Create New Diary Entry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Made with love by Alex, Suyog, Josh, Eric</span>
        </div>
      </div>
    </main>
  );
};

export default PostDiary;
