import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

/**
 * Video Processing Service
 * Handles video metadata extraction, thumbnail generation, and processing
 */
class VideoProcessingService {
  constructor() {
    this.ffmpegPath = config.ffmpeg.path || 'ffmpeg';
    this.ffprobePath = config.ffmpeg.probePath || 'ffprobe';
  }

  /**
   * Get video metadata using ffprobe
   */
  async getVideoMetadata(filepath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filepath
      ];

      const ffprobe = spawn(this.ffprobePath, args);
      let output = '';
      let errorOutput = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          // Return basic metadata if ffprobe fails
          resolve({
            duration: null,
            width: null,
            height: null,
            bitrate: null,
            codec: null
          });
          return;
        }

        try {
          const metadata = JSON.parse(output);
          const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
          const format = metadata.format;

          resolve({
            duration: parseFloat(format?.duration) || null,
            width: videoStream?.width || null,
            height: videoStream?.height || null,
            bitrate: parseInt(format?.bit_rate) || null,
            codec: videoStream?.codec_name || null,
            fps: this.parseFps(videoStream?.r_frame_rate)
          });
        } catch (error) {
          resolve({
            duration: null,
            width: null,
            height: null,
            bitrate: null,
            codec: null
          });
        }
      });

      ffprobe.on('error', (error) => {
        console.error('FFprobe error:', error.message);
        resolve({
          duration: null,
          width: null,
          height: null,
          bitrate: null,
          codec: null
        });
      });
    });
  }

  /**
   * Parse frame rate from ffprobe output
   */
  parseFps(fpsString) {
    if (!fpsString) return null;
    const [num, den] = fpsString.split('/').map(Number);
    return den ? Math.round(num / den) : num;
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(videoPath, outputPath, timeOffset = '00:00:02') {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-ss', timeOffset,
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          // Return null if thumbnail generation fails (non-critical)
          resolve(null);
        }
      });

      ffmpeg.on('error', (error) => {
        console.error('FFmpeg thumbnail error:', error.message);
        resolve(null);
      });
    });
  }

  /**
   * Process video with progress tracking
   */
  async processVideo(video, socketEmitter) {
    const stages = [
      { name: 'Validating file', progress: 10 },
      { name: 'Extracting metadata', progress: 30 },
      { name: 'Generating thumbnail', progress: 50 },
      { name: 'Preparing for streaming', progress: 70 },
      { name: 'Finalizing', progress: 90 }
    ];

    try {
      // Stage 1: Validate file
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 10,
        message: 'Validating file...',
        status: 'processing'
      });
      
      await video.updateProgress(10, 'Validating file...', 'processing');
      
      if (!fs.existsSync(video.filepath)) {
        throw new Error('Video file not found');
      }

      // Simulate processing time
      await this.delay(500);

      // Stage 2: Extract metadata
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 30,
        message: 'Extracting metadata...',
        status: 'processing'
      });
      
      await video.updateProgress(30, 'Extracting metadata...', 'processing');
      
      const metadata = await this.getVideoMetadata(video.filepath);
      
      video.duration = metadata.duration;
      video.resolution = {
        width: metadata.width,
        height: metadata.height
      };

      await this.delay(500);

      // Stage 3: Generate thumbnail
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 50,
        message: 'Generating thumbnail...',
        status: 'processing'
      });
      
      await video.updateProgress(50, 'Generating thumbnail...', 'processing');
      
      const thumbnailPath = path.join(
        path.dirname(video.filepath),
        `${path.basename(video.filename, path.extname(video.filename))}_thumb.jpg`
      );
      
      const thumbnail = await this.generateThumbnail(video.filepath, thumbnailPath);
      if (thumbnail) {
        video.thumbnail = thumbnail;
      }

      await this.delay(500);

      // Stage 4: Prepare for streaming
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 70,
        message: 'Preparing for streaming...',
        status: 'analyzing'
      });
      
      await video.updateProgress(70, 'Preparing for streaming...', 'analyzing');
      
      video.streamingUrl = `/api/videos/${video._id}/stream`;

      await this.delay(500);

      // Stage 5: Finalize
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 90,
        message: 'Finalizing...',
        status: 'analyzing'
      });
      
      await video.updateProgress(90, 'Finalizing...', 'analyzing');

      await this.delay(300);

      return video;
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(directory) {
    try {
      const files = fs.readdirSync(directory);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filepath = path.join(directory, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default new VideoProcessingService();
