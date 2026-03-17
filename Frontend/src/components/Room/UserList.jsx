import Avatar from "../Common/Avatar";

const UserList = ({ users = [], currentUserId, maxParticipants }) => {

  return (
    <div className="rounded-xl border border-white/10 bg-[#252526] p-4">
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
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-[#1e1e1e] px-3 py-2"
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