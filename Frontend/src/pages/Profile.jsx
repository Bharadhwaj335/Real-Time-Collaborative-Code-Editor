import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Common/Navbar";
import Avatar from "../components/Common/Avatar";
import Button from "../components/Common/Button";
import Loader from "../components/Common/Loader";
import RoomDashboard from "../components/Room/RoomDashboard";
import { disconnectSocket } from "../services/socket";
import { getCurrentUser, updateProfile, updateProfilePicture, deleteProfilePicture } from "../services/api";
import {
  clearAuthStorage,
  getStoredUser,
  resolveMediaUrl,
  setStoredUser
} from "../utils/helpers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "rooms" ? "rooms" : "profile";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState(() => getStoredUser() || {});
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pictureBusy, setPictureBusy] = useState(false);
  const fileInputRef = useRef(null);

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
          email: nextUser?.email || prev?.email || "",
          avatarUrl: nextUser?.avatarUrl ?? prev?.avatarUrl ?? ""
        }));

        setStoredUser({
          ...(getStoredUser() || {}),
          id: nextUser?.id || nextUser?._id,
          name: nextUser?.name || nextUser?.username || "Student",
          email: nextUser?.email || "",
          avatarUrl: nextUser?.avatarUrl ?? ""
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
    setEditEmail(profile?.email || "");
  }, [displayName, profile?.email]);

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  const saveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName) {
      toast.error("Name cannot be empty.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateProfile({
        name: trimmedName,
        email: trimmedEmail
      });

      const updatedUser = response?.user || {};
      const next = {
        ...(getStoredUser() || {}),
        ...profile,
        id: updatedUser?.id || updatedUser?._id || profile?.id,
        name: updatedUser?.name || trimmedName,
        email: updatedUser?.email || trimmedEmail,
        avatarUrl: updatedUser?.avatarUrl ?? profile?.avatarUrl ?? ""
      };

      setStoredUser(next);
      setProfile(next);
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Could not update profile.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditName(displayName);
    setEditEmail(profile?.email || "");
    setIsEditing(false);
  };

  const validatePictureFile = (file) => {
    const okType =
      ["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      /\.(png|jpe?g|webp)$/i.test(file.name || "");
    if (!okType) {
      toast.error("Please choose a PNG, JPG, JPEG, or WebP image.");
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller.");
      return false;
    }
    return true;
  };

  const handlePickPicture = () => {
    fileInputRef.current?.click();
  };

  const handlePictureChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !validatePictureFile(file)) return;

    setPictureBusy(true);
    try {
      const response = await updateProfilePicture(file);
      const updatedUser = response?.user || {};
      const next = {
        ...(getStoredUser() || {}),
        ...profile,
        id: updatedUser?.id || updatedUser?._id || profile?.id,
        name: updatedUser?.name || profile?.name,
        email: updatedUser?.email || profile?.email,
        avatarUrl: updatedUser?.avatarUrl ?? ""
      };
      setStoredUser(next);
      setProfile(next);
      toast.success("Profile picture updated.");
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.response?.data?.error || "Could not update picture.";
      toast.error(message);
    } finally {
      setPictureBusy(false);
    }
  };

  const handleRemovePicture = async () => {
    setPictureBusy(true);
    try {
      const response = await deleteProfilePicture();
      const updatedUser = response?.user || {};
      const next = {
        ...(getStoredUser() || {}),
        ...profile,
        id: updatedUser?.id || updatedUser?._id || profile?.id,
        name: updatedUser?.name || profile?.name,
        email: updatedUser?.email || profile?.email,
        avatarUrl: ""
      };
      setStoredUser(next);
      setProfile(next);
      toast.success("Profile picture removed.");
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.response?.data?.error || "Could not remove picture.";
      toast.error(message);
    } finally {
      setPictureBusy(false);
    }
  };

  return (
    <div className="cc-page-shell">
      <Navbar userName={displayName} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        {loading ? (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#252526] p-6 shadow-[var(--cc-shadow-soft)]">
            <Loader label="Loading profile..." />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#252526] p-5 shadow-[var(--cc-shadow-soft)] sm:p-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
              <Avatar
                name={displayName}
                imageUrl={resolveMediaUrl(profile?.avatarUrl) || undefined}
                size="lg"
                className="h-16 w-16 shrink-0 text-lg sm:h-[4.5rem] sm:w-[4.5rem] sm:text-xl"
              />
              <div className="mt-4 min-w-0 sm:mt-1">
                <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">{displayName}</h1>
                <p className="mt-1 truncate text-[13px] text-slate-500">{profile?.email || "No email on file"}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePictureChange}
                />
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePickPicture}
                    loading={pictureBusy}
                    disabled={pictureBusy}
                    className="!py-1.5 !text-xs"
                  >
                    Change photo
                  </Button>
                  {profile?.avatarUrl ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRemovePicture}
                      loading={pictureBusy}
                      disabled={pictureBusy}
                      className="!py-1.5 !text-xs"
                    >
                      Remove photo
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-1 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                  activeTab === "profile"
                    ? "bg-[#0a7ab8] text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rooms")}
                className={`flex-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                  activeTab === "rooms"
                    ? "bg-[#0a7ab8] text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                My rooms
              </button>
            </div>

            {activeTab === "profile" ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Name</p>
                  {isEditing ? (
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="cc-input mt-2 w-full rounded-lg px-2.5 py-2 text-[13px] text-white"
                    />
                  ) : (
                    <p className="mt-2 text-[13px] font-medium text-slate-200">{displayName}</p>
                  )}
                </div>

                <div className="rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(event) => setEditEmail(event.target.value)}
                      className="cc-input mt-2 w-full rounded-lg px-2.5 py-2 text-[13px] text-white"
                    />
                  ) : (
                    <p className="mt-2 text-[13px] font-medium text-slate-200">{profile?.email || "No email"}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {isEditing ? (
                    <>
                      <Button onClick={saveProfile} loading={isSaving} disabled={isSaving} className="!py-2 !text-xs">
                        Save
                      </Button>
                      <Button variant="secondary" onClick={cancelEdit} disabled={isSaving} className="!py-2 !text-xs">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={() => setIsEditing(true)} className="!py-2 !text-xs">
                      Edit profile
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <RoomDashboard embedded />
                <div className="text-center">
                  <Link
                    to="/rooms"
                    className="text-[12px] font-semibold text-[#5cb3e8] transition hover:text-[#cfe9ff]"
                  >
                    Open full room manager →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
