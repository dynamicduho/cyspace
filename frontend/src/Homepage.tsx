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
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import GetButton from "./components/GetButton";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OktoIntents from "./components/OktoIntents";
import SocialMedia from "./components/SocialMedia";

export default function Homepage() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const isloggedIn = oktoClient.isLoggedIn();
  const userSWA = oktoClient.userSWA;


interface Friend {
  id: number;
  name: string;
  profilePic: string;
}

const friends: Friend[] = Array.from({ length: 10 }).map((_, index) => ({
  id: index,
  name: `Friend ${index + 1}`,
  profilePic: `https://loremflickr.com/200/200?random=${index}`,
}));

const Dashboard = () => {
  return (
    <div>
        <SocialMedia />
        {/* <FriendList friends={friends} />
        <MainContent /> */}
    </div>
  );
};

const handleFriendClick = (friend: Friend) => {
  navigate(`/profile/${friend.id}`);
};

const FriendList = ({ friends }: { friends: Friend[] }) => {
  return (
    <div className="w-[250px] h-[800px] rounded-2xl shadow-lg p-5">
      <h2 className="text-lg font-semibold pb-5">Friends</h2>
      <div className="w-full h-[700px] border-2 border-solid rounded-xl overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {friends.map((friend) => (
          <div key={friend.id} onClick={() => handleFriendClick(friend)} className="w-full h-[100px] rounded-lg shadow-md p-4 flex items-center space-x-4 transition-all duration-300 hover:scale-105 cursor-pointer hover:bg-sky-200">
            <img src={friend.profilePic} alt={friend.name} className="w-20 h-20 rounded-full object-cover" />
            <h2 className="text-lg font-semibold">{friend.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

const MainContent = () => {
  return (
    <div className="w-[700px] h-[900px] bg-gray-100 rounded-2xl shadow-lg flex flex-col justify-between items-center p-10">
      <ScrollableBox />
      <Feed />
    </div>
  );
};

const ScrollableBox = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const scrollAmount = 80 * 5; // Move by 5 items

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-[650px] h-[100px] flex items-center" onMouseEnter={() => setShowArrows(true)} onMouseLeave={() => setShowArrows(false)}>
      {showArrows && (
        <button className="absolute left-0 z-10 p-2 bg-gray-300 rounded-full shadow-md hover:bg-gray-400 transition-opacity duration-300" onClick={() => scroll("left")}>
          <ChevronLeft size={24} />
        </button>
      )}
      <div ref={scrollRef} className="w-full h-full overflow-hidden border-2 border-solid rounded-xl flex items-center space-x-3 px-2 scroll-smooth" style={{ overflowX: "scroll", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className="w-20 h-20 bg-sky-200 rounded-full flex-shrink-0 hover:cursor-pointer">
            <img src={`https://loremflickr.com/200/200?random=${index}`} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          </div>
        ))}
      </div>
      {showArrows && (
        <button className="absolute right-0 z-10 p-2 bg-gray-300 rounded-full shadow-md hover:bg-gray-400 transition-opacity duration-300" onClick={() => scroll("right")}>
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};

const Feed = () => {
  return (
    <div className="w-[650px] h-[700px] border-2 border-solid rounded-xl overflow-y-auto p-4 space-y-4 scrollbar-hide">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="w-full h-[100px] bg-sky-100 rounded-lg shadow-md p-4 flex items-center space-x-4 transition-all duration-300 hover:scale-105 cursor-pointer hover:bg-sky-200">
          <img src={`https://loremflickr.com/200/200?random=${index}`} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          <div>
            <h2 className="text-lg font-semibold">Post {index + 1}</h2>
            <p className="text-sm text-gray-600 mt-2">This is the content of post {index + 1}.</p>
          </div>
        </div>
      ))}
    </div>
  );
};



  return (
      <Dashboard />
  );
}
