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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2a2a] bg-[#252526] px-4 py-3 text-white sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/home" className="text-lg font-semibold tracking-wide text-[#cfe9ff]">
          CodeCollab Studio
        </Link>

        {!publicMode && (
          <nav className="hidden items-center gap-1 rounded-md border border-[#3c3c3c] bg-[#1e1e1e] p-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#007acc] text-white"
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
          <div className="rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            Room {roomId}
          </div>
        )}

        {showConnection && isEditorPage && (
          <div
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
              isConnected ? "bg-[#094771] text-[#cfe9ff]" : "bg-[#5c4522] text-[#ffd479]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-[#4ec9b0]" : "bg-[#dcdcaa]"
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
              className="rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1.5 text-sm text-slate-200 transition hover:border-[#007acc]"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1.5 text-sm text-slate-200 transition hover:border-[#007acc]"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            {showUsers && isEditorPage && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 text-xs text-slate-200">
                <FaUsers className="text-[#4ec9b0]" />
                {connectedUsers} online
              </span>
            )}

            <div ref={menuRef} className="relative">
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1.5 text-sm text-slate-200 transition hover:border-[#007acc]"
              >
                <Avatar name={userLabel} size="sm" />
                <span className="max-w-[130px] truncate text-xs font-medium">{userLabel}</span>
                <FaChevronDown className="text-[10px] text-slate-400" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 z-40 mt-2 w-44 rounded-md border border-[#3c3c3c] bg-[#252526] p-1 shadow-xl">
                  <button
                    onClick={() => navigateTo("/profile")}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigateTo("/profile?tab=rooms")}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    My Rooms
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout?.();
                    }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/20"
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
