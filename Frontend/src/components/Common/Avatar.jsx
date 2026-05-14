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

const Avatar = ({ name, imageUrl, size = "md", className = "" }) => {
  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base"
  };

  const sizeClass = sizes[size] || sizes.md;

  if (imageUrl) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2d2d2d] ring-1 ring-white/10 ${sizeClass} ${className}`}
        title={name}
      >
        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

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
