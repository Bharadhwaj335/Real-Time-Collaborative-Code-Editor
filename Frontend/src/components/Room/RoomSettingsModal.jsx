import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaLink } from "react-icons/fa";
import Button from "../Common/Button";
import Modal from "../Common/Modal";
import DangerConfirmModal from "../Common/DangerConfirmModal";
import { deleteRoomApi, updateRoomApi } from "../../services/api";
import { buildRoomInviteLink, removeRecentRoom, removeStarredRoom } from "../../utils/helpers";
import { MIN_ROOM_PARTICIPANTS, MAX_ROOM_PARTICIPANTS } from "../../utils/constants";

const RoomSettingsModal = ({
  isOpen,
  onClose,
  roomId,
  roomName: initialName = "",
  maxParticipants: initialMax = 8,
  onUpdated,
  onDeleted
}) => {
  const [name, setName] = useState(initialName);
  const [maxParticipants, setMaxParticipants] = useState(initialMax);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName || "");
    setMaxParticipants(
      Math.min(MAX_ROOM_PARTICIPANTS, Math.max(MIN_ROOM_PARTICIPANTS, Number(initialMax) || MIN_ROOM_PARTICIPANTS))
    );
  }, [isOpen, initialName, initialMax]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRoomApi(roomId, {
        name: name.trim() || initialName,
        maxParticipants
      });
      toast.success("Room updated.");
      onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.response?.data?.error || "Could not update room."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomInviteLink(roomId));
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRoomApi(roomId);
      removeRecentRoom(roomId);
      removeStarredRoom(roomId);
      toast.success("Room deleted.");
      setDeleteOpen(false);
      onClose();
      onDeleted?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.response?.data?.error || "Could not delete room."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} title="Room settings" onClose={onClose}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Room name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cc-input mt-1.5 w-full rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Room display name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400">Max participants ({maxParticipants})</label>
            <input
              type="number"
              min={MIN_ROOM_PARTICIPANTS}
              max={MAX_ROOM_PARTICIPANTS}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="cc-input mt-1.5 w-full rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <Button type="button" variant="secondary" onClick={handleCopyLink} className="w-full gap-2 !py-2 !text-xs">
            <FaLink className="h-3 w-3" aria-hidden />
            Copy invite link
          </Button>

          <div className="flex flex-wrap gap-2 border-t border-[#3c3c3c]/60 pt-4">
            <Button type="button" onClick={handleSave} loading={saving} className="flex-1 !py-2 !text-xs">
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="!py-2 !text-xs">
              Close
            </Button>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3">
            <p className="text-xs font-semibold text-rose-200">Danger zone</p>
            <p className="mt-1 text-[11px] text-rose-100/70">Permanently delete this room and its chat history.</p>
            <Button
              type="button"
              variant="danger"
              className="mt-2 w-full !py-2 !text-xs"
              onClick={() => setDeleteOpen(true)}
            >
              Delete room…
            </Button>
          </div>
        </div>
      </Modal>

      <DangerConfirmModal
        isOpen={deleteOpen}
        title="Delete this room?"
        description="This action cannot be undone. All collaborators will lose access and chat history will be removed."
        confirmLabel="Delete room"
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

export default RoomSettingsModal;
