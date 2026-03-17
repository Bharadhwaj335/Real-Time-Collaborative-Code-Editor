const CursorOverlay = ({ remoteCursors, activeFileId }) => {
	const cursorItems = Object.values(remoteCursors || {}).filter((cursor) => {
		if (!activeFileId) return true;
		if (!cursor.fileId) return true;
		return cursor.fileId === activeFileId;
	});

	if (cursorItems.length === 0) return null;

	return (
		<div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs text-slate-200 backdrop-blur">
			<p className="mb-1 font-semibold text-blue-300">Live Cursors</p>

			<div className="space-y-1">
				{cursorItems.map((cursor) => (
					<p key={cursor.userId}>
						{cursor.userName}: L{cursor.position?.lineNumber || 1}, C
						{cursor.position?.column || 1}
					</p>
				))}
			</div>
		</div>
	);
};

export default CursorOverlay;
