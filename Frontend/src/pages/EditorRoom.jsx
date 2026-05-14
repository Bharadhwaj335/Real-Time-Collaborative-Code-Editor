import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaRegEdit, FaRegFileCode, FaTrash, FaUsers } from "react-icons/fa";

import Modal from "../components/Common/Modal";
import Navbar from "../components/Common/Navbar";
import RoomSettingsModal from "../components/Room/RoomSettingsModal";
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
  getOrCreateGuestIdentity,
  getStoredUser,
  removeRecentRoom,
  removeStarredRoom
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

    return getOrCreateGuestIdentity();
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
  const [renameModal, setRenameModal] = useState({ isOpen: false, fileName: "", newName: "" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, fileName: "" });
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(220);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [roomPanelHeight, setRoomPanelHeight] = useState(140);
  const [outputPanelHeight, setOutputPanelHeight] = useState(200);

  const lastActivityIdRef = useRef("");
  const hasLoadedCodeSnapshotRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const hydrateFromSnapshotRef = useRef(hydrateFilesFromSnapshot);
  const activeResizeTypeRef = useRef("");
  const resizeStartXRef = useRef(0);
  const resizeStartYRef = useRef(0);
  const resizeStartLeftWidthRef = useRef(220);
  const resizeStartRightWidthRef = useRef(320);
  const resizeStartRoomHeightRef = useRef(140);
  const resizeStartOutputHeightRef = useRef(200);
  const isRunning = executionStatus === "running";

  const roomUsers = useMemo(() => {
    return users.length > 0
      ? users
      : [{ id: user.id, name: user.name, status: "online" }];
  }, [user.id, user.name, users]);
  const inviteLink = useMemo(() => buildRoomInviteLink(roomId), [roomId]);

  const isRoomOwner = useMemo(() => {
    const owner = roomDetails?.createdBy;
    if (owner == null || owner === "") return false;
    return String(owner) === String(user.id);
  }, [roomDetails?.createdBy, user.id]);

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
    const handleMouseMove = (event) => {
      if (!activeResizeTypeRef.current) {
        return;
      }

      if (activeResizeTypeRef.current === "left") {
        const deltaX = event.clientX - resizeStartXRef.current;
        const nextWidth = Math.max(200, Math.min(360, resizeStartLeftWidthRef.current + deltaX));
        setLeftPanelWidth(nextWidth);
        return;
      }

      if (activeResizeTypeRef.current === "right") {
        const deltaX = event.clientX - resizeStartXRef.current;
        const nextWidth = Math.max(280, Math.min(480, resizeStartRightWidthRef.current - deltaX));
        setRightPanelWidth(nextWidth);
        return;
      }

      if (activeResizeTypeRef.current === "room-chat") {
        const deltaY = event.clientY - resizeStartYRef.current;
        const nextHeight = Math.max(112, Math.min(280, resizeStartRoomHeightRef.current + deltaY));
        setRoomPanelHeight(nextHeight);
        return;
      }

      if (activeResizeTypeRef.current === "output") {
        const deltaY = event.clientY - resizeStartYRef.current;
        const nextHeight = Math.max(140, Math.min(400, resizeStartOutputHeightRef.current - deltaY));
        setOutputPanelHeight(nextHeight);
      }
    };

    const handleMouseUp = () => {
      if (!activeResizeTypeRef.current) {
        return;
      }

      activeResizeTypeRef.current = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startPaneResize = (type, event) => {
    activeResizeTypeRef.current = type;
    resizeStartXRef.current = event.clientX;
    resizeStartYRef.current = event.clientY;
    resizeStartLeftWidthRef.current = leftPanelWidth;
    resizeStartRightWidthRef.current = rightPanelWidth;
    resizeStartRoomHeightRef.current = roomPanelHeight;
    resizeStartOutputHeightRef.current = outputPanelHeight;
    document.body.style.cursor = type === "left" || type === "right" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

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

    const handleRoomDeleted = (payload) => {
      if (!payload?.roomId || payload.roomId !== roomId) {
        return;
      }

      toast.error("This room was deleted by the owner.");
      removeRecentRoom(roomId);
      removeStarredRoom(roomId);
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId, userId: user.id });
      navigate("/rooms", { replace: true });
    };

    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.ROOM_DELETED, handleRoomDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.ROOM_DELETED, handleRoomDeleted);
    };
  }, [navigate, roomId, socket, user.id]);

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

    const handleCodeChangeError = (payload) => {
      const message = payload?.message || "Could not save code changes.";
      toast.error(message);
      addConsoleLog("error", message);
    };

    const handleFileChangeError = (payload) => {
      const message = payload?.message || "Could not switch file.";
      toast.error(message);
      addConsoleLog("error", message);
    };

    const handleRenameError = (payload) => {
      const message = payload?.message || "Could not rename file.";
      toast.error(message);
      addConsoleLog("error", message);
    };

    const handleFileDeleteError = (payload) => {
      const message = payload?.message || "Could not delete file.";
      toast.error(message);
      addConsoleLog("error", message);
    };

    socket.on(SOCKET_EVENTS.FILE_CREATE_ERROR, handleFileCreateError);
    socket.on("CODE_CHANGE_ERROR", handleCodeChangeError);
    socket.on("FILE_CHANGE_ERROR", handleFileChangeError);
    socket.on("FILE_RENAME_ERROR", handleRenameError);
    socket.on(SOCKET_EVENTS.FILE_DELETE_ERROR, handleFileDeleteError);

    return () => {
      socket.off(SOCKET_EVENTS.FILE_CREATE_ERROR, handleFileCreateError);
      socket.off("CODE_CHANGE_ERROR", handleCodeChangeError);
      socket.off("FILE_CHANGE_ERROR", handleFileChangeError);
      socket.off("FILE_RENAME_ERROR", handleRenameError);
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
    setRenameModal({ isOpen: true, fileName, newName: fileName });
  };

  const handleConfirmRename = () => {
    const result = renameFile({
      currentFileName: renameModal.fileName,
      nextFileName: renameModal.newName
    });

    if (!result.success) {
      toast.error(result.message || "Could not rename file.");
      return;
    }

    addConsoleLog("info", `Renamed ${renameModal.fileName} to ${result.fileName}.`);
    setRenameModal({ isOpen: false, fileName: "", newName: "" });
  };

  const handleDeleteFile = (fileName) => {
    setDeleteModal({ isOpen: true, fileName });
  };

  const handleConfirmDelete = () => {
    const result = deleteFile(deleteModal.fileName);

    if (!result.success) {
      toast.error(result.message || "Could not delete file.");
      return;
    }

    addConsoleLog("warning", `Deleted file ${deleteModal.fileName}.`);
    setDeleteModal({ isOpen: false, fileName: "" });
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

  const handleLeaveRoom = () => {
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
      roomId,
      userId: user.id
    });

    navigate("/home", { replace: true });
  };

  const roomDisplayName =
    roomDetails?.name || roomDetails?.roomName || roomDetails?.roomId || roomId;

  return (
    <div className="flex h-screen min-h-screen flex-col bg-[#1e1e1e] text-white">
      <Navbar
        roomId={roomId}
        connectedUsers={roomUsers.length}
        isConnected={isConnected}
        userName={user.name}
        onLogout={handleLogout}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5">
        <div className="flex min-h-0 flex-1 gap-2">
          <aside className="cc-workbench-rail flex min-h-0 flex-col items-center gap-1.5 rounded-2xl p-1.5">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSidebarMode(item.key)}
                title={item.label}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-slate-400 transition ${
                  sidebarMode === item.key
                    ? "border-[#0a7ab8]/50 bg-[#0a7ab8]/15 text-[#cfe9ff]"
                    : "border-[#3c3c3c]/80 bg-[#1e1e1e] hover:border-[#52525b] hover:text-slate-200"
                }`}
              >
                <item.icon className="h-[13px] w-[13px]" />
              </button>
            ))}
          </aside>

          <aside
            className="cc-panel min-h-0 shrink-0 overflow-hidden rounded-2xl"
            style={{ width: `${leftPanelWidth}px` }}
          >
            {sidebarMode === "files" ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="cc-panel-header flex items-center justify-between px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Files</p>
                  <button
                    type="button"
                    onClick={() => setIsFileModalOpen(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#3c3c3c]/80 bg-[#1e1e1e] text-slate-300 transition hover:border-[#0a7ab8]/45 hover:text-[#cfe9ff]"
                  >
                    <FaPlus className="text-[10px]" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5">
                  {fileTabs.map((file) => (
                    <div
                      key={file.name}
                      className={`rounded-xl border px-2 py-1 transition ${
                        file.name === activeFileName
                          ? "border-[#0a7ab8]/45 bg-[#0a7ab8]/10"
                          : "border-[#3c3c3c]/70 bg-[#1e1e1e]/80 hover:border-[#52525b]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFileName(file.name)}
                        className="w-full truncate text-left text-[11px] font-medium text-slate-200"
                      >
                        {file.name}
                      </button>

                      <div className="mt-1 flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleRenameFile(file.name)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:border-[#3c3c3c] hover:bg-[#252526] hover:text-[#cfe9ff]"
                          title="Rename file"
                        >
                          <FaRegEdit className="text-[9px]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.name)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:border-rose-500/25 hover:bg-rose-950/25 hover:text-rose-300"
                          title="Delete file"
                        >
                          <FaTrash className="text-[9px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-0 overflow-y-auto p-2.5">
                <UserList
                  users={roomUsers}
                  currentUserId={user.id}
                  maxParticipants={maxParticipants}
                />
              </div>
            )}
          </aside>

          <button
            type="button"
            onMouseDown={(event) => startPaneResize("left", event)}
            className="group hidden w-2 shrink-0 cursor-col-resize items-center justify-center rounded-md lg:flex"
            title="Drag to resize explorer"
          >
            <span className="h-14 w-1 rounded-full bg-[#3c3c3c] transition group-hover:bg-[#0a7ab8]" />
          </button>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e]">
            <EditorToolbar
              roomId={roomId}
              language={language}
              activeFileName={activeFileName}
              onLanguageChange={setLanguage}
              onRunCode={handleRunCode}
              onCopyLink={copyInviteLink}
              isRunning={isRunning}
              executionStatus={executionStatus}
              isRoomOwner={isRoomOwner}
              onRoomSettings={isRoomOwner ? () => setRoomSettingsOpen(true) : undefined}
            />

            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#2a2a2a] bg-[#252526] px-2 py-1.5">
              {fileTabs.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => setActiveFileName(file.name)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                    file.name === activeFileName
                      ? "border-[#0a7ab8]/45 bg-[#0a7ab8]/12 text-[#cfe9ff]"
                      : "border-[#3c3c3c]/80 bg-[#1e1e1e] text-slate-400 hover:border-[#52525b] hover:text-slate-200"
                  }`}
                >
                  {file.name}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsFileModalOpen(true)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#3c3c3c]/80 bg-[#1e1e1e] text-slate-400 transition hover:border-[#0a7ab8]/40 hover:text-[#cfe9ff]"
              >
                <FaPlus className="text-[9px]" />
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

            <div className="border-t border-[#2a2a2a] bg-[#252526] px-2.5 py-1.5 text-[11px] text-slate-500">
              {recentActivity.length === 0 ? (
                <p className="truncate">No remote edits yet.</p>
              ) : (
                <p className="truncate">
                  <span className="font-medium text-slate-300">{recentActivity[0].userName}</span> ·{" "}
                  {recentActivity[0].fileName} ({recentActivity[0].summary}){" "}
                  <span className="text-slate-600">{formatActivityTime(recentActivity[0].timestamp)}</span>
                </p>
              )}
            </div>
          </section>

          <button
            type="button"
            onMouseDown={(event) => startPaneResize("right", event)}
            className="group hidden w-2 shrink-0 cursor-col-resize items-center justify-center rounded-md lg:flex"
            title="Drag to resize right panel"
          >
            <span className="h-14 w-1 rounded-full bg-[#3c3c3c] transition group-hover:bg-[#0a7ab8]" />
          </button>

          <aside
            className="cc-panel flex min-h-0 w-full shrink-0 flex-col gap-0 overflow-hidden rounded-2xl p-2 lg:w-auto"
            style={{ width: `${rightPanelWidth}px` }}
          >
            <div className="shrink-0 overflow-hidden" style={{ height: `${roomPanelHeight}px` }}>
              <RoomHeader
                roomName={roomDisplayName}
                roomId={roomId}
                maxParticipants={maxParticipants || roomUsers.length}
                currentParticipants={currentParticipants || roomUsers.length}
                onLeaveRoom={() => setLeaveModalOpen(true)}
              />
            </div>

            <button
              type="button"
              onMouseDown={(event) => startPaneResize("room-chat", event)}
              className="group flex h-2.5 shrink-0 cursor-row-resize items-center justify-center rounded-md"
              title="Drag to resize room panel"
            >
              <span className="h-1 w-12 rounded-full bg-[#3c3c3c] transition group-hover:bg-[#0a7ab8]" />
            </button>

            <div className="min-h-[160px] flex-1 overflow-hidden">
              <ChatBox roomId={roomId} user={user} />
            </div>
          </aside>
        </div>

        <button
          type="button"
          onMouseDown={(event) => startPaneResize("output", event)}
          className="group flex h-2.5 shrink-0 cursor-row-resize items-center justify-center rounded-md"
          title="Drag to resize output panel"
        >
          <span className="h-1 w-14 rounded-full bg-[#3c3c3c] transition group-hover:bg-[#0a7ab8]" />
        </button>

        <div className="shrink-0 overflow-hidden" style={{ height: `${outputPanelHeight}px` }}>
          <OutputConsole
            stdout={output.stdout}
            stderr={output.stderr}
            runtimeError={output.error}
            logs={consoleLogs}
            executionStatus={executionStatus}
            onClear={clearConsole}
          />
        </div>

        <div className="cc-statusbar flex items-center justify-between gap-3 border-t border-[#2a2a2a] px-3 py-1.5 text-[11px]">
          <div className="flex min-w-0 flex-1 items-center gap-2 truncate text-slate-200/90">
            <span className="hidden text-slate-400 sm:inline">Ln 1, Col 1</span>
            <span className="rounded border border-white/10 bg-black/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-200">
              {language}
            </span>
            <span className="truncate text-slate-300/90">{roomDisplayName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-slate-200/90">
            <span className="rounded border border-white/10 bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              {isConnected ? "Live" : "Reconnecting"}
            </span>
            <span className="hidden tabular-nums text-slate-400 sm:inline">
              {currentParticipants || roomUsers.length} online
            </span>
          </div>
        </div>
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
              className="cc-input mt-2 w-full rounded-lg px-3 py-2 text-[13px] text-white"
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

      <Modal
        isOpen={renameModal.isOpen}
        title="Rename File"
        onClose={() => setRenameModal({ isOpen: false, fileName: "", newName: "" })}
      >
        <div className="space-y-4">
          <label className="block text-sm text-gray-300">
            New file name
            <input
              type="text"
              value={renameModal.newName}
              onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
              placeholder="Enter new name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmRename();
                if (e.key === "Escape") setRenameModal({ isOpen: false, fileName: "", newName: "" });
              }}
              className="mt-2 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2.5 text-white outline-none transition focus:border-[#3b82f6]"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmRename}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Rename
            </button>
            <button
              onClick={() => setRenameModal({ isOpen: false, fileName: "", newName: "" })}
              className="flex-1 rounded-lg border border-[#334155] px-3 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete File"
        onClose={() => setDeleteModal({ isOpen: false, fileName: "" })}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete <span className="font-semibold">{deleteModal.fileName}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: false, fileName: "" })}
              className="flex-1 rounded-lg border border-[#334155] px-3 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={leaveModalOpen}
        title="Leave Room"
        onClose={() => setLeaveModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Leave this room and return to dashboard?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleLeaveRoom}
              className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Leave
            </button>
            <button
              onClick={() => setLeaveModalOpen(false)}
              className="flex-1 rounded-lg border border-[#334155] px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
            >
              Stay
            </button>
          </div>
        </div>
      </Modal>

      <RoomSettingsModal
        isOpen={roomSettingsOpen}
        onClose={() => setRoomSettingsOpen(false)}
        roomId={roomId}
        roomName={roomDetails?.name || roomDetails?.roomName || ""}
        maxParticipants={roomDetails?.maxParticipants ?? maxParticipants}
        onUpdated={async () => {
          try {
            const response = await joinRoom(roomId);
            setRoomDetails({
              ...response,
              roomId: response?.roomId || roomId,
              name: response?.name || response?.roomName || "",
              roomName: response?.roomName || response?.name || ""
            });
          } catch {
            /* ignore */
          }
        }}
        onDeleted={() => {
          removeRecentRoom(roomId);
          removeStarredRoom(roomId);
          socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId, userId: user.id });
          navigate("/rooms", { replace: true });
        }}
      />
    </div>
  );
};

export default EditorRoom;
