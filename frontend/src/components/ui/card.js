import React from 'react';

export const Card = ({ className, children }) => {
  return (
    <div className={`border rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children }) => (
  <div className="border-b mb-2 pb-2">
    {children}
  </div>
);

export const CardContent = ({ children }) => (
  <div className="mt-2">
    {children}
  </div>
);

export const CardTitle = ({ children }) => (
  <h2 className="text-lg font-semibold">
    {children}
  </h2>
);
