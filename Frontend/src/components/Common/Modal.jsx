const Modal = ({ isOpen, title, onClose, children }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="w-full max-w-lg rounded-xl border border-[#334155] bg-[#1e293b] p-5 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-white">{title}</h3>
					<button
						onClick={onClose}
						className="rounded-md p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
						aria-label="Close"
					>
						x
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};

export default Modal;
