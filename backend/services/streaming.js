import fs from 'fs';
import path from 'path';

/**
 * Video Streaming Service
 * Handles HTTP range requests for video streaming
 */
class StreamingService {
  /**
   * Stream video with range request support
   */
  async streamVideo(req, res, video) {
    const videoPath = video.filepath;
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Get content type
    const contentType = this.getContentType(video.mimetype, videoPath);

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize) {
        res.status(416).json({
          success: false,
          message: 'Requested range not satisfiable',
          fileSize
        });
        return;
      }

      const chunkSize = (end - start) + 1;

      // Create read stream for the range
      const stream = fs.createReadStream(videoPath, { start, end });

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });

      // Pipe stream to response
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video'
          });
        }
      });
    } else {
      // No range header - send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      });

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video'
          });
        }
      });
    }

    // Increment view count (async, don't wait)
    this.incrementViewCount(video._id).catch(console.error);
  }

  /**
   * Stream thumbnail image
   */
  async streamThumbnail(req, res, video) {
    if (!video.thumbnail || !fs.existsSync(video.thumbnail)) {
      // Return default placeholder if no thumbnail
      return res.status(404).json({
        success: false,
        message: 'Thumbnail not available'
      });
    }

    const stat = fs.statSync(video.thumbnail);
    
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    const stream = fs.createReadStream(video.thumbnail);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Thumbnail stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming thumbnail'
        });
      }
    });
  }

  /**
   * Get content type for video
   */
  getContentType(mimetype, filepath) {
    if (mimetype) return mimetype;

    const ext = path.extname(filepath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.m4v': 'video/mp4'
    };

    return mimeTypes[ext] || 'video/mp4';
  }

  /**
   * Increment video view count
   */
  async incrementViewCount(videoId) {
    const { Video } = await import('../models/index.js');
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
  }

  /**
   * Get video file info for download
   */
  getDownloadHeaders(video) {
    return {
      'Content-Type': video.mimetype || 'video/mp4',
      'Content-Disposition': `attachment; filename="${video.originalName}"`,
      'Content-Length': video.size
    };
  }

  /**
   * Prepare video for download
   */
  async downloadVideo(req, res, video) {
    const videoPath = video.filepath;

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }

    const stat = fs.statSync(videoPath);

    res.writeHead(200, {
      'Content-Type': video.mimetype || 'video/mp4',
      'Content-Disposition': `attachment; filename="${video.originalName}"`,
      'Content-Length': stat.size
    });

    const stream = fs.createReadStream(videoPath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading video'
        });
      }
    });
  }
}

export default new StreamingService();
