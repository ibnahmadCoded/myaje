export const Textarea = ({ className = "", ...props }) => {
    return (
      <textarea
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 ${className}`}
        {...props}
      />
    );
  };
  