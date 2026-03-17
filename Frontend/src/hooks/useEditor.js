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
  name = "index.js",
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

const makeUniqueName = (desiredName, existingNames) => {
  const cleanBase = (desiredName || "untitled.txt").trim() || "untitled.txt";

  if (!existingNames.has(cleanBase.toLowerCase())) {
    return cleanBase;
  }

  const dotIndex = cleanBase.lastIndexOf(".");
  const hasExt = dotIndex > 0;
  const base = hasExt ? cleanBase.slice(0, dotIndex) : cleanBase;
  const ext = hasExt ? cleanBase.slice(dotIndex) : "";

  for (let attempt = 1; attempt <= 200; attempt += 1) {
    const candidate = `${base}-${attempt}${ext}`;

    if (!existingNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}${ext}`;
};

const normalizeServerFiles = (incomingFiles = [], fallbackLanguage = DEFAULT_LANGUAGE) => {
  const existingNames = new Set();
  const files = {};
  const fileOrder = [];
  const fileIdToName = {};

  incomingFiles.forEach((item, index) => {
    const baseName = (item?.name || `file-${index + 1}.txt`).trim() || `file-${index + 1}.txt`;
    const uniqueName = makeUniqueName(baseName, existingNames);
    existingNames.add(uniqueName.toLowerCase());

    const normalizedFile = {
      id: item?.id || uniqueName,
      name: uniqueName,
      language: (item?.language || fallbackLanguage || DEFAULT_LANGUAGE).toLowerCase(),
      code: typeof item?.code === "string" ? item.code : "",
      lastEditedBy: item?.lastEditedBy || "",
      lastEditedAt: item?.lastEditedAt || null
    };

    files[uniqueName] = normalizedFile;
    fileOrder.push(uniqueName);

    if (normalizedFile.id) {
      fileIdToName[normalizedFile.id] = uniqueName;
    }
  });

  return {
    files,
    fileOrder,
    fileIdToName
  };
};

const buildChangeSummary = (changes = []) => {
  if (!Array.isArray(changes) || changes.length === 0) {
    return "Updated file";
  }

  const [first] = changes;
  const start = Number(first?.startLineNumber) || 1;
  const end = Number(first?.endLineNumber) || start;

  return start === end ? `Edited line ${start}` : `Edited lines ${start}-${end}`;
};

const useEditor = ({ roomId, user }) => {
  const { socket } = useSocket();

  const userId = user?.id;
  const userName = user?.name || "Guest";

  const fallbackFile = useMemo(
    () => createDefaultFile({ language: DEFAULT_LANGUAGE }),
    []
  );

  const [editorState, setEditorState] = useState(() => ({
    files: { [fallbackFile.name]: fallbackFile },
    fileOrder: [fallbackFile.name],
    fileIdToName: { [fallbackFile.id]: fallbackFile.name },
    activeFileName: fallbackFile.name
  }));
  const [recentActivity, setRecentActivity] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});

  const stateRef = useRef(editorState);
  const activityIdRef = useRef(0);

  useEffect(() => {
    stateRef.current = editorState;
  }, [editorState]);

  const activeFile = useMemo(() => {
    const current = editorState.files[editorState.activeFileName];

    if (current) return current;

    const firstName = editorState.fileOrder[0];
    return editorState.files[firstName] || fallbackFile;
  }, [editorState.activeFileName, editorState.fileOrder, editorState.files, fallbackFile]);

  const fileTabs = useMemo(() => {
    return editorState.fileOrder
      .map((fileName) => editorState.files[fileName])
      .filter(Boolean);
  }, [editorState.fileOrder, editorState.files]);

  const code = activeFile?.code || "";
  const language = activeFile?.language || DEFAULT_LANGUAGE;

  const pushActivity = (entry) => {
    activityIdRef.current += 1;

    setRecentActivity((prev) => {
      return [
        {
          id: `${Date.now()}-${activityIdRef.current}`,
          ...entry
        },
        ...prev
      ].slice(0, MAX_RECENT_CHANGES);
    });
  };

  const emitCodeChange = ({ file, nextCode, nextLanguage, changes = [] }) => {
    if (!roomId || !userId || !file) return;

    socket.emit(SOCKET_EVENTS.CODE_CHANGE, {
      roomId,
      fileId: file.id,
      fileName: file.name,
      code: nextCode,
      language: nextLanguage,
      changes,
      userId,
      userName
    });
  };

  const handleEditorChange = (nextCode = "", editorChanges = []) => {
    const currentState = stateRef.current;
    const currentFile = currentState.files[currentState.activeFileName];

    if (!currentFile) return;

    setEditorState((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [currentFile.name]: {
          ...prev.files[currentFile.name],
          code: nextCode,
          lastEditedBy: userName,
          lastEditedAt: new Date().toISOString()
        }
      }
    }));

    emitCodeChange({
      file: currentFile,
      nextCode,
      nextLanguage: currentFile.language,
      changes: editorChanges
    });
  };

  const handleCursorMove = (position) => {
    if (!roomId || !userId || !position) return;

    const currentState = stateRef.current;
    const currentFile = currentState.files[currentState.activeFileName];

    socket.emit(SOCKET_EVENTS.CURSOR_MOVE, {
      roomId,
      userId,
      userName,
      fileId: currentFile?.id,
      fileName: currentFile?.name,
      position
    });
  };

  const setActiveFileName = (nextFileName) => {
    if (!nextFileName) return;

    setEditorState((prev) => {
      if (!prev.files[nextFileName]) return prev;
      return {
        ...prev,
        activeFileName: nextFileName
      };
    });
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

  const setLanguage = (nextLanguage) => {
    const normalizedLanguage = String(nextLanguage || DEFAULT_LANGUAGE).toLowerCase();

    setEditorState((prev) => {
      const file = prev.files[prev.activeFileName];
      if (!file) return prev;

      const updatedFile = {
        ...file,
        language: normalizedLanguage
      };

      emitCodeChange({
        file: updatedFile,
        nextCode: updatedFile.code,
        nextLanguage: normalizedLanguage,
        changes: []
      });

      return {
        ...prev,
        files: {
          ...prev.files,
          [prev.activeFileName]: updatedFile
        }
      };
    });
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    const handleRoomState = (payload) => {
      if (!Array.isArray(payload?.files) || payload.files.length === 0) return;

      const normalized = normalizeServerFiles(payload.files, payload?.language || DEFAULT_LANGUAGE);
      const activeFileNameFromId =
        normalized.fileIdToName[payload?.activeFileId] || normalized.fileOrder[0];

      setEditorState({
        ...normalized,
        activeFileName: activeFileNameFromId
      });
    };

    const handleFileListUpdate = (payload) => {
      if (!Array.isArray(payload?.files) || payload.files.length === 0) return;

      const normalized = normalizeServerFiles(payload.files, payload?.language || DEFAULT_LANGUAGE);

      setEditorState((prev) => {
        const currentStillExists = Boolean(normalized.files[prev.activeFileName]);

        if (currentStillExists && payload?.createdBy?.id !== userId) {
          return {
            ...normalized,
            activeFileName: prev.activeFileName
          };
        }

        const activeFromServer = normalized.fileIdToName[payload?.activeFileId];

        return {
          ...normalized,
          activeFileName: activeFromServer || prev.activeFileName || normalized.fileOrder[0]
        };
      });
    };

    const handleCodeUpdate = (payload) => {
      if (!payload || payload?.userId === userId) return;

      setEditorState((prev) => {
        const existingNames = new Set(Object.keys(prev.files).map((name) => name.toLowerCase()));

        let targetName = "";

        if (payload?.fileId && prev.fileIdToName[payload.fileId]) {
          targetName = prev.fileIdToName[payload.fileId];
        } else if (payload?.fileName && prev.files[payload.fileName]) {
          targetName = payload.fileName;
        } else {
          targetName = makeUniqueName(payload?.fileName || "untitled.txt", existingNames);
        }

        const previousFile = prev.files[targetName] || {
          id: payload?.fileId || targetName,
          name: targetName,
          language: (payload?.language || DEFAULT_LANGUAGE).toLowerCase(),
          code: "",
          lastEditedBy: "",
          lastEditedAt: null
        };

        const nextFile = {
          ...previousFile,
          id: payload?.fileId || previousFile.id,
          name: targetName,
          language: (payload?.language || previousFile.language || DEFAULT_LANGUAGE).toLowerCase(),
          code: typeof payload?.code === "string" ? payload.code : previousFile.code,
          lastEditedBy: payload?.userName || "Collaborator",
          lastEditedAt: payload?.timestamp || new Date().toISOString()
        };

        const nextFiles = {
          ...prev.files,
          [targetName]: nextFile
        };

        const nextOrder = prev.fileOrder.includes(targetName)
          ? prev.fileOrder
          : [...prev.fileOrder, targetName];

        const nextIdMap = {
          ...prev.fileIdToName
        };

        if (nextFile.id) {
          nextIdMap[nextFile.id] = targetName;
        }

        const nextActive = prev.files[prev.activeFileName]
          ? prev.activeFileName
          : targetName;

        return {
          files: nextFiles,
          fileOrder: nextOrder,
          fileIdToName: nextIdMap,
          activeFileName: nextActive
        };
      });

      const changes = Array.isArray(payload?.changes) ? payload.changes : [];

      pushActivity({
        fileName: payload?.fileName || "untitled.txt",
        userId: payload?.userId,
        userName: payload?.userName || "Collaborator",
        timestamp: payload?.timestamp || new Date().toISOString(),
        changes,
        summary: buildChangeSummary(changes)
      });
    };

    const handleCursorUpdate = (payload) => {
      if (!payload?.userId || payload.userId === userId) return;

      const currentState = stateRef.current;
      const cursorFileName =
        currentState.fileIdToName[payload?.fileId] || payload?.fileName || "untitled.txt";

      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          userName: payload.userName || "Collaborator",
          fileId: payload.fileId,
          fileName: cursorFileName,
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
  }, [roomId, socket, userId, userName]);

  return {
    filesByName: editorState.files,
    fileTabs,
    activeFileName: editorState.activeFileName,
    activeFile,
    code,
    language,
    recentActivity,
    remoteCursors,
    setActiveFileName,
    setLanguage,
    handleEditorChange,
    handleCursorMove,
    createFile
  };
};

export default useEditor;
