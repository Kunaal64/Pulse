import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import videoService from "../services/videoService";
import StatusBadge from "../components/common/StatusBadge";
import Button from "../components/common/Button";
import ProgressBar from "../components/common/ProgressBar";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share2,
  Edit,
  Trash2,
  Clock,
  Eye,
  HardDrive,
  Calendar,
  Tag,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canPerform, user } = useAuth();
  const { subscribeToVideo, unsubscribeFromVideo, getVideoUpdate } =
    useSocket();

  const videoRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    fetchVideo();
    subscribeToVideo(id);

    return () => {
      unsubscribeFromVideo(id);
    };
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current || video?.status !== "completed") return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "arrowleft":
          e.preventDefault();
          videoRef.current.currentTime = Math.max(
            0,
            videoRef.current.currentTime - 5
          );
          break;
        case "arrowright":
          e.preventDefault();
          videoRef.current.currentTime = Math.min(
            duration,
            videoRef.current.currentTime + 5
          );
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange({ target: { value: Math.min(1, volume + 0.1) } });
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange({ target: { value: Math.max(0, volume - 0.1) } });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [video, duration, volume]);

  const fetchVideo = async () => {
    try {
      const response = await videoService.getVideo(id);
      setVideo(response.data.video);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load video");
      toast.error("Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  const videoUpdate = getVideoUpdate(id);

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(
        videoRef.current.buffered.length - 1
      );
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setBuffered((bufferedEnd / duration) * 100);
      }
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleVideoLoaded = () => {
    setIsVideoLoading(false);
  };

  const handleVideoWaiting = () => {
    setIsVideoLoading(true);
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await videoService.deleteVideo(id);
        toast.success("Video deleted");
        navigate("/videos");
      } catch (err) {
        toast.error("Failed to delete video");
      }
    }
  };

  const handleReanalyze = async () => {
    try {
      await videoService.reanalyze(id);
      toast.success("Reanalysis started");
      fetchVideo();
    } catch (err) {
      toast.error("Failed to start reanalysis");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full spinner"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-medium text-zinc-900 mb-1">
          Video not found
        </h2>
        <p className="text-zinc-500 text-sm mb-4">
          {error || "The video you are looking for does not exist."}
        </p>
        <Link to="/videos">
          <Button size="sm">Back to Videos</Button>
        </Link>
      </div>
    );
  }

  const isOwner =
    video.uploadedBy?._id === user?.id || video.uploadedBy === user?.id;
  const canEdit = isOwner || user?.role === "admin";
  const isProcessing = ["uploading", "processing", "analyzing"].includes(
    video.status
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <Link
        to="/videos"
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 mb-4 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to videos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Video player */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden">
            {video.status === "completed" ? (
              <div className="relative group">
                <video
                  ref={videoRef}
                  src={`${import.meta.env.VITE_API_URL}/videos/${
                    video._id
                  }/stream?token=${localStorage.getItem("token")}`}
                  className="w-full aspect-video"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  onProgress={handleProgress}
                  onLoadedData={handleVideoLoaded}
                  onWaiting={handleVideoWaiting}
                  onCanPlay={handleVideoCanPlay}
                  crossOrigin="anonymous"
                />

                {/* Loading spinner overlay */}
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full spinner" />
                  </div>
                )}

                {/* Play button overlay when paused */}
                {!isPlaying && !isVideoLoading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                  >
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <Play className="w-7 h-7 text-white ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Custom controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Progress bar with buffer indicator */}
                  <div className="relative h-1 bg-zinc-600 rounded mb-2 cursor-pointer">
                    {/* Buffered progress */}
                    <div
                      className="absolute h-full bg-zinc-400 rounded"
                      style={{ width: `${buffered}%` }}
                    />
                    {/* Played progress */}
                    <div
                      className="absolute h-full bg-white rounded"
                      style={{
                        width: `${
                          duration ? (currentTime / duration) * 100 : 0
                        }%`,
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="text-white hover:text-zinc-300"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleMute}
                          className="text-white hover:text-zinc-300"
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-zinc-600 rounded appearance-none cursor-pointer"
                        />
                      </div>

                      <span className="text-white text-xs">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Playback speed */}
                      <select
                        value={playbackRate}
                        onChange={(e) =>
                          handlePlaybackRateChange(parseFloat(e.target.value))
                        }
                        className="bg-transparent text-white text-xs border border-zinc-600 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                      >
                        <option value="0.5" className="bg-zinc-900">
                          0.5x
                        </option>
                        <option value="0.75" className="bg-zinc-900">
                          0.75x
                        </option>
                        <option value="1" className="bg-zinc-900">
                          1x
                        </option>
                        <option value="1.25" className="bg-zinc-900">
                          1.25x
                        </option>
                        <option value="1.5" className="bg-zinc-900">
                          1.5x
                        </option>
                        <option value="2" className="bg-zinc-900">
                          2x
                        </option>
                      </select>

                      <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-zinc-300"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-zinc-900">
                {isProcessing ? (
                  <div className="text-center text-white p-6">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full spinner mx-auto mb-3" />
                    <h3 className="text-sm font-medium mb-1">
                      Processing Video
                    </h3>
                    <p className="text-zinc-400 text-xs mb-3">
                      {videoUpdate?.message ||
                        video.processingMessage ||
                        "Please wait..."}
                    </p>
                    <div className="max-w-xs mx-auto">
                      <ProgressBar
                        progress={
                          videoUpdate?.progress || video.processingProgress || 0
                        }
                        showPercentage
                        size="sm"
                        animated
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                    <h3 className="text-sm font-medium mb-1">
                      Video Not Available
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      {video.errorMessage || "Video processing failed"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          {video.status === "completed" && (
            <div className="mt-2 text-[10px] text-zinc-400 flex flex-wrap gap-3">
              <span>
                <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-zinc-500">
                  Space
                </kbd>{" "}
                Play/Pause
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-zinc-500">
                  M
                </kbd>{" "}
                Mute
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-zinc-500">
                  F
                </kbd>{" "}
                Fullscreen
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-zinc-500">
                  ←/→
                </kbd>{" "}
                Seek 5s
              </span>
            </div>
          )}

          {/* Video info */}
          <div className="mt-4">
            <h1 className="text-lg font-medium text-zinc-900">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={video.status} size="sm" />
              {video.sensitivityStatus !== "pending" && (
                <StatusBadge status={video.sensitivityStatus} size="sm" />
              )}
              <span className="flex items-center gap-1 text-zinc-400 text-xs">
                <Eye className="w-3 h-3" />
                {video.views} views
              </span>
              <span className="flex items-center gap-1 text-zinc-400 text-xs">
                <Calendar className="w-3 h-3" />
                {formatDate(video.createdAt)}
              </span>
            </div>

            {video.description && (
              <p className="mt-3 text-zinc-600 text-sm">{video.description}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {video.status === "completed" && (
                <Button
                  variant="secondary"
                  icon={Download}
                  size="sm"
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}/videos/${
                        video._id
                      }/download?token=${localStorage.getItem("token")}`,
                      "_blank"
                    )
                  }
                >
                  Download
                </Button>
              )}

              {canEdit && (
                <>
                  <Button
                    variant="secondary"
                    icon={Edit}
                    size="sm"
                    onClick={() => navigate(`/videos?edit=${video._id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    size="sm"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Video details */}
          <div className="bg-white rounded-lg p-4 shadow-soft border border-zinc-200">
            <h3 className="text-xs font-medium text-zinc-900 mb-3">
              Video Details
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Uploaded by</span>
                <span className="font-medium text-zinc-900">
                  {video.uploadedBy?.name || "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Duration</span>
                <span className="font-medium text-zinc-900">
                  {video.duration ? formatTime(video.duration) : "--:--"}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Size</span>
                <span className="font-medium text-zinc-900">
                  {formatSize(video.size)}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Resolution</span>
                <span className="font-medium text-zinc-900">
                  {video.resolution?.width && video.resolution?.height
                    ? `${video.resolution.width}x${video.resolution.height}`
                    : "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Category</span>
                <span className="font-medium text-zinc-900 capitalize">
                  {video.category || "Uncategorized"}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Visibility</span>
                <span className="font-medium text-zinc-900 capitalize">
                  {video.visibility}
                </span>
              </div>
            </div>

            {video.tags?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-100">
                <span className="text-xs text-zinc-500 flex items-center gap-1 mb-1.5">
                  <Tag className="w-3 h-3" />
                  Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {video.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sensitivity analysis */}
          <div className="bg-white rounded-lg p-4 shadow-soft border border-zinc-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-zinc-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Sensitivity Analysis
              </h3>
              {user?.role === "admin" && video.status === "completed" && (
                <button
                  onClick={handleReanalyze}
                  className="text-zinc-500 hover:text-zinc-900 text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reanalyze
                </button>
              )}
            </div>

            {video.sensitivityStatus === "pending" ? (
              <p className="text-zinc-500 text-xs">Analysis pending...</p>
            ) : (
              <>
                <div
                  className={`p-3 rounded-lg mb-3 ${
                    video.sensitivityStatus === "safe"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {video.sensitivityStatus === "safe" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        video.sensitivityStatus === "safe"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {video.sensitivityStatus === "safe"
                        ? "Content is Safe"
                        : "Content Flagged"}
                    </span>
                  </div>

                  {video.sensitivityScore !== null && (
                    <p
                      className={`text-xs mt-1 ${
                        video.sensitivityStatus === "safe"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Score: {video.sensitivityScore}/100
                    </p>
                  )}
                </div>

                {video.sensitivityReasons?.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">
                      Analysis notes:
                    </p>
                    <ul className="text-xs text-zinc-600 space-y-0.5">
                      {video.sensitivityReasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-zinc-400">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {video.sensitivityDetails && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-2">
                      Category scores:
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(video.sensitivityDetails).map(
                        ([category, data]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-zinc-600 capitalize">
                              {category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    data.score > 70
                                      ? "bg-red-500"
                                      : data.score > 40
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${data.score}%` }}
                                />
                              </div>
                              <span className="text-zinc-900 font-medium w-6">
                                {data.score}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
