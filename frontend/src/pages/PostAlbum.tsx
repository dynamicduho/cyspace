import React, { useState } from 'react';
import axios from 'axios';

const PostAlbum = () => {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc' }}>
      <h1>Upload Album</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Caption:</label>
        <input
          type="text"
          value={caption}
          onChange={handleCaptionChange}
          placeholder="Enter album caption"
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Images:</label>
        <input type="file" multiple onChange={handleFileChange} style={{ display: 'block', marginTop: '0.5rem' }} />
      </div>
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Album'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {uploadResult && (
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
        </div>
      )}
    </div>
  );
};

export default PostAlbum;
