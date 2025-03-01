import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useOkto, evmRawTransaction, getOrdersHistory, getAccount } from '@okto_web3/react-sdk';
import { Interface, getAddress } from 'ethers';
import { CySpaceNetworkAbi } from '../abi/CySpaceNetworkAbi';

const CONTRACT_ADDRESS = "0x297eCc73d6029a16f3B0166e3C6A5F1fA0F56b1B";

const PostAlbum = () => {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);
  
  // Initialize Okto client
  const oktoClient = useOkto();

  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `0x${address.slice(2, 5)}..${address.slice(-3)}`;
  };

  const handleUpload = async () => {
    if (!caption || files.length === 0) {
      setError('Please enter a caption and select at least one image.');
      return;
    }
    setError('');
    setUploading(true);

    try {
      // Create form data for the caption and images
      const formData = new FormData();
      formData.append('caption', caption);
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      // Send POST request to the backend (adjust URL if needed)
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update state with the returned file keys and flatDirectory address
      setUploadResult({
        keys: response.data.renamedFiles,
        flatDirectoryAddress: response.data.flatDirectoryAddress,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };


  const handlePost = async () => {
    if (!uploadResult) {
      setError('Please upload files first.');
      return;
    }

    setPosting(true);
    setError('');

    try {
      // Check if caption is within the 140 character limit from the contract
      if (caption.length > 140) {
        setError('Caption must be 140 characters or less.');
        setPosting(false);
        return;
      }

      // Create a contract interface
      const contractInterface = new Interface(CySpaceNetworkAbi);
      
      // Encode the function call
      const contentAddress = uploadResult.flatDirectoryAddress;
      const keys = uploadResult.keys;
      
      // Convert the flatDirectoryAddress string to an actual Ethereum address if needed
      // This depends on the format returned by your backend
      const formattedContentAddress = getAddress(contentAddress);
      
      // Encode the function call data
      const data = contractInterface.encodeFunctionData("createPhoto", [
        caption,
        formattedContentAddress,
        keys
      ]);

      console.log(caption, formattedContentAddress, keys)
      console.log(data);

      // Get user's address
      const userAddress = oktoClient.userSWA;
      
      // Create raw transaction parameters using the evmRawTransaction approach
      const rawTxParams = {
        caip2Id: "eip155:84532", // Use the appropriate chain ID (1 for Ethereum Mainnet)
        transaction: {
          from: userAddress,
          to: CONTRACT_ADDRESS,
          data: data,
          value: BigInt(0) // No ETH value is being sent with this transaction
        }
      };
      
      // Execute the transaction using evmRawTransaction
      const jobId = await evmRawTransaction(oktoClient, rawTxParams);
      console.log('Job ID:', jobId);

      setTxResult({
        status: 'success',
        jobId: jobId,
        message: 'Your photo has been posted to the blockchain!'
      });
    } catch (err) {
      console.error('Posting error:', err);
      setError(`Failed to post to blockchain: ${err.message}`);
      setTxResult({
        status: 'failed',
        message: err.message
      });
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    async function test(){
      const orders = await getOrdersHistory(oktoClient, {
        intentId: "d09f33ef-4abe-4eaa-9de1-d250d4f676d5",
      });
      console.log("orderdata", orders);
      const account = await getAccount(oktoClient);
      console.log("octo account", account);
    }
    test();
  }, [oktoClient]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-cyspace-pink">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 cyspace-notebook">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Left Column - Preview Area */}
          <div className="border-r border-gray-200 pr-4 md:col-span-1">
            <div className="bg-white p-2 rounded mb-3 border border-gray-200">
              <h2 className="text-center text-blue-500 mb-2 border-b border-gray-200 pb-1 text-lg">Preview</h2>
              <div className="pixel-avatar bg-gray-100 h-24 w-24 mx-auto mb-2 relative overflow-hidden">
                {files.length > 0 && (
                  <img 
                    src={URL.createObjectURL(files[0])} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {/* <p className="text-center text-xs text-gray-700">
                {caption || "Add a caption"}
              </p> */}
            </div>
          </div>

          {/* Right Column - Upload Form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded border border-gray-200 p-5 mb-4">
              <h1 className="text-2xl font-bold text-center text-blue-600 mb-4 border-b border-gray-200 pb-2">
                Post pictures
              </h1>

              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Caption:</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={handleCaptionChange}
                    placeholder="Enter album caption (max 140 characters)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={140}
                  />
                  <small className="text-gray-500">{caption.length}/140 characters</small>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Images:</label>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full border-2 border-b-4 border-r-4 border-yellow-600 transition duration-200 text-sm disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Album'}
                  </button>

                  {uploadResult && !txResult && (
                    <button 
                      onClick={handlePost} 
                      disabled={posting}
                      className="flex-1 py-2 bg-green-400 hover:bg-green-500 text-white rounded-full border-2 border-b-4 border-r-4 border-green-600 transition duration-200 text-sm disabled:opacity-50"
                    >
                      {posting ? 'Posting to Blockchain...' : 'Post to CySpace'}
                    </button>
                  )}
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                {uploadResult && !txResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-600 mb-2">Upload Successful!</h2>
                    <p className="text-sm text-gray-700">
                      <strong>FlatDirectory Address:</strong> {truncateAddress(uploadResult.flatDirectoryAddress)}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>File Keys:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {uploadResult.keys.map((key, index) => (
                        <li key={index}>{key}</li>
                      ))}
                    </ul>
                  </div>
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
                          setCaption('');
                          setFiles([]);
                          setUploadResult(null);
                          setTxResult(null);
                        }}
                        className="mt-4 w-full py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-full border-2 border-b-4 border-r-4 border-blue-600 transition duration-200 text-sm"
                      >
                        Create New Album
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Section */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Made with love by Alex, Suyog, Josh, Eric</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8">
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-full shadow-lg transition duration-200"
        >
          Back
        </button>
      </div>
    </main>
  );
};

export default PostAlbum;
