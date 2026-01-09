import dotenv from 'dotenv';
dotenv.config();

export default {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse_video_db',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 524288000, // 500MB
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // AWS S3 (Optional)
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET
  },
  
  // Sensitivity API (Optional)
  sensitivityApi: {
    url: process.env.SENSITIVITY_API_URL,
    key: process.env.SENSITIVITY_API_KEY
  },
  
  // FFmpeg paths (Optional)
  ffmpeg: {
    path: process.env.FFMPEG_PATH,
    probePath: process.env.FFPROBE_PATH
  },
  
  // Allowed video formats
  allowedVideoFormats: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  
  // User roles
  roles: {
    VIEWER: 'viewer',
    EDITOR: 'editor',
    ADMIN: 'admin'
  }
};
