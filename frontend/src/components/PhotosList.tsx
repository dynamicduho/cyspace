import React, { useState } from 'react';

interface PhotoAlbum {
  __typename: string;
  id: string;
  author: string;
  caption: string;
  fileDirectory: string;
  transactionHash: string;
  timestamp: string;
}

interface PostsListProps {
  photoalbums: PhotoAlbum[];
}

const PhotosList: React.FC<PostsListProps> = ({ photoalbums }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `0x${address.slice(2, 5)}..${address.slice(-3)}`;
  };

  // Handle image click to show the large view
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  return (
    <div className="posts-list p-4">
      {photoalbums.map((album) => (
        <div key={album.id} className="post border border-gray-300 rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Author: {truncateAddress(album.author)}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(Number(album.timestamp) * 1000).toLocaleString()}
            </span>
          </div>
          <div className="mb-2 text-gray-800">{album.caption}</div>
          <div className="flex space-x-2 mb-2">
            {/* Each placeholder image is clickable and opens a modal with a larger view */}
            <img
              src={`https://${album.fileDirectory}.3337.w3link.io/1.png`}
              alt="post image 1"
              className="w-1/3 rounded cursor-pointer"
              onClick={() => handleImageClick(`https://${album.fileDirectory}.3337.w3link.io/1.png`)}
            />
            <img
              src={`https://${album.fileDirectory}.3337.w3link.io/2.png`}
              alt="post image 2"
              className="w-1/3 rounded cursor-pointer"
              onClick={() => handleImageClick(`https://${album.fileDirectory}.3337.w3link.io/2.png`)}
            />
            <img
              src={`https://${album.fileDirectory}.3337.w3link.io/3.png`}
              alt="post image 3"
              className="w-1/3 rounded cursor-pointer"
              onClick={() => handleImageClick(`https://${album.fileDirectory}.3337.w3link.io/3.png`)}
            />
          </div>
          <div>
            <a
              href={`https://sepolia.basescan.org/tx/${album.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              View on Basescan
            </a>
          </div>
        </div>
      ))}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative">
            <img
              src={selectedImage}
              alt="Large view"
              className="rounded max-w-3xl max-h-1/2"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotosList;
