import { useOkto } from "@okto_web3/react-sdk";

import { useParams } from 'react-router-dom';

export default function ProfilePage() {
    const oktoClient = useOkto();
    const userSWA = oktoClient.userSWA;
  const { username } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl">Welcome to {username}'s profile, visiting from {userSWA}</h1>
    </div>
  );
}