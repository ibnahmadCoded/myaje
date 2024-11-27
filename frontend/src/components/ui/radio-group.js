import React from "react";

export const RadioGroup = ({ value, onChange, children }) => {
  return (
    <div role="radiogroup" className="space-y-2">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              selectedValue: value, // Pass the current selected value to each child
              onChange, // Pass the onChange handler to each child
            })
          : child
      )}
    </div>
  );
};


export const RadioGroupItem = ({
  label,
  value,
  selectedValue,
  onChange,
  ...props
}) => {
  // Remove `selectedValue` from props before passing to the input
  const { selectedValue: _, ...rest } = props;

  return (
    <label className="flex items-center space-x-2">
      <input
        type="radio"
        value={value}
        checked={value === selectedValue} // Determine if this option is selected
        onChange={() => onChange && onChange(value)} // Notify parent of change
        className="form-radio h-4 w-4 text-blue-600"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
};

