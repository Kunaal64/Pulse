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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Videos</h1>
          <p className="text-gray-500 mt-1">
            Manage and view your video library
          </p>
        </div>

        <Button onClick={fetchVideos} variant="secondary" icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* Search and filters bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.search}
              onChange={handleSearch}
              className="input pl-10"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? "primary" : "secondary"}
            icon={SlidersHorizontal}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* View mode toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-primary-50 text-primary-600"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-primary-50 text-primary-600"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="input"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sensitivity
              </label>
              <select
                value={filters.sensitivityStatus}
                onChange={(e) =>
                  handleFilterChange("sensitivityStatus", e.target.value)
                }
                className="input"
              >
                <option value="">All</option>
                <option value="safe">Safe</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="input"
              >
                <option value="">All</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="marketing">Marketing</option>
                <option value="training">Training</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortOrder", sortOrder);
                }}
                className="input"
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
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Videos grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full spinner"></div>
        </div>
      ) : videos.length > 0 ? (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
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
            <div className="mt-8 flex items-center justify-center gap-2">
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
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No videos found
          </h3>
          <p className="text-gray-500">
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
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="input min-h-[100px]"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

            <div className="flex gap-4 pt-4">
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
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this video? This action cannot be
            undone.
          </p>
          <div className="flex gap-4">
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
