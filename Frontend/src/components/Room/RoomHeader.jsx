const RoomHeader = ({
	roomName,
	roomId,
	maxParticipants,
	currentParticipants,
	onLeaveRoom
}) => {
	return (
		<div className="flex h-full flex-col rounded-xl border border-[#2a2a2a] bg-[#252526]">
			<div className="border-b border-[#2a2a2a] px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
							Room
						</p>
						<p className="mt-1 truncate text-base font-semibold text-white">
							{roomName || roomId || "Untitled Room"}
						</p>
						<p className="mt-1 text-xs text-slate-400">ID: {roomId}</p>
					</div>

					<button
						onClick={onLeaveRoom}
						className="rounded-md border border-[#5a2b2b] bg-[#2b1b1b] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ffb4b4] transition hover:border-[#f44747] hover:bg-[#3a1f1f]"
					>
						Leave
					</button>
				</div>
			</div>

			<div className="grid gap-2 px-4 py-3 text-xs text-slate-300">
				<div className="flex items-center justify-between rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2">
					<span className="text-slate-400">Participants</span>
					<span className="font-semibold text-white">
						{currentParticipants || 0}/{maxParticipants || 0}
					</span>
				</div>
				<div className="flex items-center justify-between rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2">
					<span className="text-slate-400">Invite code</span>
					<span className="font-mono text-white">{roomId}</span>
				</div>
			</div>
		</div>
	);
};

export default RoomHeader;
