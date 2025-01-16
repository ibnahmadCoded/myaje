import React from "react";

export const RadioGroup = ({ value, onChange, children }) => {
  return (
    <div role="radiogroup" className="space-y-2">
      {React.Children.map(children, (child) => {
        // If it's a Fragment (like from a JSX <></>), we need to handle its children
        if (child?.type === React.Fragment) {
          return React.Children.map(child.props.children, (fragmentChild) => {
            if (!React.isValidElement(fragmentChild)) return fragmentChild;
            
            return React.cloneElement(fragmentChild, {
              checked: fragmentChild.props.value === value,
              onChange: () => onChange(fragmentChild.props.value)
            });
          });
        }
        
        // Handle non-Fragment elements
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          checked: child.props.value === value,
          onChange: () => onChange(child.props.value)
        });
      })}
    </div>
  );
};

export const RadioGroupItem = ({
  label,
  value,
  checked,
  onChange,
  disabled,
  ...props
}) => {
  return (
    <label className={`flex items-center space-x-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="form-radio h-4 w-4 text-blue-600"
        {...props}
      />
      <span className={disabled ? 'text-gray-400' : ''}>{label}</span>
    </label>
  );
};