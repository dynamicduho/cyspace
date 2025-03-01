// whiteboard-walrus.js
// This file handles the integration with Walrus for blob storage

/**
 * Upload whiteboard image to Walrus
 * @param {string} dataUrl - The image data URL from canvas.toDataURL()
 * @param {string} username - The username to associate with this upload
 * @returns {Promise<string>} - Promise resolving to the blobId
 */
export async function saveWhiteboardToWalrus(dataUrl, username) {
    const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
    
    try {
      // Convert data URL to blob
      const fetchResponse = await fetch(dataUrl);
      const blob = await fetchResponse.blob();
      
      // Add metadata with username and timestamp
      const fileWithMetadata = new File([blob], `${username}_whiteboard.png`, { 
        type: 'image/png',
        lastModified: new Date().getTime()
      });
      
      console.log(`Uploading whiteboard image for user ${username} to Walrus...`);
      
      // Upload to Walrus
      const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=5`, {
        method: 'PUT',
        body: fileWithMetadata,
        headers: {
          'Content-Type': 'image/png'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Walrus upload response:", result);
      
      // Extract the blobId based on response structure
      let blobId;
      if (result.newlyCreated && result.newlyCreated.blobObject.blobId) {
        blobId = result.newlyCreated.blobObject.blobId;
        console.log(`Whiteboard successfully uploaded with new blobId: ${blobId}`);
      } else if (result.alreadyCertified && result.alreadyCertified.blobId) {
        blobId = result.alreadyCertified.blobId;
        console.log(`Whiteboard was already certified with blobId: ${blobId}`);
      } else {
        throw new Error("Failed to retrieve blob id from response");
      }
      
      return blobId;
    } catch (error) {
      console.error("Error uploading whiteboard to Walrus:", error);
      throw error;
    }
  }
  
  /**
   * Download whiteboard image from Walrus
   * @param {string} blobId - The blobId to download
   * @returns {Promise<string>} - Promise resolving to the image data URL
   */
  export async function loadWhiteboardFromWalrus(blobId) {
    if (!blobId) {
      console.log("No blobId provided, cannot load whiteboard");
      return null;
    }
    
    const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
    
    try {
      console.log(`Downloading whiteboard with blobId: ${blobId}`);
      
      const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
      if (!response.ok) {
        throw new Error(`Error fetching whiteboard image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Convert blob to data URL to use with canvas
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to download whiteboard from Walrus:", error);
      throw error;
    }
  }
  
