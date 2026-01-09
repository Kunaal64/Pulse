import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import videoService from "../services/videoService";
import VideoCard from "../components/common/VideoCard";
import Button from "../components/common/Button";
import {
  Video,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Eye,
  HardDrive,
  ArrowRight,
} from "lucide-react";

const Dashboard = () => {
  const { user, canPerform } = useAuth();
  const { videoUpdates } = useSocket();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, videosRes] = await Promise.all([
        videoService.getStats(),
        videoService.getVideos({
          limit: 4,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ]);

      setStats(statsRes.data.stats);
      setRecentVideos(videosRes.data.videos);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1
      ? `${gb.toFixed(2)} GB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Videos",
      value: stats?.totalVideos || 0,
      icon: Video,
    },
    {
      title: "Safe",
      value: stats?.safeVideos || 0,
      icon: CheckCircle,
    },
    {
      title: "Flagged",
      value: stats?.flaggedVideos || 0,
      icon: AlertTriangle,
    },
    {
      title: "Processing",
      value: stats?.processingVideos || 0,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-zinc-500 mt-0.5 text-sm">
            Here's an overview of your videos
          </p>
        </div>

        {canPerform("upload") && (
          <Link to="/upload">
            <Button icon={Upload}>Upload</Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg p-4 border border-zinc-200"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="w-4 h-4 text-zinc-400" />
              <span className="text-2xl font-semibold text-zinc-900">
                {stat.value}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <Eye className="w-4 h-4 opacity-60" />
            <span className="text-xl font-semibold">{stats?.totalViews || 0}</span>
          </div>
          <p className="text-sm opacity-60 mt-1">Total Views</p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <HardDrive className="w-4 h-4 opacity-60" />
            <span className="text-xl font-semibold">{formatBytes(stats?.totalSize)}</span>
          </div>
          <p className="text-sm opacity-60 mt-1">Storage Used</p>
        </div>

        <div className="bg-zinc-700 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-4 h-4 opacity-60" />
            <span className="text-xl font-semibold">
              {stats?.avgDuration
                ? `${Math.floor(stats.avgDuration / 60)}:${Math.floor(
                    stats.avgDuration % 60
                  )
                    .toString()
                    .padStart(2, "0")}`
                : "--:--"}
            </span>
          </div>
          <p className="text-sm opacity-60 mt-1">Avg Duration</p>
        </div>
      </div>

      {/* Recent videos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-zinc-900">Recent Videos</h2>
          <Link
            to="/videos"
            className="text-zinc-600 hover:text-zinc-900 text-sm flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentVideos.map((video) => {
              const update = videoUpdates[video._id];
              return (
                <VideoCard
                  key={video._id}
                  video={video}
                  showProgress={!!update}
                  progress={update?.progress || video.processingProgress}
                  progressMessage={update?.message || video.processingMessage}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-10 text-center border border-zinc-200">
            <Video className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-zinc-900 mb-1">
              No videos yet
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              {canPerform("upload")
                ? "Upload your first video to get started"
                : "No videos have been shared with you yet"}
            </p>
            {canPerform("upload") && (
              <Link to="/upload">
                <Button icon={Upload}>Upload</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
