import Avatar from "../Common/Avatar";
import { formatMessageTime } from "../../utils/helpers";

const MessageItem = ({ message, isOwnMessage }) => {
  if (message?.isSystem) {
    return (
      <div className="flex justify-center">
        <p className="rounded-md border border-[#3c3c3c] bg-[#252526] px-2.5 py-1 text-[11px] text-slate-300">
          {message?.text}
        </p>
      </div>
    );
  }

  const senderName =
    message?.senderName ||
    message?.sender?.name ||
    message?.username ||
    "Collaborator";

  const text = message?.text || message?.content || "";

  return (
    <div className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage && <Avatar name={senderName} size="sm" />}

      <div
        className={`max-w-[82%] rounded-xl border px-3 py-2 text-sm ${
          isOwnMessage
            ? "border-[#007acc]/50 bg-[#007acc]/20 text-white"
            : "border-[#3c3c3c] bg-[#252526] text-slate-100"
        }`}
      >
        <p className={`mb-1 text-xs font-semibold ${isOwnMessage ? "text-[#cfe9ff]" : "text-slate-300"}`}>
          {isOwnMessage ? "You" : senderName}
        </p>

        <p className="leading-relaxed">{text}</p>

        <p className="mt-1 text-right text-[10px] text-slate-400">
          {formatMessageTime(message?.createdAt || message?.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageItem;
