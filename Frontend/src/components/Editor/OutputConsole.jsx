import { useEffect, useMemo, useRef, useState } from "react";

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
  idle: "text-slate-400",
  running: "text-amber-300",
  success: "text-emerald-300",
  error: "text-rose-300"
};

const STATUS_LABEL = {
  idle: "Idle",
  running: "Running",
  success: "Success",
  error: "Error"
};

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
    <section className={`flex h-full min-h-0 flex-col rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] ${className}`}>
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#252526] px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(tabKeys.output)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tabKeys.output ? "bg-[#007acc] text-white" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Output
          </button>

          <button
            onClick={() => setActiveTab(tabKeys.errors)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tabKeys.errors ? "bg-[#5a1d1d] text-[#ffb4b4]" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Errors
          </button>

          <button
            onClick={() => setActiveTab(tabKeys.logs)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tabKeys.logs ? "bg-[#43311a] text-[#f5d08c]" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Logs
          </button>
        </div>

        <div className="flex items-center gap-3">
          <p className={`text-xs font-medium ${STATUS_STYLE[executionStatus] || STATUS_STYLE.idle}`}>
            {STATUS_LABEL[executionStatus] || STATUS_LABEL.idle}
          </p>

          <button
            onClick={() => onClear?.()}
            className="rounded-md border border-[#3c3c3c] px-2.5 py-1 text-xs text-slate-300 transition hover:border-[#007acc] hover:text-[#cfe9ff]"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#1e1e1e] px-3 py-3 font-mono text-xs"
      >
        {activeTab === tabKeys.output && (
          <pre className="whitespace-pre-wrap break-words text-emerald-300">
            {stdout?.trim() ? stdout : "No output yet."}
          </pre>
        )}

        {activeTab === tabKeys.errors && (
          <div className="space-y-2">
            {errors.length === 0 ? (
              <p className="text-amber-200">No errors.</p>
            ) : (
              errors.map((item, index) => (
                <pre key={`${item}-${index}`} className="whitespace-pre-wrap break-words text-rose-300">
                  {item}
                </pre>
              ))
            )}
          </div>
        )}

        {activeTab === tabKeys.logs && (
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-slate-400">No logs yet.</p>
            ) : (
              logs.map((log) => {
                const tone =
                  log.level === "error"
                    ? "text-rose-300"
                    : log.level === "warning"
                      ? "text-amber-300"
                      : "text-emerald-300";

                return (
                  <p key={log.id} className={tone}>
                    [{formatLogTime(log.timestamp)}] {log.message}
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
