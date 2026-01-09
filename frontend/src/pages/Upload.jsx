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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
        <p className="text-gray-500 mt-2">
          Upload a video for sensitivity analysis and streaming
        </p>
      </div>

      {/* Upload complete state */}
      {uploadedVideo && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-6">
          <div className="text-center mb-6">
            {isReady ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Video Ready!
                </h2>
                <p className="text-gray-500 mt-1">
                  Your video has been processed successfully
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full spinner" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Processing Video...
                </h2>
                <p className="text-gray-500 mt-1">
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
              className={`p-4 rounded-lg mb-6 ${
                videoUpdate.sensitivityStatus === "safe"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {videoUpdate.sensitivityStatus === "safe" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  Sensitivity Analysis:{" "}
                  {videoUpdate.sensitivityStatus === "safe"
                    ? "Content is Safe"
                    : "Content Flagged"}
                </span>
              </div>
              {videoUpdate.sensitivityReasons?.length > 0 && (
                <ul className="mt-2 ml-7 list-disc text-sm">
                  {videoUpdate.sensitivityReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-4">
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
            className="w-full mt-4 text-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Upload Another Video
          </button>
        </div>
      )}

      {/* Upload form */}
      {!uploadedVideo && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-primary-500 bg-primary-50"
                : file
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Video Preview */}
                {videoPreviewUrl && (
                  <div className="relative rounded-lg overflow-hidden bg-black max-w-md mx-auto">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full max-h-48 object-contain"
                      preload="metadata"
                    >
                      Your browser does not support video preview.
                    </video>
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Film className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Remove video"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-sm text-green-600 font-medium">
                  ✓ Video ready for upload
                </p>
              </div>
            ) : (
              <>
                <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive
                    ? "Drop your video here"
                    : "Drag & drop your video"}
                </p>
                <p className="text-gray-500 mb-4">or click to browse files</p>
                <p className="text-sm text-gray-400">
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
            <div className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={metadata.description}
                  onChange={handleMetadataChange}
                  className="input min-h-[100px]"
                  placeholder="Enter video description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                size="lg"
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
