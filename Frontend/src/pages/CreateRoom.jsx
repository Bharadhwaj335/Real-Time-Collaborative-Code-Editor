import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory, FaRocket } from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { createRoom, joinRoom } from "../services/api";
import { disconnectSocket } from "../services/socket";
import { getErrorMessage } from "../utils/errorUtils";
import {
  clearAuthStorage,
  getRecentRooms,
  getStoredUser,
  saveRecentRoom
} from "../utils/helpers";

const CreateRoom = () => {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [loading, setLoading] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  const user = getStoredUser();

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  const handleCreateRoom = async () => {
    if (maxParticipants < 2) {
      return toast.error("Participants must be at least 2.");
    }

    setLoading(true);

    try {
      const trimmedRoomName = roomName.trim();
      const response = await createRoom({
        name: trimmedRoomName,
        roomName: trimmedRoomName,
        maxParticipants
      });

      const roomId = response?.roomId || response?.data?.roomId;
      const roomData = response?.data || {};
      const resolvedLanguage = roomData?.language || "javascript";
      const resolvedRoomName =
        roomData?.name || roomData?.roomName || trimmedRoomName || `Room-${roomId?.slice(0, 5) || "new"}`;

      if (!roomId) {
        throw new Error("Room id missing from response");
      }

      saveRecentRoom({
        roomId,
        roomName: resolvedRoomName,
        name: resolvedRoomName,
        language: resolvedLanguage
      });

      toast.success("Room created.");
      navigate(`/room/${roomId}`, { state: { language: resolvedLanguage } });

    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const openRecentRoom = async (roomId) => {
    try {
      await joinRoom(roomId);
      navigate(`/room/${roomId}`);
    } catch {
      toast.error("This room is no longer available.");
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  return (
    <div className="cc-page-shell">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <div className="cc-workbench cc-card-elevated rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#007acc]/20 text-[#cfe9ff]">
              <FaRocket className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Start a session</h2>
              <p className="mt-1 text-sm text-slate-400">Configure your coding room and create a shareable space.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <label className="text-sm">
              <span className="mb-2 block font-medium text-slate-300">Room name</span>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="DSA practice group"
                className="cc-input w-full rounded-xl px-3.5 py-3 text-white transition placeholder:text-slate-600"
              />
            </label>

            <label className="text-sm">
              <span className="mb-2 block font-medium text-slate-300">Max participants ({maxParticipants})</span>
              <input
                type="number"
                min="2"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="cc-input w-full rounded-xl px-3.5 py-3 text-white transition"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleCreateRoom} loading={loading} className="rounded-xl py-3">
                Create room
              </Button>

              <Button variant="secondary" onClick={() => navigate("/home")} className="rounded-xl py-3">
                Back
              </Button>
            </div>
          </div>

          {recentRooms.length > 0 && (
            <div className="mt-10 border-t border-[#2a2a2a] pt-8">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <FaHistory className="text-[#4ec9b0]" aria-hidden />
                Last visited rooms
              </h3>

              <div className="mt-4 space-y-2.5">
                {recentRooms.map((room) => (
                  <button
                    key={room.roomId}
                    type="button"
                    onClick={() => openRecentRoom(room.roomId)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#3c3c3c] bg-[#252526] px-4 py-3 text-left transition hover:border-[#007acc]/70 hover:bg-[#2d2d2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007acc]/45"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#cfe9ff]">{room.roomName || "Untitled Room"}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">ID · {room.roomId}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[#2aa1ff]">Rejoin →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;