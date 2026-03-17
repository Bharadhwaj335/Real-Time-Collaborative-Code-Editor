const RoomHeader = ({ roomId, language, isConnected }) => {
	return (
		<div className="rounded-xl border border-white/10 bg-[#252526] p-4">
			<p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room</p>
			<p className="mt-2 font-semibold uppercase tracking-wide text-white">{roomId}</p>

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
		</div>
	);
};

export default RoomHeader;
