import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Common/Navbar";
import { joinRoom } from "../services/api";
import { disconnectSocket } from "../services/socket";
import {
  clearAuthStorage,
  extractRoomId,
  getStoredUser,
  saveRecentRoom
} from "../utils/helpers";

const JoinRoom = () => {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  const handleJoin = async () => {
    const roomId = extractRoomId(roomInput);

    if (!roomId) {
      toast.error("Please enter a valid room ID or invite link.");
      return;
    }

    setLoading(true);

    try {
      const response = await joinRoom(roomId);
      const language = response?.language || "javascript";
      const roomName = response?.name || response?.roomName || `Room-${roomId.slice(0, 5)}`;

      saveRecentRoom({
        roomId,
        roomName,
        name: roomName,
        language
      });

      toast.success("Joined successfully 🚀");

      navigate(`/room/${roomId}`, { state: { language } });

    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to join this room."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111318] to-[#020617] text-white">
      
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto flex w-full max-w-xl flex-col justify-center px-4 py-12">

        {/* MAIN CARD */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 shadow-2xl">

          {/* HEADER */}
          <h2 className="text-3xl font-bold text-center">
            🔗 Join Room
          </h2>

          <p className="mt-2 text-center text-sm text-slate-400">
            Enter a room ID or paste an invite link
          </p>

          {/* TABS */}
          <div className="mt-6 flex rounded-xl bg-[#15171d] p-1">
            <button
              onClick={() => navigate("/create-room")}
              className="flex-1 rounded-lg py-2 text-sm text-slate-400 hover:text-white transition"
            >
              Create
            </button>

            <button className="flex-1 rounded-lg bg-[#252526] py-2 text-sm text-white">
              Join
            </button>
          </div>

          {/* INPUT */}
          <div className="mt-6">
            <label className="text-sm text-slate-300">
              Room ID or Invite Link
            </label>

            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="e.g. ABC123 or full link"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-4 py-3 text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          {/* BUTTONS */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 font-semibold hover:scale-[1.02] transition disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join Room"}
            </button>

            <button
              onClick={() => navigate("/home")}
              className="rounded-xl border border-white/10 bg-[#252526] py-3 hover:border-blue-400 transition"
            >
              Back
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default JoinRoom;