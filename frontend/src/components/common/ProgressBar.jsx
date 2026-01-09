const ProgressBar = ({
  progress = 0,
  message = "",
  showPercentage = true,
  size = "md",
  variant = "primary",
  animated = false,
}) => {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variantClasses = {
    primary: "bg-primary-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {message && (
          <span className="text-sm text-gray-600 truncate">{message}</span>
        )}
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${variantClasses[variant]} ${
            sizeClasses[size]
          } rounded-full transition-all duration-500 ease-out ${
            animated ? "progress-pulse" : ""
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
