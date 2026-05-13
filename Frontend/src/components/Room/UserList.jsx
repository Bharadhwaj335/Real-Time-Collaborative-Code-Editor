import Avatar from "../Common/Avatar";

const UserList = ({ users = [], currentUserId, maxParticipants }) => {
  const orderedUsers = [...users].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  const cap = maxParticipants || users.length || 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl p-1">
      <div className="shrink-0 border-b border-[#2a2a2a] pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active users</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">
          <span className="font-medium text-slate-300">{users.length}</span> connected
          {cap ? (
            <>
              {" "}
              · cap <span className="tabular-nums">{cap}</span>
            </>
          ) : null}
        </p>
      </div>

      {users.length === 0 ? (
        <p className="mt-3 text-center text-[12px] leading-relaxed text-slate-500">
          Waiting for collaborators to join.
        </p>
      ) : (
        <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {orderedUsers.map((u) => (
            <li
              key={u.id}
              className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1.5 transition hover:border-[#52525b] ${
                u.id === currentUserId
                  ? "border-[#0a7ab8]/45 bg-[#0a7ab8]/10"
                  : "border-[#3c3c3c]/80 bg-[#252526]/60"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={u.name} size="sm" />
                <span className="truncate text-[12px] font-medium text-slate-200">
                  {u.name}
                  {u.id === currentUserId ? (
                    <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                      You
                    </span>
                  ) : null}
                </span>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#3db39c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3db39c]" />
                {u.status || "live"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;
