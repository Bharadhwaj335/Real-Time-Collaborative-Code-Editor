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

      if (response?.isJoinable === false) {
        toast.error(
          response?.maxParticipants
            ? `Room is full (${response.currentParticipants}/${response.maxParticipants}).`
            : "Room is full."
        );
        return;
      }

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
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_10px_40px_rgba(2,8,23,0.45)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.26em] text-blue-300">Quick Start</p>
          <h1 className="mt-3 text-3xl font-bold">Collaborate in real time</h1>
          <p className="mt-2 text-sm text-slate-300">
            Choose a language, create a room instantly, or join a room using its ID.
          </p>

          <div className="mt-8 grid gap-5">
            <label className="text-sm">
              <span className="mb-2 block text-slate-300">Language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-xl border border-[#334155] bg-[#0f172a] px-3 py-2.5 text-white outline-none transition focus:border-[#3b82f6]"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={roomInput}
                onChange={(event) => setRoomInput(event.target.value)}
                placeholder="Paste room ID or invite link"
                className="rounded-xl border border-[#334155] bg-[#0f172a] px-3 py-2.5 text-white outline-none transition focus:border-[#3b82f6]"
              />
              <Button
                variant="secondary"
                onClick={() => handleJoinRoom()}
                loading={loadingAction === "join"}
                className="rounded-xl border-[#334155] bg-[#0f172a] hover:border-[#3b82f6]/80"
              >
                Join Room
              </Button>
            </div>

            <Button
              onClick={handleCreateRoom}
              loading={loadingAction === "create"}
              className="w-full rounded-xl py-3 transition hover:translate-y-[-1px]"
            >
              Create Room
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_10px_40px_rgba(2,8,23,0.45)]">
          <h2 className="text-lg font-semibold">Recent rooms</h2>
          <p className="mt-1 text-xs text-slate-300">Rejoin active sessions quickly.</p>

          <div className="mt-4 space-y-3">
            {recentRooms.length === 0 && (
              <p className="rounded-xl border border-[#334155] bg-[#0f172a] p-3 text-sm text-slate-300">
                No recent rooms yet.
              </p>
            )}

            {recentRooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => handleJoinRoom(room.roomId)}
                className="w-full rounded-xl border border-[#334155] bg-[#0f172a] p-3 text-left transition hover:border-[#3b82f6] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
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
