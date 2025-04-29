import axios from 'axios';

/**
 * CustomerService - Handles all API calls related to customers
 */
export default {
  /**
   * Get customer details by ID
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer data
   */
  async getCustomerById(websiteId, customerId) {
    const response = await axios.get(`customer?id=${websiteId}&custId=${customerId}`);
    return response.data.customer;
  },

  /**
   * Update customer details
   * @param {string} websiteId - Current website ID
   * @param {Object} customerData - Customer data to update
   * @returns {Promise<Object>} Update response
   */
  async updateCustomer(websiteId, customerData) {
    const response = await axios.post(`add-customer?id=${websiteId}`, { data: customerData });
    return response.data;
  },

  /**
   * Get customer financials
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Financial data
   */
  async getCustomerFinancials(websiteId, customerId) {
    const response = await axios.get(`customers/${customerId}/financials?id=${websiteId}`);
    return response.data;
  },

  /**
   * Generate timeline summary
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response data
   */
  async generateTimelineSummary(websiteId, customerId) {
    const response = await axios.post(`customers/${customerId}/timeline-summary?id=${websiteId}`);
    return response.data;
  },

  /**
   * Generate profitability analysis
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response data
   */
  async generateProfitabilityAnalysis(websiteId, customerId) {
    const response = await axios.post(`customers/${customerId}/profitability-analysis?id=${websiteId}`);
    return response.data;
  },

  /**
   * Generate sentiment analysis
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response data
   */
  async generateSentimentAnalysis(websiteId, customerId) {
    const response = await axios.post(`customers/${customerId}/analyze-sentiment?id=${websiteId}`);
    return response.data;
  },

  /**
   * Generate follow-up suggestions
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response data with suggestions
   */
  async generateFollowupSuggestions(websiteId, customerId) {
    const response = await axios.post(`customers/${customerId}/followup-suggestions?id=${websiteId}`);
    return response.data;
  },

  /**
   * Dismiss a suggestion
   * @param {string} websiteId - Current website ID
   * @param {string} suggestionId - Suggestion ID to dismiss
   * @returns {Promise<Object>} Response data
   */
  async dismissSuggestion(websiteId, suggestionId) {
    const response = await axios.post(`suggestions/${suggestionId}/dismiss?id=${websiteId}`);
    return response.data;
  },

  /**
   * Get scheduled messages for a customer
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @param {string} status - Filter by status
   * @returns {Promise<Object>} Response with scheduled messages
   */
  async getScheduledMessages(websiteId, customerId, status = 'SCHEDULED') {
    const response = await axios.get(`follow-ups?customerId=${customerId}&status=${status}&id=${websiteId}`);
    return response.data;
  },

  /**
   * Cancel a scheduled message
   * @param {string} websiteId - Current website ID
   * @param {string} followUpId - Follow-up ID to cancel
   * @returns {Promise<Object>} Response data
   */
  async cancelScheduledMessage(websiteId, followUpId) {
    const response = await axios.put(`follow-ups/${followUpId}?id=${websiteId}`, { status: 'CANCELLED' });
    return response.data;
  },

  /**
   * Schedule a message (suggestion or greeting)
   * @param {string} websiteId - Current website ID
   * @param {Object} payload - Follow-up data
   * @returns {Promise<Object>} Response data
   */
  async scheduleMessage(websiteId, payload) {
    const response = await axios.post(`follow-ups?id=${websiteId}`, payload);
    return response.data;
  },

  /**
   * Send a direct message
   * @param {string} websiteId - Current website ID
   * @param {Object} payload - Message data
   * @returns {Promise<Object>} Response data
   */
  async sendDirectMessage(websiteId, payload) {
    const response = await axios.post(`messaging/send-direct?id=${websiteId}`, payload);
    return response.data;
  },

  /**
   * Get all follow-ups for a customer
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response with follow-ups
   */
  async getFollowUps(websiteId, customerId) {
    const response = await axios.get(`follow-ups?customerId=${customerId}&id=${websiteId}`);
    return response.data;
  },

  /**
   * Get visitor activity for a customer
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response with visitor activity
   */
  async getVisitorActivity(websiteId, customerId) {
    const response = await axios.get(`/websites/${websiteId}/visitor-activity?customerId=${customerId}`);
    return response.data;
  },

  /**
   * Get technicians
   * @param {string} websiteId - Current website ID
   * @returns {Promise<Object>} Response with technicians
   */
  async getTechnicians(websiteId) {
    const response = await axios.get(`employees?id=${websiteId}`);
    return response.data.employees || [];
  },

  /**
   * Update preferred technician
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @param {Object} payload - Technician payload
   * @returns {Promise<Object>} Response data
   */
  async updatePreferredTechnician(websiteId, customerId, payload) {
    const response = await axios.put(`customers/${customerId}/preferred-technician?id=${websiteId}`, payload);
    return response.data;
  },

  /**
   * Update communication preferences
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @param {Object} payload - Preferences payload
   * @returns {Promise<Object>} Response data
   */
  async updateCommunicationPreferences(websiteId, customerId, payload) {
    const response = await axios.put(`customers/${customerId}/communication-preferences?id=${websiteId}`, payload);
    return response.data;
  },

  /**
   * Get appliance maintenance prediction
   * @param {string} websiteId - Current website ID
   * @param {string} applianceId - Appliance ID
   * @returns {Promise<Object>} Response with prediction
   */
  async getApplianceMaintPrediction(websiteId, applianceId) {
    const response = await axios.post(`appliances/${applianceId}/predict-maintenance?id=${websiteId}`);
    return response.data;
  },

  /**
   * Dismiss appliance alert
   * @param {string} websiteId - Current website ID
   * @param {string} applianceId - Appliance ID
   * @returns {Promise<Object>} Response data
   */
  async dismissApplianceAlert(websiteId, applianceId) {
    const response = await axios.post(`appliances/${applianceId}/dismiss-alert?id=${websiteId}`);
    return response.data;
  },

  /**
   * Use AI to detect appliances
   * @param {string} websiteId - Current website ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Response data
   */
  async detectAppliancesAI(websiteId, customerId) {
    const response = await axios.post(`customers/${customerId}/detect-appliances?id=${websiteId}`);
    return response.data;
  },

  /**
   * Delete an appliance
   * @param {string} websiteId - Current website ID
   * @param {string} applianceId - Appliance ID
   * @returns {Promise<Object>} Response data
   */
  async deleteAppliance(websiteId, applianceId) {
    const response = await axios.delete(`appliances/${applianceId}?id=${websiteId}`);
    return response.data;
  }
};