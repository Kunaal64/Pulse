import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import videoService from "../services/videoService";
import VideoCard from "../components/common/VideoCard";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  Video,
  RefreshCw,
} from "lucide-react";

const Videos = () => {
  const { canPerform } = useAuth();
  const { videoUpdates } = useSocket();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sensitivityStatus: "",
    category: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, [pagination.page, filters]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      };

      const response = await videoService.getVideos(params);
      setVideos(response.data.videos);
      setPagination((prev) => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await videoService.updateVideo(editingVideo._id, {
        title: editingVideo.title,
        description: editingVideo.description,
        category: editingVideo.category,
        visibility: editingVideo.visibility,
      });

      toast.success("Video updated successfully");
      setEditModal(false);
      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      toast.error("Failed to update video");
    }
  };

  const handleDeleteClick = (videoId) => {
    setDeletingVideoId(videoId);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await videoService.deleteVideo(deletingVideoId);
      toast.success("Video deleted successfully");
      setDeleteModal(false);
      setDeletingVideoId(null);
      fetchVideos();
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      sensitivityStatus: "",
      category: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "createdAt" && v !== "desc"
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Videos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Manage and view your video library
          </p>
        </div>

        <Button
          onClick={fetchVideos}
          variant="secondary"
          icon={RefreshCw}
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {/* Search and filters bar */}
      <div className="bg-white rounded-lg p-3 shadow-soft border border-zinc-200 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.search}
              onChange={handleSearch}
              className="input pl-10 text-sm"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? "primary" : "secondary"}
            icon={SlidersHorizontal}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* View mode toggle */}
          <div className="flex border border-zinc-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-white text-zinc-400 hover:bg-zinc-50"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-white text-zinc-400 hover:bg-zinc-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="input text-sm"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Sensitivity
              </label>
              <select
                value={filters.sensitivityStatus}
                onChange={(e) =>
                  handleFilterChange("sensitivityStatus", e.target.value)
                }
                className="input text-sm"
              >
                <option value="">All</option>
                <option value="safe">Safe</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="input text-sm"
              >
                <option value="">All</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="marketing">Marketing</option>
                <option value="training">Training</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Sort by
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortOrder", sortOrder);
                }}
                className="input text-sm"
              >
                <option value="createdAt-desc">Newest first</option>
                <option value="createdAt-asc">Oldest first</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="views-desc">Most viewed</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-4">
              <button
                onClick={clearFilters}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Videos grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full spinner"></div>
        </div>
      ) : videos.length > 0 ? (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            }
          >
            {videos.map((video) => {
              const update = videoUpdates[video._id];
              return (
                <VideoCard
                  key={video._id}
                  video={video}
                  onEdit={canPerform("upload") ? handleEdit : null}
                  onDelete={canPerform("upload") ? handleDeleteClick : null}
                  showProgress={!!update}
                  progress={update?.progress || video.processingProgress}
                  progressMessage={update?.message || video.processingMessage}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(pagination.pages, 5) },
                  (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: pageNum }))
                        }
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                          pagination.page === pageNum
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg p-10 text-center border border-zinc-200">
          <Video className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-zinc-900 mb-1">
            No videos found
          </h3>
          <p className="text-zinc-500 text-sm">
            {filters.search || activeFilterCount > 0
              ? "Try adjusting your search or filters"
              : "Upload your first video to get started"}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Video"
      >
        {editingVideo && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={editingVideo.title}
                onChange={(e) =>
                  setEditingVideo({ ...editingVideo, title: e.target.value })
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Description
              </label>
              <textarea
                value={editingVideo.description || ""}
                onChange={(e) =>
                  setEditingVideo({
                    ...editingVideo,
                    description: e.target.value,
                  })
                }
                className="input min-h-[80px]"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Category
              </label>
              <select
                value={editingVideo.category || ""}
                onChange={(e) =>
                  setEditingVideo({ ...editingVideo, category: e.target.value })
                }
                className="input"
              >
                <option value="">Select category</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="marketing">Marketing</option>
                <option value="training">Training</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Visibility
              </label>
              <select
                value={editingVideo.visibility}
                onChange={(e) =>
                  setEditingVideo({
                    ...editingVideo,
                    visibility: e.target.value,
                  })
                }
                className="input"
              >
                <option value="private">Private</option>
                <option value="organization">Organization</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                variant="secondary"
                onClick={() => setEditModal(false)}
                fullWidth
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} fullWidth>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Video"
        size="sm"
      >
        <div className="p-5">
          <p className="text-zinc-600 text-sm mb-5">
            Are you sure you want to delete this video? This action cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} fullWidth>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Videos;
