import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaChevronDown, FaUsers } from "react-icons/fa";
import Avatar from "./Avatar";

const navItems = [
  { label: "Home", to: "/home" },
  { label: "Create Room", to: "/create-room" },
  { label: "Join Room", to: "/join-room" }
];

const Navbar = ({
  roomId,
  connectedUsers,
  isConnected,
  onLogout,
  userName,
  publicMode = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const showConnection = typeof isConnected === "boolean";
  const showUsers = typeof connectedUsers === "number";
  const userLabel = userName || "Student";

  const isEditorPage = useMemo(() => location.pathname.startsWith("/room/"), [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    window.addEventListener("mousedown", handleOutside);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
    };
  }, [isMenuOpen]);

  const navigateTo = (path) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#334155] bg-[#1e293b] px-4 py-3 text-white sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/home" className="text-xl font-bold tracking-tight text-[#3b82f6]">
          CodeCollab
        </Link>

        {!publicMode && (
          <nav className="hidden items-center gap-1 rounded-xl border border-[#334155] bg-[#0f172a] p-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#3b82f6]/20 text-blue-200"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {roomId && isEditorPage && (
          <div className="rounded-full border border-[#334155] bg-[#0f172a] px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            Room {roomId}
          </div>
        )}

        {showConnection && isEditorPage && (
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
              className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-1.5 text-sm text-slate-200 transition hover:border-[#3b82f6]/50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-1.5 text-sm text-slate-200 transition hover:border-[#3b82f6]/50"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            {showUsers && isEditorPage && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#334155] bg-[#0f172a] px-3 py-1 text-xs text-slate-200">
                <FaUsers className="text-[#3b82f6]" />
                {connectedUsers} online
              </span>
            )}

            <div ref={menuRef} className="relative">
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#0f172a] px-2 py-1.5 text-sm text-slate-200 transition hover:border-[#3b82f6]/50"
              >
                <Avatar name={userLabel} size="sm" />
                <span className="max-w-[130px] truncate text-xs font-medium">{userLabel}</span>
                <FaChevronDown className="text-[10px] text-slate-400" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 z-40 mt-2 w-44 rounded-xl border border-[#334155] bg-[#0f172a] p-1 shadow-xl">
                  <button
                    onClick={() => navigateTo("/profile")}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigateTo("/profile?tab=rooms")}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    My Rooms
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout?.();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/20"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
