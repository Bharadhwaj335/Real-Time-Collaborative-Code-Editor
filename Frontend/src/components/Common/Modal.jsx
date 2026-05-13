const Modal = ({ isOpen, title, onClose, children }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
			<div className="w-full max-w-lg rounded-xl border border-[#3c3c3c] bg-[#252526] p-5 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-white">{title}</h3>
					<button
						onClick={onClose}
						className="rounded-md p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
						aria-label="Close"
					>
						&times;
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};

export default Modal;
