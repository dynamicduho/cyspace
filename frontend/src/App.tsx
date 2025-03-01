import { useOkto } from "@okto_web3/react-sdk";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./Homepage";
import LoginPage from "./LoginPage";
import CreateNft from "./pages/CreateNft";
import RawTransaction from "./pages/RawTransaction";
import TransferNFT from "./pages/TransferNFT";
import TransferTokens from "./pages/TransferTokens";
import ProfilePage from "./components/ProfilePage";
import PostAlbum from "./pages/PostAlbum";
import BioPage from "./components/BioPage";
function App() {
  const oktoClient = useOkto();

  //check if user is already logged in
  const isloggedIn = oktoClient.isLoggedIn();
  console.log(isloggedIn);
  console.log(oktoClient);

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/bio" element={<BioPage />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/u/:username" element={<ProfilePage />} />

        <Route path="/transfertoken" element={<TransferTokens />} />
        <Route path="/transfernft" element={<TransferNFT />} />
        <Route path="/createnftcollection" element={<CreateNft />} />
        <Route path="/post/album" element={<PostAlbum />} />
        <Route path="/post/diaryentry" element={<></>} />
        <Route path="/rawtransaction" element={<RawTransaction />} />
      </Routes>
    </>
  );
}

export default App;
