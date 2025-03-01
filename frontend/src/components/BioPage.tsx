import { useOkto } from "@okto_web3/react-sdk";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function BioPage() {
    const oktoClient = useOkto();
    const userSWA = oktoClient.userSWA;
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Create user data object
        const userData = {
            username,
            bio,
            wallet_address: userSWA,
            created_at: new Date().toISOString()
        };

        try {
            // Insert data into Supabase
            const { data, error } = await supabase
                .from('users')  // Replace with your table name
                .insert([userData])
                .select();

            if (error) throw error;

            // Still keep in localStorage for quick access
            localStorage.setItem('cyworld_user_data', JSON.stringify(userData));

            // Navigate to home page
            navigate(`/home`);
        } catch (err) {
            console.error('Error saving to Supabase:', err);
            setError('Failed to save user data');
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-cyworld-pink">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 cyworld-notebook">
                {/* Top Navigation Bar */}
                <div className="flex justify-between items-center mb-3 px-2 py-1 bg-gray-100 rounded-t-md border-b border-gray-300">
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                        <span>TODAY</span>
                        <span className="mx-1 text-yellow-500">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Left Column - Profile Area */}
                    <div className="border-r border-gray-200 pr-4 md:col-span-1">
                        <div className="bg-white p-2 rounded mb-3 border border-gray-200">
                            <h2 className="text-center text-blue-500 mb-2 border-b border-gray-200 pb-1 text-lg">TODAY is...</h2>
                            <div className="pixel-avatar bg-gray-100 h-24 w-24 mx-auto mb-2 relative overflow-hidden">
                                <div className="pixel-character"></div>
                            </div>
                            <p className="text-center text-xs text-gray-700">
                                {username || "Set your username"}
                            </p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <h3 className="text-xs text-center mb-1">STATUS</h3>
                            <div className="flex justify-center space-x-1 text-xs">
                                <span className="bg-green-100 px-1 rounded-sm">💖 0</span>
                                <span className="bg-blue-100 px-1 rounded-sm">🌟 0</span>
                                <span className="bg-yellow-100 px-1 rounded-sm">🔔 0</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle & Right Columns - Main Content */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded border border-gray-200 p-5 mb-4">
                            <h1 className="text-2xl font-bold text-center text-blue-600 mb-4 border-b border-gray-200 pb-2">
                                Create Your Profile
                            </h1>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bio" className="block mb-2 text-sm font-medium text-gray-700">Bio</label>
                                    <textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Write a short bio about yourself..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full border-2 border-b-4 border-r-4 border-yellow-600 transition duration-200 text-sm"
                                >
                                    Enter Cyworld
                                </button>
                            </form>

                            <p className="mt-4 text-xs text-gray-500 text-center">Connected wallet: {userSWA}</p>
                        </div>

                        {/* Footer Section */}
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Made with love by Alex, Suyog, Josh, Eric</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
