const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto border-4 border-cyspace-pink animate-pulse">
        <h2 className="text-xl font-['Press_Start_2P'] text-center text-blue-600 mb-4">
          Loading...
        </h2>
        
        {/* Custom spinner with cyspace theme */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24">
            {/* Outer circle */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            
            {/* Spinning segment */}
            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
            
            {/* Center pixel character */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-contain bg-center bg-no-repeat pixel-character-mini"></div>
            </div>
          </div>
        </div>
        
        <p className="text-center font-['Press_Start_2P'] text-xs text-gray-700">
          Entering your mini-homepage...
        </p>
        
        {/* Status updates */}
        <div className="mt-4 text-xs font-['Press_Start_2P'] text-center text-gray-500">
          <div className="animate-pulse">Please wait a moment ♥</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;