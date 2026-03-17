import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { createRoom, joinRoom } from "../services/api";
import { disconnectSocket } from "../services/socket";
import { DEFAULT_LANGUAGE, LANGUAGES } from "../utils/constants";
import {
  clearAuthStorage,
  extractRoomId,
  getRecentRooms,
  getStoredUser,
  saveRecentRoom
} from "../utils/helpers";

const Home = () => {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [loadingAction, setLoadingAction] = useState("");
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  const user = useMemo(() => getStoredUser(), []);

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  const handleCreateRoom = async () => {
    setLoadingAction("create");

    try {
      const response = await createRoom({ language });
      const roomId = response?.roomId || response?.data?.roomId;

      if (!roomId) {
        throw new Error("Room id missing in create room response");
      }

      saveRecentRoom({ roomId, language });
      toast.success("Room created successfully.");
      navigate(`/room/${roomId}`, { state: { language } });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to create room right now.";
      toast.error(message);
    } finally {
      setLoadingAction("");
    }
  };

  const handleJoinRoom = async (value) => {
    const resolvedRoom = extractRoomId(value || roomInput);

    if (!resolvedRoom) {
      toast.error("Enter a room id or invite link first.");
      return;
    }

    setLoadingAction("join");

    try {
      const response = await joinRoom(resolvedRoom);
      const roomLanguage = response?.language || language;
      saveRecentRoom({ roomId: resolvedRoom, language: roomLanguage });
      navigate(`/room/${resolvedRoom}`, { state: { language: roomLanguage } });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Room not found or unavailable.";
      toast.error(message);
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.26em] text-blue-300">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold">Welcome, {user?.name || "Student"}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Create a new room for your team, or join an existing session with
            a room id.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-2 block text-slate-300">Preferred language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-slate-300">Room ID / Invite link</span>
              <input
                value={roomInput}
                onChange={(event) => setRoomInput(event.target.value)}
                placeholder="e.g. ABC123 or full invite link"
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button onClick={handleCreateRoom} loading={loadingAction === "create"}>
              Create Room
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleJoinRoom()}
              loading={loadingAction === "join"}
            >
              Join Room
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => navigate("/create-room")}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/5"
            >
              Open full create page
            </button>
            <button
              onClick={() => navigate("/join-room")}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/5"
            >
              Open full join page
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-[#1b1d24] p-6">
          <h2 className="text-lg font-semibold">Recent rooms</h2>
          <p className="mt-1 text-xs text-slate-400">Quickly jump back into active sessions.</p>

          <div className="mt-4 space-y-3">
            {recentRooms.length === 0 && (
              <p className="rounded-lg border border-white/10 bg-[#252526] p-3 text-sm text-slate-400">
                No recent rooms yet.
              </p>
            )}

            {recentRooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => handleJoinRoom(room.roomId)}
                className="w-full rounded-lg border border-white/10 bg-[#252526] p-3 text-left transition hover:border-blue-400/60"
              >
                <p className="font-semibold uppercase tracking-wide">{room.roomId}</p>
                <p className="text-xs text-slate-400">{room.language}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;