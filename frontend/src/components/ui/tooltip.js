import React, { useState } from 'react';

export const TooltipProvider = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const TooltipTrigger = ({ children, onMouseEnter, onMouseLeave }) => {
  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="inline-block cursor-help"
    >
      {children}
    </div>
  );
};

export const TooltipContent = ({ children, side = "top", className }) => {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <div className={`absolute z-50 ${positions[side]} ${className}`}>
      {children}
    </div>
  );
};

export const Tooltip = ({ children, content, side = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TooltipProvider>
      <TooltipTrigger
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <TooltipContent side={side}>
            {content}
          </TooltipContent>
        )}
      </TooltipTrigger>
    </TooltipProvider>
  );
};