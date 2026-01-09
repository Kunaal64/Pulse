import { Link } from "react-router-dom";
import {
  Play,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Clock,
  HardDrive,
} from "lucide-react";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

const VideoCard = ({
  video,
  onDelete,
  onEdit,
  showProgress = false,
  progress = 0,
  progressMessage = "",
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isProcessing = ["uploading", "processing", "analyzing"].includes(
    video.status
  );
  const canPlay = video.status === "completed";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover fade-in">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {video.thumbnail && !imageError ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/videos/${
              video._id
            }/thumbnail`}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Play className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Play overlay for completed videos */}
        {canPlay && (
          <Link
            to={`/videos/${video._id}`}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all duration-200 group"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
              <Play className="w-8 h-8 text-primary-600 ml-1" />
            </div>
          </Link>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full spinner mx-auto mb-2" />
              <p className="text-sm">
                {video.processingMessage || "Processing..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and menu */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {canPlay ? (
              <Link
                to={`/videos/${video._id}`}
                className="hover:text-primary-600 transition-colors"
              >
                {video.title}
              </Link>
            ) : (
              video.title
            )}
          </h3>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
                  {canPlay && (
                    <Link
                      to={`/videos/${video._id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      <Eye className="w-4 h-4" />
                      Watch
                    </Link>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(video);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(video._id);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={video.status} size="sm" />
          {video.sensitivityStatus && video.sensitivityStatus !== "pending" && (
            <StatusBadge status={video.sensitivityStatus} size="sm" />
          )}
        </div>

        {/* Progress bar for processing videos */}
        {(showProgress || isProcessing) && (
          <div className="mb-3">
            <ProgressBar
              progress={progress || video.processingProgress || 0}
              message={progressMessage || video.processingMessage}
              size="sm"
              animated={isProcessing}
            />
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(video.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {formatSize(video.size)}
            </span>
          </div>
          {video.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {video.views}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
