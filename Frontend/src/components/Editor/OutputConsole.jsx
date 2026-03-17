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

const OutputConsole = ({ stdout = "", stderr = "", runtimeError = "", logs = [], isRunning = false }) => {
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
    <section className="mt-3 rounded-xl border border-[#334155] bg-[#1e293b]">
      <div className="flex items-center justify-between border-b border-[#334155] px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(tabKeys.output)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tabKeys.output ? "bg-[#3b82f6]/20 text-blue-200" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Output
          </button>

          <button
            onClick={() => setActiveTab(tabKeys.errors)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tabKeys.errors ? "bg-[#ef4444]/20 text-rose-200" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Errors
          </button>

          <button
            onClick={() => setActiveTab(tabKeys.logs)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === tabKeys.logs ? "bg-[#f59e0b]/20 text-amber-200" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Logs
          </button>
        </div>

        <p className="text-xs text-slate-400">{isRunning ? "Running..." : "Idle"}</p>
      </div>

      <div
        ref={containerRef}
        className="max-h-52 min-h-[170px] overflow-y-auto bg-[#0b1120] px-3 py-3 font-mono text-xs"
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
