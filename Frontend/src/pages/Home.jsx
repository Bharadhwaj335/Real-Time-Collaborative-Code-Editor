import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaHistory, FaLink, FaRocket } from "react-icons/fa";
import Navbar from "../components/Common/Navbar";
import { disconnectSocket } from "../services/socket";
import {
  clearAuthStorage,
  formatRecentOpened,
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
    <div className="cc-page-shell">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8 lg:grid-cols-[1.65fr_1fr]">
        <section className="cc-workbench cc-card-elevated relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#0a7ab8]/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-[#3db39c]/10 blur-3xl"
            aria-hidden
          />

          <p className="relative text-[10px] font-semibold uppercase tracking-[0.26em] text-[#3db39c]">
            Dashboard
          </p>

          <h1 className="relative mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#cfe9ff] to-[#5cb3e8] bg-clip-text text-transparent">
              {user?.name || "Student"}
            </span>
          </h1>

          <p className="relative mt-2 max-w-lg text-[13px] leading-relaxed text-slate-500">
            Start a session or pick up where you left off.
          </p>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/create-room")}
              className="group rounded-2xl bg-gradient-to-br from-[#0c5a8a] to-[#0a7ab8] p-px text-left shadow-md transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e]"
            >
              <div className="flex h-full flex-col gap-2.5 rounded-[15px] bg-[#1e1e1e]/95 px-4 py-4 transition group-hover:bg-[#1e1e1e]/88">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a7ab8]/25 text-[#cfe9ff]">
                  <FaRocket className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-white">Create room</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">New session, shared editor & chat.</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#5cb3e8]">
                  Continue <FaArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/join-room")}
              className="group rounded-2xl border border-[#3c3c3c]/90 bg-[#252526]/70 p-4 text-left transition hover:border-[#0a7ab8]/40 hover:bg-[#2d2d2d]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] text-[#cfe9ff]">
                <FaLink className="h-3.5 w-3.5" aria-hidden />
              </span>
              <h2 className="mt-2.5 text-[15px] font-semibold text-white">Join room</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Paste a link or enter a room ID.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition group-hover:text-slate-200">
                Open <FaArrowRight className="h-3 w-3 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
              </span>
            </button>
          </div>
        </section>

        <aside className="cc-panel cc-card-elevated flex flex-col rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e1e1e] text-[#3db39c]">
              <FaHistory className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-white">Recent rooms</h2>
              <p className="text-[11px] text-slate-500">Stored on this device.</p>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-2">
            {recentRooms.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#3c3c3c]/90 bg-[#1e1e1e]/40 px-3 py-5 text-center text-[12px] text-slate-500">
                No recent rooms yet.
              </p>
            )}

            {recentRooms.map((room) => {
              const opened = formatRecentOpened(room.touchedAt);
              return (
                <button
                  key={room.roomId}
                  type="button"
                  onClick={() =>
                    navigate(`/room/${room.roomId}`, {
                      state: { language: room.language }
                    })
                  }
                  className="group w-full rounded-xl border border-[#3c3c3c]/90 bg-[#252526]/80 p-3 text-left transition hover:border-[#0a7ab8]/35 hover:bg-[#2d2d2d]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/35"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-[#cfe9ff] transition group-hover:text-white">
                      {room.roomName || "Untitled Room"}
                    </p>
                    <span className="shrink-0 rounded-md border border-emerald-500/15 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300/90">
                      Local
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">ID · {room.roomId}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {room.language ? (
                      <span className="rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        {room.language}
                      </span>
                    ) : null}
                    {opened ? (
                      <span className="text-[10px] font-medium text-slate-500">Opened {opened}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;