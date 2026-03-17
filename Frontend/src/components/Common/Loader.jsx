const Loader = ({ label = "Loading..." }) => {
	return (
		<div className="flex items-center justify-center gap-3 text-slate-300">
			<span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-blue-400" />
			<span className="text-sm">{label}</span>
		</div>
	);
};

export default Loader;
