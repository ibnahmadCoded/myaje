import React from "react";

const Avatar = React.forwardRef(({ 
  className = "",
  src,
  alt = "Avatar",
  fallback = "U",
  ...props 
}, ref) => {
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className={`
        relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full
        ${className}
      `}
      ref={ref}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-600">
          {fallback}
        </div>
      )}
    </div>
  );
});

Avatar.displayName = "Avatar";

export { Avatar };