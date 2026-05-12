const RoomHeader = ({
	roomName,
	roomId,
	language,
	isConnected,
	maxParticipants,
	currentParticipants,
	onLeaveRoom
}) => {
	return (
		<div className="rounded-xl border border-white/10 bg-[#252526] p-4">
			<p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room</p>
			<p className="mt-2 text-base font-bold tracking-wide text-white">
				{roomName || roomId || "Untitled Room"}
			</p>
			<p className="mt-1 text-xs uppercase tracking-wide text-slate-400">ID: {roomId}</p>

			<p className="mt-2 text-xs text-slate-300">
				Participants: {currentParticipants || 0}/{maxParticipants || 0}
			</p>

			<div className="mt-3 flex items-center justify-between text-xs">
				<span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">
					{language}
				</span>

				<span
					className={`inline-flex items-center gap-1 ${
						isConnected ? "text-emerald-300" : "text-amber-300"
					}`}
				>
					<span
						className={`h-2 w-2 rounded-full ${
							isConnected ? "bg-emerald-400" : "bg-amber-400"
						}`}
					/>
					{isConnected ? "Connected" : "Reconnecting"}
				</span>
			</div>

			<button
				onClick={onLeaveRoom}
				className="mt-3 w-full rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/20"
			>
				Leave Room
			</button>
		</div>
	);
};

export default RoomHeader;
