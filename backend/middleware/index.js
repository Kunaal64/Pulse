import { authenticate, optionalAuth, generateToken, generateRefreshToken } from './auth.js';
import { 
  requireRole, 
  requirePermission, 
  requireOwnership, 
  requireSameOrganization,
  adminOnly, 
  editorOrAdmin,
  getUserPermissions 
} from './rbac.js';
import { videoUpload, handleUploadError, validateUpload, getUploadDirs } from './upload.js';
import { 
  ApiError, 
  asyncHandler, 
  notFoundHandler, 
  errorHandler,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalError
} from './errorHandler.js';

export {
  // Auth
  authenticate,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  
  // RBAC
  requireRole,
  requirePermission,
  requireOwnership,
  requireSameOrganization,
  adminOnly,
  editorOrAdmin,
  getUserPermissions,
  
  // Upload
  videoUpload,
  handleUploadError,
  validateUpload,
  getUploadDirs,
  
  // Error handling
  ApiError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalError
};
