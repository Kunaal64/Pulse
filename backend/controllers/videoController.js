import fs from 'fs';
import path from 'path';
import { Video } from '../models/index.js';
import { videoProcessingService, sensitivityAnalysisService, streamingService } from '../services/index.js';
import { asyncHandler, NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler.js';
import { getSocketEmitter } from '../socket/socketHandler.js';

/**
 * @desc    Upload a new video
 * @route   POST /api/videos/upload
 * @access  Private (Editor, Admin)
 */
export const uploadVideo = asyncHandler(async (req, res) => {
  const file = req.file;
  const { title, description, category, tags, visibility } = req.body;

  // Create video document
  const video = await Video.create({
    title: title || file.originalname,
    description: description || '',
    filename: file.filename,
    originalName: file.originalname,
    filepath: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedBy: req.user._id,
    organization: req.user.organization,
    category: category || 'uncategorized',
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    visibility: visibility || 'private',
    status: 'uploading',
    processingProgress: 5,
    processingMessage: 'Upload complete, starting processing...'
  });

  // Get socket emitter
  const socketEmitter = getSocketEmitter(req.user._id.toString());

  // Emit upload complete
  socketEmitter('upload:complete', {
    videoId: video._id,
    message: 'Upload complete, processing started'
  });

  // Start async processing (don't await - let it run in background)
  processVideoAsync(video, socketEmitter);

  res.status(201).json({
    success: true,
    message: 'Video uploaded successfully. Processing started.',
    data: {
      video: video.toJSON()
    }
  });
});

/**
 * Async video processing function
 */
async function processVideoAsync(video, socketEmitter) {
  try {
    // Process video (metadata, thumbnail, etc.)
    await videoProcessingService.processVideo(video, socketEmitter);
    
    // Run sensitivity analysis
    await sensitivityAnalysisService.analyzeVideo(video, socketEmitter);
    
  } catch (error) {
    console.error('Video processing error:', error);
    
    video.status = 'failed';
    video.errorMessage = error.message;
    video.processingMessage = 'Processing failed: ' + error.message;
    await video.save();

    socketEmitter('processing:error', {
      videoId: video._id,
      error: error.message
    });
  }
}

/**
 * @desc    Get all videos for current user
 * @route   GET /api/videos
 * @access  Private
 */
export const getVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sensitivityStatus,
    category,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query based on user role
  let query = {};

  if (req.user.role === 'admin') {
    // Admin sees all videos in organization
    query.organization = req.user.organization;
  } else {
    // Users see their own videos + shared + organization/public videos
    query.$or = [
      { uploadedBy: req.user._id },
      { 'sharedWith.user': req.user._id },
      { visibility: 'public' },
      { visibility: 'organization', organization: req.user.organization }
    ];
  }

  // Apply filters
  if (status) query.status = status;
  if (sensitivityStatus) query.sensitivityStatus = sensitivityStatus;
  if (category) query.category = category;
  if (search) {
    query.$text = { $search: search };
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [videos, total] = await Promise.all([
    Video.find(query)
      .populate('uploadedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Video.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Private
 */
export const getVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id)
    .populate('uploadedBy', 'name email');

  if (!video) {
    throw NotFoundError('Video not found');
  }

  // Check access
  if (!video.isAccessibleBy(req.user)) {
    throw ForbiddenError('You do not have access to this video');
  }

  res.json({
    success: true,
    data: { video }
  });
});

/**
 * @desc    Update video details
 * @route   PUT /api/videos/:id
 * @access  Private (Owner, Admin)
 */
export const updateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  // Check permission
  const permission = video.getPermissionLevel(req.user);
  if (!['owner', 'admin', 'edit'].includes(permission)) {
    throw ForbiddenError('You do not have permission to edit this video');
  }

  const { title, description, category, tags, visibility } = req.body;

  if (title) video.title = title;
  if (description !== undefined) video.description = description;
  if (category) video.category = category;
  if (tags) video.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  if (visibility) video.visibility = visibility;

  await video.save();

  res.json({
    success: true,
    message: 'Video updated successfully',
    data: { video }
  });
});

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private (Owner, Admin)
 */
export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  // Check permission
  const permission = video.getPermissionLevel(req.user);
  if (!['owner', 'admin'].includes(permission)) {
    throw ForbiddenError('You do not have permission to delete this video');
  }

  // Delete file from disk
  if (fs.existsSync(video.filepath)) {
    fs.unlinkSync(video.filepath);
  }

  // Delete thumbnail
  if (video.thumbnail && fs.existsSync(video.thumbnail)) {
    fs.unlinkSync(video.thumbnail);
  }

  await video.deleteOne();

  res.json({
    success: true,
    message: 'Video deleted successfully'
  });
});

/**
 * @desc    Stream video
 * @route   GET /api/videos/:id/stream
 * @access  Private
 */
export const streamVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  // Check access
  if (!video.isAccessibleBy(req.user)) {
    throw ForbiddenError('You do not have access to this video');
  }

  // Check if video is ready for streaming
  if (video.status !== 'completed') {
    throw BadRequestError('Video is still processing and not ready for streaming');
  }

  // Stream video
  await streamingService.streamVideo(req, res, video);
});

/**
 * @desc    Get video thumbnail
 * @route   GET /api/videos/:id/thumbnail
 * @access  Private
 */
export const getThumbnail = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  if (!video.isAccessibleBy(req.user)) {
    throw ForbiddenError('You do not have access to this video');
  }

  await streamingService.streamThumbnail(req, res, video);
});

/**
 * @desc    Download video
 * @route   GET /api/videos/:id/download
 * @access  Private (Editor, Admin for own videos)
 */
export const downloadVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  const permission = video.getPermissionLevel(req.user);
  if (!['owner', 'admin', 'edit'].includes(permission)) {
    throw ForbiddenError('You do not have permission to download this video');
  }

  await streamingService.downloadVideo(req, res, video);
});

/**
 * @desc    Share video with users
 * @route   POST /api/videos/:id/share
 * @access  Private (Owner, Admin)
 */
export const shareVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  const permission = video.getPermissionLevel(req.user);
  if (!['owner', 'admin'].includes(permission)) {
    throw ForbiddenError('You do not have permission to share this video');
  }

  const { userId, permission: sharePermission } = req.body;

  // Check if already shared
  const existingShare = video.sharedWith.find(s => s.user.toString() === userId);
  if (existingShare) {
    existingShare.permission = sharePermission || 'view';
  } else {
    video.sharedWith.push({
      user: userId,
      permission: sharePermission || 'view'
    });
  }

  await video.save();

  res.json({
    success: true,
    message: 'Video shared successfully',
    data: { video }
  });
});

/**
 * @desc    Get video processing status
 * @route   GET /api/videos/:id/status
 * @access  Private
 */
export const getVideoStatus = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id)
    .select('status processingProgress processingMessage sensitivityStatus sensitivityScore sensitivityReasons');

  if (!video) {
    throw NotFoundError('Video not found');
  }

  res.json({
    success: true,
    data: {
      status: video.status,
      progress: video.processingProgress,
      message: video.processingMessage,
      sensitivity: {
        status: video.sensitivityStatus,
        score: video.sensitivityScore,
        reasons: video.sensitivityReasons
      }
    }
  });
});

/**
 * @desc    Get video statistics
 * @route   GET /api/videos/stats
 * @access  Private
 */
export const getVideoStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const organization = req.user.organization;

  let matchQuery = {};
  if (req.user.role === 'admin') {
    matchQuery.organization = organization;
  } else {
    matchQuery.uploadedBy = userId;
  }

  const stats = await Video.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalViews: { $sum: '$views' },
        avgDuration: { $avg: '$duration' },
        safeVideos: {
          $sum: { $cond: [{ $eq: ['$sensitivityStatus', 'safe'] }, 1, 0] }
        },
        flaggedVideos: {
          $sum: { $cond: [{ $eq: ['$sensitivityStatus', 'flagged'] }, 1, 0] }
        },
        processingVideos: {
          $sum: { $cond: [{ $in: ['$status', ['uploading', 'processing', 'analyzing']] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalVideos: 0,
    totalSize: 0,
    totalViews: 0,
    avgDuration: 0,
    safeVideos: 0,
    flaggedVideos: 0,
    processingVideos: 0
  };

  res.json({
    success: true,
    data: { stats: result }
  });
});

/**
 * @desc    Reanalyze video sensitivity
 * @route   POST /api/videos/:id/reanalyze
 * @access  Private (Admin)
 */
export const reanalyzeVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw NotFoundError('Video not found');
  }

  if (video.organization !== req.user.organization) {
    throw ForbiddenError('Access denied');
  }

  const socketEmitter = getSocketEmitter(req.user._id.toString());

  // Start reanalysis
  sensitivityAnalysisService.reanalyzeVideo(video._id, socketEmitter)
    .catch(err => console.error('Reanalysis error:', err));

  res.json({
    success: true,
    message: 'Reanalysis started'
  });
});
