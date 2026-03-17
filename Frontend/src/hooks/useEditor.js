import { useEffect, useMemo, useRef, useState } from "react";
import useSocket from "./useSocket";
import {
  DEFAULT_EDITOR_CODE,
  DEFAULT_LANGUAGE,
  SOCKET_EVENTS
} from "../utils/constants";

const MAX_RECENT_CHANGES = 25;

const createDefaultFile = ({
  id = "main",
  name = "main.js",
  language = DEFAULT_LANGUAGE,
  code = DEFAULT_EDITOR_CODE
} = {}) => ({
  id,
  name,
  language,
  code,
  lastEditedBy: "",
  lastEditedAt: null
});

const normalizeFile = (file, fallbackLanguage = DEFAULT_LANGUAGE) => {
  const language = (file?.language || fallbackLanguage || DEFAULT_LANGUAGE).toLowerCase();

  return {
    id: file?.id || `file-${Date.now()}`,
    name: file?.name || "untitled.txt",
    language,
    code: typeof file?.code === "string" ? file.code : "",
    lastEditedBy: file?.lastEditedBy || "",
    lastEditedAt: file?.lastEditedAt || null
  };
};

const buildChangeSummary = (changes = []) => {
  if (!Array.isArray(changes) || changes.length === 0) {
    return "Updated file";
  }

  const [first] = changes;
  const start = Number(first?.startLineNumber) || 1;
  const end = Number(first?.endLineNumber) || start;

  if (start === end) {
    return `Edited line ${start}`;
  }

  return `Edited lines ${start}-${end}`;
};

const useEditor = ({ roomId, user }) => {
  const { socket } = useSocket();

  const userId = user?.id;
  const userName = user?.name || "Guest";
  const fallbackFile = useMemo(
    () => createDefaultFile({ language: DEFAULT_LANGUAGE }),
    []
  );

  const [files, setFiles] = useState([fallbackFile]);
  const [activeFileId, setActiveFileId] = useState(fallbackFile.id);
  const [recentActivity, setRecentActivity] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});

  const applyingRemoteChangeRef = useRef(false);
  const activityIdRef = useRef(0);

  const activeFile = useMemo(() => {
    return files.find((file) => file.id === activeFileId) || files[0] || fallbackFile;
  }, [activeFileId, fallbackFile, files]);

  const code = activeFile?.code || "";
  const language = activeFile?.language || DEFAULT_LANGUAGE;

  const pushActivity = (entry) => {
    activityIdRef.current += 1;

    setRecentActivity((prev) => {
      const next = [
        {
          id: `${Date.now()}-${activityIdRef.current}`,
          ...entry
        },
        ...prev
      ].slice(0, MAX_RECENT_CHANGES);

      return next;
    });
  };

  const syncActiveFile = ({ nextFileId, nextLanguage }) => {
    const currentFileId = nextFileId || activeFile.id;

    if (nextFileId && activeFileId !== nextFileId) {
      setActiveFileId(nextFileId);
    }

    if (nextLanguage && currentFileId === activeFile.id) {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === currentFileId
            ? {
                ...file,
                language: nextLanguage
              }
            : file
        )
      );
    }
  };

  const emitCodeChange = ({ fileId, fileName, nextCode, nextLanguage, changes = [] }) => {
    if (!roomId || !userId) return;

    socket.emit(SOCKET_EVENTS.CODE_CHANGE, {
      roomId,
      fileId,
      fileName,
      code: nextCode,
      language: nextLanguage,
      changes,
      userId,
      userName
    });
  };

  const handleEditorChange = (nextCode = "", editorChanges = []) => {
    const targetFile = activeFile;

    setFiles((prev) =>
      prev.map((file) =>
        file.id === targetFile.id
          ? {
              ...file,
              code: nextCode,
              lastEditedBy: userName,
              lastEditedAt: new Date().toISOString()
            }
          : file
      )
    );

    if (applyingRemoteChangeRef.current) {
      return;
    }

    emitCodeChange({
      fileId: targetFile.id,
      fileName: targetFile.name,
      nextCode,
      nextLanguage: targetFile.language,
      changes: editorChanges
    });
  };

  const handleCursorMove = (position) => {
    if (!roomId || !userId || !position) return;

    socket.emit(SOCKET_EVENTS.CURSOR_MOVE, {
      roomId,
      userId,
      userName,
      fileId: activeFile.id,
      position
    });
  };

  const switchActiveFile = (nextFileId) => {
    if (!nextFileId) return;
    syncActiveFile({ nextFileId });
  };

  const createFile = ({ fileName, language: nextLanguage, initialCode = "" }) => {
    if (!roomId || !userId) return;

    socket.emit(SOCKET_EVENTS.FILE_CREATE, {
      roomId,
      fileName,
      language: nextLanguage,
      code: initialCode,
      userId,
      userName
    });
  };

  const updateLanguage = (nextLanguage) => {
    const normalizedLanguage = String(nextLanguage || DEFAULT_LANGUAGE).toLowerCase();

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFile.id
          ? {
              ...file,
              language: normalizedLanguage
            }
          : file
      )
    );

    emitCodeChange({
      fileId: activeFile.id,
      fileName: activeFile.name,
      nextCode: activeFile.code,
      nextLanguage: normalizedLanguage,
      changes: []
    });
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    const handleRoomState = (payload) => {
      if (!payload) return;

      if (Array.isArray(payload.files) && payload.files.length > 0) {
        const normalizedFiles = payload.files.map((file) =>
          normalizeFile(file, payload.language || DEFAULT_LANGUAGE)
        );

        setFiles(normalizedFiles);

        const nextActiveId = payload.activeFileId || normalizedFiles[0].id;
        setActiveFileId(nextActiveId);
      }
    };

    const handleFileListUpdate = (payload) => {
      if (!Array.isArray(payload?.files) || payload.files.length === 0) {
        return;
      }

      const normalizedFiles = payload.files.map((file) =>
        normalizeFile(file, payload.language || DEFAULT_LANGUAGE)
      );

      setFiles(normalizedFiles);

      const currentFileStillExists = normalizedFiles.some((file) => file.id === activeFileId);

      if (!currentFileStillExists) {
        const nextActiveId = payload.activeFileId || normalizedFiles[0].id;
        setActiveFileId(nextActiveId);
        return;
      }

      if (payload?.createdBy?.id && payload.createdBy.id === userId) {
        const nextActiveId = payload.activeFileId || activeFileId;
        setActiveFileId(nextActiveId);
      }
    };

    const handleCodeUpdate = (payload) => {
      if (!payload) return;
      if (payload.userId && payload.userId === userId) return;

      if (!payload.fileId) return;

      applyingRemoteChangeRef.current = true;

      setFiles((prev) => {
        const hasFile = prev.some((file) => file.id === payload.fileId);
        const nextFiles = hasFile
          ? prev.map((file) =>
              file.id === payload.fileId
                ? {
                    ...file,
                    code: typeof payload.code === "string" ? payload.code : file.code,
                    language: payload.language || file.language,
                    lastEditedBy: payload.userName || file.lastEditedBy,
                    lastEditedAt: payload.timestamp || file.lastEditedAt
                  }
                : file
            )
          : [
              ...prev,
              normalizeFile(
                {
                  id: payload.fileId,
                  name: payload.fileName || "untitled.txt",
                  language: payload.language || DEFAULT_LANGUAGE,
                  code: typeof payload.code === "string" ? payload.code : "",
                  lastEditedBy: payload.userName || "Collaborator",
                  lastEditedAt: payload.timestamp || new Date().toISOString()
                },
                DEFAULT_LANGUAGE
              )
            ];

        return nextFiles;
      });

      if (payload.fileId !== activeFileId) {
        setActiveFileId(payload.fileId);
      }

      const changes = Array.isArray(payload.changes) ? payload.changes : [];

      pushActivity({
        fileId: payload.fileId,
        fileName: payload.fileName || "Untitled",
        userId: payload.userId,
        userName: payload.userName || "Collaborator",
        timestamp: payload.timestamp || new Date().toISOString(),
        changes,
        summary: buildChangeSummary(changes)
      });

      window.setTimeout(() => {
        applyingRemoteChangeRef.current = false;
      }, 0);
    };

    const handleCursorUpdate = (payload) => {
      if (!payload?.userId || payload.userId === userId) return;

      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          userName: payload.userName || "Collaborator",
          fileId: payload.fileId,
          position: payload.position
        }
      }));
    };

    const handleUserLeft = (payload) => {
      const leftUserId = payload?.userId || payload?.id;
      if (!leftUserId) return;

      setRemoteCursors((prev) => {
        if (!prev[leftUserId]) return prev;

        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
    };

    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.FILE_LIST_UPDATE, handleFileListUpdate);
    socket.on(SOCKET_EVENTS.CODE_UPDATE, handleCodeUpdate);
    socket.on(SOCKET_EVENTS.CURSOR_UPDATE, handleCursorUpdate);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.FILE_LIST_UPDATE, handleFileListUpdate);
      socket.off(SOCKET_EVENTS.CODE_UPDATE, handleCodeUpdate);
      socket.off(SOCKET_EVENTS.CURSOR_UPDATE, handleCursorUpdate);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    };
  }, [activeFileId, roomId, socket, userId]);

  return {
    files,
    activeFileId,
    activeFile,
    code,
    language,
    recentActivity,
    remoteCursors,
    setActiveFileId: switchActiveFile,
    setLanguage: updateLanguage,
    handleEditorChange,
    handleCursorMove,
    createFile
  };
};

export default useEditor;
