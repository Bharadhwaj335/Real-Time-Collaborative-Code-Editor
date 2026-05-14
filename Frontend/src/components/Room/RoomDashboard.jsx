import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCopy,
  FaDoorOpen,
  FaPen,
  FaRegStar,
  FaStar,
  FaTrash
} from "react-icons/fa";
import Button from "../Common/Button";
import Loader from "../Common/Loader";
import Modal from "../Common/Modal";
import DangerConfirmModal from "../Common/DangerConfirmModal";
import { deleteRoomApi, getMyRooms, joinRoom, updateRoomApi } from "../../services/api";
import {
  buildRoomInviteLink,
  formatRecentOpened,
  isRoomStarred,
  removeRecentRoom,
  removeStarredRoom,
  toggleStarredRoom
} from "../../utils/helpers";

const RoomDashboard = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starTick, setStarTick] = useState(0);
  const [rename, setRename] = useState({ open: false, roomId: "", name: "" });
  const [renameSaving, setRenameSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState({ open: false, roomId: "", name: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRooms();
      setRooms(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch {
      toast.error("Could not load your rooms.");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openRename = (room) => {
    setRename({
      open: true,
      roomId: room.roomId,
      name: room.name || room.roomName || ""
    });
  };

  const submitRename = async () => {
    const trimmed = rename.name.trim();
    if (!trimmed || !rename.roomId) {
      toast.error("Enter a room name.");
      return;
    }

    setRenameSaving(true);
    try {
      await updateRoomApi(rename.roomId, { name: trimmed });
      toast.success("Room updated.");
      setRename({ open: false, roomId: "", name: "" });
      await loadRooms();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not rename room.");
    } finally {
      setRenameSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete.roomId) return;
    setDeleteLoading(true);
    try {
      await deleteRoomApi(pendingDelete.roomId);
      removeRecentRoom(pendingDelete.roomId);
      removeStarredRoom(pendingDelete.roomId);
      toast.success("Room deleted.");
      setPendingDelete({ open: false, roomId: "", name: "" });
      await loadRooms();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not delete room.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyInvite = async (roomId) => {
    try {
      await navigator.clipboard.writeText(buildRoomInviteLink(roomId));
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const goJoin = async (roomId) => {
    try {
      const response = await joinRoom(roomId);
      const language = response?.language || response?.currentLanguage || "javascript";
      navigate(`/room/${roomId}`, { state: { language } });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to open this room.");
    }
  };

  const toggleStar = (roomId) => {
    toggleStarredRoom(roomId);
    setStarTick((n) => n + 1);
  };

  return (
    <div className={embedded ? "" : "rounded-2xl border border-[#2a2a2a] bg-[#252526]/60 p-4 sm:p-5"}>
      {!embedded && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Your rooms</h2>
          <p className="mt-1 text-[12px] text-slate-500">Rooms you created. Star favorites for quick access.</p>
        </div>
      )}

      {loading ? (
        <div className="py-10">
          <Loader label="Loading rooms…" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#3c3c3c] bg-[#1e1e1e]/50 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-300">No rooms yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] text-slate-500">
            Create a room from the dashboard — it will show up here for management.
          </p>
          <Button type="button" className="mt-4 !py-2 !text-xs" onClick={() => navigate("/create-room")}>
            Create room
          </Button>
        </div>
      ) : (
        <ul className="space-y-2.5" key={starTick}>
          {rooms.map((room) => {
            const starred = isRoomStarred(room.roomId);
            const updated = formatRecentOpened(room.updatedAt || room.createdAt);
            const full = !room.isJoinable;

            return (
              <li
                key={room.roomId}
                className="group rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e]/80 p-3 transition hover:border-[#0a7ab8]/30 hover:bg-[#1e1e1e]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStar(room.roomId)}
                        className="text-slate-500 transition hover:text-amber-300"
                        aria-label={starred ? "Unstar room" : "Star room"}
                      >
                        {starred ? <FaStar className="text-amber-300" /> : <FaRegStar />}
                      </button>
                      <h3 className="truncate text-[14px] font-semibold text-white">
                        {room.name || room.roomName || "Untitled room"}
                      </h3>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">ID · {room.roomId}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      <span className="rounded-md border border-[#3c3c3c] bg-[#252526] px-1.5 py-0.5">{room.language}</span>
                      <span className="text-slate-600">
                        {room.currentParticipants ?? 0}/{room.maxParticipants ?? "—"} online cap
                      </span>
                      {updated ? <span className="normal-case text-slate-600">Updated {updated}</span> : null}
                      <span
                        className={`rounded-md px-1.5 py-0.5 ${
                          full ? "border border-amber-500/25 bg-amber-500/10 text-amber-200/90" : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200/90"
                        }`}
                      >
                        {full ? "Full" : "Open"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => goJoin(room.roomId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#0a7ab8]/35 bg-[#0a7ab8]/15 px-2 py-1 text-[11px] font-semibold text-[#cfe9ff] transition hover:bg-[#0a7ab8]/25"
                    >
                      <FaDoorOpen className="h-3 w-3" aria-hidden />
                      Join
                    </button>
                    <button
                      type="button"
                      onClick={() => copyInvite(room.roomId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#3c3c3c] px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:border-[#52525b]"
                    >
                      <FaCopy className="h-3 w-3" aria-hidden />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => openRename(room)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#3c3c3c] px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:border-[#52525b]"
                    >
                      <FaPen className="h-3 w-3" aria-hidden />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({
                          open: true,
                          roomId: room.roomId,
                          name: room.name || room.roomName || room.roomId
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-950/20 px-2 py-1 text-[11px] font-semibold text-rose-200/90 transition hover:bg-rose-950/35"
                    >
                      <FaTrash className="h-3 w-3" aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={rename.open}
        title="Rename room"
        onClose={() => !renameSaving && setRename({ open: false, roomId: "", name: "" })}
      >
        <div className="space-y-3">
          <label className="block text-sm text-slate-400">
            Display name
            <input
              value={rename.name}
              onChange={(e) => setRename((r) => ({ ...r, name: e.target.value }))}
              className="cc-input mt-2 w-full rounded-lg px-3 py-2 text-sm text-white"
              autoFocus
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" className="flex-1 !py-2 !text-xs" onClick={submitRename} loading={renameSaving}>
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!py-2 !text-xs"
              onClick={() => setRename({ open: false, roomId: "", name: "" })}
              disabled={renameSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <DangerConfirmModal
        isOpen={pendingDelete.open}
        title={`Delete “${pendingDelete.name}”?`}
        description="This action cannot be undone. The room and its messages will be removed for everyone."
        onClose={() => !deleteLoading && setPendingDelete({ open: false, roomId: "", name: "" })}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default RoomDashboard;
