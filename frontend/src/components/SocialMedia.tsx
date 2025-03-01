import React, { useState, useEffect } from 'react';
import OktoIntents from './OktoIntents';
import { useOkto } from "@okto_web3/react-sdk";
import { useNavigate } from 'react-router-dom';
import RetroClock from './RetroClock';
import { useQuery } from '@apollo/client';
import { GET_ALL_PHOTO_ALBUMS } from '../query/photoalbums';
import PhotosList from './PhotosList';
import GetButton from './GetButton';
import { googleLogout } from "@react-oauth/google";
import Cookies from "universal-cookie";
import { supabase } from './supabaseClient';

interface Friend {
  id: number;
  name: string;
  profilePic: string;
}

const SocialMedia = () => {
  const { loading, error, data: photoalbums } = useQuery(GET_ALL_PHOTO_ALBUMS);
  const [username, setUsername] = useState('');
  const oktoClient = useOkto();
  const userSWA = oktoClient.userSWA;
  const navigate = useNavigate();
  const cookies = new Cookies();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('wallet_address', userSWA)
          .single();

        if (error) throw error;
        if (data) {
          setUsername(data.username);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [userSWA]);

  // Sample data for friends
  const friends = [
    { id: 1, username: "suyog", name: 'Suyog Joshi', online: true, color: 'bg-teal-300' },
    { id: 2, username: "joshua", name: 'Joshua Kim', online: true, color: 'bg-orange-300' },
    { id: 3, username: "alex", name: 'Alex Lu', online: false, color: 'bg-pink-100' },
    { id: 4, username: "eric", name: 'Eric Liu', online: true, color: 'bg-teal-700' },
  ];

  // Sample data for stories
  const stories = [
    { id: 1, name: 'Eric', color: 'bg-orange-300' },
    { id: 2, name: 'Alex', color: 'bg-teal-300' },
    { id: 3, name: 'Suyog', color: 'bg-teal-700' },
    { id: 4, name: 'Joshua', color: 'bg-pink-100'},
  ];

  const handleFriendClick = (friend: Friend) => {
    window?.open?.(`http://localhost:9999/u/${friend.username}`, '_blank').focus();
    // navigate(`http://localhost:9999/`, {
    //    
    // });
  };
  const [query, setQuery] = useState("");

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(query.toLowerCase()));

  // Add state for modal
  const [selectedStory, setSelectedStory] = useState<{ name: string; color: string } | null>(null);

  // Add logout handler
  async function handleLogout() {
    try {
      cookies.remove('auth_session');
      googleLogout();
      localStorage.removeItem("googleIdToken");
      oktoClient.sessionClear();
      navigate("/");
      return { result: "logout success" };
    } catch (error) {
      console.error("Logout failed:", error);
      return { result: "logout failed" };
    }
  }

  return (
    
    <div className="bg-amber-50 min-h-screen flex justify-center bg-cyspace-pink">
      {/* Modal */}
      {selectedStory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedStory(null)}
        >
          <div className="w-80 h-96 rounded-2xl overflow-hidden flex flex-col">
            <div className={`flex-1 ${selectedStory.color}`}></div>
            <div className="bg-white p-4 text-center font-semibold">{selectedStory.name}</div>
          </div>
        </div>
      )}

      <div className="w-full border-2 border-gray-800 rounded-lg overflow-hidden">
        {/* Top navigation bar */}
        <div className="bg-cyspace-blue p-4 flex items-center justify-between border-b-2 border-gray-800">
          <div className="text-white text-3xl font-bold">CySpace</div>
          
          <div className="bg-white rounded-full w-full max-w-md mx-4 px-4 py-2 flex items-center relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-700"
            />
            {query && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-800 rounded-lg shadow-lg z-10">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => (
                    <div
                      key={friend.id}
                      onClick={() => {
                        handleFriendClick(friend);
                        setQuery('');
                      }}
                      className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <div className={`w-8 h-8 ${friend.color} rounded-full mr-3 border-2 border-gray-800`}></div>
                      <span>{friend.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500">No matching friends found</div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <div>{userSWA?.slice(0, 6)}...{userSWA?.slice(-6)}</div>
          </div>
        </div>
        
        <div className="flex h-full">
          {/* Left sidebar - Friends */}
          <div className="w-80 border-r-2 border-gray-800 p-4">
            <h2 className="text-2xl mb-6 font-bold text-gray-800">Friends</h2>
            
            <div className="space-y-6">
              {friends.map(friend => (
                <div key={friend.id} onClick={() => handleFriendClick(friend)} className="flex items-center justify-between hover:scale-105 cursor-pointer hover:bg-sky-200">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${friend.color} rounded-full mr-4 border-2 border-gray-800`}></div>
                    <span className="text-lg text-gray-800">{friend.name}</span>
                  </div>
                  {friend.online && (
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* <button className="mt-8 bg-red-400 text-white py-3 px-6 w-full rounded-full text-lg font-bold border-2 border-gray-700">
              Find Friends
            </button> */}
          </div>
          
          {/* Main content area */}
          <div className="flex-1 p-4">
            {/* Stories section */}
            
            

            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className='flex flex-col flex-1'>
                
                <div className="bg-[#E0CCFF] rounded-lg border-2 border-gray-800 p-4 mb-4">
                  <div className="flex space-x-16 justify-center">
                    {/* Your Story with plus sign */}
                    {/* <div className="flex flex-col items-center">
                      <div className="relative w-20 h-20 border-4 border-red-400 rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-red-400 text-3xl font-bold">+</span>
                        </div>
                      </div>
                      <span className="mt-2 text-center">Your Story</span>
                    </div> */}
                    
                    {stories.map(story => !story.isYourStory && (
                      <div 
                        key={story.id} 
                        className="flex flex-col items-center"
                        onClick={() => setSelectedStory(story)}
                      >
                        <div className="w-20 h-20 border-4 border-red-400 rounded-full flex items-center justify-center">
                          <div className={`w-16 h-16 ${story.color} rounded-full`}></div>
                        </div>
                        <span className="mt-2 text-center">{story.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {photoalbums?.photoAlbums && <PhotosList photoalbums={photoalbums.photoAlbums} />}
              </div>
              <div className="lg:w-[500px] overflow-y-auto max-h-[700px]">
                  <div><RetroClock /></div>
                  <button 
                    onClick={() => navigate('/post/album')}
                    className="w-full bg-cyspace-blue text-white py-3 px-6 rounded-lg text-lg font-bold border-2 border-gray-800 hover:bg-blue-700 transition-colors duration-200 mt-10"
                  >
                    Post Picture
                  </button>
                  <button 
                    onClick={() => navigate('/post/diaryentry')}
                    className="w-full bg-cyspace-blue text-white py-3 px-6 rounded-lg text-lg font-bold border-2 border-gray-800 hover:bg-blue-700 transition-colors duration-200 mt-5"
                  >
                    Post Diary
                  </button>
                  <button 
                    onClick={() => window?.open?.(`http://localhost:9999/u/${username}`, '_blank').focus()}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg text-lg font-bold border-2 border-gray-800 hover:bg-blue-700 transition-colors duration-200 mt-5"
                  >
                    Enter My Homespace
                  </button>
                  <GetButton 
                    title="Log out" 
                    apiFn={handleLogout} 
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;