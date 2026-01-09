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
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden card-hover fade-in">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-100">
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
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <Play className="w-10 h-10 text-zinc-300" />
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Play overlay for completed videos */}
        {canPlay && (
          <Link
            to={`/videos/${video._id}`}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all duration-150 group"
          >
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md">
              <Play className="w-6 h-6 text-zinc-900 ml-0.5" />
            </div>
          </Link>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full spinner mx-auto mb-2" />
              <p className="text-xs">
                {video.processingMessage || "Processing..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title and menu */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-medium text-zinc-900 text-sm line-clamp-2 flex-1">
            {canPlay ? (
              <Link
                to={`/videos/${video._id}`}
                className="hover:text-zinc-600 transition-colors"
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
              className="p-1 hover:bg-zinc-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-zinc-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-7 bg-white rounded-lg shadow-medium border border-zinc-200 py-1 z-20 min-w-[120px]">
                  {canPlay && (
                    <Link
                      to={`/videos/${video._id}`}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Watch
                    </Link>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(video);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 w-full"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(video._id);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <StatusBadge status={video.status} size="sm" />
          {video.sensitivityStatus && video.sensitivityStatus !== "pending" && (
            <StatusBadge status={video.sensitivityStatus} size="sm" />
          )}
        </div>

        {/* Progress bar for processing videos */}
        {(showProgress || isProcessing) && (
          <div className="mb-2">
            <ProgressBar
              progress={progress || video.processingProgress || 0}
              message={progressMessage || video.processingMessage}
              size="sm"
              animated={isProcessing}
            />
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>{formatDate(video.createdAt)}</span>
          <span>{formatSize(video.size)}</span>
          {video.views > 0 && (
            <span className="flex items-center gap-0.5">
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
