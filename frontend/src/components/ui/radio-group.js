import React from "react";

export const RadioGroup = ({ value, onChange, children }) => {
  return (
    <div role="radiogroup" className="space-y-2">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              selectedValue: value,
              onChange,
            })
          : child
      )}
    </div>
  );
};

export const RadioGroupItem = ({ label, value, selectedValue, onChange, ...props }) => {
  return (
    <label className="flex items-center space-x-2">
      <input
        type="radio"
        value={value}
        checked={value === selectedValue}
        onChange={() => onChange && onChange(value)}
        className="form-radio h-4 w-4 text-blue-600"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
};
