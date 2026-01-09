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
    className: "badge-safe",
  },
  flagged: {
    label: "Flagged",
    icon: AlertTriangle,
    className: "badge-flagged",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "badge-pending",
  },
  processing: {
    label: "Processing",
    icon: Loader,
    className: "badge-processing",
  },
  uploading: {
    label: "Uploading",
    icon: Loader,
    className: "badge-processing",
  },
  analyzing: {
    label: "Analyzing",
    icon: Loader,
    className: "badge-processing",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "badge-safe",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "badge-flagged",
  },
  error: {
    label: "Error",
    icon: XCircle,
    className: "badge-flagged",
  },
};

const StatusBadge = ({ status, showIcon = true, size = "md" }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`badge ${config.className} ${sizeClasses[size]} inline-flex items-center gap-1.5`}
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
