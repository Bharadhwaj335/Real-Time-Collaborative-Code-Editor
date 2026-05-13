import { useOnlineStatus } from "../../hooks/useOnlineStatus";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">⚠</span>
        <span className="font-medium">You are offline. Some features may not work properly.</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
