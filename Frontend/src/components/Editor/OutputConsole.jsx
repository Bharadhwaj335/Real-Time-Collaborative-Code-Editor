import { useEffect, useMemo, useRef, useState } from "react";
import { FaTerminal } from "react-icons/fa";

const tabKeys = {
  output: "output",
  errors: "errors",
  logs: "logs"
};

const formatLogTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

const STATUS_STYLE = {
  idle: "text-slate-500",
  running: "text-amber-300/95",
  success: "text-emerald-300/95",
  error: "text-rose-300/95"
};

const STATUS_LABEL = {
  idle: "Idle",
  running: "Running",
  success: "Success",
  error: "Error"
};

const tabClass = (active) =>
  `rounded-lg px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/35 ${
    active ? "bg-[#0a7ab8] text-white shadow-sm" : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
  }`;

const OutputConsole = ({
  stdout = "",
  stderr = "",
  runtimeError = "",
  logs = [],
  executionStatus = "idle",
  onClear,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState(tabKeys.output);
  const containerRef = useRef(null);

  const errors = useMemo(() => {
    const items = [];

    if (stderr?.trim()) {
      items.push(stderr.trim());
    }

    if (runtimeError?.trim()) {
      items.push(runtimeError.trim());
    }

    return items;
  }, [runtimeError, stderr]);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [activeTab, errors, logs, stdout]);

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] ${className}`}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#2a2a2a] bg-[#252526] px-2.5 py-1.5">
        <div className="flex items-center gap-1">
          <span className="mr-1 hidden text-slate-500 sm:inline" aria-hidden>
            <FaTerminal className="inline h-3 w-3" />
          </span>
          <button type="button" onClick={() => setActiveTab(tabKeys.output)} className={tabClass(activeTab === tabKeys.output)}>
            Output
          </button>

          <button type="button" onClick={() => setActiveTab(tabKeys.errors)} className={tabClass(activeTab === tabKeys.errors)}>
            Errors
          </button>

          <button type="button" onClick={() => setActiveTab(tabKeys.logs)} className={tabClass(activeTab === tabKeys.logs)}>
            Logs
          </button>
        </div>

        <div className="flex items-center gap-2">
          <p className={`text-[11px] font-semibold ${STATUS_STYLE[executionStatus] || STATUS_STYLE.idle}`}>
            {STATUS_LABEL[executionStatus] || STATUS_LABEL.idle}
          </p>

          <button
            type="button"
            onClick={() => onClear?.()}
            className="rounded-lg border border-[#3c3c3c] px-2 py-0.5 text-[11px] font-semibold text-slate-400 transition hover:border-[#0a7ab8]/40 hover:text-[#cfe9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/30"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#1a1a1a] px-3 py-2 font-mono text-[11px] leading-relaxed"
      >
        {activeTab === tabKeys.output && (
          <>
            {stdout?.trim() ? (
              <pre className="whitespace-pre-wrap break-words text-emerald-300/90">{stdout}</pre>
            ) : (
              <p className="text-slate-500">No program output yet. Run your code to see results here.</p>
            )}
          </>
        )}

        {activeTab === tabKeys.errors && (
          <div className="space-y-2">
            {errors.length === 0 ? (
              <p className="text-slate-500">No errors recorded for the last run.</p>
            ) : (
              errors.map((item, index) => (
                <pre key={`${item}-${index}`} className="whitespace-pre-wrap break-words text-rose-300/90">
                  {item}
                </pre>
              ))
            )}
          </div>
        )}

        {activeTab === tabKeys.logs && (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-500">Room activity logs will appear here.</p>
            ) : (
              logs.map((log) => {
                const tone =
                  log.level === "error"
                    ? "text-rose-300/90"
                    : log.level === "warning"
                      ? "text-amber-300/90"
                      : "text-emerald-300/85";

                return (
                  <p key={log.id} className={tone}>
                    <span className="text-slate-500">[{formatLogTime(log.timestamp)}]</span> {log.message}
                  </p>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default OutputConsole;
