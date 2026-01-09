import express from 'express';
import { videoController } from '../controllers/index.js';
import { 
  authenticate, 
  videoUpload, 
  handleUploadError, 
  validateUpload,
  adminOnly
} from '../middleware/index.js';

const router = express.Router();

/**
 * @route   POST /api/videos/upload
 * @desc    Upload a new video
 * @access  Private (Authenticated users)
 */
router.post(
  '/upload',
  authenticate,
  videoUpload,
  handleUploadError,
  validateUpload,
  videoController.uploadVideo
);

/**
 * @route   GET /api/videos
 * @desc    Get all videos (with filters)
 * @access  Private
 */
router.get('/', authenticate, videoController.getVideos);

/**
 * @route   GET /api/videos/stats
 * @desc    Get video statistics
 * @access  Private
 */
router.get('/stats', authenticate, videoController.getVideoStats);

/**
 * @route   GET /api/videos/:id
 * @desc    Get single video by ID
 * @access  Private
 */
router.get('/:id', authenticate, videoController.getVideo);

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video details
 * @access  Private (Owner, Editor with access, Admin)
 */
router.put('/:id', authenticate, videoController.updateVideo);

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete a video
 * @access  Private (Owner, Admin)
 */
router.delete('/:id', authenticate, videoController.deleteVideo);

/**
 * @route   GET /api/videos/:id/stream
 * @desc    Stream video (with range request support)
 * @access  Private
 */
router.get('/:id/stream', authenticate, videoController.streamVideo);

/**
 * @route   GET /api/videos/:id/thumbnail
 * @desc    Get video thumbnail
 * @access  Private
 */
router.get('/:id/thumbnail', authenticate, videoController.getThumbnail);

/**
 * @route   GET /api/videos/:id/download
 * @desc    Download video file
 * @access  Private (Owner, Editor, Admin)
 */
router.get('/:id/download', authenticate, videoController.downloadVideo);

/**
 * @route   POST /api/videos/:id/share
 * @desc    Share video with other users
 * @access  Private (Owner, Admin)
 */
router.post('/:id/share', authenticate, videoController.shareVideo);

/**
 * @route   GET /api/videos/:id/status
 * @desc    Get video processing status
 * @access  Private
 */
router.get('/:id/status', authenticate, videoController.getVideoStatus);

/**
 * @route   POST /api/videos/:id/reanalyze
 * @desc    Trigger reanalysis of video sensitivity
 * @access  Private (Admin)
 */
router.post('/:id/reanalyze', authenticate, adminOnly, videoController.reanalyzeVideo);

export default router;
