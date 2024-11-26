import React from 'react';

export const Select = ({ value, onValueChange, children }) => {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)} 
        className="border rounded-md p-2 w-full"
      >
        {children}
      </select>
    </div>
  );
};

export const SelectTrigger = ({ children }) => (
  <>{children}</>
);

export const SelectContent = ({ children }) => (
  <>
    {children}
  </>
);

export const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

export const SelectValue = ({ placeholder }) => (
  <option value="">{placeholder}</option>
);
