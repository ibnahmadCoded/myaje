import React from "react";

const buttonVariants = {
  default: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-green-500",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
  link: "text-green-600 underline-offset-4 hover:underline focus:ring-green-500"
};

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-8",
  icon: "h-10 w-10"
};

const Button = React.forwardRef(({ 
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}, ref) => {
  if (asChild) {
    //console.log("asChild prop is true");
  }
  
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };