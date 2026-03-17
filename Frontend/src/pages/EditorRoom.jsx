import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Modal from "../components/Common/Modal";
import Navbar from "../components/Common/Navbar";
import CodeEditor from "../components/Editor/CodeEditor";
import EditorToolbar from "../components/Editor/EditorToolbar";
import CursorOverlay from "../components/Room/CursorOverlay";
import InviteLink from "../components/Room/InviteLink";
import RoomHeader from "../components/Room/RoomHeader";
import UserList from "../components/Room/UserList";
import ChatBox from "../components/Chat/ChatBox";
import useRoom from "../hooks/useRoom";
import useEditor from "../hooks/useEditor";
import useSocket from "../hooks/useSocket";
import { executeCode } from "../services/api";
import { disconnectSocket } from "../services/socket";
import {
  buildRoomInviteLink,
  clearAuthStorage,
  createGuestIdentity,
  getStoredUser,
  setStoredUser
} from "../utils/helpers";
import { SOCKET_EVENTS } from "../utils/constants";

const extractExecutionResult = (payload) => {
  const stdout = payload?.stdout || payload?.output || payload?.run?.stdout || "";
  const stderr = payload?.stderr || payload?.run?.stderr || "";
  const error =
    payload?.error ||
    payload?.compile_output ||
    payload?.compileError ||
    payload?.message ||
    "";

  return {
    stdout,
    stderr,
    error
  };
};

const formatActivityTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const EditorRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const user = useMemo(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      return {
        id: storedUser.id || storedUser._id || `user-${Date.now()}`,
        name: storedUser.name || storedUser.username || "Student"
      };
    }

    const guest = createGuestIdentity();
    setStoredUser(guest);
    return guest;
  }, []);

  const {
    files,
    activeFileId,
    activeFile,
    code,
    language,
    setActiveFileId,
    setLanguage,
    recentActivity,
    remoteCursors,
    handleEditorChange,
    handleCursorMove,
    createFile
  } = useEditor({ roomId, user });

  const {
    users,
    isConnected,
    roomError,
    setRoomError,
    maxParticipants,
    currentParticipants
  } = useRoom({ roomId, user });

  const [output, setOutput] = useState({
    stdout: "",
    stderr: "",
    error: ""
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const inviteLink = useMemo(() => buildRoomInviteLink(roomId), [roomId]);
  const roomUsers = users.length > 0 ? users : [{ id: user.id, name: user.name, status: "online" }];

  useEffect(() => {
    const languageFromRoute = location.state?.language;
    if (languageFromRoute && !activeFile?.language) {
      setLanguage(languageFromRoute);
    }
  }, [activeFile?.language, location.state?.language, setLanguage]);

  useEffect(() => {
    const handleFileCreateError = (payload) => {
      const message = payload?.message || "Could not create file.";
      toast.error(message);
    };

    socket.on(SOCKET_EVENTS.FILE_CREATE_ERROR, handleFileCreateError);

    return () => {
      socket.off(SOCKET_EVENTS.FILE_CREATE_ERROR, handleFileCreateError);
    };
  }, [socket]);

  useEffect(() => {
    if (!roomError) return;

    toast.error(roomError);

    const timer = window.setTimeout(() => {
      navigate("/join-room", { replace: true });
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      setRoomError("");
    };
  }, [navigate, roomError, setRoomError]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Type some code before running.");
      return;
    }

    setIsRunning(true);
    setOutput({ stdout: "", stderr: "", error: "" });

    try {
      const response = await executeCode({
        roomId,
        code,
        language
      });

      setOutput(extractExecutionResult(response));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to run code.";

      setOutput((prev) => ({
        ...prev,
        error: message
      }));
      toast.error(message);
    } finally {
      setIsRunning(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy invite link.");
    }
  };

  const handleCreateFile = () => {
    const trimmedName = newFileName.trim();

    createFile({
      fileName: trimmedName,
      language,
      initialCode: ""
    });

    setIsFileModalOpen(false);
    setNewFileName("");
  };

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen min-h-screen flex-col bg-[#111318] text-white">
      <Navbar
        roomId={roomId}
        connectedUsers={roomUsers.length}
        isConnected={isConnected}
        userName={user.name}
        onShare={() => setIsInviteOpen(true)}
        onLogout={handleLogout}
      />

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:p-4">
        <aside className="flex min-h-0 flex-col gap-3">
          <RoomHeader
            roomId={roomId}
            language={language}
            isConnected={isConnected}
            maxParticipants={maxParticipants}
            currentParticipants={currentParticipants || roomUsers.length}
          />

          <InviteLink roomId={roomId} inviteLink={inviteLink} onCopy={copyInviteLink} />

          <div className="min-h-0 flex-1 overflow-auto">
            <UserList
              users={roomUsers}
              currentUserId={user.id}
              maxParticipants={maxParticipants}
            />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e]">
          <EditorToolbar
            roomId={roomId}
            language={language}
            activeFileName={activeFile?.name}
            filesCount={files.length}
            onLanguageChange={setLanguage}
            onRunCode={handleRunCode}
            onCopyLink={copyInviteLink}
            onCreateFile={() => setIsFileModalOpen(true)}
            isRunning={isRunning}
          />

          <div className="flex items-center gap-2 overflow-auto border-b border-white/10 bg-[#202127] px-3 py-2">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`rounded-md border px-3 py-1.5 text-xs transition ${
                  file.id === activeFileId
                    ? "border-blue-400 bg-blue-500/15 text-blue-200"
                    : "border-white/10 bg-[#2a2b31] text-slate-300 hover:border-blue-300/40"
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          <div className="relative min-h-0 flex-1">
            <CursorOverlay remoteCursors={remoteCursors} activeFileId={activeFileId} />
            <CodeEditor
              language={language}
              code={code}
              activityItems={recentActivity}
              activeFileId={activeFileId}
              onCodeChange={handleEditorChange}
              onCursorMove={handleCursorMove}
            />
          </div>

          <div className="border-t border-white/10 bg-[#202127] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Live updates
            </p>

            <div className="mt-2 max-h-24 space-y-1 overflow-auto text-xs text-slate-300">
              {recentActivity.length === 0 ? (
                <p className="text-slate-400">No remote edits yet.</p>
              ) : (
                recentActivity.slice(0, 6).map((item) => (
                  <p key={item.id}>
                    <span className="font-semibold text-blue-300">{item.userName}</span> updated {item.fileName} ({item.summary}) {formatActivityTime(item.timestamp)}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="min-h-0">
          <ChatBox roomId={roomId} user={user} />
        </aside>
      </div>

      <section className="border-t border-white/10 bg-[#1a1d25] p-4">
        <h3 className="text-sm font-semibold text-slate-200">Output Console</h3>

        <div className="mt-3 grid gap-3 text-sm lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#252526] p-3">
            <p className="mb-2 font-semibold text-emerald-300">stdout</p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-slate-200">
              {output.stdout || "No output yet."}
            </pre>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#252526] p-3">
            <p className="mb-2 font-semibold text-amber-300">stderr</p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-slate-200">
              {output.stderr || "No errors."}
            </pre>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#252526] p-3">
            <p className="mb-2 font-semibold text-rose-300">Compilation / Runtime</p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-slate-200">
              {output.error || "No runtime issues."}
            </pre>
          </div>
        </div>
      </section>

      <Modal
        isOpen={isInviteOpen}
        title="Invite to room"
        onClose={() => setIsInviteOpen(false)}
      >
        <InviteLink roomId={roomId} inviteLink={inviteLink} onCopy={copyInviteLink} />
      </Modal>

      <Modal
        isOpen={isFileModalOpen}
        title="Create collaborative file"
        onClose={() => setIsFileModalOpen(false)}
      >
        <div className="space-y-3">
          <label className="block text-sm text-slate-300">
            File name
            <input
              value={newFileName}
              onChange={(event) => setNewFileName(event.target.value)}
              placeholder="utils.js"
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
            />
          </label>

          <button
            onClick={handleCreateFile}
            className="w-full rounded-lg border border-blue-400/60 bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25"
          >
            Create File
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditorRoom;
