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
    <div className="posts-list space-y-6">
      {photoalbums.map((album) => (
        <div 
          key={album.id} 
          className="post border border-gray-200 rounded-lg p-6 mb-4 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              Author: {truncateAddress(album.author)}
            </span>
            <span className="text-xs text-gray-500 italic">
              {new Date(Number(album.timestamp) * 1000).toLocaleString()}
            </span>
          </div>
          <div className="mb-4 text-gray-800 font-medium">{album.caption}</div>
          <div className="flex space-x-3 mb-4">
            <ImageWithFallback
              primarySrc={`https://${album.fileDirectory}.3337.w3link.io/1.png`}
              fallbackSrc={`https://${album.fileDirectory}.3337.w3link.io/1.jpg`}
              alt="post image 1"
              className="w-1/3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer transform hover:scale-[1.02] transition-transform"
              onImageClick={handleImageClick}
            />
            <ImageWithFallback
              primarySrc={`https://${album.fileDirectory}.3337.w3link.io/2.png`}
              fallbackSrc={`https://${album.fileDirectory}.3337.w3link.io/2.jpg`}
              alt="post image 2"
              className="w-1/3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer transform hover:scale-[1.02] transition-transform"
              onImageClick={handleImageClick}
            />
            <ImageWithFallback
              primarySrc={`https://${album.fileDirectory}.3337.w3link.io/3.png`}
              fallbackSrc={`https://${album.fileDirectory}.3337.w3link.io/3.jpg`}
              alt="post image 3"
              className="w-1/3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer transform hover:scale-[1.02] transition-transform"
              onImageClick={handleImageClick}
            />
          </div>
          <div>
            <a
              href={`https://sepolia.basescan.org/tx/${album.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium hover:underline inline-flex items-center"
            >
              View on Basescan
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      ))}

      {/* Modal with improved styling */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative p-2 bg-white rounded-xl shadow-2xl">
            <img
              src={selectedImage}
              alt="Large view"
              className="rounded-lg max-w-4xl max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotosList;
