import { forwardRef } from "react";

const FormField = forwardRef(({
  label,
  type = "text",
  error,
  required,
  placeholder,
  disabled,
  className,
  inputClassName,
  ...props
}, ref) => {
  return (
    <div className={`mb-4 ${className || ""}`}>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white
          placeholder-gray-500 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700'}
          ${inputClassName || ""}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = "FormField";

export default FormField;
