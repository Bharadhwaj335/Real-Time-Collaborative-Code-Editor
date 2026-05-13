import { FaTimes } from "react-icons/fa";

const Modal = ({ isOpen, title, onClose, children }) => {
	if (!isOpen) return null;

	return (
		<div
			className="cc-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[6px]"
			role="presentation"
			onClick={onClose}
		>
			<div
				className="cc-modal-panel w-full max-w-lg rounded-2xl border border-[#3c3c3c]/90 bg-gradient-to-b from-[#2d2d2d] to-[#252526] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? "cc-modal-title" : undefined}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="mb-4 flex items-start justify-between gap-3 border-b border-[#3c3c3c]/60 pb-3">
					<h3 id="cc-modal-title" className="text-lg font-semibold tracking-tight text-white">
						{title}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007acc]/50"
						aria-label="Close dialog"
					>
						<FaTimes className="h-3.5 w-3.5" />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};

export default Modal;
