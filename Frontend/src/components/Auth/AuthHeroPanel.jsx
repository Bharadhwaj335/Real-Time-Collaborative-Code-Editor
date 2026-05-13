const FEATURES = ["Real-time sync", "Multi-file editing", "Live collaboration", "Code execution", "Secure rooms"];

const AuthHeroPanel = ({ eyebrow = "CodeCollab Studio", subtitle }) => (
  <div className="relative flex min-h-[280px] flex-1 flex-col justify-between overflow-hidden bg-[#141416] p-7 sm:min-h-[320px] sm:p-8 lg:min-h-0 lg:p-9">
    <div
      className="pointer-events-none absolute inset-0 opacity-90"
      aria-hidden
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px"
      }}
    />

    <div
      className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[#0a7ab8]/12 blur-[100px]"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute -left-32 bottom-0 h-[280px] w-[280px] rounded-full bg-[#3db39c]/10 blur-[90px]"
      aria-hidden
    />

    <div className="relative z-[1]">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#5cb3e8]/90">{eyebrow}</p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#3db39c]/95">
        Real-time collaborative editor
      </p>
      <h1 className="mt-3 max-w-lg text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[1.95rem]">
        Build together, understand faster.
      </h1>
      <p className="mt-4 max-w-md text-[13px] leading-relaxed text-slate-400">
        {subtitle ||
          "Collaborate on code, chat with teammates, and run programs in one modern workspace."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FEATURES.map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 shadow-[0_0_20px_rgba(10,122,184,0.08)] backdrop-blur-sm"
          >
            {label}
          </span>
        ))}
      </div>
    </div>

    <div className="relative z-[1] mt-8 hidden lg:block">
      <div className="relative mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/80 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          <span className="ml-2 flex-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-center font-mono text-[9px] text-slate-500">
            editor — live
          </span>
        </div>
        <div className="flex gap-2">
          <div className="w-[22%] shrink-0 space-y-1 rounded-xl border border-white/[0.06] bg-[#121214] p-2">
            <div className="h-1.5 w-3/4 rounded bg-slate-700/80" />
            <div className="h-1.5 w-full rounded bg-[#0a7ab8]/35" />
            <div className="h-1.5 w-5/6 rounded bg-slate-700/50" />
            <div className="h-1.5 w-2/3 rounded bg-slate-700/40" />
          </div>
          <div className="relative min-h-[120px] flex-1 overflow-hidden rounded-xl border border-[#0a7ab8]/25 bg-[#0f1114] p-2 font-mono text-[9px] leading-relaxed text-slate-500 shadow-[inset_0_0_40px_rgba(10,122,184,0.06)]">
            <p className="text-emerald-400/90">// shared session</p>
            <p>
              <span className="text-[#569cd6]">function</span>{" "}
              <span className="text-[#dcdcaa]">sync</span>() {"{"}
            </p>
            <p className="pl-2 text-slate-400">return peers.map(render);</p>
            <p>{"}"}</p>
            <span
              className="absolute left-[52%] top-[42%] h-4 w-px bg-[#3db39c] shadow-[0_0_12px_#3db39c]"
              title="Live cursor"
            />
            <span
              className="absolute left-[38%] top-[58%] h-4 w-px bg-[#5cb3e8] shadow-[0_0_12px_#5cb3e8]"
              title="Live cursor"
            />
            <span
              className="absolute right-6 top-8 rounded border border-[#c586c0]/50 bg-[#1a1520] px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#c586c0]"
            >
              You
            </span>
          </div>
        </div>
      </div>
    </div>

    <p className="relative z-[1] mt-6 text-[11px] text-slate-600 lg:mt-4">
      Encrypted sessions · Owner-controlled rooms · Built for classrooms & teams
    </p>
  </div>
);

export default AuthHeroPanel;
