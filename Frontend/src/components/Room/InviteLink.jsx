import Button from "../Common/Button";

const InviteLink = ({ roomId, inviteLink, onCopy }) => {
	return (
		<div className="rounded-xl border border-white/10 bg-[#252526] p-4">
			<p className="text-sm font-semibold text-white">Invite teammates</p>
			<p className="mt-1 text-xs text-slate-400">Room {roomId}</p>

			<div className="mt-3 rounded-lg border border-white/10 bg-[#1e1e1e] px-3 py-2 text-xs text-slate-300">
				<p className="truncate">{inviteLink}</p>
			</div>

			<Button className="mt-3 w-full" variant="secondary" onClick={onCopy}>
				Copy invite link
			</Button>
		</div>
	);
};

export default InviteLink;
