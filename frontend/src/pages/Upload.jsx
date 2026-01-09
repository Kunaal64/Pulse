import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useSocket } from "../context/SocketContext";
import videoService from "../services/videoService";
import Button from "../components/common/Button";
import ProgressBar from "../components/common/ProgressBar";
import toast from "react-hot-toast";
import {
  Upload as UploadIcon,
  Film,
  X,
  CheckCircle,
  AlertCircle,
  Cloud,
} from "lucide-react";

const Upload = () => {
  const navigate = useNavigate();
  const { subscribeToVideo, getVideoUpdate } = useSocket();

  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    visibility: "private",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [error, setError] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError("File is too large. Maximum size is 500MB.");
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload a video file.");
        } else {
          setError("Error with selected file. Please try another.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        setError("");

        // Create video preview URL
        if (videoPreviewUrl) {
          URL.revokeObjectURL(videoPreviewUrl);
        }
        setVideoPreviewUrl(URL.createObjectURL(selectedFile));

        // Auto-fill title from filename
        if (!metadata.title) {
          const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
          setMetadata((prev) => ({ ...prev, title: nameWithoutExt }));
        }
      }
    },
    [metadata.title, videoPreviewUrl]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".webm", ".mov", ".avi", ".mkv"],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
  });

  const handleMetadataChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file");
      return;
    }

    if (!metadata.title.trim()) {
      setError("Please enter a title");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await videoService.upload(file, metadata, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        setUploadedVideo(result.data.video);
        subscribeToVideo(result.data.video._id);
        toast.success("Video uploaded! Processing started.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    setFile(null);
    setUploadProgress(0);
    setUploadedVideo(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get real-time update for uploaded video
  const videoUpdate = uploadedVideo ? getVideoUpdate(uploadedVideo._id) : null;
  const processingProgress =
    videoUpdate?.progress || uploadedVideo?.processingProgress || 0;
  const processingMessage =
    videoUpdate?.message || uploadedVideo?.processingMessage || "";
  const isReady = videoUpdate?.ready || uploadedVideo?.status === "completed";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Upload Video</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Upload a video for sensitivity analysis and streaming
        </p>
      </div>

      {/* Upload complete state */}
      {uploadedVideo && (
        <div className="bg-white rounded-lg p-6 shadow-soft border border-zinc-200 mb-6">
          <div className="text-center mb-5">
            {isReady ? (
              <>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-lg font-medium text-zinc-900">
                  Video Ready
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Your video has been processed successfully
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full spinner" />
                </div>
                <h2 className="text-lg font-medium text-zinc-900">
                  Processing Video
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {processingMessage ||
                    "Please wait while we analyze your video"}
                </p>
              </>
            )}
          </div>

          <div className="mb-6">
            <ProgressBar
              progress={processingProgress}
              message={processingMessage}
              size="lg"
              variant={isReady ? "success" : "primary"}
              animated={!isReady}
            />
          </div>

          {videoUpdate?.sensitivityStatus && (
            <div
              className={`p-3 rounded-lg mb-5 text-sm ${
                videoUpdate.sensitivityStatus === "safe"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {videoUpdate.sensitivityStatus === "safe" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {videoUpdate.sensitivityStatus === "safe"
                    ? "Content is Safe"
                    : "Content Flagged"}
                </span>
              </div>
              {videoUpdate.sensitivityReasons?.length > 0 && (
                <ul className="mt-2 ml-6 list-disc text-xs">
                  {videoUpdate.sensitivityReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/videos")}
              variant="secondary"
              fullWidth
            >
              View All Videos
            </Button>
            {isReady && (
              <Button
                onClick={() => navigate(`/videos/${uploadedVideo._id}`)}
                fullWidth
              >
                Watch Video
              </Button>
            )}
          </div>

          <button
            onClick={() => {
              setUploadedVideo(null);
              setFile(null);
              setUploadProgress(0);
              setMetadata({
                title: "",
                description: "",
                category: "",
                tags: "",
                visibility: "private",
              });
            }}
            className="w-full mt-3 text-center text-zinc-600 hover:text-zinc-900 text-sm"
          >
            Upload Another Video
          </button>
        </div>
      )}

      {/* Upload form */}
      {!uploadedVideo && (
        <div className="bg-white rounded-lg p-6 shadow-soft border border-zinc-200">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150 ${
              isDragActive
                ? "border-zinc-400 bg-zinc-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {/* Video Preview */}
                {videoPreviewUrl && (
                  <div className="relative rounded-lg overflow-hidden bg-black max-w-sm mx-auto">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full max-h-40 object-contain"
                      preload="metadata"
                    >
                      Your browser does not support video preview.
                    </video>
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Film className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-zinc-900 text-sm">{file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
                    title="Remove video"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>

                <p className="text-xs text-green-600">
                  ✓ Video ready for upload
                </p>
              </div>
            ) : (
              <>
                <Cloud className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-900 mb-1">
                  {isDragActive
                    ? "Drop your video here"
                    : "Drag & drop your video"}
                </p>
                <p className="text-zinc-500 text-sm mb-3">or click to browse files</p>
                <p className="text-xs text-zinc-400">
                  MP4, WebM, MOV, AVI, MKV • Max 500MB
                </p>
              </>
            )}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-6">
              <ProgressBar
                progress={uploadProgress}
                message="Uploading video..."
                size="lg"
                animated
              />
            </div>
          )}

          {/* Metadata form */}
          {file && !uploading && (
            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-medium text-zinc-600 mb-1.5"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={metadata.title}
                  onChange={handleMetadataChange}
                  className="input"
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-zinc-600 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={metadata.description}
                  onChange={handleMetadataChange}
                  className="input min-h-[80px]"
                  placeholder="Enter video description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-xs font-medium text-zinc-600 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={metadata.category}
                    onChange={handleMetadataChange}
                    className="input"
                  >
                    <option value="">Select category</option>
                    <option value="education">Education</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="marketing">Marketing</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="visibility"
                    className="block text-xs font-medium text-zinc-600 mb-1.5"
                  >
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={metadata.visibility}
                    onChange={handleMetadataChange}
                    className="input"
                  >
                    <option value="private">Private</option>
                    <option value="organization">Organization</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block text-xs font-medium text-zinc-600 mb-1.5"
                >
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={metadata.tags}
                  onChange={handleMetadataChange}
                  className="input"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <Button
                onClick={handleUpload}
                fullWidth
                icon={UploadIcon}
                loading={uploading}
              >
                Upload & Process Video
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
