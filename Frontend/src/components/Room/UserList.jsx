import Avatar from "../Common/Avatar";

const UserList = ({ users = [], currentUserId, maxParticipants }) => {
  const orderedUsers = [...users].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="rounded-xl border border-[#334155] bg-[#0f172a] p-4">
      <h3 className="text-sm font-semibold text-white">Active users ({users.length})</h3>
      <p className="mt-1 text-xs text-slate-400">
        Capacity: {users.length}/{maxParticipants || users.length}
      </p>

      {users.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">
          Waiting for collaborators to join.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {orderedUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                user.id === currentUserId
                  ? "border-[#3b82f6]/60 bg-[#3b82f6]/15"
                  : "border-[#334155] bg-[#1e293b]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Avatar name={user.name} size="sm" />
                <p className="text-sm text-slate-200">
                  {user.name}
                  {user.id === currentUserId ? " (You)" : ""}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {user.status || "online"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;