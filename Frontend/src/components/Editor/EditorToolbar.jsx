import Button from "../Common/Button";
import LanguageSelector from "./LanguageSelector";

const EditorToolbar = ({
  roomId,
  language,
  activeFileName,
  filesCount,
  onLanguageChange,
  onRunCode,
  onCopyLink,
  onCreateFile,
  isRunning
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#252526] px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="rounded-md bg-black/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
          Room {roomId}
        </p>

        <p className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-200">
          {activeFileName || "untitled"}
        </p>

        <p className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300">
          {filesCount || 0} files
        </p>

        <LanguageSelector value={language} onChange={onLanguageChange} />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onCreateFile}>
          New File
        </Button>

        <Button variant="secondary" onClick={onCopyLink}>
          Copy Invite Link
        </Button>

        <Button onClick={onRunCode} loading={isRunning}>
          Run Code
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
