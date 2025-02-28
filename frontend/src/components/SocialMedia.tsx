import React from 'react';
import OktoIntents from './OktoIntents';
import {
    getAccount,
    getChains,
    getOrdersHistory,
    getPortfolio,
    getPortfolioActivity,
    getPortfolioNFT,
    getTokens,
    useOkto,
  } from "@okto_web3/react-sdk";

const RetroSocialApp = () => {
  // Sample data for friends
  const friends = [
    { id: 1, name: 'Sarah Johnson', online: true, color: 'bg-teal-300' },
    { id: 2, name: 'Mike Richards', online: true, color: 'bg-orange-300' },
    { id: 3, name: 'Alex Wong', online: false, color: 'bg-pink-100' },
    { id: 4, name: 'Jamie Smith', online: true, color: 'bg-teal-700' },
    { id: 5, name: 'Taylor Moore', online: false, color: 'bg-gray-200' },
  ];

  // Sample data for stories
  const stories = [
    { id: 1, name: 'Sarah', color: 'bg-orange-300' },
    { id: 2, name: 'Mike', color: 'bg-teal-300' },
    { id: 3, name: 'Alex', color: 'bg-teal-700' },
    { id: 4, name: 'Your Story', color: 'bg-pink-100', isYourStory: true },
  ];
  const oktoClient = useOkto();
    const userSWA = oktoClient.userSWA;

  return (
    
    <div className="bg-amber-50 min-h-screen flex justify-center">
      <div className="w-full border-2 border-gray-800 rounded-lg overflow-hidden">
        {/* Top navigation bar */}
        <div className="bg-red-400 p-4 flex items-center justify-between border-b-2 border-gray-800">
          <div className="text-white text-3xl font-bold">CyWorld</div>
          
          <div className="bg-white rounded-full w-full max-w-md mx-4 px-4 py-2 flex items-center">
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-transparent outline-none text-gray-700"
            />
          </div>
          
          <div className="flex space-x-2">
            <div>{userSWA}</div>
          </div>
        </div>
        
        <div className="flex">
          {/* Left sidebar - Friends */}
          <div className="w-72 border-r-2 border-gray-800 p-4">
            <h2 className="text-2xl mb-6 font-bold text-gray-800">Friends</h2>
            
            <div className="space-y-6">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center">
                  <div className={`w-12 h-12 ${friend.color} rounded-full mr-4 border-2 border-gray-800`}></div>
                  <span className="text-lg text-gray-800">{friend.name}</span>
                  {friend.online && (
                    <div className="w-4 h-4 bg-green-500 rounded-full ml-2"></div>
                  )}
                </div>
              ))}
            </div>
            
            <button className="mt-8 bg-red-400 text-white py-3 px-6 w-full rounded-full text-lg font-bold border-2 border-gray-700">
              Find Friends
            </button>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 p-4">
            {/* Stories section */}
            <div className="bg-white rounded-lg border-2 border-gray-800 p-4 mb-4">
              <div className="flex space-x-8 justify-center">
                {/* Your Story with plus sign */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 border-4 border-red-400 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-red-400 text-3xl font-bold">+</span>
                    </div>
                  </div>
                  <span className="mt-2 text-sm text-center">Your Story</span>
                </div>
                
                {stories.map(story => !story.isYourStory && (
                  <div key={story.id} className="flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-red-400 rounded-full flex items-center justify-center">
                      <div className={`w-16 h-16 ${story.color} rounded-full`}></div>
                    </div>
                    <span className="mt-2 text-sm text-center">{story.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Feed would go here */}
            <div className="overflow-y-auto max-h-[400px]">
                <OktoIntents />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroSocialApp;