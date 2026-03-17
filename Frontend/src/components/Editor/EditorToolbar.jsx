import Button from "../Common/Button";
import LanguageSelector from "./LanguageSelector";

const EditorToolbar = ({
  roomId,
  language,
  activeFileName,
  onLanguageChange,
  onRunCode,
  onCopyLink,
  isRunning
}) => {
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
