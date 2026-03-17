import { Link } from "react-router-dom";
import { FaShareAlt, FaSignOutAlt, FaUsers } from "react-icons/fa";

const Navbar = ({
  roomId,
  connectedUsers,
  isConnected,
  onShare,
  onLogout,
  userName,
  publicMode = false
}) => {
  const showConnection = typeof isConnected === "boolean";
  const showUsers = typeof connectedUsers === "number";
  const showPrivateNavigation = !publicMode;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#1b1d24] px-4 py-3 text-white sm:px-6">
      <div className="flex items-center gap-3">
        <Link to="/home" className="text-xl font-bold tracking-tight text-blue-400">
          CodeCollab
        </Link>

        {showPrivateNavigation && (
          <nav className="hidden items-center gap-1 rounded-lg border border-white/10 bg-[#252526] p-1 md:flex">
            <Link
              to="/home"
              className="rounded-md px-2.5 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              to="/create-room"
              className="rounded-md px-2.5 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              Create Room
            </Link>
            <Link
              to="/join-room"
              className="rounded-md px-2.5 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              Join Room
            </Link>
          </nav>
        )}

        {roomId && (
          <div className="rounded-full border border-white/15 bg-[#252526] px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            Room {roomId}
          </div>
        )}

        {showConnection && (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
              isConnected ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {isConnected ? "Live" : "Connecting"}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {publicMode ? (
          <>
            <Link
              to="/login"
              className="rounded-lg border border-white/10 bg-[#252526] px-3 py-1.5 text-sm text-slate-200 transition hover:border-blue-400/50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-white/10 bg-[#252526] px-3 py-1.5 text-sm text-slate-200 transition hover:border-blue-400/50"
            >
              Register
            </Link>
          </>
        ) : (
          <span className="rounded-full bg-[#252526] px-3 py-1 text-xs text-slate-300">
            {userName || "Student"}
          </span>
        )}

        {showUsers && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#252526] px-3 py-1 text-xs text-slate-200">
            <FaUsers className="text-blue-400" />
            {connectedUsers} online
          </span>
        )}

        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#252526] px-3 py-1.5 text-sm text-slate-200 transition hover:border-blue-400/50"
          >
            <FaShareAlt className="text-blue-400" />
            Share
          </button>
        )}

        {!publicMode && onLogout && (
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-200 transition hover:bg-rose-500/20"
          >
            <FaSignOutAlt />
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;