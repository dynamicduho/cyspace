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

interface ImageWithFallbackProps {
  primarySrc: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  onImageClick: (src: string) => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  primarySrc,
  fallbackSrc,
  alt,
  className,
  onImageClick,
}) => {
  const [src, setSrc] = useState(primarySrc);
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      setSrc(fallbackSrc);
    } else {
      setSrc(""); // Hide the image if fallback also fails
    }
  };

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={() => onImageClick(src)}
      onError={handleError}
    />
  );
};

const PhotosList: React.FC<PostsListProps> = ({ photoalbums }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Helper function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `0x${address.slice(2, 5)}..${address.slice(-3)}`;
  };

  // Handles clicking an image to open the modal with a larger view
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
            <ImageWithFallback
              primarySrc={`https://${album.fileDirectory}.3337.w3link.io/1.png`}
              fallbackSrc={`https://${album.fileDirectory}.3337.w3link.io/1.jpg`}
              alt="post image 1"
              className="w-1/3 rounded cursor-pointer"
              onImageClick={handleImageClick}
            />
            <ImageWithFallback
              primarySrc={`https://${album.fileDirectory}.3337.w3link.io/2.png`}
              fallbackSrc={`https://${album.fileDirectory}.3337.w3link.io/2.jpg`}
              alt="post image 2"
              className="w-1/3 rounded cursor-pointer"
              onImageClick={handleImageClick}
            />
            <ImageWithFallback
              primarySrc={`https://${album.fileDirectory}.3337.w3link.io/3.png`}
              fallbackSrc={`https://${album.fileDirectory}.3337.w3link.io/3.jpg`}
              alt="post image 3"
              className="w-1/3 rounded cursor-pointer"
              onImageClick={handleImageClick}
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

      {/* Modal for the large image view */}
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
