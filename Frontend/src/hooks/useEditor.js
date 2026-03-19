import { useEffect, useMemo, useRef, useState } from "react";
import useSocket from "./useSocket";
import {
  DEFAULT_EDITOR_CODE,
  DEFAULT_LANGUAGE,
  SOCKET_EVENTS
} from "../utils/constants";
import { getLanguageFromFileName } from "../utils/getLanguageFromExtension";

const MAX_RECENT_CHANGES = 25;
const DEFAULT_FILE_NAME = "main.js";

const createDefaultState = () => ({
  files: { [DEFAULT_FILE_NAME]: DEFAULT_EDITOR_CODE },
  fileMeta: {
    [DEFAULT_FILE_NAME]: {
      id: "main",
      language: getLanguageFromFileName(DEFAULT_FILE_NAME, DEFAULT_LANGUAGE),
      lastEditedBy: "",
      lastEditedAt: null
    }
  },
  fileOrder: [DEFAULT_FILE_NAME],
  fileIdToName: { main: DEFAULT_FILE_NAME },
  activeFile: DEFAULT_FILE_NAME
});

const sanitizeClientFileName = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 64);

  return normalized || "untitled.txt";
};

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

const findFileNameCaseInsensitive = (fileNames = [], requestedName = "") => {
  const normalizedRequestedName = String(requestedName || "").toLowerCase();

  if (!normalizedRequestedName) {
    return "";
  }

  return fileNames.find((fileName) => fileName.toLowerCase() === normalizedRequestedName) || "";
};

const normalizeServerFiles = (incomingFiles = [], fallbackLanguage = DEFAULT_LANGUAGE) => {
  const existingNames = new Set();
  const files = {};
  const fileMeta = {};
  const fileOrder = [];
  const fileIdToName = {};

  incomingFiles.forEach((item, index) => {
    const baseName = sanitizeClientFileName(item?.name || `file-${index + 1}.txt`);
    const uniqueName = makeUniqueName(baseName, existingNames);
    const inferredLanguage = getLanguageFromFileName(
      uniqueName,
      item?.language || fallbackLanguage || DEFAULT_LANGUAGE
    );

    existingNames.add(uniqueName.toLowerCase());
    files[uniqueName] = typeof item?.code === "string" ? item.code : "";
    fileMeta[uniqueName] = {
      id: item?.id || uniqueName,
      language: inferredLanguage,
      lastEditedBy: item?.lastEditedBy || "",
      lastEditedAt: item?.lastEditedAt || null
    };
    fileOrder.push(uniqueName);

    if (fileMeta[uniqueName].id) {
      fileIdToName[fileMeta[uniqueName].id] = uniqueName;
    }
  });

  if (fileOrder.length === 0) {
    return createDefaultState();
  }

  return {
    files,
    fileMeta,
    fileOrder,
    fileIdToName,
    activeFile: fileOrder[0]
  };
};

const normalizeSnapshotFiles = (
  snapshotFiles = {},
  previousMeta = {},
  fallbackLanguage = DEFAULT_LANGUAGE
) => {
  if (!snapshotFiles || typeof snapshotFiles !== "object" || Array.isArray(snapshotFiles)) {
    return createDefaultState();
  }

  const entries = Object.entries(snapshotFiles);

  if (entries.length === 0) {
    return createDefaultState();
  }

  const previousMetaByLowerName = Object.entries(previousMeta || {}).reduce((acc, [name, meta]) => {
    acc[name.toLowerCase()] = meta;
    return acc;
  }, {});

  const existingNames = new Set();
  const files = {};
  const fileMeta = {};
  const fileOrder = [];
  const fileIdToName = {};

  entries.forEach(([name, value], index) => {
    const safeName = sanitizeClientFileName(name || `file-${index + 1}.txt`);
    const uniqueName = makeUniqueName(safeName, existingNames);
    const existing = previousMetaByLowerName[uniqueName.toLowerCase()] || {};
    const inferredLanguage = getLanguageFromFileName(
      uniqueName,
      existing?.language || fallbackLanguage
    );

    existingNames.add(uniqueName.toLowerCase());

    files[uniqueName] = typeof value === "string" ? value : value?.code || "";
    fileMeta[uniqueName] = {
      id: existing?.id || `local-${Date.now()}-${index}`,
      language: inferredLanguage,
      lastEditedBy: existing?.lastEditedBy || "",
      lastEditedAt: existing?.lastEditedAt || null
    };
    fileOrder.push(uniqueName);
    fileIdToName[fileMeta[uniqueName].id] = uniqueName;
  });

  return {
    files,
    fileMeta,
    fileOrder,
    fileIdToName,
    activeFile: fileOrder[0] || DEFAULT_FILE_NAME
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

  const [editorState, setEditorState] = useState(() => createDefaultState());
  const [recentActivity, setRecentActivity] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});

  const stateRef = useRef(editorState);
  const activityIdRef = useRef(0);

  useEffect(() => {
    stateRef.current = editorState;
  }, [editorState]);

  const activeFileName =
    editorState.files[editorState.activeFile] !== undefined
      ? editorState.activeFile
      : editorState.fileOrder[0] || DEFAULT_FILE_NAME;

  const code = editorState.files[activeFileName] ?? "";
  const language = getLanguageFromFileName(
    activeFileName,
    editorState.fileMeta[activeFileName]?.language || DEFAULT_LANGUAGE
  );

  const activeFile = useMemo(
    () => ({
      id: editorState.fileMeta[activeFileName]?.id || activeFileName,
      name: activeFileName,
      language,
      code,
      lastEditedBy: editorState.fileMeta[activeFileName]?.lastEditedBy || "",
      lastEditedAt: editorState.fileMeta[activeFileName]?.lastEditedAt || null
    }),
    [activeFileName, code, editorState.fileMeta, language]
  );

  const fileTabs = useMemo(() => {
    return editorState.fileOrder
      .map((fileName) => {
        if (editorState.files[fileName] === undefined) {
          return null;
        }

        return {
          id: editorState.fileMeta[fileName]?.id || fileName,
          name: fileName,
          language: getLanguageFromFileName(
            fileName,
            editorState.fileMeta[fileName]?.language || DEFAULT_LANGUAGE
          ),
          code: editorState.files[fileName],
          lastEditedBy: editorState.fileMeta[fileName]?.lastEditedBy || "",
          lastEditedAt: editorState.fileMeta[fileName]?.lastEditedAt || null
        };
      })
      .filter(Boolean);
  }, [editorState.fileMeta, editorState.fileOrder, editorState.files]);

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

  const emitCodeChange = ({ fileName, fileId, nextCode, nextLanguage, changes = [] }) => {
    if (!roomId || !userId || !fileName) return;

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

  const setActiveFileName = (nextFileName, options = { emit: true }) => {
    if (!nextFileName) return;

    const currentState = stateRef.current;
    const resolvedName = findFileNameCaseInsensitive(currentState.fileOrder, nextFileName);

    if (!resolvedName || currentState.files[resolvedName] === undefined) {
      return;
    }

    const inferredLanguage = getLanguageFromFileName(
      resolvedName,
      currentState.fileMeta[resolvedName]?.language || DEFAULT_LANGUAGE
    );

    setEditorState((prev) => ({
      ...prev,
      fileMeta: {
        ...prev.fileMeta,
        [resolvedName]: {
          ...prev.fileMeta[resolvedName],
          language: inferredLanguage
        }
      },
      activeFile: resolvedName
    }));

    if (!options?.emit || !roomId || !userId) {
      return;
    }

    socket.emit(SOCKET_EVENTS.FILE_CHANGE, {
      roomId,
      fileId: currentState.fileMeta[resolvedName]?.id,
      fileName: resolvedName,
      language: inferredLanguage,
      userId,
      userName
    });
  };

  const handleEditorChange = (nextCode = "", editorChanges = []) => {
    const currentState = stateRef.current;
    const currentFileName = currentState.activeFile;

    if (!currentFileName || currentState.files[currentFileName] === undefined) {
      return;
    }

    const nextLanguage = getLanguageFromFileName(
      currentFileName,
      currentState.fileMeta[currentFileName]?.language || DEFAULT_LANGUAGE
    );

    setEditorState((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [currentFileName]: nextCode
      },
      fileMeta: {
        ...prev.fileMeta,
        [currentFileName]: {
          ...prev.fileMeta[currentFileName],
          language: nextLanguage,
          lastEditedBy: userName,
          lastEditedAt: new Date().toISOString()
        }
      }
    }));

    emitCodeChange({
      fileName: currentFileName,
      fileId: currentState.fileMeta[currentFileName]?.id,
      nextCode,
      nextLanguage,
      changes: editorChanges
    });
  };

  const handleCursorMove = (position) => {
    if (!roomId || !userId || !position) return;

    const currentState = stateRef.current;
    const currentFileName = currentState.activeFile;

    socket.emit(SOCKET_EVENTS.CURSOR_MOVE, {
      roomId,
      userId,
      userName,
      fileId: currentState.fileMeta[currentFileName]?.id,
      fileName: currentFileName,
      position
    });
  };

  const createFile = ({ fileName, language: nextLanguage, initialCode = "" }) => {
    const currentState = stateRef.current;
    const existingNames = new Set(
      Object.keys(currentState.files).map((name) => name.toLowerCase())
    );
    const safeName = sanitizeClientFileName(fileName);
    const uniqueName = makeUniqueName(safeName, existingNames);
    const inferredLanguage = getLanguageFromFileName(
      uniqueName,
      nextLanguage || currentState.fileMeta[currentState.activeFile]?.language || DEFAULT_LANGUAGE
    );
    const optimisticFileId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setEditorState((prev) => {
      if (prev.files[uniqueName] !== undefined) {
        return {
          ...prev,
          activeFile: uniqueName
        };
      }

      return {
        files: {
          ...prev.files,
          [uniqueName]: initialCode
        },
        fileMeta: {
          ...prev.fileMeta,
          [uniqueName]: {
            id: optimisticFileId,
            language: inferredLanguage,
            lastEditedBy: userName,
            lastEditedAt: new Date().toISOString()
          }
        },
        fileOrder: [...prev.fileOrder, uniqueName],
        fileIdToName: {
          ...prev.fileIdToName,
          [optimisticFileId]: uniqueName
        },
        activeFile: uniqueName
      };
    });

    if (!roomId || !userId) {
      return;
    }

    socket.emit(SOCKET_EVENTS.FILE_CREATE, {
      roomId,
      fileName: uniqueName,
      language: inferredLanguage,
      code: initialCode,
      userId,
      userName
    });
  };

  const renameFile = ({ currentFileName, nextFileName }) => {
    const currentState = stateRef.current;
    const sourceName =
      findFileNameCaseInsensitive(currentState.fileOrder, currentFileName) ||
      currentState.activeFile;

    if (!sourceName || currentState.files[sourceName] === undefined) {
      return { success: false, message: "File not found." };
    }

    const sourceMeta = currentState.fileMeta[sourceName] || {};
    const requestedName = sanitizeClientFileName(nextFileName);
    const existingNames = new Set(
      currentState.fileOrder
        .filter((fileName) => fileName !== sourceName)
        .map((fileName) => fileName.toLowerCase())
    );
    const uniqueName = makeUniqueName(requestedName, existingNames);

    if (!uniqueName || uniqueName === sourceName) {
      return { success: false, message: "File name is unchanged." };
    }

    setEditorState((prev) => {
      if (prev.files[sourceName] === undefined) {
        return prev;
      }

      const nextFiles = {
        ...prev.files,
        [uniqueName]: prev.files[sourceName]
      };
      delete nextFiles[sourceName];

      const nextFileMeta = {
        ...prev.fileMeta,
        [uniqueName]: {
          ...prev.fileMeta[sourceName],
          language: getLanguageFromFileName(
            uniqueName,
            prev.fileMeta[sourceName]?.language || DEFAULT_LANGUAGE
          )
        }
      };
      delete nextFileMeta[sourceName];

      const nextOrder = prev.fileOrder.map((fileName) =>
        fileName === sourceName ? uniqueName : fileName
      );

      const nextIdToName = {
        ...prev.fileIdToName
      };

      const fileId = prev.fileMeta[sourceName]?.id;
      if (fileId) {
        nextIdToName[fileId] = uniqueName;
      }

      return {
        files: nextFiles,
        fileMeta: nextFileMeta,
        fileOrder: nextOrder,
        fileIdToName: nextIdToName,
        activeFile: prev.activeFile === sourceName ? uniqueName : prev.activeFile
      };
    });

    if (roomId && userId) {
      socket.emit(SOCKET_EVENTS.FILE_RENAME, {
        roomId,
        fileId: sourceMeta.id,
        oldFileName: sourceName,
        newFileName: uniqueName,
        language: getLanguageFromFileName(uniqueName, sourceMeta.language || DEFAULT_LANGUAGE),
        userId,
        userName
      });
    }

    return { success: true, fileName: uniqueName };
  };

  const deleteFile = (targetFileName) => {
    const currentState = stateRef.current;
    const resolvedTarget =
      findFileNameCaseInsensitive(currentState.fileOrder, targetFileName) ||
      currentState.activeFile;

    if (!resolvedTarget || currentState.files[resolvedTarget] === undefined) {
      return { success: false, message: "File not found." };
    }

    if (currentState.fileOrder.length <= 1) {
      return {
        success: false,
        message: "At least one file must remain in the room."
      };
    }

    const targetMeta = currentState.fileMeta[resolvedTarget] || {};
    const currentIndex = currentState.fileOrder.indexOf(resolvedTarget);
    const nextCandidate =
      currentState.fileOrder[currentIndex + 1] ||
      currentState.fileOrder[currentIndex - 1] ||
      currentState.fileOrder.find((name) => name !== resolvedTarget) ||
      DEFAULT_FILE_NAME;

    setEditorState((prev) => {
      if (prev.files[resolvedTarget] === undefined) {
        return prev;
      }

      const nextFiles = { ...prev.files };
      const nextFileMeta = { ...prev.fileMeta };
      const nextIdToName = { ...prev.fileIdToName };

      delete nextFiles[resolvedTarget];
      delete nextFileMeta[resolvedTarget];

      if (targetMeta.id) {
        delete nextIdToName[targetMeta.id];
      }

      const nextOrder = prev.fileOrder.filter((fileName) => fileName !== resolvedTarget);
      const nextActive =
        prev.activeFile === resolvedTarget
          ? nextCandidate
          : prev.activeFile;

      return {
        files: nextFiles,
        fileMeta: nextFileMeta,
        fileOrder: nextOrder,
        fileIdToName: nextIdToName,
        activeFile: nextActive
      };
    });

    if (roomId && userId) {
      socket.emit(SOCKET_EVENTS.FILE_DELETE, {
        roomId,
        fileId: targetMeta.id,
        fileName: resolvedTarget,
        userId,
        userName
      });
    }

    return { success: true };
  };

  const setLanguage = (nextLanguage) => {
    const normalizedLanguage = String(nextLanguage || DEFAULT_LANGUAGE).toLowerCase();
    const currentState = stateRef.current;
    const currentFileName = currentState.activeFile;

    if (!currentFileName || currentState.files[currentFileName] === undefined) {
      return;
    }

    setEditorState((prev) => ({
      ...prev,
      fileMeta: {
        ...prev.fileMeta,
        [currentFileName]: {
          ...prev.fileMeta[currentFileName],
          language: normalizedLanguage
        }
      }
    }));

    emitCodeChange({
      fileName: currentFileName,
      fileId: currentState.fileMeta[currentFileName]?.id,
      nextCode: currentState.files[currentFileName] || "",
      nextLanguage: normalizedLanguage,
      changes: []
    });
  };

  const hydrateFilesFromSnapshot = (snapshotFiles = {}, preferredActiveFile = "") => {
    setEditorState((prev) => {
      const normalized = normalizeSnapshotFiles(
        snapshotFiles,
        prev.fileMeta,
        prev.fileMeta[prev.activeFile]?.language || DEFAULT_LANGUAGE
      );
      const requestedActive = findFileNameCaseInsensitive(
        normalized.fileOrder,
        preferredActiveFile
      );
      const previousActive = findFileNameCaseInsensitive(normalized.fileOrder, prev.activeFile);

      return {
        ...normalized,
        activeFile: requestedActive || previousActive || normalized.activeFile || DEFAULT_FILE_NAME
      };
    });
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    const handleRoomState = (payload) => {
      if (!Array.isArray(payload?.files) || payload.files.length === 0) return;

      const normalized = normalizeServerFiles(payload.files, payload?.language || DEFAULT_LANGUAGE);
      const activeFromServer = normalized.fileIdToName[payload?.activeFileId];

      setEditorState({
        ...normalized,
        activeFile: activeFromServer || normalized.activeFile || DEFAULT_FILE_NAME
      });
    };

    const handleFileListUpdate = (payload) => {
      if (!Array.isArray(payload?.files) || payload.files.length === 0) return;

      const normalized = normalizeServerFiles(payload.files, payload?.language || DEFAULT_LANGUAGE);

      setEditorState((prev) => {
        const currentStillExists = normalized.files[prev.activeFile] !== undefined;

        if (currentStillExists && payload?.createdBy?.id !== userId) {
          return {
            ...normalized,
            activeFile: prev.activeFile
          };
        }

        const activeFromServer = normalized.fileIdToName[payload?.activeFileId];
        const previousActive =
          normalized.files[prev.activeFile] !== undefined ? prev.activeFile : "";

        return {
          ...normalized,
          activeFile: activeFromServer || previousActive || normalized.activeFile || DEFAULT_FILE_NAME
        };
      });
    };

    const handleCodeUpdate = (payload) => {
      if (!payload || payload?.userId === userId) return;

      const changes = Array.isArray(payload?.changes) ? payload.changes : [];

      setEditorState((prev) => {
        let targetName = "";

        if (payload?.fileId && prev.fileIdToName[payload.fileId]) {
          targetName = prev.fileIdToName[payload.fileId];
        } else if (payload?.fileName) {
          targetName = findFileNameCaseInsensitive(prev.fileOrder, payload.fileName);
        }

        if (!targetName) {
          const safeName = sanitizeClientFileName(payload?.fileName || "untitled.txt");
          const existingNames = new Set(prev.fileOrder.map((name) => name.toLowerCase()));
          targetName = makeUniqueName(safeName, existingNames);
        }

        const previousCode = prev.files[targetName] ?? "";
        const previousMeta = prev.fileMeta[targetName] || {};
        const nextCode = typeof payload?.code === "string" ? payload.code : previousCode;
        const nextLanguage = getLanguageFromFileName(
          targetName,
          payload?.language || previousMeta.language || DEFAULT_LANGUAGE
        );

        const fileId =
          payload?.fileId ||
          previousMeta.id ||
          `remote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const nextFiles = {
          ...prev.files,
          [targetName]: nextCode
        };
        const nextFileMeta = {
          ...prev.fileMeta,
          [targetName]: {
            ...previousMeta,
            id: fileId,
            language: nextLanguage,
            lastEditedBy: payload?.userName || "Collaborator",
            lastEditedAt: payload?.timestamp || new Date().toISOString()
          }
        };
        const nextOrder = prev.fileOrder.includes(targetName)
          ? prev.fileOrder
          : [...prev.fileOrder, targetName];
        const nextIdToName = {
          ...prev.fileIdToName,
          [fileId]: targetName
        };

        const nextActive =
          nextFiles[prev.activeFile] !== undefined ? prev.activeFile : targetName;

        return {
          files: nextFiles,
          fileMeta: nextFileMeta,
          fileOrder: nextOrder,
          fileIdToName: nextIdToName,
          activeFile: nextActive
        };
      });

      pushActivity({
        fileName: payload?.fileName || "untitled.txt",
        userId: payload?.userId,
        userName: payload?.userName || "Collaborator",
        timestamp: payload?.timestamp || new Date().toISOString(),
        changes,
        summary: buildChangeSummary(changes)
      });
    };

    const handleFileChange = (payload) => {
      if (!payload) return;

      setEditorState((prev) => {
        const fileNameFromId = payload?.fileId ? prev.fileIdToName[payload.fileId] : "";
        const byName = payload?.fileName
          ? findFileNameCaseInsensitive(prev.fileOrder, payload.fileName)
          : "";
        const targetName = fileNameFromId || byName || payload?.fileName;

        if (!targetName) {
          return prev;
        }

        if (prev.files[targetName] === undefined) {
          const inferredLanguage = getLanguageFromFileName(
            targetName,
            payload?.language || DEFAULT_LANGUAGE
          );
          const syntheticId = payload?.fileId || `synthetic-${Date.now()}`;

          return {
            files: {
              ...prev.files,
              [targetName]: ""
            },
            fileMeta: {
              ...prev.fileMeta,
              [targetName]: {
                id: syntheticId,
                language: inferredLanguage,
                lastEditedBy: "",
                lastEditedAt: null
              }
            },
            fileOrder: prev.fileOrder.includes(targetName)
              ? prev.fileOrder
              : [...prev.fileOrder, targetName],
            fileIdToName: {
              ...prev.fileIdToName,
              ...(payload?.fileId ? { [payload.fileId]: targetName } : {})
            },
            activeFile: targetName
          };
        }

        return {
          ...prev,
          fileMeta: {
            ...prev.fileMeta,
            [targetName]: {
              ...prev.fileMeta[targetName],
              id: payload?.fileId || prev.fileMeta[targetName]?.id,
              language: getLanguageFromFileName(
                targetName,
                payload?.language || prev.fileMeta[targetName]?.language || DEFAULT_LANGUAGE
              )
            }
          },
          fileIdToName: {
            ...prev.fileIdToName,
            ...(payload?.fileId ? { [payload.fileId]: targetName } : {})
          },
          activeFile: targetName
        };
      });
    };

    const handleFileRenamed = (payload) => {
      if (!payload) return;

      setEditorState((prev) => {
        const currentName = payload?.fileId
          ? prev.fileIdToName[payload.fileId]
          : findFileNameCaseInsensitive(prev.fileOrder, payload?.oldFileName || payload?.fileName);

        if (!currentName || prev.files[currentName] === undefined) {
          return prev;
        }

        const requestedName = sanitizeClientFileName(payload?.fileName || currentName);
        const existingNames = new Set(
          prev.fileOrder
            .filter((fileName) => fileName !== currentName)
            .map((fileName) => fileName.toLowerCase())
        );
        const uniqueName = makeUniqueName(requestedName, existingNames);

        if (uniqueName === currentName) {
          return prev;
        }

        const nextFiles = {
          ...prev.files,
          [uniqueName]: prev.files[currentName]
        };
        delete nextFiles[currentName];

        const nextMeta = {
          ...prev.fileMeta,
          [uniqueName]: {
            ...prev.fileMeta[currentName],
            language: getLanguageFromFileName(
              uniqueName,
              payload?.language || prev.fileMeta[currentName]?.language || DEFAULT_LANGUAGE
            )
          }
        };
        delete nextMeta[currentName];

        const nextOrder = prev.fileOrder.map((fileName) =>
          fileName === currentName ? uniqueName : fileName
        );

        const nextIdToName = {
          ...prev.fileIdToName
        };

        const fileId = payload?.fileId || prev.fileMeta[currentName]?.id;
        if (fileId) {
          nextIdToName[fileId] = uniqueName;
        }

        return {
          files: nextFiles,
          fileMeta: nextMeta,
          fileOrder: nextOrder,
          fileIdToName: nextIdToName,
          activeFile: prev.activeFile === currentName ? uniqueName : prev.activeFile
        };
      });
    };

    const handleFileDeleted = (payload) => {
      if (!payload) return;

      setEditorState((prev) => {
        const targetName = payload?.fileId
          ? prev.fileIdToName[payload.fileId]
          : findFileNameCaseInsensitive(prev.fileOrder, payload?.fileName);

        if (!targetName || prev.files[targetName] === undefined || prev.fileOrder.length <= 1) {
          return prev;
        }

        const nextFiles = { ...prev.files };
        const nextMeta = { ...prev.fileMeta };
        const nextIdToName = { ...prev.fileIdToName };

        delete nextFiles[targetName];
        delete nextMeta[targetName];

        if (payload?.fileId) {
          delete nextIdToName[payload.fileId];
        }

        const nextOrder = prev.fileOrder.filter((fileName) => fileName !== targetName);
        const nextActive =
          prev.activeFile === targetName
            ? nextOrder[0] || DEFAULT_FILE_NAME
            : prev.activeFile;

        return {
          files: nextFiles,
          fileMeta: nextMeta,
          fileOrder: nextOrder,
          fileIdToName: nextIdToName,
          activeFile: nextActive
        };
      });
    };

    const handleCursorUpdate = (payload) => {
      if (!payload?.userId || payload.userId === userId) return;

      const currentState = stateRef.current;
      const cursorFileName =
        payload?.fileName ||
        (payload?.fileId ? currentState.fileIdToName[payload.fileId] : "") ||
        "untitled.txt";

      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          userName: payload.userName || "Collaborator",
          fileId: payload.fileId,
          fileName: cursorFileName,
          position: payload.position,
          timestamp: payload.timestamp
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
    socket.on(SOCKET_EVENTS.FILE_CHANGE, handleFileChange);
    socket.on(SOCKET_EVENTS.FILE_RENAMED, handleFileRenamed);
    socket.on(SOCKET_EVENTS.FILE_DELETED, handleFileDeleted);
    socket.on(SOCKET_EVENTS.CURSOR_UPDATE, handleCursorUpdate);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.FILE_LIST_UPDATE, handleFileListUpdate);
      socket.off(SOCKET_EVENTS.CODE_UPDATE, handleCodeUpdate);
      socket.off(SOCKET_EVENTS.FILE_CHANGE, handleFileChange);
      socket.off(SOCKET_EVENTS.FILE_RENAMED, handleFileRenamed);
      socket.off(SOCKET_EVENTS.FILE_DELETED, handleFileDeleted);
      socket.off(SOCKET_EVENTS.CURSOR_UPDATE, handleCursorUpdate);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    };
  }, [roomId, socket, userId, userName]);

  return {
    files: editorState.files,
    filesByName: editorState.files,
    fileTabs,
    activeFileName,
    activeFile,
    code,
    language,
    recentActivity,
    remoteCursors,
    setActiveFileName,
    setLanguage,
    handleEditorChange,
    handleCursorMove,
    createFile,
    renameFile,
    deleteFile,
    hydrateFilesFromSnapshot
  };
};

export default useEditor;
