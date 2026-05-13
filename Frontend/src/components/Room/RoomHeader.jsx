const RoomHeader = ({
	roomName,
	roomId,
	maxParticipants,
	currentParticipants,
	onLeaveRoom
}) => {
	return (
		<div className="h-full rounded-xl border border-white/10 bg-[#252526] p-4">
			<p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room</p>
			<p className="mt-2 text-base font-bold tracking-wide text-white">
				{roomName || roomId || "Untitled Room"}
			</p>
			<p className="mt-1 text-xs uppercase tracking-wide text-slate-400">ID: {roomId}</p>

			<p className="mt-2 text-xs text-slate-300">
				Participants: {currentParticipants || 0}/{maxParticipants || 0}
			</p>

			<button
				onClick={onLeaveRoom}
				className="mt-4 w-full rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/20"
			>
				Leave Room
			</button>
		</div>
	);
};

export default RoomHeader;
