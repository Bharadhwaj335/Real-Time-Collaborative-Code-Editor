import { useEffect, useMemo, useRef, useState } from "react";
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
  clientTempId: message?.clientTempId
});

const ChatBox = ({ roomId, user }) => {
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messageContainerRef = useRef(null);

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

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    };
  }, [roomId, socket]);

  useEffect(() => {
    if (!messageContainerRef.current) return;

    messageContainerRef.current.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const handleSend = () => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

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

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-[#334155] bg-[#0f172a]">
      <header className="border-b border-[#334155] px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Room Chat</h3>
      </header>

      <div ref={messageContainerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading && <Loader label="Loading chat..." />}

        {!loading && messages.length === 0 && (
          <p className="rounded-lg border border-[#334155] bg-[#1e293b] p-3 text-sm text-slate-400">
            No messages yet. Start the conversation.
          </p>
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

      <div className="border-t border-[#334155] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="min-h-[54px] flex-1 resize-none rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3b82f6]"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />

          <Button onClick={handleSend} className="h-[54px]">
            Send
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChatBox;
