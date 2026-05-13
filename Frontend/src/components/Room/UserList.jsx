import Avatar from "../Common/Avatar";

const UserList = ({ users = [], currentUserId, maxParticipants }) => {
  const orderedUsers = [...users].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="cc-panel rounded-xl p-4">
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
                    ? "border-[#007acc] bg-[#007acc]/15"
                    : "border-[#3c3c3c] bg-[#1e1e1e]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Avatar name={user.name} size="sm" />
                <p className="text-sm text-slate-200">
                  {user.name}
                  {user.id === currentUserId ? " (You)" : ""}
                </p>
              </div>

                <span className="inline-flex items-center gap-1 text-xs text-[#4ec9b0]">
                  <span className="h-2 w-2 rounded-full bg-[#4ec9b0]" />
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