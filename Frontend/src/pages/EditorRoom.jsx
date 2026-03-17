import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaRegFileCode, FaUsers } from "react-icons/fa";

import Modal from "../components/Common/Modal";
import Navbar from "../components/Common/Navbar";
import CodeEditor from "../components/Editor/CodeEditor";
import EditorToolbar from "../components/Editor/EditorToolbar";
import OutputConsole from "../components/Editor/OutputConsole";
import CursorOverlay from "../components/Room/CursorOverlay";
import RoomHeader from "../components/Room/RoomHeader";
import UserList from "../components/Room/UserList";
import ChatBox from "../components/Chat/ChatBox";
import useRoom from "../hooks/useRoom";
import useEditor from "../hooks/useEditor";
import useSocket from "../hooks/useSocket";
import { executeCode, joinRoom } from "../services/api";
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

  return { stdout, stderr, error };
};

const formatActivityTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const sidebarItems = [
  { key: "files", label: "Files", icon: FaRegFileCode },
  { key: "users", label: "Users", icon: FaUsers }
];

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
    fileTabs,
    activeFileName,
    activeFile,
    code,
    language,
    setActiveFileName,
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
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("files");
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [roomDetails, setRoomDetails] = useState(null);

  const lastActivityIdRef = useRef("");

  const roomUsers = users.length > 0 ? users : [{ id: user.id, name: user.name, status: "online" }];
  const inviteLink = useMemo(() => buildRoomInviteLink(roomId), [roomId]);

  const addConsoleLog = (level, message) => {
    setConsoleLogs((prev) => {
      const next = [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          level,
          message,
          timestamp: new Date().toISOString()
        }
      ];

      return next.slice(-200);
    });
  };

  useEffect(() => {
    const languageFromRoute = location.state?.language;

    if (languageFromRoute && !activeFile?.language) {
      setLanguage(languageFromRoute);
    }
  }, [activeFile?.language, location.state?.language, setLanguage]);

  useEffect(() => {
    let isMounted = true;

    const loadRoomDetails = async () => {
      try {
        const response = await joinRoom(roomId);

        if (!isMounted) {
          return;
        }

        const nextRoomName = response?.name || response?.roomName || "";

        setRoomDetails({
          ...response,
          roomId: response?.roomId || roomId,
          name: nextRoomName,
          roomName: response?.roomName || nextRoomName
        });
      } catch {
        if (isMounted) {
          setRoomDetails((prev) =>
            prev || {
              roomId,
              name: "",
              roomName: ""
            }
          );
        }
      }
    };

    if (roomId) {
      loadRoomDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    const handleRoomState = (payload) => {
      if (!payload) return;

      const nextRoomName = payload?.name || payload?.roomName || "";

      setRoomDetails((prev) => ({
        ...prev,
        ...payload,
        roomId: payload?.roomId || prev?.roomId || roomId,
        name: nextRoomName || prev?.name || "",
        roomName: payload?.roomName || nextRoomName || prev?.roomName || ""
      }));
    };

    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    };
  }, [roomId, socket]);

  useEffect(() => {
    const handleFileCreateError = (payload) => {
      const message = payload?.message || "Could not create file.";
      toast.error(message);
      addConsoleLog("error", message);
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

  useEffect(() => {
    if (!recentActivity.length) return;

    const latest = recentActivity[0];

    if (!latest?.id || latest.id === lastActivityIdRef.current) {
      return;
    }

    lastActivityIdRef.current = latest.id;
    addConsoleLog("info", `${latest.userName} updated ${latest.fileName} (${latest.summary}).`);
  }, [recentActivity]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied.");
      addConsoleLog("info", "Invite link copied to clipboard.");
    } catch {
      toast.error("Could not copy invite link.");
      addConsoleLog("error", "Failed to copy invite link.");
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Type some code before running.");
      addConsoleLog("warning", "Run blocked: editor is empty.");
      return;
    }

    setIsRunning(true);
    setOutput({ stdout: "", stderr: "", error: "" });
    addConsoleLog("info", `Running ${activeFileName || "current file"} in ${language}.`);

    try {
      const response = await executeCode({ roomId, code, language });
      const result = extractExecutionResult(response);

      setOutput(result);

      if (result.stdout?.trim()) {
        addConsoleLog("info", "Execution finished with stdout output.");
      }

      if (result.stderr?.trim()) {
        addConsoleLog("warning", "Execution finished with stderr output.");
      }

      if (result.error?.trim()) {
        addConsoleLog("error", "Execution returned compilation/runtime issue.");
      }

      if (!result.stdout?.trim() && !result.stderr?.trim() && !result.error?.trim()) {
        addConsoleLog("info", "Execution completed with no console output.");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to run code.";

      setOutput((prev) => ({ ...prev, error: message }));
      toast.error(message);
      addConsoleLog("error", message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateFile = () => {
    const trimmedName = newFileName.trim();

    if (!trimmedName) {
      toast.error("Please enter a file name.");
      return;
    }

    createFile({
      fileName: trimmedName,
      initialCode: ""
    });

    addConsoleLog("info", `Create file request sent: ${trimmedName}`);
    setIsFileModalOpen(false);
    setNewFileName("");
  };

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  const roomDisplayName =
    roomDetails?.name || roomDetails?.roomName || roomDetails?.roomId || roomId;

  return (
    <div className="flex h-screen min-h-screen flex-col bg-[#0f172a] text-white">
      <Navbar
        roomId={roomId}
        connectedUsers={roomUsers.length}
        isConnected={isConnected}
        userName={user.name}
        onLogout={handleLogout}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[56px_240px_minmax(0,1fr)_320px]">
          <aside className="flex min-h-0 flex-col items-center gap-2 rounded-xl border border-[#334155] bg-[#1e293b] p-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSidebarMode(item.key)}
                title={item.label}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                  sidebarMode === item.key
                    ? "border-[#3b82f6]/70 bg-[#3b82f6]/20 text-blue-200"
                    : "border-[#334155] bg-[#0f172a] text-slate-300 hover:border-[#3b82f6]/50"
                }`}
              >
                <item.icon />
              </button>
            ))}
          </aside>

          <aside className="min-h-0 overflow-hidden rounded-xl border border-[#334155] bg-[#1e293b]">
            {sidebarMode === "files" ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between border-b border-[#334155] px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Files</p>
                  <button
                    onClick={() => setIsFileModalOpen(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#334155] bg-[#0f172a] text-slate-200 transition hover:border-[#3b82f6]/60"
                  >
                    <FaPlus className="text-[11px]" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
                  {fileTabs.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFileName(file.name)}
                      className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                        file.name === activeFileName
                          ? "border-[#3b82f6]/70 bg-[#3b82f6]/20 text-blue-200"
                          : "border-[#334155] bg-[#0f172a] text-slate-300 hover:border-[#3b82f6]/50"
                      }`}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="min-h-0 h-full overflow-auto p-3">
                <UserList
                  users={roomUsers}
                  currentUserId={user.id}
                  maxParticipants={maxParticipants}
                />
              </div>
            )}
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#334155] bg-[#1e293b]">
            <EditorToolbar
              roomId={roomId}
              language={language}
              activeFileName={activeFileName}
              onLanguageChange={setLanguage}
              onRunCode={handleRunCode}
              onCopyLink={copyInviteLink}
              isRunning={isRunning}
            />

            <div className="flex items-center gap-2 overflow-x-auto border-b border-[#334155] bg-[#0f172a] px-3 py-2">
              {fileTabs.map((file) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileName(file.name)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    file.name === activeFileName
                      ? "border-[#3b82f6]/70 bg-[#3b82f6]/20 text-blue-200"
                      : "border-[#334155] bg-[#1e293b] text-slate-300 hover:border-[#3b82f6]/50"
                  }`}
                >
                  {file.name}
                </button>
              ))}

              <button
                onClick={() => setIsFileModalOpen(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#334155] bg-[#1e293b] text-slate-300 transition hover:border-[#3b82f6]/50"
              >
                <FaPlus className="text-[10px]" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              <CursorOverlay remoteCursors={remoteCursors} activeFileName={activeFileName} />
              <CodeEditor
                language={language}
                code={code}
                activityItems={recentActivity}
                activeFileName={activeFileName}
                onCodeChange={handleEditorChange}
                onCursorMove={handleCursorMove}
              />
            </div>

            <div className="border-t border-[#334155] bg-[#0f172a] px-3 py-2 text-xs text-slate-300">
              {recentActivity.length === 0 ? (
                <p>No remote edits yet.</p>
              ) : (
                <p>
                  {recentActivity[0].userName} updated {recentActivity[0].fileName} ({recentActivity[0].summary}) {formatActivityTime(recentActivity[0].timestamp)}
                </p>
              )}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-xl border border-[#334155] bg-[#1e293b] p-3">
            <RoomHeader
              roomName={roomDisplayName}
              roomId={roomId}
              language={language}
              isConnected={isConnected}
              maxParticipants={maxParticipants || roomUsers.length}
              currentParticipants={currentParticipants || roomUsers.length}
            />

            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatBox roomId={roomId} user={user} />
            </div>
          </aside>
        </div>

        <OutputConsole
          stdout={output.stdout}
          stderr={output.stderr}
          runtimeError={output.error}
          logs={consoleLogs}
          isRunning={isRunning}
        />
      </div>

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
              placeholder="App.js"
              className="mt-2 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2.5 text-white outline-none transition focus:border-[#3b82f6]"
            />
          </label>

          <button
            onClick={handleCreateFile}
            className="w-full rounded-lg border border-[#3b82f6]/60 bg-[#3b82f6]/20 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:bg-[#3b82f6]/30"
          >
            Create File
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditorRoom;
