import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { createRoom, joinRoom } from "../services/api";
import { disconnectSocket } from "../services/socket";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_MAX_PARTICIPANTS,
  LANGUAGES,
  MAX_ROOM_PARTICIPANTS,
  MIN_ROOM_PARTICIPANTS
} from "../utils/constants";
import {
  clearAuthStorage,
  getRecentRooms,
  getStoredUser,
  saveRecentRoom
} from "../utils/helpers";

const CreateRoom = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [visibility, setVisibility] = useState("private");
  const [maxParticipants, setMaxParticipants] = useState(DEFAULT_MAX_PARTICIPANTS);
  const [loading, setLoading] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);
  const user = getStoredUser();

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);

    try {
      const response = await createRoom({
        roomName,
        language,
        visibility,
        maxParticipants
      });

      const roomId = response?.roomId || response?.data?.roomId;

      if (!roomId) {
        throw new Error("Room id missing from response");
      }

      saveRecentRoom({ roomId, language });
      toast.success("Room created. Invite your classmates now.");
      navigate(`/room/${roomId}`, { state: { language } });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create room.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const openRecentRoom = async (roomId) => {
    try {
      await joinRoom(roomId);
      navigate(`/room/${roomId}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "This room is no longer available.";
      toast.error(message);
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-xl sm:p-8">
        <h2 className="text-2xl font-semibold">Start a session</h2>

        <p className="mt-2 text-sm text-slate-400">
          Configure your coding room and create a shareable space.
        </p>

        <div className="mt-8 grid gap-5">
          <label className="text-sm">
            <span className="mb-2 block text-slate-300">Room Name (optional)</span>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="DSA Practice Group"
              className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
            />
          </label>

          <label className="text-sm">
            <span className="mb-2 block text-slate-300">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
            >
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-2 text-sm text-slate-300">Visibility</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setVisibility("private")}
                className={`rounded-lg border px-4 py-2.5 text-sm transition ${
                  visibility === "private"
                    ? "border-blue-400 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-[#252526] text-slate-300"
                }`}
              >
                Private
              </button>

              <button
                onClick={() => setVisibility("public")}
                className={`rounded-lg border px-4 py-2.5 text-sm transition ${
                  visibility === "public"
                    ? "border-blue-400 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-[#252526] text-slate-300"
                }`}
              >
                Public
              </button>
            </div>
          </div>

          <label className="text-sm">
            <span className="mb-2 block text-slate-300">Max participants</span>
            <input
              type="number"
              min={MIN_ROOM_PARTICIPANTS}
              max={MAX_ROOM_PARTICIPANTS}
              value={maxParticipants}
              onChange={(e) => {
                const value = Number(e.target.value);

                if (!Number.isFinite(value)) {
                  setMaxParticipants(DEFAULT_MAX_PARTICIPANTS);
                  return;
                }

                const clamped = Math.min(
                  MAX_ROOM_PARTICIPANTS,
                  Math.max(MIN_ROOM_PARTICIPANTS, value)
                );

                setMaxParticipants(clamped);
              }}
              className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={handleCreateRoom} loading={loading}>
              Create Room
            </Button>

            <Button variant="secondary" onClick={() => navigate("/home")}>Back</Button>
          </div>
        </div>

        {recentRooms.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-slate-300">Last visited rooms</h3>

            <div className="mt-3 space-y-3">
              {recentRooms.map((room) => (
                <button
                  key={room.roomId}
                  onClick={() => openRecentRoom(room.roomId)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#252526] p-3 transition hover:border-blue-400/60"
                >
                  <div className="text-left">
                    <p className="font-semibold uppercase tracking-wide">{room.roomId}</p>
                    <p className="text-xs text-slate-400">{room.language}</p>
                  </div>
                  <span className="text-xs text-slate-500">Rejoin</span>
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