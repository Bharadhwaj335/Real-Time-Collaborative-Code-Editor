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
      ? "text-amber-200 border-amber-500/40 bg-amber-500/10"
      : executionStatus === "success"
      ? "text-emerald-200 border-emerald-500/40 bg-emerald-500/10"
      : executionStatus === "error"
      ? "text-rose-200 border-rose-500/40 bg-rose-500/10"
      : "text-slate-300 border-[#334155] bg-[#0f172a]";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#334155] bg-[#1e293b] px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="rounded-md border border-[#334155] bg-[#0f172a] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
          Room {roomId}
        </p>

        <p className="rounded-md border border-[#334155] bg-[#0f172a] px-2.5 py-1 text-xs font-semibold text-blue-200">
          {activeFileName || "untitled"}
        </p>

        <LanguageSelector value={language} onChange={onLanguageChange} />
      </div>

      <div className="flex items-center gap-2">
        <p className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
          {statusLabel}
        </p>

        <Button variant="secondary" onClick={onCopyLink}>
          Copy Invite Link
        </Button>

        <Button onClick={onRunCode} loading={isRunning} disabled={isRunning}>
          Run Code
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
