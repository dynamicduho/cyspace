import { useEffect, useState } from "react";
import { supabase } from './supabaseClient';
import { useOkto } from "@okto_web3/react-sdk";

const RetroClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [username, setUsername] = useState('');
  const oktoClient = useOkto();
  const userSWA = oktoClient.userSWA;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

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

    return () => clearInterval(interval);
  }, [userSWA]);

  // Time calculations
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secondDeg = seconds * 6; // 360deg / 60s
  const minuteDeg = minutes * 6 + seconds * 0.1; // 360deg / 60min
  const hourDeg = hours * 30 + minutes * 0.5; // 360deg / 12h

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome {username || 'Guest'}</h1>
      <div className="relative w-64 h-64 bg-[#99ccff] border-8 border-[#6699cc] rounded-full shadow-2xl flex items-center justify-center">
        {/* Clock Center Dot */}
        <div className="absolute w-4 h-4 bg-red-500 rounded-full z-20"></div>

        {/* Hour Hand (Shorter and Thicker) */}
        <div
          className="absolute w-2 h-16 bg-white origin-bottom"
          style={{
            transform: `rotate(${hourDeg}deg)`,
            bottom: "50%",
          }}
        ></div>

        {/* Minute Hand (Longer and Medium Width) */}
        <div
          className="absolute w-1.5 h-24 bg-gray-500 origin-bottom"
          style={{
            transform: `rotate(${minuteDeg}deg)`,
            bottom: "50%",
          }}
        ></div>

        {/* Second Hand (Longest and Thinnest) */}
        <div
          className="absolute w-1 h-28 bg-red-500 origin-bottom"
          style={{
            transform: `rotate(${secondDeg}deg)`,
            bottom: "50%",
          }}
        ></div>

        {/* Clock Face Numbers (Updated with Press Start 2P font) */}
        {[...Array(12)].map((_, i) => {
          const angle = (i + 1) * 30;
          const radius = 90;
          const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
          const y = radius * Math.sin((angle - 90) * (Math.PI / 180));

          return (
            <div
              key={i}
              className="absolute text-white text-m font-['Press_Start_2P']"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RetroClock;
