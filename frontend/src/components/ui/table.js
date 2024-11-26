export const Table = ({ className = "", children, ...props }) => {
    return (
      <div className={`overflow-x-auto ${className}`} {...props}>
        <table className="min-w-full border-collapse border border-gray-200">
          {children}
        </table>
      </div>
    );
  };
  
  export const TableHeader = ({ className = "", children, ...props }) => {
    return (
      <thead className={`bg-gray-100 ${className}`} {...props}>
        <tr>{children}</tr>
      </thead>
    );
  };
  
  export const TableRow = ({ className = "", children, ...props }) => {
    return (
      <tr className={`hover:bg-gray-50 ${className}`} {...props}>
        {children}
      </tr>
    );
  };
  
  export const TableCell = ({ className = "", children, isHeader = false, ...props }) => {
    const Component = isHeader ? "th" : "td";
    return (
      <Component
        className={`border border-gray-200 px-4 py-2 text-sm ${isHeader ? "font-medium text-gray-700" : "text-gray-600"} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  };
  