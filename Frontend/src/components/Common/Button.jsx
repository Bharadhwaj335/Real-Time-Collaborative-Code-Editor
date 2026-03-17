const variantClasses = {
	primary:
		"bg-[#3b82f6] hover:bg-[#2563eb] text-white border border-[#3b82f6]/40 shadow-[0_0_20px_rgba(59,130,246,0.25)]",
	secondary: "bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155]",
	ghost: "bg-transparent hover:bg-white/5 text-slate-200 border border-[#334155]",
	danger: "bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40"
};

const Button = ({
	children,
	type = "button",
	variant = "primary",
	className = "",
	loading = false,
	disabled = false,
	...props
}) => {
	const variantClass = variantClasses[variant] || variantClasses.primary;

	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
			{...props}
		>
			{loading && (
				<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
			)}
			{children}
		</button>
	);
};

export default Button;
