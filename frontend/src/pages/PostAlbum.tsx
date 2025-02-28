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
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc' }}>
      <h1>Upload Album</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Caption:</label>
        <input
          type="text"
          value={caption}
          onChange={handleCaptionChange}
          placeholder="Enter album caption (max 140 characters)"
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          maxLength={140}
        />
        <small>{caption.length}/140 characters</small>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Images:</label>
        <input type="file" multiple onChange={handleFileChange} style={{ display: 'block', marginTop: '0.5rem' }} />
      </div>
      <button 
        onClick={handleUpload} 
        disabled={uploading}
        style={{ marginRight: '1rem' }}
      >
        {uploading ? 'Uploading...' : 'Upload Album'}
      </button>
      
      {/* Post button appears after successful upload */}
      {uploadResult && !txResult && (
        <button 
          onClick={handlePost} 
          disabled={posting}
          style={{ 
            backgroundColor: '#4CAF50', 
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: posting ? 'not-allowed' : 'pointer'
          }}
        >
          {posting ? 'Posting to Blockchain...' : 'Post to CySpace'}
        </button>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {uploadResult && !txResult && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Upload Successful!</h2>
          <p>
            <strong>FlatDirectory Address:</strong> {uploadResult.flatDirectoryAddress}
          </p>
          <p>
            <strong>File Keys:</strong>
          </p>
          <ul>
            {uploadResult.keys.map((key, index) => (
              <li key={index}>{key}</li>
            ))}
          </ul>
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Click "Post to CySpace" to save your album to the blockchain.
          </p>
        </div>
      )}
      
      {txResult && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: txResult.status === 'success' ? '#e8f5e9' : '#ffebee',
          borderRadius: '4px'
        }}>
          <h2>{txResult.status === 'success' ? '🎉 Posted Successfully!' : '❌ Posting Failed'}</h2>
          <p>{txResult.message}</p>
          {txResult.jobId && (
            <p>
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
              style={{ 
                marginTop: '1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New Album
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostAlbum;
