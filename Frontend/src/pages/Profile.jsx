import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Common/Navbar";
import Avatar from "../components/Common/Avatar";
import Button from "../components/Common/Button";
import Loader from "../components/Common/Loader";
import { disconnectSocket } from "../services/socket";
import { getCurrentUser, joinRoom } from "../services/api";
import {
  clearAuthStorage,
  getRecentRooms,
  getStoredUser,
  saveRecentRoom,
  setStoredUser
} from "../utils/helpers";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "rooms" ? "rooms" : "profile";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState(() => getStoredUser() || {});
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setLoading(true);

      try {
        const response = await getCurrentUser();
        const nextUser = response?.user || response?.data || {};

        if (!isMounted) return;

        setProfile((prev) => ({
          ...prev,
          id: nextUser?.id || nextUser?._id || prev?.id,
          name: nextUser?.name || nextUser?.username || prev?.name || "Student",
          email: nextUser?.email || prev?.email || ""
        }));

        setStoredUser({
          ...(getStoredUser() || {}),
          id: nextUser?.id || nextUser?._id,
          name: nextUser?.name || nextUser?.username || "Student",
          email: nextUser?.email || ""
        });
      } catch {
        if (isMounted) {
          const fallback = getStoredUser();

          if (fallback) {
            setProfile((prev) => ({ ...prev, ...fallback }));
          }

          toast.error("Could not refresh profile details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(() => profile?.name || "Student", [profile?.name]);

  useEffect(() => {
    setEditName(displayName);
  }, [displayName]);

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  const saveProfileLocally = () => {
    const trimmed = editName.trim();

    if (!trimmed) {
      toast.error("Name cannot be empty.");
      return;
    }

    const next = {
      ...(getStoredUser() || {}),
      ...profile,
      name: trimmed
    };

    setStoredUser(next);
    setProfile(next);
    setIsEditing(false);
    toast.success("Profile updated locally.");
  };

  const openRecentRoom = async (roomId) => {
    try {
      const response = await joinRoom(roomId);
      const language = response?.language || "javascript";
      saveRecentRoom({ roomId, language });
      navigate(`/room/${roomId}`, { state: { language } });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to open this room.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar userName={displayName} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {loading ? (
          <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-8">
            <Loader label="Loading profile..." />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#334155] bg-[#1e293b] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center text-center">
              <Avatar name={displayName} size="lg" className="h-20 w-20 text-xl" />
              <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
              <p className="mt-1 text-sm text-slate-300">{profile?.email || "No email"}</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[#334155] pb-3">
              <button
                onClick={() => setActiveTab("profile")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  activeTab === "profile"
                    ? "bg-[#3b82f6]/20 text-blue-200"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("rooms")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  activeTab === "rooms"
                    ? "bg-[#3b82f6]/20 text-blue-200"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                My Rooms
              </button>
            </div>

            {activeTab === "profile" ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#334155] bg-[#0f172a] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                  {isEditing ? (
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-white outline-none transition focus:border-[#3b82f6]"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-100">{displayName}</p>
                  )}
                </div>

                <div className="rounded-xl border border-[#334155] bg-[#0f172a] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-2 text-sm text-slate-100">{profile?.email || "No email"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={saveProfileLocally}>Save</Button>
                      <Button variant="secondary" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {recentRooms.length === 0 ? (
                  <p className="rounded-xl border border-[#334155] bg-[#0f172a] p-4 text-sm text-slate-300">
                    No recent rooms found yet.
                  </p>
                ) : (
                  recentRooms.map((room) => (
                    <button
                      key={room.roomId}
                      onClick={() => openRecentRoom(room.roomId)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#334155] bg-[#0f172a] p-4 text-left transition hover:border-[#3b82f6]/70 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                    >
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-slate-100">
                          {room.roomId}
                        </p>
                        <p className="mt-1 text-xs text-slate-300">{room.language}</p>
                      </div>
                      <span className="text-xs text-blue-300">Open</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
