import api from './api';

const videoService = {
  /**
   * Upload a new video
   */
  upload: async (file, metadata, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.tags) formData.append('tags', metadata.tags);
    if (metadata.visibility) formData.append('visibility', metadata.visibility);

    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    return response.data;
  },

  /**
   * Get all videos with filters
   */
  getVideos: async (params = {}) => {
    const response = await api.get('/videos', { params });
    return response.data;
  },

  /**
   * Get single video by ID
   */
  getVideo: async (id) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  /**
   * Update video details
   */
  updateVideo: async (id, data) => {
    const response = await api.put(`/videos/${id}`, data);
    return response.data;
  },

  /**
   * Delete video
   */
  deleteVideo: async (id) => {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  },

  /**
   * Get video streaming URL
   */
  getStreamUrl: (id) => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/videos/${id}/stream?token=${token}`;
  },

  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl: (id) => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/videos/${id}/thumbnail?token=${token}`;
  },

  /**
   * Get video status
   */
  getVideoStatus: async (id) => {
    const response = await api.get(`/videos/${id}/status`);
    return response.data;
  },

  /**
   * Share video with user
   */
  shareVideo: async (id, userId, permission = 'view') => {
    const response = await api.post(`/videos/${id}/share`, { userId, permission });
    return response.data;
  },

  /**
   * Get video statistics
   */
  getStats: async () => {
    const response = await api.get('/videos/stats');
    return response.data;
  },

  /**
   * Trigger reanalysis
   */
  reanalyze: async (id) => {
    const response = await api.post(`/videos/${id}/reanalyze`);
    return response.data;
  }
};

export default videoService;
