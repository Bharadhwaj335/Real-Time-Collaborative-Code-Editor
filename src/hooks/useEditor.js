import { useEffect, useState } from "react";
import useSocket from "./useSocket";
import {
  DEFAULT_EDITOR_CODE,
  DEFAULT_LANGUAGE,
  SOCKET_EVENTS
} from "../utils/constants";

const useEditor = ({ roomId, user }) => {
  const { socket } = useSocket();

  const [code, setCode] = useState(DEFAULT_EDITOR_CODE);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [remoteCursors, setRemoteCursors] = useState({});

  const userId = user?.id;
  const userName = user?.name || "Guest";

  const handleEditorChange = (nextCode = "") => {
    setCode(nextCode);

    if (!roomId || !userId) return;

    socket.emit(SOCKET_EVENTS.CODE_CHANGE, {
      roomId,
      code: nextCode,
      language,
      userId,
      userName
    });
  };

  const handleCursorMove = (position) => {
    if (!roomId || !userId || !position) return;

    socket.emit(SOCKET_EVENTS.CURSOR_MOVE, {
      roomId,
      userId,
      userName,
      position
    });
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    const handleCodeUpdate = (payload) => {
      if (!payload) return;
      if (payload.userId && payload.userId === userId) return;

      if (typeof payload.code === "string") {
        setCode(payload.code);
      }

      if (payload.language) {
        setLanguage(payload.language);
      }
    };

    const handleCursorUpdate = (payload) => {
      if (!payload?.userId || payload.userId === userId) return;

      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          userName: payload.userName || "Collaborator",
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

    socket.on(SOCKET_EVENTS.CODE_UPDATE, handleCodeUpdate);
    socket.on(SOCKET_EVENTS.CURSOR_UPDATE, handleCursorUpdate);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);

    return () => {
      socket.off(SOCKET_EVENTS.CODE_UPDATE, handleCodeUpdate);
      socket.off(SOCKET_EVENTS.CURSOR_UPDATE, handleCursorUpdate);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    };
  }, [roomId, socket, userId]);

  const updateLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);

    if (!roomId || !userId) return;

    socket.emit(SOCKET_EVENTS.CODE_CHANGE, {
      roomId,
      code,
      language: nextLanguage,
      userId,
      userName
    });
  };

  return {
    code,
    setCode,
    language,
    setLanguage: updateLanguage,
    remoteCursors,
    handleEditorChange,
    handleCursorMove
  };
};

export default useEditor;
