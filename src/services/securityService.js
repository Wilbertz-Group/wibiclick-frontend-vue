// wibiclick-frontend-vue/src/services/securityService.js
import axios from 'axios';

/**
 * SecurityService - Enhanced version with comprehensive security analytics
 * Handles all API calls related to security monitoring, blocked IPs, and threat analysis
 */
export default {
  /**
   * Get the list of blocked IPs with enhanced information
   * @param {string} websiteId - Current website ID
   * @param {Object} options - Query options (search, filters, pagination)
   * @returns {Promise<Object>} Blocked IPs data with metadata
   */
  async getBlockedIps(websiteId, options = {}) {
    try {
      const params = new URLSearchParams({
        id: websiteId,
        ...options
      });
      
      const { data } = await axios.get(`/api/security/blocklist?${params}`);
      return {
        blockedIps: data.blockedIps || [],
        total: data.total || 0,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      throw error;
    }
  },

  /**
   * Add an IP to the blocklist with reason
   * @param {string} websiteId - Current website ID
   * @param {string} ip - IP address to block
   * @param {string} reason - Reason for blocking (optional)
   * @param {number} duration - Block duration in milliseconds (optional)
   * @returns {Promise<Object>} Response data
   */
  async addBlockedIp(websiteId, ip, reason = 'Manually blocked', duration = null) {
    try {
      const payload = { ip, reason };
      if (duration) payload.duration = duration;
      
      const { data } = await axios.post(`/api/security/block`, payload, {
        params: { id: websiteId }
      });
      return data;
    } catch (error) {
      console.error('Error adding blocked IP:', error);
      throw error;
    }
  },

  /**
   * Remove an IP from the blocklist
   * @param {string} websiteId - Current website ID
   * @param {string} ip - IP address to unblock
   * @returns {Promise<Object>} Response data
   */
  async removeBlockedIp(websiteId, ip) {
    try {
      const { data } = await axios.post(`/api/security/unblock`, { ip }, {
        params: { id: websiteId }
      });
      return data;
    } catch (error) {
      console.error('Error removing blocked IP:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive security statistics and analytics
   * @param {string} websiteId - Current website ID
   * @param {string} timeRange - Time range for analytics (1h, 24h, 7d, 30d)
   * @returns {Promise<Object>} Security analytics data
   */
  async getSecurityAnalytics(websiteId, timeRange = '24h') {
    try {
      const { data } = await axios.get('/api/security/analytics', {
        params: { 
          websiteId,
          timeRange 
        }
      });
      
      return {
        totalBlocked: data.totalBlocked || 0,
        recentBlocks: data.recentBlocks || 0,
        totalAttacks: data.totalAttacks || 0,
        attacksToday: data.attacksToday || 0,
        attacksByCategory: data.attacksByCategory || {},
        attacksByHour: data.attacksByHour || [],
        topAttackingIps: data.topAttackingIps || [],
        topAttackingCountries: data.topAttackingCountries || [],
        securityScore: data.securityScore || 0,
        trends: data.trends || {}
      };
    } catch (error) {
      console.error('Error fetching security analytics:', error);
      throw error;
    }
  },

  /**
   * Get recent security events and attacks
   * @param {string} websiteId - Current website ID
   * @param {number} limit - Number of events to return
   * @param {string} timeRange - Time range for events
   * @returns {Promise<Array>} Recent security events
   */
  async getRecentSecurityEvents(websiteId, limit = 50, timeRange = '24h') {
    try {
      const { data } = await axios.get('/api/security/events/recent', {
        params: { 
          websiteId,
          limit,
          timeRange 
        }
      });
      
      return data.events || [];
    } catch (error) {
      console.error('Error fetching recent security events:', error);
      throw error;
    }
  },

  /**
   * Fetch attack logs for analysis
   * @param {string} websiteId - Current website ID
   * @param {Object} filters - Filtering options
   * @returns {Promise<Object>} Attack logs with metadata
   */
  async getAttackLogs(websiteId, filters = {}) {
    try {
      const params = {
        websiteId,
        ...filters
      };
      
      const { data } = await axios.get('/api/security/attack-logs', { params });
      return {
        attackLogs: data.attackLogs || [],
        total: data.total || 0,
        summary: data.summary || {},
        categories: data.categories || {}
      };
    } catch (error) {
      console.error('Error fetching attack logs:', error);
      throw error;
    }
  },

  /**
   * Get attack logs for a specific IP address
   * @param {string} ip - IP address to get logs for
   * @param {string} websiteId - Current website ID
   * @param {number} limit - Number of logs to return
   * @returns {Promise<Array>} Attack logs for the IP
   */
  async getAttackLogsForIp(ip, websiteId, limit = 10) {
    try {
      const { data } = await axios.get('/api/security/attack-logs/ip', {
        params: { 
          ip: encodeURIComponent(ip),
          websiteId,
          limit 
        }
      });
      return data.attackLogs || [];
    } catch (error) {
      console.error('Error fetching attack logs for IP:', error);
      throw error;
    }
  },

  /**
   * Get geographic distribution of attacks
   * @param {string} websiteId - Current website ID
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Geographic attack data
   */
  async getGeographicAttackData(websiteId, timeRange = '24h') {
    try {
      const { data } = await axios.get('/api/security/analytics/geographic', {
        params: { 
          websiteId,
          timeRange 
        }
      });
      
      return {
        countries: data.countries || [],
        regions: data.regions || [],
        cities: data.cities || [],
        summary: data.summary || {}
      };
    } catch (error) {
      console.error('Error fetching geographic attack data:', error);
      throw error;
    }
  },

  /**
   * Get attack pattern analysis
   * @param {string} websiteId - Current website ID
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Attack pattern data
   */
  async getAttackPatterns(websiteId, timeRange = '24h') {
    try {
      const { data } = await axios.get('/api/security/analytics/patterns', {
        params: { 
          websiteId,
          timeRange 
        }
      });
      
      return {
        categories: data.categories || {},
        userAgents: data.userAgents || [],
        requestMethods: data.requestMethods || {},
        targetUrls: data.targetUrls || [],
        timeDistribution: data.timeDistribution || {}
      };
    } catch (error) {
      console.error('Error fetching attack patterns:', error);
      throw error;
    }
  },

  /**
   * Start real-time monitoring session
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Object>} Monitoring session data
   */
  async startMonitoring(websiteId) {
    try {
      const { data } = await axios.post('/api/security/monitoring/start', {
        websiteId
      });
      return data;
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  },

  /**
   * Stop real-time monitoring session
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Object>} Response data
   */
  async stopMonitoring(websiteId) {
    try {
      const { data } = await axios.post('/api/security/monitoring/stop', {
        websiteId
      });
      return data;
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      throw error;
    }
  },

  /**
   * Get real-time monitoring status and recent events
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Object>} Monitoring status and events
   */
  async getMonitoringStatus(websiteId) {
    try {
      const { data } = await axios.get('/api/security/monitoring/status', {
        params: { websiteId }
      });
      
      return {
        isActive: data.isActive || false,
        startedAt: data.startedAt,
        recentEvents: data.recentEvents || [],
        stats: data.stats || {}
      };
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
      throw error;
    }
  },

  /**
   * Export comprehensive security report
   * @param {string} websiteId - Current website ID
   * @param {Object} options - Export options (format, timeRange, includeDetails)
   * @returns {Promise<Blob>} Export file blob
   */
  async exportSecurityReport(websiteId, options = {}) {
    try {
      const params = {
        websiteId,
        format: options.format || 'json',
        timeRange: options.timeRange || '30d',
        includeDetails: options.includeDetails || true
      };
      
      const response = await axios.get('/api/security/export', {
        params,
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting security report:', error);
      throw error;
    }
  },

  /**
   * Get security recommendations based on current threats
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Array>} Security recommendations
   */
  async getSecurityRecommendations(websiteId) {
    try {
      const { data } = await axios.get('/api/security/recommendations', {
        params: { websiteId }
      });
      
      return data.recommendations || [];
    } catch (error) {
      console.error('Error fetching security recommendations:', error);
      throw error;
    }
  },

  /**
   * Test security configuration
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Object>} Security test results
   */
  async testSecurityConfiguration(websiteId) {
    try {
      const { data } = await axios.post('/api/security/test', {
        websiteId
      });
      
      return {
        score: data.score || 0,
        tests: data.tests || [],
        recommendations: data.recommendations || []
      };
    } catch (error) {
      console.error('Error testing security configuration:', error);
      throw error;
    }
  },

  /**
   * Update security settings
   * @param {string} websiteId - Current website ID
   * @param {Object} settings - Security settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSecuritySettings(websiteId, settings) {
    try {
      const { data } = await axios.put('/api/security/settings', {
        websiteId,
        settings
      });
      return data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  /**
   * Get IP reputation data
   * @param {string} ip - IP address to check
   * @returns {Promise<Object>} IP reputation information
   */
  async getIpReputation(ip) {
    try {
      const { data } = await axios.get('/api/security/ip-reputation', {
        params: { ip: encodeURIComponent(ip) }
      });
      
      return {
        ip,
        reputation: data.reputation || 'unknown',
        riskScore: data.riskScore || 0,
        categories: data.categories || [],
        location: data.location || {},
        provider: data.provider || {},
        history: data.history || []
      };
    } catch (error) {
      console.error('Error fetching IP reputation:', error);
      throw error;
    }
  },

  /**
   * Bulk operations for IP management
   * @param {string} websiteId - Current website ID
   * @param {Object} operation - Bulk operation details
   * @returns {Promise<Object>} Operation results
   */
  async bulkIpOperation(websiteId, operation) {
    try {
      const { data } = await axios.post('/api/security/bulk-operations', {
        websiteId,
        ...operation
      });
      
      return {
        success: data.success || false,
        processed: data.processed || 0,
        failed: data.failed || 0,
        results: data.results || []
      };
    } catch (error) {
      console.error('Error performing bulk IP operation:', error);
      throw error;
    }
  }
};