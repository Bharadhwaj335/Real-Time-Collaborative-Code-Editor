import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
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
      toast.error("Please enter a room ID or invite link.");
      return;
    }

    setLoading(true);

    try {
      const response = await joinRoom(roomId);
      const language = response?.language || "javascript";
      saveRecentRoom({ roomId, language });
      navigate(`/room/${roomId}`, { state: { language } });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to join this room.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-xl sm:p-8">
        <h2 className="text-2xl font-semibold">Join a room</h2>

        <p className="mt-2 text-sm text-slate-400">
          Paste a room id or full invite link to enter the collaborative editor.
        </p>

        <div className="mt-6 flex rounded-lg bg-[#15171d] p-1">
          <button
            onClick={() => navigate("/create-room")}
            className="flex-1 rounded-md px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200"
          >
            Create room
          </button>

          <button className="flex-1 rounded-md bg-[#252526] px-3 py-2 text-sm text-white">
            Join room
          </button>
        </div>

        <label className="mt-6 block text-sm">
          <span className="mb-2 block text-slate-300">Room ID or invite link</span>
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="e.g. ABC123 or http://localhost:5173/room/ABC123"
            className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
          />
        </label>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button onClick={handleJoin} loading={loading}>
            Join Room
          </Button>
          <Button variant="secondary" onClick={() => navigate("/home")}>Back</Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;