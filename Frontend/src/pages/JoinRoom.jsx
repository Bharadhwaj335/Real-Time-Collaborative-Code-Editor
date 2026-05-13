import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLink } from "react-icons/fa";
import toast from "react-hot-toast";
import Navbar from "../components/Common/Navbar";
import Button from "../components/Common/Button";
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
    <div className="cc-page-shell">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto flex w-full max-w-xl flex-col justify-center px-4 py-10 sm:py-14">
        <div className="cc-workbench cc-card-elevated rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007acc]/20 text-[#cfe9ff]">
              <FaLink className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Join a room</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-400">Enter a room ID or paste an invite link from your instructor or teammate.</p>
          </div>

          <div className="mt-8 flex rounded-xl border border-[#2a2a2a] bg-[#1e1e1e]/80 p-1">
            <button
              type="button"
              onClick={() => navigate("/create-room")}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007acc]/40"
            >
              Create
            </button>
            <span className="flex-1 rounded-lg bg-[#007acc] py-2.5 text-center text-sm font-semibold text-white shadow-inner">
              Join
            </span>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-300">Room ID or invite link</label>
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="e.g. ABC123 or full URL"
              className="cc-input mt-2 w-full rounded-xl px-4 py-3.5 text-white transition placeholder:text-slate-600"
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={handleJoin} loading={loading} className="rounded-xl py-3">
              Join room
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/home")} className="rounded-xl py-3">
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;