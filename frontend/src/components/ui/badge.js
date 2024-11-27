import React from "react";

const badgeVariants = {
  default: "bg-green-100 text-green-800 hover:bg-green-200",
  waiting: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  destructive: "bg-red-100 text-red-800 hover:bg-red-200",
  outline: "border border-gray-200 text-gray-800 hover:bg-gray-100"
};

const Badge = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  return (
    <div className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
      focus:ring-green-500 select-none
      ${badgeVariants[variant]}
      ${className}
    `}>
      {children}
    </div>
  );
};

export { Badge, badgeVariants };