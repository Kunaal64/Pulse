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
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full spinner"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Video not found
        </h2>
        <p className="text-gray-500 mb-6">
          {error || "The video you are looking for does not exist."}
        </p>
        <Link to="/videos">
          <Button>Back to Videos</Button>
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
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <Link
        to="/videos"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to videos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video player */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-xl overflow-hidden">
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
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full spinner" />
                  </div>
                )}

                {/* Play button overlay when paused */}
                {!isPlaying && !isVideoLoading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                  >
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Custom controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Progress bar with buffer indicator */}
                  <div className="relative h-1 bg-gray-600 rounded-lg mb-3 cursor-pointer">
                    {/* Buffered progress */}
                    <div
                      className="absolute h-full bg-gray-400 rounded-lg"
                      style={{ width: `${buffered}%` }}
                    />
                    {/* Played progress */}
                    <div
                      className="absolute h-full bg-primary-500 rounded-lg"
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
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="text-white hover:text-primary-400"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleMute}
                          className="text-white hover:text-primary-400"
                        >
                          {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <span className="text-white text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Playback speed */}
                      <select
                        value={playbackRate}
                        onChange={(e) =>
                          handlePlaybackRateChange(parseFloat(e.target.value))
                        }
                        className="bg-transparent text-white text-sm border border-gray-600 rounded px-2 py-1 cursor-pointer focus:outline-none"
                      >
                        <option value="0.5" className="bg-gray-900">
                          0.5x
                        </option>
                        <option value="0.75" className="bg-gray-900">
                          0.75x
                        </option>
                        <option value="1" className="bg-gray-900">
                          1x
                        </option>
                        <option value="1.25" className="bg-gray-900">
                          1.25x
                        </option>
                        <option value="1.5" className="bg-gray-900">
                          1.5x
                        </option>
                        <option value="2" className="bg-gray-900">
                          2x
                        </option>
                      </select>

                      <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-primary-400"
                      >
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-900">
                {isProcessing ? (
                  <div className="text-center text-white p-8">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full spinner mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Processing Video
                    </h3>
                    <p className="text-gray-400 mb-4">
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
                        size="md"
                        animated
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-lg font-medium mb-2">
                      Video Not Available
                    </h3>
                    <p className="text-gray-400">
                      {video.errorMessage || "Video processing failed"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          {video.status === "completed" && (
            <div className="mt-3 text-xs text-gray-400 flex flex-wrap gap-4">
              <span>
                <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">
                  Space
                </kbd>{" "}
                Play/Pause
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">
                  M
                </kbd>{" "}
                Mute
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">
                  F
                </kbd>{" "}
                Fullscreen
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">
                  ←/→
                </kbd>{" "}
                Seek 5s
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">
                  ↑/↓
                </kbd>{" "}
                Volume
              </span>
            </div>
          )}

          {/* Video info */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <StatusBadge status={video.status} />
              {video.sensitivityStatus !== "pending" && (
                <StatusBadge status={video.sensitivityStatus} />
              )}
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Eye className="w-4 h-4" />
                {video.views} views
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                {formatDate(video.createdAt)}
              </span>
            </div>

            {video.description && (
              <p className="mt-4 text-gray-600">{video.description}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              {video.status === "completed" && (
                <Button
                  variant="secondary"
                  icon={Download}
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
                    onClick={() => navigate(`/videos?edit=${video._id}`)}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" icon={Trash2} onClick={handleDelete}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Video details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Video Details</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Uploaded by</span>
                <span className="font-medium text-gray-900">
                  {video.uploadedBy?.name || "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">
                  {video.duration ? formatTime(video.duration) : "--:--"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Size</span>
                <span className="font-medium text-gray-900">
                  {formatSize(video.size)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Resolution</span>
                <span className="font-medium text-gray-900">
                  {video.resolution?.width && video.resolution?.height
                    ? `${video.resolution.width}x${video.resolution.height}`
                    : "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-900 capitalize">
                  {video.category || "Uncategorized"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Visibility</span>
                <span className="font-medium text-gray-900 capitalize">
                  {video.visibility}
                </span>
              </div>
            </div>

            {video.tags?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </span>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sensitivity analysis */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sensitivity Analysis
              </h3>
              {user?.role === "admin" && video.status === "completed" && (
                <button
                  onClick={handleReanalyze}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reanalyze
                </button>
              )}
            </div>

            {video.sensitivityStatus === "pending" ? (
              <p className="text-gray-500 text-sm">Analysis pending...</p>
            ) : (
              <>
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    video.sensitivityStatus === "safe"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {video.sensitivityStatus === "safe" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        video.sensitivityStatus === "safe"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {video.sensitivityStatus === "safe"
                        ? "Content is Safe"
                        : "Content Flagged"}
                    </span>
                  </div>

                  {video.sensitivityScore !== null && (
                    <p
                      className={`text-sm mt-1 ${
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
                    <p className="text-sm text-gray-500 mb-2">
                      Analysis notes:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {video.sensitivityReasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {video.sensitivityDetails && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                      Category scores:
                    </p>
                    <div className="space-y-2">
                      {Object.entries(video.sensitivityDetails).map(
                        ([category, data]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600 capitalize">
                              {category}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    data.score > 70
                                      ? "bg-red-500"
                                      : data.score > 40
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${data.score}%` }}
                                />
                              </div>
                              <span className="text-gray-900 font-medium w-8">
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
