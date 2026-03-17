import { getInitials } from "../../utils/helpers";

const palette = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-fuchsia-500",
  "bg-orange-500",
  "bg-rose-500"
];

const colorFromName = (name = "") => {
  const total = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
};

const Avatar = ({ name, size = "md", className = "" }) => {
  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base"
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${colorFromName(
        name
      )} ${sizeClass} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
