import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">

      <div className="w-[420px] border border-gray-800 rounded-xl p-8 shadow-lg">

        <h1 className="text-3xl font-semibold mb-2">
          Code Collaboration
        </h1>

        <p className="text-gray-400 mb-8">
          Create or join a coding session with your team.
        </p>

        {/* CREATE ROOM BUTTON */}
        <button
          onClick={() => navigate("/create-room")}
          className="w-full mb-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition"
        >
          Create Room
        </button>

        {/* JOIN ROOM BUTTON */}
        <button
          onClick={() => navigate("/join-room")}
          className="w-full py-3 rounded-lg border border-gray-700 hover:border-blue-500 transition"
        >
          Join Room
        </button>

      </div>

    </div>
  );
};

export default Home;