import Avatar from "../Common/Avatar";
import { formatMessageTime } from "../../utils/helpers";

const MessageItem = ({ message, isOwnMessage }) => {
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
            ? "border-[#3b82f6]/50 bg-[#3b82f6]/20 text-blue-50"
            : "border-[#334155] bg-[#1e293b] text-slate-100"
        }`}
      >
        <p className={`mb-1 text-xs font-semibold ${isOwnMessage ? "text-blue-200" : "text-slate-300"}`}>
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
