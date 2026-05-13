import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaComments } from "react-icons/fa";
import toast from "react-hot-toast";
import MessageItem from "./MessageItem";
import useSocket from "../../hooks/useSocket";
import { getRoomMessages } from "../../services/api";
import { SOCKET_EVENTS } from "../../utils/constants";
import Button from "../Common/Button";
import Loader from "../Common/Loader";

const normalizeMessage = (message) => ({
  id: message?._id || message?.id || message?.clientTempId,
  roomId: message?.roomId,
  text: message?.text || message?.content || "",
  senderId: message?.senderId || message?.sender?.id,
  senderName: message?.senderName || message?.sender?.name || message?.username,
  timestamp: message?.timestamp || message?.createdAt || new Date().toISOString(),
  clientTempId: message?.clientTempId,
  isSystem: Boolean(message?.isSystem),
  systemType: message?.systemType || ""
});

const ChatBox = ({ roomId, user }) => {
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const languageByFileRef = useRef({});

  const currentUserId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await getRoomMessages(roomId);
        const rawMessages = Array.isArray(response)
          ? response
          : response?.messages || response?.data || [];

        if (!isMounted) return;
        setMessages(rawMessages.map(normalizeMessage));
      } catch {
        if (isMounted) {
          toast.error("Could not load chat history.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (roomId) {
      fetchMessages();
    }

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    const handleNewMessage = (payload) => {
      if (!payload) return;
      if (payload.roomId && payload.roomId !== roomId) return;

      const incoming = normalizeMessage(payload);

      if (incoming?.senderId) {
        setTypingUsers((prev) => {
          if (!prev[incoming.senderId]) {
            return prev;
          }

          const next = { ...prev };
          delete next[incoming.senderId];
          return next;
        });
      }

      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            (incoming.id && item.id && incoming.id === item.id) ||
            (incoming.clientTempId && item.clientTempId === incoming.clientTempId)
        );

        if (existingIndex === -1) {
          return [...prev, incoming];
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...incoming
        };
        return updated;
      });
    };

    const appendSystemMessage = (systemType, text) => {
      setMessages((prev) => [
        ...prev,
        normalizeMessage({
          id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          roomId,
          text,
          isSystem: true,
          systemType,
          timestamp: new Date().toISOString()
        })
      ]);
    };

    const handleUserJoined = (payload) => {
      const joinedUser = payload?.user;

      if (!joinedUser?.id || joinedUser.id === currentUserId) {
        return;
      }

      appendSystemMessage("user_joined", `${joinedUser.name || "Collaborator"} joined the room.`);
    };

    const handleUserLeft = (payload) => {
      const leftUserId = payload?.userId || payload?.id;

      if (!leftUserId || leftUserId === currentUserId) {
        return;
      }

      const leftUserName = payload?.userName || "A collaborator";
      appendSystemMessage("user_left", `${leftUserName} left the room.`);
    };

    const handleFileChange = (payload) => {
      if (!payload?.language || !payload?.userId) {
        return;
      }

      const key = payload?.fileId || payload?.fileName || "active";
      const previousLanguage = languageByFileRef.current[key];
      const nextLanguage = String(payload.language).toLowerCase();
      languageByFileRef.current[key] = nextLanguage;

      if (!previousLanguage || previousLanguage === nextLanguage) {
        return;
      }

      const actor = payload?.userName || "A collaborator";
      appendSystemMessage("language_changed", `${actor} changed language to ${nextLanguage}.`);
    };

    const handleTypingUpdate = (payload) => {
      if (!payload?.userId || payload.userId === currentUserId) return;
      if (payload?.roomId && payload.roomId !== roomId) return;

      setTypingUsers((prev) => {
        if (!payload.isTyping) {
          if (!prev[payload.userId]) {
            return prev;
          }

          const next = { ...prev };
          delete next[payload.userId];
          return next;
        }

        return {
          ...prev,
          [payload.userId]: payload.userName || "Collaborator"
        };
      });
    };

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleTypingUpdate);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.FILE_CHANGE, handleFileChange);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleTypingUpdate);
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      socket.off(SOCKET_EVENTS.FILE_CHANGE, handleFileChange);
    };
  }, [currentUserId, roomId, socket]);

  useEffect(() => {
    if (!messageContainerRef.current) return;

    if (!shouldAutoScrollRef.current) {
      return;
    }

    messageContainerRef.current.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const emitTypingState = useCallback((isTyping) => {
    if (!roomId || !currentUserId) return;

    socket.emit(SOCKET_EVENTS.USER_TYPING, {
      roomId,
      userId: currentUserId,
      userName: user?.name,
      isTyping
    });
  }, [currentUserId, roomId, socket, user?.name]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      emitTypingState(false);
    };
  }, [emitTypingState]);

  const handleSend = () => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    emitTypingState(false);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const payload = {
      roomId,
      text: cleanMessage,
      senderId: user?.id,
      senderName: user?.name,
      clientTempId: `temp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, normalizeMessage(payload)]);
    socket.emit(SOCKET_EVENTS.SEND_MESSAGE, payload);
    setMessage("");
  };

  const handleMessageScroll = () => {
    const container = messageContainerRef.current;

    if (!container) {
      return;
    }

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldAutoScrollRef.current = distanceToBottom < 80;
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e]">
      <header className="shrink-0 border-b border-[#2a2a2a] bg-[#252526] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Chat</h3>
            <p className="text-[11px] text-slate-500">Synced for everyone in this room.</p>
          </div>
          <span className="rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
            {messages.length}
          </span>
        </div>
      </header>

      <div
        ref={messageContainerRef}
        onScroll={handleMessageScroll}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3"
      >
        {loading && <Loader label="Loading chat..." />}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#3c3c3c]/80 bg-[#252526]/40 px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] text-slate-500">
              <FaComments className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-[13px] font-medium text-slate-300">No messages yet</p>
            <p className="max-w-[240px] text-[12px] leading-relaxed text-slate-500">
              Say hi to your collaborators — messages are saved for this room.
            </p>
          </div>
        )}

        {!loading &&
          messages.map((item) => (
            <MessageItem
              key={item.id || item.clientTempId}
              message={item}
              isOwnMessage={item.senderId === currentUserId}
            />
          ))}
      </div>

      <div className="shrink-0 border-t border-[#2a2a2a] bg-[#252526] p-2.5">
        {Object.keys(typingUsers).length > 0 && (
          <p className="mb-2 rounded-lg border border-[#3c3c3c]/80 bg-[#1e1e1e] px-2 py-1 text-[11px] text-[#c9c48a]">
            {Object.values(typingUsers).slice(0, 2).join(", ")}
            {Object.keys(typingUsers).length > 2 ? " and others" : ""}{" "}
            {Object.keys(typingUsers).length > 1 ? "are" : "is"} typing…
          </p>
        )}

        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              emitTypingState(true);

              if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
              }

              typingTimeoutRef.current = window.setTimeout(() => {
                emitTypingState(false);
              }, 1000);
            }}
            placeholder="Message the room…"
            rows={2}
            className="min-h-[48px] flex-1 resize-none rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-2.5 py-2 text-[13px] text-white outline-none transition placeholder:text-slate-600 focus:border-[#0a7ab8] focus:ring-1 focus:ring-[#0a7ab8]/30"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />

          <Button onClick={handleSend} className="h-[48px] shrink-0 !px-3 !py-2 !text-xs !font-semibold">
            Send
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChatBox;
