import { useNavigate } from "react-router-dom";

function CreateNft() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <button
        onClick={() => navigate("/home")}
        className="w-fit py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black mb-8"
      >
        Home
      </button>
      <h1 className="text-black font-bold text-3xl mb-8">Create NFT</h1>
      <div className="flex flex-col gap-2 w-full">
        <div>CreateNft</div>
      </div>
    </main>
  );
}

export default CreateNft;
