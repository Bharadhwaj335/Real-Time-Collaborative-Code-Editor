import { FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";

const RoomHeader = ({
  roomName,
  roomId,
  maxParticipants,
  currentParticipants,
  onLeaveRoom
}) => {
  const copyId = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied.");
    } catch {
      toast.error("Could not copy room ID.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#252526]">
      <div className="shrink-0 border-b border-[#2a2a2a] px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Room</p>
            <p className="mt-0.5 truncate text-sm font-semibold leading-tight text-white">
              {roomName || roomId || "Untitled Room"}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="truncate font-mono text-[10px] text-slate-500">{roomId}</span>
              <button
                type="button"
                onClick={copyId}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition hover:border-[#0a7ab8]/45 hover:text-[#cfe9ff]"
                title="Copy room ID"
              >
                <FaCopy className="h-2.5 w-2.5" aria-hidden />
                Copy
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onLeaveRoom}
            className="shrink-0 rounded-lg border border-rose-500/25 bg-rose-950/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-200/95 transition hover:border-rose-400/40 hover:bg-rose-950/45"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="grid shrink-0 gap-1.5 px-3 py-2 text-[11px] text-slate-300">
        <div className="flex items-center justify-between rounded-lg border border-[#3c3c3c]/80 bg-[#1e1e1e] px-2 py-1.5">
          <span className="text-slate-500">Online</span>
          <span className="font-semibold tabular-nums text-white">
            {currentParticipants || 0}
            <span className="font-normal text-slate-500"> / {maxParticipants || "—"}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoomHeader;
