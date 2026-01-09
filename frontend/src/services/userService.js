import api from './api';

const userService = {
  /**
   * Get all users (admin only)
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get single user by ID
   */
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user (admin only)
   */
  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user role (admin only)
   */
  updateRole: async (id, role) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * Toggle user status (admin only)
   */
  toggleStatus: async (id) => {
    const response = await api.patch(`/users/${id}/status`);
    return response.data;
  },

  /**
   * Get user statistics (admin only)
   */
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  /**
   * Search users
   */
  searchUsers: async (query) => {
    const response = await api.get('/users', { params: { search: query } });
    return response.data;
  },

  /**
   * Update own profile (via auth routes)
   */
  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },

  /**
   * Change own password (via auth routes)
   */
  changePassword: async (data) => {
    const response = await api.put('/auth/password', data);
    return response.data;
  }
};

export default userService;
