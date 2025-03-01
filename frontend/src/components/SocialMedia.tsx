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
import { GET_ALL_DIARY_ENTRY } from '../query/diary';
import { getWalletOrUsername } from '../helper';

interface Friend {
  id: number;
  name: string;
  profilePic: string;
}

const SocialMedia = () => {
  const { loading, error, data: photoalbums } = useQuery(GET_ALL_PHOTO_ALBUMS);
  const { loading: diaryLoading, error: diaryError, data: diaryEntries } = useQuery(GET_ALL_DIARY_ENTRY);

  const [username, setUsername] = useState('');
  const oktoClient = useOkto();
  const userSWA = oktoClient.userSWA;
  const navigate = useNavigate();
  const cookies = new Cookies();

  console.log(diaryEntries);

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
    { id: 4, name: 'Joshua', color: 'bg-pink-100' },
  ];

  const handleFriendClick = (friend: Friend) => {
    window?.open?.(`http://localhost:9999/u/${friend.username}`, '_blank').focus();
  };

  const [query, setQuery] = useState("");

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(query.toLowerCase()));

  // State for modal
  const [selectedStory, setSelectedStory] = useState<{ name: string; color: string } | null>(null);

  // Logout handler
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

  // State for tab navigation: "posts" or "diary"
  const [activeTab, setActiveTab] = useState("posts");

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
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4">
            {/* Stories section */}
            <div className="bg-[#E0CCFF] rounded-lg border-2 border-gray-800 p-4 mb-4">
              <div className="flex space-x-16 justify-center">
                {stories.map(story => (
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

            {/* Tab Navigation */}
            <div className="mb-4">
              <div className="flex border-b-2 border-gray-800 mb-4">
                <button
                  className={`px-4 py-2 font-bold ${activeTab === "posts" ? "border-b-2 border-cyspace-blue text-cyspace-blue" : "text-gray-600"}`}
                  onClick={() => setActiveTab("posts")}
                >
                  Posts
                </button>
                <button
                  className={`px-4 py-2 font-bold ${activeTab === "diary" ? "border-b-2 border-cyspace-blue text-cyspace-blue" : "text-gray-600"}`}
                  onClick={() => setActiveTab("diary")}
                >
                  Diary Entries
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "posts" && (
                <div>
                  {photoalbums?.photoAlbums ? (
                    <PhotosList photoalbums={photoalbums.photoAlbums} />
                  ) : (
                    <div>No posts available.</div>
                  )}
                </div>
              )}

              {activeTab === "diary" && (
                <div className="space-y-4">
                  {diaryLoading && <div>Loading diary entries...</div>}
                  {diaryError && <div>Error loading diary entries.</div>}
                  {diaryEntries && diaryEntries.diaryEntries && diaryEntries.diaryEntries.map(entry => (
                    <div key={entry.id} className="p-4 border border-gray-300 rounded-lg bg-yellow-50">
                      <div className="text-gray-500 text-xs flex justify-between">
                        <span>{new Date(parseInt(entry.timestamp) * 1000).toLocaleString()}</span>
                        <span>{entry.author.slice(0, 6)}...{entry.author.slice(-6)}</span>
                      </div>
                      <div className="mt-2 text-lg font-serif" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '12px', lineHeight: '1.6' }}>
                        {entry.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:w-[500px] overflow-y-auto max-h-[700px] p-4">
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
  );
};

export default SocialMedia;
