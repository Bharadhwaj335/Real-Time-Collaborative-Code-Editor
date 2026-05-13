import Avatar from "../Common/Avatar";
import { formatMessageTime } from "../../utils/helpers";

const MessageItem = ({ message, isOwnMessage }) => {
  if (message?.isSystem) {
    return (
      <div className="flex justify-center py-0.5">
        <p className="max-w-[95%] rounded-lg border border-[#3c3c3c]/80 bg-[#252526]/90 px-2.5 py-1 text-center text-[11px] leading-snug text-slate-400">
          {message?.text}
        </p>
      </div>
    );
  }

  const senderName =
    message?.senderName || message?.sender?.name || message?.username || "Collaborator";

  const text = message?.text || message?.content || "";
  const time = formatMessageTime(message?.createdAt || message?.timestamp);

  return (
    <div className={`flex gap-2 py-0.5 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage && (
        <div className="mt-0.5 shrink-0">
          <Avatar name={senderName} size="sm" />
        </div>
      )}

      <div
        className={`max-w-[min(88%,420px)] rounded-2xl border px-2.5 py-1.5 text-[13px] shadow-sm transition ${
          isOwnMessage
            ? "border-[#0a7ab8]/35 bg-[#0a7ab8]/18 text-slate-100"
            : "border-[#3c3c3c]/90 bg-[#252526] text-slate-100"
        }`}
      >
        <div className="mb-0.5 flex items-baseline justify-between gap-2">
          <p
            className={`truncate text-[11px] font-semibold ${
              isOwnMessage ? "text-[#cfe9ff]" : "text-slate-400"
            }`}
          >
            {isOwnMessage ? "You" : senderName}
          </p>
          {time ? (
            <p className="shrink-0 text-[10px] font-medium text-slate-500 tabular-nums">{time}</p>
          ) : null}
        </div>

        <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-100/95">{text}</p>
      </div>
    </div>
  );
};

export default MessageItem;
