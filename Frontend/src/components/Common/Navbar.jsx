import { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaChevronDown, FaTimes, FaUsers } from "react-icons/fa";
import Avatar from "./Avatar";

const navItems = [
  { label: "Home", to: "/home" },
  { label: "My rooms", to: "/rooms" },
  { label: "Create", to: "/create-room" },
  { label: "Join", to: "/join-room" }
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const showConnection = typeof isConnected === "boolean";
  const showUsers = typeof connectedUsers === "number";
  const userLabel = userName || "Student";

  const isEditorPage = useMemo(() => location.pathname.startsWith("/room/"), [location.pathname]);

  useEffect(() => {
    startTransition(() => {
      setIsMobileNavOpen(false);
    });
  }, [location.pathname]);

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
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2a2a]/90 bg-[#252526]/92 px-3 py-2 text-white shadow-sm backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        <Link
          to="/home"
          className="shrink-0 text-sm font-semibold tracking-tight text-[#cfe9ff] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#252526] rounded-sm sm:text-[15px]"
        >
          CodeCollab Studio
        </Link>

        {!publicMode && (
          <>
            <nav className="hidden items-center gap-0.5 rounded-lg border border-[#3c3c3c]/70 bg-[#1e1e1e]/95 p-0.5 md:flex">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/45 ${
                      isActive
                        ? "bg-[#0a7ab8] text-white shadow-sm"
                        : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] text-slate-200 transition hover:border-[#0a7ab8]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/45 md:hidden"
            >
              {isMobileNavOpen ? <FaTimes className="text-xs" /> : <FaBars className="text-xs" />}
            </button>
          </>
        )}

        {roomId && isEditorPage && (
          <div className="hidden min-w-0 max-w-[140px] truncate rounded-md border border-[#3c3c3c]/70 bg-[#1e1e1e]/95 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:block sm:max-w-[200px] sm:px-2.5 sm:text-[11px]">
            Room <span className="normal-case font-medium text-[#cfe9ff]">{roomId}</span>
          </div>
        )}

        {showConnection && isEditorPage && (
          <div
            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:py-1 sm:text-[11px] ${
              isConnected
                ? "border-emerald-500/20 bg-emerald-950/35 text-emerald-100"
                : "border-amber-500/20 bg-amber-950/30 text-amber-100"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                isConnected ? "bg-[#3db39c]" : "bg-[#c9c48a]"
              }`}
            />
            {isConnected ? "Live" : "Connecting"}
          </div>
        )}
      </div>

      {isMobileNavOpen && !publicMode && (
        <nav className="order-last flex w-full flex-col gap-0.5 rounded-xl border border-[#3c3c3c]/80 bg-[#1e1e1e]/98 p-1.5 md:hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileNavOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-[#0a7ab8] text-white" : "text-slate-200 hover:bg-white/[0.06]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {publicMode ? (
          <>
            <Link
              to="/login"
              className="rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#0a7ab8]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/45 sm:text-sm sm:px-3"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-[#5cb3e8]/35 bg-[#0a7ab8]/18 px-2.5 py-1.5 text-xs font-medium text-[#cfe9ff] transition hover:border-[#5cb3e8]/50 hover:bg-[#0a7ab8]/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/45 sm:text-sm sm:px-3"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            {showUsers && isEditorPage && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#3c3c3c]/70 bg-[#1e1e1e]/95 px-2 py-1 text-[11px] text-slate-200 sm:px-2.5 sm:text-xs">
                <FaUsers className="text-[#3db39c]" aria-hidden />
                {connectedUsers} online
              </span>
            )}

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#3c3c3c]/70 bg-[#1e1e1e]/95 py-1 pl-1 pr-2 text-sm text-slate-200 transition hover:border-[#0a7ab8]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/45"
              >
                <Avatar name={userLabel} size="sm" />
                <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline sm:max-w-[140px]">
                  {userLabel}
                </span>
                <FaChevronDown className="text-[9px] text-slate-500" aria-hidden />
              </button>

              {isMenuOpen && (
                <div className="cc-dropdown-enter absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#252526] p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => navigateTo("/profile")}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/profile?tab=rooms")}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    My Rooms
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout?.();
                    }}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-rose-200/95 transition hover:bg-rose-500/12"
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
