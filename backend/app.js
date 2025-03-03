require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { FlatDirectory } = require('ethstorage-sdk');
const { NodeFile } = require('ethstorage-sdk/file');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const rpc = "https://rpc.beta.testnet.l2.quarkchain.io:8545";
const privateKey = process.env.PRIVATE_KEY;

// Simplified endpoint to run TwitterFDC.ts
app.post('/connect-twitter', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: "Twitter username is required" });
    }
    
    console.log(`Running TwitterFDC.ts for username: ${username}`);
    
    // Path to the flare directory
    const flarePath = path.join(__dirname, '../flare');
    
    // Execute the script with the provided username
    const command = `cd ${flarePath} && npx hardhat run scripts/TwitterFDC.ts --network coston`;
    
    console.log(`Executing command: ${command}`);
    
    // For demo purposes, we'll simulate the script execution
    // In a real implementation, you would uncomment this to run the actual script
    
    // Try to execute the script
    try {
      // Uncomment this in production
      // const { stdout, stderr } = await execPromise(command);
      // console.log('Script output:', stdout);
      // if (stderr) console.error('Script errors:', stderr);
      
      // Parse the JSON output from the script
      // const result = JSON.parse(stdout);
      
      // For demo purposes, we'll simulate the response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate the response from the script with the provided username
      const mockResult = {
        merkleProof: [
          "0xaad404e82ca159997a14fbc86a9f68526742ef8ad35c599cb1e7d67a9307813a",
          "0x5276a34bedc9b9a064a0cdf6675d8d9165d8ceb0f86c594eab72af3c952c99cc"
        ],
        roundProgress: "https://coston-systems-explorer.flare.rocks/voting-epoch/916993?tab=fdc",
        storedTweets: [
          {
            id: "1234567890",
            text: `This is a sample tweet from @${username}`,
            username: username,
            createdAt: new Date().toISOString()
          }
        ]
      };
      
      res.status(200).json(mockResult);
    } catch (execError) {
      console.error('Error executing script:', execError);
      res.status(500).json({ 
        message: "Failed to execute TwitterFDC.ts script", 
        error: execError.toString() 
      });
    }
    
  } catch (error) {
    console.error("Twitter connection error:", error);
    res.status(500).json({ message: "Failed to connect Twitter", error: error.toString() });
  }
});

app.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const { caption } = req.body;
    const files = req.files;

    if (!caption) {
      return res.status(400).json({ message: "Caption is required" });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const newFlatDirectory = await FlatDirectory.create({
      rpc: rpc,
      privateKey: privateKey
    });
    const deployedAddress = await newFlatDirectory.deploy();
    console.log("New FlatDirectory deployed at:", deployedAddress);

    const albumTimestamp = Date.now();
    const renamedFiles = [];

    const metadataKey = `album_${albumTimestamp}_metadata.json`;
    const metadata = {
      caption: caption,
      timestamp: albumTimestamp,
      fileCount: files.length,
    };

    const metadataRequest = {
      key: metadataKey,
      content: Buffer.from(JSON.stringify(metadata)),
      type: 2, // Using blob storage
      callback: {
        onProgress: (progress, count) => {
          console.log(`Metadata upload progress: ${progress} / ${count}`);
        },
        onFail: (err) => {
          console.error("Metadata upload failed:", err);
        },
        onFinish: (chunks, size, cost) => {
          console.log(`Metadata upload finished: ${chunks} chunks, cost: ${cost}`);
        }
      }
    };

    await newFlatDirectory.upload(metadataRequest);
    console.log("Metadata uploaded");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname);
      const newName = `${i + 1}${ext}`;
      renamedFiles.push(newName);
      
      const newPath = path.join('uploads', newName);
      
      fs.renameSync(file.path, newPath);
      
      const nodeFile = new NodeFile(newPath);
      const fileRequest = {
        key: newName,
        content: nodeFile,
        type: 2,
        callback: {
          onProgress: (progress, count) => {
            console.log(`File ${newName} progress: ${progress} / ${count}`);
          },
          onFail: (err) => {
            console.error(`File ${newName} upload failed:`, err);
          },
          onFinish: (chunks, size, cost) => {
            console.log(`File ${newName} uploaded: ${chunks} chunks, cost: ${cost}`);
          }
        }
      };

      await newFlatDirectory.upload(fileRequest);
      console.log(`File renamed to ${newName} and uploaded`);

      fs.unlink(newPath, (err) => {
        if (err) console.error("Error removing file:", newPath, err);
      });
    }

    res.status(200).json({
      message: "Album uploaded successfully",
      renamedFiles: renamedFiles,
      flatDirectoryAddress: deployedAddress
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
