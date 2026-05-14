import { useEffect, useRef } from "react";
import { FaBolt, FaCog, FaFolderOpen, FaUsers, FaHistory } from "react-icons/fa";

const categoryIcon = (category) => {
  switch (category) {
    case "files":
      return FaFolderOpen;
    case "run":
      return FaBolt;
    case "room":
      return FaCog;
    default:
      return FaUsers;
  }
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const RoomActivityFeed = ({ items = [] }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-1.5 [scrollbar-width:thin]">
        {items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center space-y-3 text-center text-slate-500">
            <FaHistory className="h-8 w-8 opacity-20" />
            <p className="text-[11px] font-medium text-slate-400">No room activity yet</p>
          </div>
        ) : (
          items.map((row) => {
            const Icon = categoryIcon(row.category);

            return (
              <div key={row.id} className="flex items-start gap-2.5 rounded-lg border border-transparent p-1.5 transition hover:border-[#3c3c3c]/50 hover:bg-[#252526]">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#1a1a1c] border border-[#2a2a2a]">
                  <Icon className="h-2.5 w-2.5 text-slate-500" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="text-[11px] text-slate-300/95">{row.message}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-slate-500">{formatTime(row.ts)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default RoomActivityFeed;
