import config from '../config/index.js';

const { roles } = config;

/**
 * Role-Based Access Control (RBAC) Middleware
 * Defines permissions for each role and checks access
 */

// Permission definitions for each role
const rolePermissions = {
  [roles.VIEWER]: {
    videos: ['read', 'stream'],
    users: ['read:own'],
    profile: ['read', 'update']
  },
  [roles.EDITOR]: {
    videos: ['create', 'read', 'update', 'delete:own', 'stream'],
    users: ['read:own'],
    profile: ['read', 'update']
  },
  [roles.ADMIN]: {
    videos: ['create', 'read', 'update', 'delete', 'stream', 'manage'],
    users: ['create', 'read', 'update', 'delete', 'manage'],
    profile: ['read', 'update'],
    system: ['manage', 'configure']
  }
};

/**
 * Check if role has specific permission
 */
const hasPermission = (role, resource, action) => {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  
  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions.includes(action) || resourcePermissions.includes('manage');
};

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userRole = req.user.role;
    
    // Flatten in case of nested arrays
    const roles = allowedRoles.flat();
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: userRole
      });
    }
    
    next();
  };
};

/**
 * Middleware to check specific permission
 * @param {string} resource - Resource name (videos, users, etc.)
 * @param {string} action - Action to perform (create, read, update, delete, etc.)
 */
export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userRole = req.user.role;
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to ${action} ${resource}.`
      });
    }
    
    next();
  };
};

/**
 * Check if user can only access their own resources
 */
export const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Admin can access all resources in their organization
    if (req.user.role === roles.ADMIN) {
      return next();
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Check if user belongs to the same organization
 */
export const requireSameOrganization = (getResourceOrg) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    try {
      const resourceOrg = await getResourceOrg(req);
      
      if (resourceOrg !== req.user.organization) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Resource belongs to different organization.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Organization check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking organization access'
      });
    }
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = requireRole(roles.ADMIN);

/**
 * Editor or Admin middleware
 */
export const editorOrAdmin = requireRole(roles.EDITOR, roles.ADMIN);

/**
 * Get user's effective permissions
 */
export const getUserPermissions = (role) => {
  return rolePermissions[role] || {};
};

export default {
  requireRole,
  requirePermission,
  requireOwnership,
  requireSameOrganization,
  adminOnly,
  editorOrAdmin,
  getUserPermissions,
  hasPermission
};
