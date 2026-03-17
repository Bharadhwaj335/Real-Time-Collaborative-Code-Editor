import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { createRoom, joinRoom } from "../services/api";
import { disconnectSocket } from "../services/socket";
import { DEFAULT_LANGUAGE, LANGUAGES } from "../utils/constants";
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
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [loading, setLoading] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  const user = getStoredUser();

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  const handleCreateRoom = async () => {
    if (maxParticipants < 1) {
      return toast.error("Participants must be at least 1");
    }

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

      saveRecentRoom({
        roomId,
        roomName: roomName || `Room-${roomId.slice(0, 5)}`,
        language
      });

      toast.success("Room created 🚀");
      navigate(`/room/${roomId}`, { state: { language } });

    } catch (error) {
      toast.error(error?.message || "Failed to create room.");
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111318] to-[#020617] text-white">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-[#1e1e1e]/80 backdrop-blur-md p-6 shadow-2xl sm:p-8 transition hover:shadow-blue-500/10">

          <h2 className="text-2xl font-semibold tracking-wide">
            🚀 Start a session
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Configure your coding room and create a shareable space.
          </p>

          <div className="mt-8 grid gap-5">

            {/* ROOM NAME */}
            <label className="text-sm">
              <span className="mb-2 block text-slate-300">Room Name</span>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="DSA Practice Group"
                className="w-full rounded-lg border border-white/10 bg-[#252526] px-3 py-2.5 text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              />
            </label>

            {/* LANGUAGE */}
            <label className="text-sm">
              <span className="mb-2 block text-slate-300">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#252526] px-3 py-2.5 text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {/* PARTICIPANTS */}
            <label className="text-sm">
              <span className="mb-2 block text-slate-300">
                Participants ({maxParticipants})
              </span>
              <input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#252526] px-3 py-2.5 text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              />
            </label>

            {/* VISIBILITY */}
            <div>
              <p className="mb-2 text-sm text-slate-300">Visibility</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setVisibility("private")}
                  className={`rounded-lg px-4 py-2.5 text-sm transition ${
                    visibility === "private"
                      ? "border border-blue-400 bg-blue-500/10 text-blue-300 shadow-sm"
                      : "border border-white/10 bg-[#252526] text-slate-300 hover:border-blue-400/50"
                  }`}
                >
                  🔒 Private
                </button>

                <button
                  onClick={() => setVisibility("public")}
                  className={`rounded-lg px-4 py-2.5 text-sm transition ${
                    visibility === "public"
                      ? "border border-blue-400 bg-blue-500/10 text-blue-300 shadow-sm"
                      : "border border-white/10 bg-[#252526] text-slate-300 hover:border-blue-400/50"
                  }`}
                >
                  🌍 Public
                </button>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleCreateRoom} loading={loading}>
                Create Room
              </Button>

              <Button variant="secondary" onClick={() => navigate("/home")}>
                Back
              </Button>
            </div>

          </div>

          {/* RECENT ROOMS */}
          {recentRooms.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-slate-300">
                🔁 Last visited rooms
              </h3>

              <div className="mt-3 space-y-3">
                {recentRooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => openRecentRoom(room.roomId)}
                    className="flex w-full justify-between rounded-lg border border-white/10 bg-[#252526] p-3 transition hover:border-blue-400/60 hover:bg-[#2a2b2e]"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-blue-400">
                        {room.roomName || "Untitled Room"}
                      </p>
                      <p className="text-xs text-slate-400">
                        ID: {room.roomId}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Rejoin →
                    </span>
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