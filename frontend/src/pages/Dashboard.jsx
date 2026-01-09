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
      color: "primary",
      bgColor: "bg-primary-50",
      iconColor: "text-primary-600",
    },
    {
      title: "Safe Videos",
      value: stats?.safeVideos || 0,
      icon: CheckCircle,
      color: "success",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Flagged Videos",
      value: stats?.flaggedVideos || 0,
      icon: AlertTriangle,
      color: "danger",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Processing",
      value: stats?.processingVideos || 0,
      icon: Clock,
      color: "warning",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your videos
          </p>
        </div>

        {canPerform("upload") && (
          <Link to="/upload">
            <Button icon={Upload}>Upload Video</Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Total Views</p>
              <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <HardDrive className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Storage Used</p>
              <p className="text-2xl font-bold">
                {formatBytes(stats?.totalSize)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Avg Duration</p>
              <p className="text-2xl font-bold">
                {stats?.avgDuration
                  ? `${Math.floor(stats.avgDuration / 60)}:${Math.floor(
                      stats.avgDuration % 60
                    )
                      .toString()
                      .padStart(2, "0")}`
                  : "--:--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent videos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Videos</h2>
          <Link
            to="/videos"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No videos yet
            </h3>
            <p className="text-gray-500 mb-6">
              {canPerform("upload")
                ? "Upload your first video to get started"
                : "No videos have been shared with you yet"}
            </p>
            {canPerform("upload") && (
              <Link to="/upload">
                <Button icon={Upload}>Upload Video</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
