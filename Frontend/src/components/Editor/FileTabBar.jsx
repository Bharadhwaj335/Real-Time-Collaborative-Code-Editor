import { FaPlus, FaTimes } from "react-icons/fa";

const FileTabBar = ({
  tabs = [],
  activeFileName,
  dirtyFiles,
  onSelect,
  onClose,
  onAdd,
  onRequestRename
}) => {
  return (
    <div className="flex min-h-0 items-stretch border-b border-[#2a2a2a] bg-[#252526]">
      <div className="flex min-w-0 flex-1 items-stretch gap-px overflow-x-auto overflow-y-hidden px-1 py-0.5 [scrollbar-width:thin]">
        {tabs.map((file) => {
          const active = file.name === activeFileName;
          const dirty = dirtyFiles?.has?.(file.name);

          return (
            <div
              key={file.name}
              role="tab"
              aria-selected={active}
              className={`group relative flex h-8 max-w-[180px] shrink-0 items-stretch rounded-md border transition ${
                active
                  ? "z-[1] border-[#1e1e1e] bg-[#1e1e1e] text-slate-100 shadow-[inset_0_-2px_0_#0a7ab8]"
                  : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(file.name)}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  onRequestRename?.(file.name);
                }}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    onClose?.(file.name, { fromMiddleClick: true });
                  }
                }}
                className="flex min-w-0 flex-1 items-center gap-1 px-2 py-0 text-left text-[11px] font-medium leading-none"
                title={file.name}
              >
                <span className="min-w-0 flex-1 truncate">
                  {file.name}
                  {dirty ? (
                    <span className="text-amber-300/95" aria-hidden>
                      {" "}
                      *
                    </span>
                  ) : null}
                </span>
                {dirty ? (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/95 shadow-[0_0_6px_rgba(251,191,36,0.35)]"
                    title="Unsaved"
                  />
                ) : null}
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose?.(file.name, { fromMiddleClick: false });
                }}
                className={`flex h-full w-6 shrink-0 items-center justify-center rounded-r-md text-slate-500 transition hover:bg-white/[0.07] hover:text-slate-200 ${
                  active ? "opacity-80" : "opacity-0 group-hover:opacity-90"
                }`}
                aria-label={`Close ${file.name}`}
              >
                <FaTimes className="text-[9px]" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="m-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-md border border-[#3c3c3c]/80 bg-[#1e1e1e] text-slate-400 transition hover:border-[#0a7ab8]/40 hover:text-[#cfe9ff]"
        title="New file"
      >
        <FaPlus className="text-[9px]" aria-hidden />
      </button>
    </div>
  );
};

export default FileTabBar;
