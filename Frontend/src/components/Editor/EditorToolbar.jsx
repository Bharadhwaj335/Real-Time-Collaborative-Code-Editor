import { FaLink, FaPlay } from "react-icons/fa";
import Button from "../Common/Button";
import LanguageSelector from "./LanguageSelector";

const EditorToolbar = ({
  roomId,
  language,
  activeFileName,
  onLanguageChange,
  onRunCode,
  onCopyLink,
  isRunning,
  executionStatus = "idle"
}) => {
  const statusLabel =
    executionStatus === "running"
      ? "Running"
      : executionStatus === "success"
        ? "Success"
        : executionStatus === "error"
          ? "Error"
          : "Idle";

  const statusStyle =
    executionStatus === "running"
      ? "text-amber-200/95 border-amber-500/30 bg-amber-500/[0.08]"
      : executionStatus === "success"
        ? "text-emerald-200/95 border-emerald-500/25 bg-emerald-500/[0.08]"
        : executionStatus === "error"
          ? "text-rose-200/95 border-rose-500/25 bg-rose-500/[0.08]"
          : "text-slate-400 border-[#3c3c3c] bg-[#1e1e1e]";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#2a2a2a] bg-[#252526] px-3 py-2 sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span
          className="hidden max-w-[140px] truncate rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 font-mono text-[11px] font-medium text-slate-400 sm:inline sm:max-w-[180px]"
          title={roomId}
        >
          <span className="text-slate-500">#</span>
          {roomId}
        </span>

        <span className="max-w-[min(200px,40vw)] truncate rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-[11px] font-medium text-[#cfe9ff]">
          {activeFileName || "untitled"}
        </span>

        <LanguageSelector value={language} onChange={onLanguageChange} />
      </div>

      <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
        <span
          className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
        >
          {statusLabel}
        </span>

        <Button
          variant="secondary"
          onClick={onCopyLink}
          className="gap-1.5 !rounded-xl !px-2.5 !py-1.5 !text-[11px] !font-semibold"
        >
          <FaLink className="h-3 w-3 opacity-80" aria-hidden />
          Invite
        </Button>

        <Button
          onClick={onRunCode}
          loading={isRunning}
          disabled={isRunning}
          className="gap-1.5 !rounded-xl !px-3 !py-1.5 !text-[11px] !font-semibold"
        >
          {!isRunning && <FaPlay className="h-2.5 w-2.5" aria-hidden />}
          Run
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
