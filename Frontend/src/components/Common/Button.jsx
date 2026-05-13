const variantClasses = {
	primary: "cc-button-primary",
	secondary: "cc-button",
	ghost: "cc-button-ghost",
	danger: "bg-[#6b2a2a] hover:bg-[#8f3636] text-white border border-[#8f3636]"
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
			className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
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
