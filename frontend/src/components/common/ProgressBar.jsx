const ProgressBar = ({
  progress = 0,
  message = "",
  showPercentage = true,
  size = "md",
  variant = "primary",
  animated = false,
}) => {
  const sizeClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  const variantClasses = {
    primary: "bg-zinc-600",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {message && (
          <span className="text-xs text-zinc-500 truncate">{message}</span>
        )}
        {showPercentage && (
          <span className="text-xs font-medium text-zinc-600">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div
        className={`w-full bg-zinc-100 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${variantClasses[variant]} ${
            sizeClasses[size]
          } rounded-full transition-all duration-300 ease-out ${
            animated ? "progress-pulse" : ""
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
