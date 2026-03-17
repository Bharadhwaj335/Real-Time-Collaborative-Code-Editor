import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Common/Navbar";
import { disconnectSocket } from "../services/socket";
import {
  clearAuthStorage,
  getRecentRooms,
  getStoredUser
} from "../utils/helpers";

const Home = () => {
  const navigate = useNavigate();

  const [recentRooms] = useState(() => getRecentRooms());
  const user = useMemo(() => getStoredUser(), []);

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111318] to-[#1e293b] text-white">
      
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[2fr_1fr]">
        
        {/* MAIN CARD */}
        <section className="rounded-3xl border border-white/10 bg-[#1e1e1e]/80 backdrop-blur p-8 shadow-2xl">
          
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
            Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Welcome back,{" "}
            <span className="text-blue-400">
              {user?.name || "Student"}
            </span>
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Start a new collaborative coding session or jump back into your recent rooms.
          </p>

          {/* ACTION BUTTONS */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            
            {/* CREATE */}
            <button
              onClick={() => navigate("/create-room")}
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 p-[2px] transition hover:scale-[1.02]"
            >
              <div className="rounded-2xl bg-[#1e1e1e] px-6 py-4 text-left">
                <h2 className="text-lg font-semibold">🚀 Create Room</h2>
                <p className="text-xs text-slate-400">
                  Start a new coding session
                </p>
              </div>
            </button>

            {/* JOIN */}
            <button
              onClick={() => navigate("/join-room")}
              className="rounded-2xl border border-white/10 bg-[#252526] px-6 py-4 text-left transition hover:border-blue-400/60 hover:bg-[#2a2b2e]"
            >
              <h2 className="text-lg font-semibold">🔗 Join Room</h2>
              <p className="text-xs text-slate-400">
                Enter a room ID to join
              </p>
            </button>

          </div>
        </section>

        {/* RECENT ROOMS */}
        <aside className="rounded-3xl border border-white/10 bg-[#1b1d24]/80 backdrop-blur p-6 shadow-xl">
          
          <h2 className="text-lg font-semibold">Recent Rooms</h2>
          <p className="mt-1 text-xs text-slate-400">
            Rejoin your previous sessions instantly
          </p>

          <div className="mt-5 space-y-3">
            
            {recentRooms.length === 0 && (
              <p className="rounded-lg border border-white/10 bg-[#252526] p-3 text-sm text-slate-400">
                No recent rooms yet.
              </p>
            )}

            {recentRooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() =>
                  navigate(`/room/${room.roomId}`, {
                    state: { language: room.language }
                  })
                }
                className="group w-full rounded-xl border border-white/10 bg-[#252526] p-4 text-left transition hover:border-blue-400/60 hover:bg-[#2a2b2e]"
              >
                {/* ROOM NAME */}
                <p className="font-semibold text-blue-400 group-hover:text-blue-300">
                  {room.roomName || "Untitled Room"}
                </p>

                {/* ROOM ID */}
                <p className="text-xs text-slate-400 mt-1">
                  ID: {room.roomId}
                </p>

                {/* LANGUAGE */}
                {room.language && (
                  <p className="text-xs text-slate-500">
                    {room.language}
                  </p>
                )}
              </button>
            ))}

          </div>

        </aside>

      </div>
    </div>
  );
};

export default Home;