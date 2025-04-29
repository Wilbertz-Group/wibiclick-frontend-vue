import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import customerService from '@/services/customerService';
import { tryParseJson } from '@/utils/formatters';

export const useCustomerStore = defineStore('customer', () => {
  // State
  const customer = ref({});
  const customerFinancials = ref({ totalRevenue: null, totalCosts: null, netProfit: null });
  const isFetchingCustomer = ref(false);
  const isUpdatingCustomer = ref(false);
  const customerError = ref(null);
  const lineItems = ref([]);
  const editableCustomer = ref({});
  const isEditingInfo = ref(false);
  
  // AI Analysis State
  const latestTimelineSummary = ref(null);
  const latestProfitabilityAnalysis = ref(null);
  const latestSentimentAnalysis = ref(null);
  const isFetchingTimelineSummary = ref(false);
  const timelineSummaryError = ref(null);
  const isFetchingProfitabilityAnalysis = ref(false);
  const profitabilityAnalysisError = ref(null);
  const isFetchingSentiment = ref(false);
  const sentimentError = ref(null);
  
  // Engagement State
  const followupSuggestions = ref([]);
  const scheduledMessages = ref([]);
  const loggedFollowUps = ref([]);
  const serviceFollowUps = ref([]);
  const holidayGreetings = ref([]);
  const isFetchingSuggestions = ref(false);
  const suggestionsError = ref(null);
  const isFetchingScheduled = ref(false);
  const scheduledError = ref(null);
  const isFetchingGreetings = ref(false);
  const greetingsError = ref(null);
  
  // Appliance State
  const predictiveMaintenanceAlerts = ref([]);
  const isFetchingPredMaint = ref(false);
  const predMaintError = ref(null);
  const isDetectingAppliances = ref(false);
  
  // Visitor Activity State
  const visitorActivity = ref(null);
  const isFetchingVisitorActivity = ref(false);
  const visitorActivityError = ref(null);
  
  // Computed Properties
  const isLoading = computed(() => isFetchingCustomer.value || isUpdatingCustomer.value);
  const relatedItems = computed(() => {
    // This will need to be updated based on your actual objects
    const jobs = customer.value?.jobs || [];
    const estimates = customer.value?.estimate || [];
    const invoices = customer.value?.invoice || [];
    const payments = customer.value?.payments || [];
    const expenses = customer.value?.expenses || [];
    const insurance = customer.value?.insurance || [];
    const currentLineItems = lineItems.value || [];
    
    return [
      { name: 'Jobs', icon: 'briefcase', data: jobs, component: null, addRoute: 'add-job', queryKey: 'contact_id', itemKey: 'job' },
      // Add others similar to above
    ];
  });
  
  const parsedSentimentContent = computed(() => {
    if (latestSentimentAnalysis.value?.content && typeof latestSentimentAnalysis.value.content === 'string') {
      return tryParseJson(latestSentimentAnalysis.value.content);
    }
    return latestSentimentAnalysis.value?.content || null;
  });
  
  // Core Customer Data Actions
  async function fetchCustomer(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    customerError.value = null;
    isFetchingCustomer.value = true;
    
    try {
      const customerData = await customerService.getCustomerById(websiteId, customerId);
      customer.value = customerData || {};
      
      // Process AI Analysis History
      if (Array.isArray(customer.value?.aiAnalysisHistory)) {
        latestProfitabilityAnalysis.value = customer.value.aiAnalysisHistory.find(
          h => h.analysisType === 'customerProfitabilityAnalysis'
        ) || null;
        latestTimelineSummary.value = customer.value.aiAnalysisHistory.find(
          h => h.analysisType === 'interactionTimelineSummary'
        ) || null;
        latestSentimentAnalysis.value = customer.value.aiAnalysisHistory.find(
          h => h.analysisType === 'sentimentAnalysis'
        ) || null;
      }
      
      // Process line items
      processLineItems();
      
      // Initialize editable form data
      resetEditableCustomer();
      
    } catch (error) {
      customerError.value = error.response?.data?.message || error.message || 'Failed to load customer data';
      console.error('Error fetching customer:', error);
    } finally {
      isFetchingCustomer.value = false;
    }
  }
  
  function processLineItems() {
    let items = [];
    if (Array.isArray(customer.value?.estimate) && customer.value.estimate?.length && !customer.value.invoice?.length) {
      for (const item of customer.value.estimate) {
        items = [...items, ...(item.lineItem || [])];
      }
    }
    if (Array.isArray(customer.value?.invoice) && customer.value.invoice?.length) {
      for (const item of customer.value.invoice) {
        items = [...items, ...(item.lineItem || [])];
      }
    }
    lineItems.value = items;
  }
  
  function resetEditableCustomer() {
    editableCustomer.value = {
      name: customer.value.name || '',
      phone: customer.value.phone || '',
      email: customer.value.email || '',
      channel: customer.value.channel || '',
      address: customer.value.address || '',
      message: customer.value.message || '',
      portal: customer.value.portal || '',
      foreignID: customer.value.foreignID || '',
      preferredTechnicianId: customer.value.preferredTechnicianId || null,
      preferredContactMethod: customer.value.preferredContactMethod || null,
      preferredContactTimes: customer.value.preferredContactTimes || '',
      communicationFrequencyPreference: customer.value.communicationFrequencyPreference || null,
      languagePreference: customer.value.languagePreference || 'en'
    };
  }
  
  async function updateCustomer(websiteId, customerData) {
    if (!websiteId || !customer.value?.id) return;
    
    isUpdatingCustomer.value = true;
    
    try {
      const backendData = customerData || {
        id: customer.value.id,
        name: editableCustomer.value.name,
        Phone: editableCustomer.value.phone,
        Email: editableCustomer.value.email,
        Reply: editableCustomer.value.channel,
        address: editableCustomer.value.address,
        Message: editableCustomer.value.message,
        portal: editableCustomer.value.portal,
        foreignID: editableCustomer.value.foreignID,
        vid: editableCustomer.value.foreignID,
      };
      
      await customerService.updateCustomer(websiteId, backendData);
      isEditingInfo.value = false;
      
      // Refresh customer data
      await fetchCustomer(websiteId, customer.value.id);
      
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    } finally {
      isUpdatingCustomer.value = false;
    }
  }
  
  // Update this method in CustomerStore.js
  async function fetchCustomerFinancials(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    try {
      // Attempt to get from the API
      const financials = await customerService.getCustomerFinancials(websiteId, customerId);
      
      // Check if we got valid data back
      if (financials && 
          (financials.totalRevenue !== null || 
          financials.totalCosts !== null || 
          financials.netProfit !== null)) {
        
        customerFinancials.value = financials;
        return;
      }
      
      // If API didn't return valid data, calculate locally
      const totalRevenue = calculateTotalRevenue(customer.value);
      const totalCosts = calculateTotalCosts(customer.value);
      const netProfit = totalRevenue - totalCosts;
      
      customerFinancials.value = {
        totalRevenue,
        totalCosts,
        netProfit
      };
      
    } catch (error) {
      console.error('Error fetching customer financials:', error);
      
      // On API error, still try to calculate locally
      const totalRevenue = calculateTotalRevenue(customer.value);
      const totalCosts = calculateTotalCosts(customer.value);
      const netProfit = totalRevenue - totalCosts;
      
      customerFinancials.value = {
        totalRevenue,
        totalCosts,
        netProfit
      };
    }
  }

  // Helper function to calculate revenue from customer data
  function calculateTotalRevenue(customerData) {
    let total = 0;
    
    // Add invoice amounts
    if (Array.isArray(customerData?.invoice)) {
      total += customerData.invoice.reduce((sum, invoice) => {
        return sum + (Number(invoice.sales) || 0);
      }, 0);
    }
    
    // Add payment amounts (might overlap with invoices, adjust as needed)
    if (Array.isArray(customerData?.payments)) {
      total += customerData.payments.reduce((sum, payment) => {
        // Only include payments not already counted in invoices
        if (!payment.invoiceId) {
          return sum + (Number(payment.total) || 0);
        }
        return sum;
      }, 0);
    }
    
    return total;
  }

  // Helper function to calculate costs from customer data
  function calculateTotalCosts(customerData) {
    let total = 0;
    
    // Add expense amounts
    if (Array.isArray(customerData?.expenses)) {
      total += customerData.expenses.reduce((sum, expense) => {
        return sum + (Number(expense.amount) || 0);
      }, 0);
    }
    
    // Add parts costs from jobs
    if (Array.isArray(customerData?.jobs)) {
      total += customerData.jobs.reduce((sum, job) => {
        return sum + (Number(job.parts) || 0) + (Number(job.partsExpense) || 0);
      }, 0);
    }
    
    return total;
  }
  
  // AI Analysis Actions
  async function fetchTimelineSummary(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingTimelineSummary.value = true;
    timelineSummaryError.value = null;
    
    try {
      await customerService.generateTimelineSummary(websiteId, customerId);
      // Reload customer to get latest analysis
      await fetchCustomer(websiteId, customerId);
    } catch (error) {
      timelineSummaryError.value = error.response?.data?.message || error.message || 'Failed to generate summary';
      console.error('Error generating timeline summary:', error);
      throw error;
    } finally {
      isFetchingTimelineSummary.value = false;
    }
  }
  
  async function fetchProfitabilityAnalysis(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingProfitabilityAnalysis.value = true;
    profitabilityAnalysisError.value = null;
    
    try {
      await customerService.generateProfitabilityAnalysis(websiteId, customerId);
      // Reload customer to get latest analysis
      await fetchCustomer(websiteId, customerId);
    } catch (error) {
      profitabilityAnalysisError.value = error.response?.data?.message || error.message || 'Failed to generate analysis';
      console.error('Error generating profitability analysis:', error);
      throw error;
    } finally {
      isFetchingProfitabilityAnalysis.value = false;
    }
  }
  
  async function fetchSentimentAnalysis(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingSentiment.value = true;
    sentimentError.value = null;
    
    try {
      await customerService.generateSentimentAnalysis(websiteId, customerId);
      // Reload customer to get latest analysis
      await fetchCustomer(websiteId, customerId);
    } catch (error) {
      sentimentError.value = error.response?.data?.message || error.message || 'Failed to generate sentiment analysis';
      console.error('Error generating sentiment analysis:', error);
      throw error;
    } finally {
      isFetchingSentiment.value = false;
    }
  }
  
  // Visitor Activity
  async function fetchVisitorActivity(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingVisitorActivity.value = true;
    visitorActivityError.value = null;
    
    try {
      const data = await customerService.getVisitorActivity(websiteId, customerId);
      visitorActivity.value = data;
    } catch (error) {
      visitorActivityError.value = error.response?.data?.message || error.message || 'Failed to load visitor activity';
      console.error('Error fetching visitor activity:', error);
    } finally {
      isFetchingVisitorActivity.value = false;
    }
  }
  
  // Follow-up Suggestions
  async function fetchFollowupSuggestions(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingSuggestions.value = true;
    suggestionsError.value = null;
    followupSuggestions.value = [];
    
    try {
      const response = await customerService.generateFollowupSuggestions(websiteId, customerId);
      // Assuming backend returns { suggestions: [...] } which might be stringified JSON
      const suggestions = response.suggestions;
      followupSuggestions.value = typeof suggestions === 'string' ? JSON.parse(suggestions) : suggestions || [];
    } catch (error) {
      suggestionsError.value = error.response?.data?.message || error.message || 'Failed to load suggestions';
      console.error('Error fetching follow-up suggestions:', error);
    } finally {
      isFetchingSuggestions.value = false;
    }
  }
  
  async function dismissSuggestion(websiteId, suggestionId) {
    if (!websiteId || !suggestionId) return;
    
    try {
      await customerService.dismissSuggestion(websiteId, suggestionId);
      // Update local state - remove the dismissed suggestion
      const index = followupSuggestions.value.findIndex(s => s.id === suggestionId);
      if (index !== -1) {
        followupSuggestions.value.splice(index, 1);
      }
      return true;
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      throw error;
    }
  }
  
  // Scheduled Messages
  async function fetchScheduledMessages(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingScheduled.value = true;
    scheduledError.value = null;
    scheduledMessages.value = [];
    
    try {
      const response = await customerService.getScheduledMessages(websiteId, customerId, 'SCHEDULED');
      scheduledMessages.value = response.followUps || [];
    } catch (error) {
      scheduledError.value = error.response?.data?.message || error.message || 'Failed to load scheduled messages';
      console.error('Error fetching scheduled messages:', error);
    } finally {
      isFetchingScheduled.value = false;
    }
  }
  
  async function cancelScheduledMessage(websiteId, followUpId) {
    if (!websiteId || !followUpId) return;
    
    try {
      await customerService.cancelScheduledMessage(websiteId, followUpId);
      // Update local state - remove the canceled message
      scheduledMessages.value = scheduledMessages.value.filter(msg => msg.id !== followUpId);
      return true;
    } catch (error) {
      console.error('Error canceling scheduled message:', error);
      throw error;
    }
  }
  
  async function scheduleMessage(websiteId, payload) {
    if (!websiteId || !payload) return;
    
    try {
      await customerService.scheduleMessage(websiteId, payload);
      // We'll refresh the lists after this call succeeds rather than updating local state
      return true;
    } catch (error) {
      console.error('Error scheduling message:', error);
      throw error;
    }
  }
  
  // Holiday Greetings
  async function fetchHolidayGreetings(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingGreetings.value = true;
    greetingsError.value = null;
    holidayGreetings.value = [];
    
    try {
      const response = await customerService.getScheduledMessages(websiteId, customerId, 'SCHEDULED', 'GREETING');
      // Map the followUps to the greeting format expected by the UI
      holidayGreetings.value = (response.followUps || []).map(followUp => ({
        followUpId: followUp.id,
        occasionDate: followUp.followUpDate,
        draftMessage: followUp.messageContent,
        specificOccasion: followUp.messageContent?.split('\n')[0] || 'Scheduled Greeting',
        occasionType: 'Greeting'
      }));
    } catch (error) {
      greetingsError.value = error.response?.data?.message || error.message || 'Failed to load greetings';
      console.error('Error fetching holiday greetings:', error);
    } finally {
      isFetchingGreetings.value = false;
    }
  }
  
  // Follow-ups
  async function fetchLoggedFollowUps(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    try {
      const response = await customerService.getFollowUps(websiteId, customerId);
      loggedFollowUps.value = response.followUps || [];
    } catch (error) {
      console.error('Error fetching logged follow-ups:', error);
      loggedFollowUps.value = [];
    }
  }
  
  async function fetchServiceFollowUps(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    try {
      const response = await customerService.getFollowUps(websiteId, customerId);
      serviceFollowUps.value = response.followUps || [];
    } catch (error) {
      console.error('Error fetching service follow-ups:', error);
      serviceFollowUps.value = [];
    }
  }
  
  // Direct Messaging
  async function sendDirectMessage(websiteId, payload) {
    if (!websiteId || !payload) return;
    
    try {
      await customerService.sendDirectMessage(websiteId, payload);
      return true;
    } catch (error) {
      console.error('Error sending direct message:', error);
      throw error;
    }
  }
  
  // Appliance Management
  async function fetchPredictiveMaintenance(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isFetchingPredMaint.value = true;
    predMaintError.value = null;
    predictiveMaintenanceAlerts.value = [];
    
    try {
      const appliances = customer.value?.appliances || [];
      
      if (appliances.length === 0) {
        return;
      }
      
      const alertPromises = appliances.map(async (appliance) => {
        try {
          const response = await customerService.getApplianceMaintPrediction(websiteId, appliance.id);
          if (response.prediction) {
            return { applianceId: appliance.id, alert: response.prediction };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching prediction for appliance ${appliance.id}:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(alertPromises);
      predictiveMaintenanceAlerts.value = results.filter(alert => alert !== null);
    } catch (error) {
      predMaintError.value = error.response?.data?.message || error.message || 'Failed to load predictions';
      console.error('Error fetching predictive maintenance alerts:', error);
    } finally {
      isFetchingPredMaint.value = false;
    }
  }
  
  async function dismissApplianceAlert(websiteId, applianceId) {
    if (!websiteId || !applianceId) return;
    
    try {
      await customerService.dismissApplianceAlert(websiteId, applianceId);
      // Update local state
      predictiveMaintenanceAlerts.value = predictiveMaintenanceAlerts.value.filter(
        alert => alert.applianceId !== applianceId
      );
      return true;
    } catch (error) {
      console.error('Error dismissing appliance alert:', error);
      throw error;
    }
  }
  
  async function detectAppliancesAI(websiteId, customerId) {
    if (!websiteId || !customerId) return;
    
    isDetectingAppliances.value = true;
    
    try {
      const response = await customerService.detectAppliancesAI(websiteId, customerId);
      isDetectingAppliances.value = false;
      return response;
    } catch (error) {
      console.error('Error detecting appliances:', error);
      isDetectingAppliances.value = false;
      throw error;
    }
  }
  
  async function deleteAppliance(websiteId, applianceId) {
    if (!websiteId || !applianceId) return;
    
    try {
      await customerService.deleteAppliance(websiteId, applianceId);
      // Update local state if the customer has appliances
      if (customer.value?.appliances) {
        customer.value.appliances = customer.value.appliances.filter(a => a.id !== applianceId);
      }
      return true;
    } catch (error) {
      console.error('Error deleting appliance:', error);
      throw error;
    }
  }
  
  // Technician Management
  async function fetchTechnicians(websiteId) {
    if (!websiteId) return [];
    
    try {
      const technicians = await customerService.getTechnicians(websiteId);
      return technicians;
    } catch (error) {
      console.error('Error fetching technicians:', error);
      return [];
    }
  }
  
  return {
    // State
    customer,
    customerFinancials,
    isFetchingCustomer,
    isUpdatingCustomer,
    customerError,
    lineItems,
    editableCustomer,
    isEditingInfo,
    latestTimelineSummary,
    latestProfitabilityAnalysis,
    latestSentimentAnalysis,
    isFetchingTimelineSummary,
    timelineSummaryError,
    isFetchingProfitabilityAnalysis,
    profitabilityAnalysisError,
    isFetchingSentiment,
    sentimentError,
    followupSuggestions,
    scheduledMessages,
    loggedFollowUps,
    serviceFollowUps,
    holidayGreetings,
    isFetchingSuggestions,
    suggestionsError,
    isFetchingScheduled,
    scheduledError,
    isFetchingGreetings,
    greetingsError,
    predictiveMaintenanceAlerts,
    isFetchingPredMaint,
    predMaintError,
    isDetectingAppliances,
    visitorActivity,
    isFetchingVisitorActivity,
    visitorActivityError,
    
    // Computed
    isLoading,
    relatedItems,
    parsedSentimentContent,
    
    // Core Customer Actions
    fetchCustomer,
    updateCustomer,
    resetEditableCustomer,
    fetchCustomerFinancials,
    
    // AI Analysis Actions
    fetchTimelineSummary,
    fetchProfitabilityAnalysis,
    fetchSentimentAnalysis,
    
    // Visitor Activity
    fetchVisitorActivity,
    
    // Follow-up Suggestions
    fetchFollowupSuggestions,
    dismissSuggestion,
    
    // Scheduled Messages
    fetchScheduledMessages,
    cancelScheduledMessage,
    scheduleMessage,
    
    // Holiday Greetings
    fetchHolidayGreetings,
    
    // Follow-ups
    fetchLoggedFollowUps,
    fetchServiceFollowUps,
    
    // Direct Messaging
    sendDirectMessage,
    
    // Appliance Management
    fetchPredictiveMaintenance,
    dismissApplianceAlert,
    detectAppliancesAI,
    deleteAppliance,
    
    // Technician Management
    fetchTechnicians,
  };
});