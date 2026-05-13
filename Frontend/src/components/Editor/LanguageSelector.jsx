import { ROOM_LANGUAGES } from "../../utils/constants";

const LanguageSelector = ({ value, onChange, className = "" }) => {
  return (
    <label className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
        Lang
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[140px] cursor-pointer rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-[11px] font-medium text-slate-100 outline-none transition hover:border-[#52525b] focus:border-[#0a7ab8] focus:ring-1 focus:ring-[#0a7ab8]/35 sm:max-w-[180px]"
      >
        {ROOM_LANGUAGES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;
