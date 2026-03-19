import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaRegEdit, FaRegFileCode, FaTrash, FaUsers } from "react-icons/fa";

import Modal from "../components/Common/Modal";
import Navbar from "../components/Common/Navbar";
import CodeEditor from "../components/Editor/CodeEditor";
import EditorToolbar from "../components/Editor/EditorToolbar";
import OutputConsole from "../components/Editor/OutputConsole";
import RoomHeader from "../components/Room/RoomHeader";
import UserList from "../components/Room/UserList";
import ChatBox from "../components/Chat/ChatBox";
import useRoom from "../hooks/useRoom";
import useEditor from "../hooks/useEditor";
import useSocket from "../hooks/useSocket";
import {
  executeCode,
  getRoomCodeSnapshot,
  joinRoom,
  saveRoomCodeSnapshot
} from "../services/api";
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
    files,
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
    createFile,
    renameFile,
    deleteFile,
    hydrateFilesFromSnapshot
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
  const [executionStatus, setExecutionStatus] = useState("idle");
  const [sidebarMode, setSidebarMode] = useState("files");
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [roomDetails, setRoomDetails] = useState(null);

  const lastActivityIdRef = useRef("");
  const hasLoadedCodeSnapshotRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const hydrateFromSnapshotRef = useRef(hydrateFilesFromSnapshot);
  const isRunning = executionStatus === "running";

  const roomUsers = useMemo(() => {
    return users.length > 0
      ? users
      : [{ id: user.id, name: user.name, status: "online" }];
  }, [user.id, user.name, users]);
  const inviteLink = useMemo(() => buildRoomInviteLink(roomId), [roomId]);

  const addConsoleLog = useCallback((level, message) => {
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
  }, []);

  useEffect(() => {
    hydrateFromSnapshotRef.current = hydrateFilesFromSnapshot;
  }, [hydrateFilesFromSnapshot]);

  useEffect(() => {
    let isMounted = true;
    hasLoadedCodeSnapshotRef.current = false;

    const loadSnapshot = async () => {
      try {
        const response = await getRoomCodeSnapshot(roomId);

        if (!isMounted) {
          return;
        }

        if (response?.files && typeof response.files === "object") {
          hydrateFromSnapshotRef.current(response.files, response?.activeFileName || "");

          if (response?.updatedAt) {
            addConsoleLog("info", "Loaded latest saved room code.");
          }
        }
      } catch {
        if (isMounted) {
          addConsoleLog("warning", "Could not load saved code snapshot. Using live room state.");
        }
      } finally {
        if (isMounted) {
          hasLoadedCodeSnapshotRef.current = true;
        }
      }
    };

    if (roomId) {
      loadSnapshot();
    }

    return () => {
      isMounted = false;
      hasLoadedCodeSnapshotRef.current = false;
    };
  }, [addConsoleLog, roomId]);

  useEffect(() => {
    if (!roomId || !hasLoadedCodeSnapshotRef.current) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const snapshotKey = JSON.stringify({
          files,
          activeFileName
        });

        if (!snapshotKey || snapshotKey === lastSavedSnapshotRef.current) {
          return;
        }

        await saveRoomCodeSnapshot({
          roomId,
          files,
          activeFileName,
          language,
          userName: user.name
        });

        lastSavedSnapshotRef.current = snapshotKey;
      } catch {
        addConsoleLog("warning", "Auto-save failed. Changes will retry on next edit.");
      }
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeFileName, addConsoleLog, files, language, roomId, user.name]);

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
    const handleUserJoined = (payload) => {
      const joinedUser = payload?.user;

      if (!joinedUser?.id || joinedUser.id === user.id) {
        return;
      }

      const joinedName = joinedUser.name || "A collaborator";
      toast.success(`${joinedName} joined the room.`);
      addConsoleLog("info", `${joinedName} joined the room.`);
    };

    const handleUserLeft = (payload) => {
      const leftUserId = payload?.userId || payload?.id;

      if (!leftUserId || leftUserId === user.id) {
        return;
      }

      const leftUserName = roomUsers.find((member) => member.id === leftUserId)?.name || "A collaborator";
      toast(`${leftUserName} left the room.`);
      addConsoleLog("warning", `${leftUserName} left the room.`);
    };

    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);

    return () => {
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    };
  }, [addConsoleLog, roomUsers, socket, user.id]);

  useEffect(() => {
    const handleFileCreateError = (payload) => {
      const message = payload?.message || "Could not create file.";
      toast.error(message);
      addConsoleLog("error", message);
    };

    const handleFileDeleteError = (payload) => {
      const message = payload?.message || "Could not delete file.";
      toast.error(message);
      addConsoleLog("error", message);
    };

    socket.on(SOCKET_EVENTS.FILE_CREATE_ERROR, handleFileCreateError);
    socket.on(SOCKET_EVENTS.FILE_DELETE_ERROR, handleFileDeleteError);

    return () => {
      socket.off(SOCKET_EVENTS.FILE_CREATE_ERROR, handleFileCreateError);
      socket.off(SOCKET_EVENTS.FILE_DELETE_ERROR, handleFileDeleteError);
    };
  }, [addConsoleLog, socket]);

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
  }, [addConsoleLog, recentActivity]);

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
      setExecutionStatus("idle");
      return;
    }

    setExecutionStatus("running");
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

      if (result.error?.trim() || result.stderr?.trim()) {
        setExecutionStatus("error");
      } else {
        setExecutionStatus("success");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to run code.";

      setOutput((prev) => ({ ...prev, error: message }));
      toast.error(message);
      addConsoleLog("error", message);
      setExecutionStatus("error");
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

  const handleRenameFile = (fileName) => {
    const nextFileName = window.prompt("Rename file", fileName);

    if (typeof nextFileName !== "string") {
      return;
    }

    const result = renameFile({
      currentFileName: fileName,
      nextFileName
    });

    if (!result.success) {
      toast.error(result.message || "Could not rename file.");
      return;
    }

    addConsoleLog("info", `Renamed ${fileName} to ${result.fileName}.`);
  };

  const handleDeleteFile = (fileName) => {
    const confirmed = window.confirm(`Delete ${fileName}?`);

    if (!confirmed) {
      return;
    }

    const result = deleteFile(fileName);

    if (!result.success) {
      toast.error(result.message || "Could not delete file.");
      return;
    }

    addConsoleLog("warning", `Deleted file ${fileName}.`);
  };

  const clearConsole = () => {
    setOutput({ stdout: "", stderr: "", error: "" });
    setConsoleLogs([]);
    setExecutionStatus("idle");
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
                    <div
                      key={file.name}
                      className={`rounded-lg border px-2 py-1.5 transition ${
                        file.name === activeFileName
                          ? "border-[#3b82f6]/70 bg-[#3b82f6]/20"
                          : "border-[#334155] bg-[#0f172a]"
                      }`}
                    >
                      <button
                        onClick={() => setActiveFileName(file.name)}
                        className="w-full text-left text-xs text-slate-200"
                      >
                        {file.name}
                      </button>

                      <div className="mt-1.5 flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRenameFile(file.name)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#334155] text-slate-300 transition hover:border-[#3b82f6]/60 hover:text-blue-200"
                          title="Rename file"
                        >
                          <FaRegEdit className="text-[10px]" />
                        </button>

                        <button
                          onClick={() => handleDeleteFile(file.name)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#334155] text-slate-300 transition hover:border-[#ef4444]/60 hover:text-rose-300"
                          title="Delete file"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
                    </div>
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
              executionStatus={executionStatus}
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
              <CodeEditor
                language={language}
                code={code}
                activityItems={recentActivity}
                remoteCursors={remoteCursors}
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
          executionStatus={executionStatus}
          onClear={clearConsole}
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
