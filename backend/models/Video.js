import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // Duration in seconds
    default: null
  },
  resolution: {
    width: { type: Number, default: null },
    height: { type: Number, default: null }
  },
  thumbnail: {
    type: String,
    default: null
  },
  
  // Processing status
  status: {
    type: String,
    enum: ['uploading', 'processing', 'analyzing', 'completed', 'failed'],
    default: 'uploading'
  },
  processingProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  processingMessage: {
    type: String,
    default: ''
  },
  
  // Sensitivity analysis results
  sensitivityStatus: {
    type: String,
    enum: ['pending', 'safe', 'flagged', 'error'],
    default: 'pending'
  },
  sensitivityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  sensitivityDetails: {
    violence: { score: Number, detected: Boolean },
    adult: { score: Number, detected: Boolean },
    hate: { score: Number, detected: Boolean },
    drugs: { score: Number, detected: Boolean },
    language: { score: Number, detected: Boolean }
  },
  sensitivityReasons: [{
    type: String
  }],
  
  // User and organization (multi-tenant)
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: String,
    required: true,
    index: true
  },
  
  // Access control
  visibility: {
    type: String,
    enum: ['private', 'organization', 'public'],
    default: 'private'
  },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' }
  }],
  
  // Categories and tags
  category: {
    type: String,
    trim: true,
    default: 'uncategorized'
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Streaming metadata
  streamingUrl: {
    type: String,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  
  // Error tracking
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
videoSchema.index({ uploadedBy: 1, createdAt: -1 });
videoSchema.index({ organization: 1, status: 1 });
videoSchema.index({ sensitivityStatus: 1 });
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for formatted file size
videoSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Check if video is accessible by user
videoSchema.methods.isAccessibleBy = function(user) {
  // Owner always has access
  if (this.uploadedBy.toString() === user._id.toString()) return true;
  
  // Admin has access to all in organization
  if (user.role === 'admin' && this.organization === user.organization) return true;
  
  // Check visibility
  if (this.visibility === 'public') return true;
  if (this.visibility === 'organization' && this.organization === user.organization) return true;
  
  // Check shared access
  const sharedAccess = this.sharedWith.find(s => s.user.toString() === user._id.toString());
  return !!sharedAccess;
};

// Get permission level for user
videoSchema.methods.getPermissionLevel = function(user) {
  if (this.uploadedBy.toString() === user._id.toString()) return 'owner';
  if (user.role === 'admin' && this.organization === user.organization) return 'admin';
  
  const sharedAccess = this.sharedWith.find(s => s.user.toString() === user._id.toString());
  if (sharedAccess) return sharedAccess.permission;
  
  if (this.visibility === 'public' || this.visibility === 'organization') return 'view';
  
  return 'none';
};

// Update processing progress
videoSchema.methods.updateProgress = async function(progress, message, status) {
  this.processingProgress = progress;
  if (message) this.processingMessage = message;
  if (status) this.status = status;
  return this.save();
};

const Video = mongoose.model('Video', videoSchema);

export default Video;
