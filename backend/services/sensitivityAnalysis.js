import { Video } from '../models/index.js';

/**
 * Sensitivity Analysis Service
 * Analyzes video content for sensitive material and classifies as safe/flagged
 * 
 * In a production environment, this would integrate with:
 * - AWS Rekognition
 * - Google Cloud Video Intelligence
 * - Azure Content Moderator
 * - Custom ML models
 * 
 * For this implementation, we simulate the analysis process
 */
class SensitivityAnalysisService {
  constructor() {
    // Sensitivity thresholds (0-100)
    this.thresholds = {
      violence: 70,
      adult: 70,
      hate: 60,
      drugs: 60,
      language: 80
    };
    
    // Overall threshold for flagging
    this.overallThreshold = 65;
  }

  /**
   * Analyze video for sensitive content
   * Returns analysis results and classification
   */
  async analyzeVideo(video, socketEmitter) {
    try {
      // Emit start of analysis
      socketEmitter('sensitivity:start', {
        videoId: video._id,
        message: 'Starting sensitivity analysis...'
      });

      // Update progress
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 92,
        message: 'Analyzing content for sensitivity...',
        status: 'analyzing'
      });

      await video.updateProgress(92, 'Analyzing content for sensitivity...', 'analyzing');
      
      // Simulate analysis delay (would be actual API call in production)
      await this.delay(2000);

      // Generate simulated analysis results
      // In production, this would be actual content analysis
      const analysisResults = await this.performAnalysis(video);

      // Update progress
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 96,
        message: 'Generating sensitivity report...',
        status: 'analyzing'
      });

      await this.delay(1000);

      // Calculate overall score and determine status
      const overallScore = this.calculateOverallScore(analysisResults);
      const sensitivityStatus = this.determineSensitivityStatus(analysisResults, overallScore);
      const reasons = this.generateReasons(analysisResults);

      // Update video with analysis results
      video.sensitivityDetails = analysisResults;
      video.sensitivityScore = overallScore;
      video.sensitivityStatus = sensitivityStatus;
      video.sensitivityReasons = reasons;
      video.status = 'completed';
      video.processingProgress = 100;
      video.processingMessage = sensitivityStatus === 'safe' 
        ? 'Video processed successfully - Content is safe'
        : 'Video processed - Content flagged for review';

      await video.save();

      // Emit completion
      socketEmitter('processing:update', {
        videoId: video._id,
        progress: 100,
        message: video.processingMessage,
        status: 'completed'
      });

      socketEmitter('sensitivity:complete', {
        videoId: video._id,
        status: sensitivityStatus,
        score: overallScore,
        details: analysisResults,
        reasons: reasons
      });

      socketEmitter('video:ready', {
        videoId: video._id,
        video: video.toJSON()
      });

      return {
        status: sensitivityStatus,
        score: overallScore,
        details: analysisResults,
        reasons: reasons
      };
    } catch (error) {
      console.error('Sensitivity analysis error:', error);
      
      video.sensitivityStatus = 'error';
      video.status = 'failed';
      video.errorMessage = error.message;
      await video.save();

      socketEmitter('processing:error', {
        videoId: video._id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Perform content analysis
   * Simulates various content moderation checks
   */
  async performAnalysis(video) {
    // Simulate analysis based on video properties
    // In production, this would call external APIs or ML models
    
    // Generate random scores for simulation
    // Real implementation would analyze actual video content
    const generateScore = () => Math.floor(Math.random() * 40); // Low scores = mostly safe content
    
    // Occasionally generate higher scores for testing
    const addVariance = (score) => {
      const variance = Math.random();
      if (variance > 0.9) return Math.min(score + 50, 100); // 10% chance of higher score
      if (variance > 0.8) return Math.min(score + 30, 85);  // 10% chance of medium score
      return score;
    };

    return {
      violence: {
        score: addVariance(generateScore()),
        detected: false
      },
      adult: {
        score: addVariance(generateScore()),
        detected: false
      },
      hate: {
        score: addVariance(generateScore()),
        detected: false
      },
      drugs: {
        score: addVariance(generateScore()),
        detected: false
      },
      language: {
        score: addVariance(generateScore()),
        detected: false
      }
    };
  }

  /**
   * Calculate overall sensitivity score
   */
  calculateOverallScore(results) {
    const scores = Object.values(results).map(r => r.score);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Weight maximum score more heavily
    return Math.round((maxScore * 0.6) + (avgScore * 0.4));
  }

  /**
   * Determine if video should be flagged
   */
  determineSensitivityStatus(results, overallScore) {
    // Check individual thresholds
    for (const [category, data] of Object.entries(results)) {
      if (data.score >= this.thresholds[category]) {
        results[category].detected = true;
        return 'flagged';
      }
    }

    // Check overall threshold
    if (overallScore >= this.overallThreshold) {
      return 'flagged';
    }

    return 'safe';
  }

  /**
   * Generate human-readable reasons for flagging
   */
  generateReasons(results) {
    const reasons = [];
    
    const categoryLabels = {
      violence: 'Violent content',
      adult: 'Adult content',
      hate: 'Hate speech or symbols',
      drugs: 'Drug-related content',
      language: 'Explicit language'
    };

    for (const [category, data] of Object.entries(results)) {
      if (data.detected || data.score >= this.thresholds[category]) {
        reasons.push(`${categoryLabels[category]} detected (score: ${data.score})`);
      }
    }

    return reasons;
  }

  /**
   * Re-analyze a video (for manual review triggers)
   */
  async reanalyzeVideo(videoId, socketEmitter) {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    video.sensitivityStatus = 'pending';
    video.status = 'analyzing';
    video.processingProgress = 90;
    await video.save();

    return this.analyzeVideo(video, socketEmitter);
  }

  /**
   * Manually override sensitivity status (admin function)
   */
  async overrideSensitivityStatus(videoId, newStatus, reason, adminId) {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    const previousStatus = video.sensitivityStatus;
    
    video.sensitivityStatus = newStatus;
    video.sensitivityReasons = [
      ...video.sensitivityReasons,
      `Manual override by admin: ${previousStatus} -> ${newStatus}. Reason: ${reason}`
    ];

    await video.save();

    return video;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sensitivity statistics for organization
   */
  async getOrganizationStats(organization) {
    const stats = await Video.aggregate([
      { $match: { organization } },
      {
        $group: {
          _id: '$sensitivityStatus',
          count: { $sum: 1 },
          avgScore: { $avg: '$sensitivityScore' }
        }
      }
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgScore: Math.round(stat.avgScore || 0)
      };
      return acc;
    }, {});
  }
}

export default new SensitivityAnalysisService();
