require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { FlatDirectory } = require('ethstorage-sdk');
const { NodeFile } = require('ethstorage-sdk/file');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:5173'
}));

const upload = multer({ dest: 'uploads/' });

const rpc = "https://rpc.beta.testnet.l2.quarkchain.io:8545";
const privateKey = process.env.PRIVATE_KEY;

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
      const fileKey = `album_${albumTimestamp}_${newName}`;
      const nodeFile = new NodeFile(file.path);
      const fileRequest = {
        key: fileKey,
        content: nodeFile,
        type: 2,
        callback: {
          onProgress: (progress, count) => {
            console.log(`File ${file.originalname} progress: ${progress} / ${count}`);
          },
          onFail: (err) => {
            console.error(`File ${file.originalname} upload failed:`, err);
          },
          onFinish: (chunks, size, cost) => {
            console.log(`File ${file.originalname} uploaded: ${chunks} chunks, cost: ${cost}`);
          }
        }
      };

      await newFlatDirectory.upload(fileRequest);
      console.log(`File ${file.originalname} renamed to ${newName} and uploaded`);

      fs.unlink(file.path, (err) => {
        if (err) console.error("Error removing file:", file.path, err);
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
