import React from 'react';

// Main AlertDialog component
export const AlertDialog = ({ open, onOpenChange, children }) => {
  return (
    <div className={`fixed inset-0 flex items-center justify-center ${open ? '' : 'hidden'}`}>
      <div className="bg-black opacity-30 fixed inset-0" onClick={() => onOpenChange(false)} />
      <div className="bg-green-50/40 rounded-lg shadow-lg z-10 max-w-sm w-full border border-stone-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// AlertDialogHeader component
export const AlertDialogHeader = ({ children }) => {
  return <div className="p-4 border-b border-gray-200 bg-green-50">{children}</div>;
};

// AlertDialogContent component
export const AlertDialogContent = ({ children }) => {
  return <div className="p-4 text-stone-600">{children}</div>;
};

// AlertDialogFooter component
export const AlertDialogFooter = ({ children }) => {
  return <div className="p-4 border-t border-gray-200 flex justify-end bg-green-50">{children}</div>;
};

// AlertDialogTitle component
export const AlertDialogTitle = ({ children }) => {
  return <h3 className="text-lg font-semibold text-stone-800">{children}</h3>;
};

// AlertDialogDescription component
export const AlertDialogDescription = ({ children }) => {
  return <p className="mt-2 text-sm text-stone-600">{children}</p>;
};

// AlertDialogAction component
export const AlertDialogAction = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 rounded-md bg-amber-50 border border-amber-200 text-stone-600 hover:border-amber-300 hover:bg-amber-100 transition duration-200 ${className}`}
    >
      {children}
    </button>
  );
};

// AlertDialogCancel component
export const AlertDialogCancel = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="py-2 px-4 text-stone-400 hover:text-red-500 transition duration-200"
    >
      {children}
    </button>
  );
};
