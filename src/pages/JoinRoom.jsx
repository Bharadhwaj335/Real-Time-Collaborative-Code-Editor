import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoom = () => {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState("");

  const handleJoin = () => {
    if (!roomInput.trim()) {
      alert("Please enter a room ID or invite link");
      return;
    }

    // extract room id if full link pasted
    const roomId = roomInput.includes("/")
      ? roomInput.split("/").pop()
      : roomInput;

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">

      <div className="w-[420px] border border-gray-800 rounded-xl p-6">

        {/* HEADER */}
        <h2 className="text-2xl font-semibold mb-1">
          Start a session
        </h2>

        <p className="text-gray-400 mb-6 text-sm">
          Create a new room or join an existing one.
        </p>

        {/* TABS */}
        <div className="flex bg-[#0f172a] rounded-lg p-1 mb-6">

          <button
            onClick={() => navigate("/create-room")}
            className="flex-1 py-2 text-gray-400"
          >
            Create room
          </button>

          <button className="flex-1 py-2 bg-[#1e293b] rounded-md">
            Join room
          </button>

        </div>

        {/* INPUT */}
        <label className="text-xs text-gray-400">
          ROOM ID OR INVITE LINK
        </label>

        <input
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="e.g. XK9-42F or https://codesync.app/room/..."
          className="w-full mt-2 mb-4 p-3 bg-[#020617] border border-gray-700 rounded-md"
        />

        {/* JOIN BUTTON */}
        <button
          onClick={handleJoin}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-700 hover:opacity-90 transition"
        >
          Join room →
        </button>

      </div>

    </div>
  );
};

export default JoinRoom;