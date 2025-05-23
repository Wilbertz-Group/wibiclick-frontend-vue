// wibiclick-frontend-vue/src/services/securityService.js
import axios from 'axios';

/**
 * SecurityService - Handles all API calls related to security (Blocked IPs)
 */
export default {
  /**
   * Get the list of blocked IPs
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Array>} List of blocked IPs
   */
  async getBlockedIps(websiteId) {
    try {
      const { data } = await axios.get(`/api/security/blocklist?id=${websiteId}`);
      return data.blockedIps || [];
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      throw error;
    }
  },

  /**
   * Add an IP to the blocklist
   * @param {string} websiteId - Current website ID
   * @param {string} ip - IP address to block
   * @returns {Promise<Object>} Response data
   */
  async addBlockedIp(websiteId, ip) {
    try {
      const { data } = await axios.post(`/api/security/block?id=${websiteId}`, { ip });
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
      const { data } = await axios.delete(`/api/security/unblock?id=${websiteId}&ip=${ip}`);
      return data;
    } catch (error) {
      console.error('Error removing blocked IP:', error);
      throw error;
    }
  }
,
  /**
   * Fetch attack logs for a specific IP (or all if no IP provided)
   * @param {string} ip - IP address to filter logs (optional)
   * @returns {Promise<Array>} List of attack logs
   */
  async getAttackLogs(ip) {
    try {
      const url = ip ? `/api/attack-logs?ip=${encodeURIComponent(ip)}` : '/api/attack-logs';
      const { data } = await axios.get(url);
      return data.attackLogs || [];
    } catch (error) {
      console.error('Error fetching attack logs:', error);
      throw error;
    }
  }
};