import { LANGUAGES } from "../../utils/constants";

const LanguageSelector = ({ value, onChange, className = "" }) => {
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Language
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3b82f6]"
      >
        {LANGUAGES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;