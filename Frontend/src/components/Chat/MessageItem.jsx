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
        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
          isOwnMessage
            ? "bg-blue-500/20 text-blue-50"
            : "bg-[#252526] text-slate-100"
        }`}
      >
        {!isOwnMessage && <p className="mb-1 text-xs font-semibold text-blue-300">{senderName}</p>}

        <p className="leading-relaxed">{text}</p>

        <p className="mt-1 text-right text-[10px] text-slate-400">
          {formatMessageTime(message?.createdAt || message?.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageItem;
