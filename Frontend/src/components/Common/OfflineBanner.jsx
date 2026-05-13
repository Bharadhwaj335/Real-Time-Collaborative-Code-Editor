import { MdWifiOff } from "react-icons/md";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[60] border-b border-amber-500/25 bg-gradient-to-r from-amber-950/95 via-zinc-900/95 to-zinc-950/95 px-4 py-2.5 text-center text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2.5 text-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15 text-amber-300">
          <MdWifiOff className="h-4 w-4" aria-hidden />
        </span>
        <span className="font-medium leading-snug">
          You are offline. Edits and collaboration may not sync until you reconnect.
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
