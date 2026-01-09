import {
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Loader,
} from "lucide-react";

const statusConfig = {
  safe: {
    label: "Safe",
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-100",
  },
  flagged: {
    label: "Flagged",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 border-red-100",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-zinc-50 text-zinc-600 border-zinc-200",
  },
  processing: {
    label: "Processing",
    icon: Loader,
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  uploading: {
    label: "Uploading",
    icon: Loader,
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  analyzing: {
    label: "Analyzing",
    icon: Loader,
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-100",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-100",
  },
  error: {
    label: "Error",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-100",
  },
};

const StatusBadge = ({ status, showIcon = true, size = "md" }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`${config.className} ${sizeClasses[size]} inline-flex items-center gap-1 rounded border font-medium`}
    >
      {showIcon && (
        <Icon
          className={`${iconSizes[size]} ${
            status === "processing" ||
            status === "uploading" ||
            status === "analyzing"
              ? "spinner"
              : ""
          }`}
        />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
