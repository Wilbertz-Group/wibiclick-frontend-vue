// wibiclick-frontend-vue/src/views/Customers/View.vue
<script setup>
import axios from "axios";
import { uuid } from 'vue-uuid';
import { onMounted, ref, computed, watchEffect, nextTick } from "vue";
import { useToast } from 'vue-toast-notification';
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/UserStore";
import { useCustomerStore } from "@/stores/CustomerStore";
import { tooltips, noteModal, whatsappModal, copyToClipboard } from '../../helpers';
import {
  formatCurrency,
  formatFullDate,
  formatRelativeTime,
  formatAbsoluteDateTime,
  getProfitClass,
  getSentimentClass,
  tryParseJson
} from '@/utils/formatters';
import customerService from '@/services/customerService.js';

// Component imports
import JobVue from '@/components/jobs/Job.vue'
import TipTapEditor from '@/components/editor/TipTapEditor.vue';
import ItemVue from '@/components/line-items/item.vue'
import EstimateCustomVue from '@/components/estimates/EstimateCustom.vue'
import InsuranceCustomVue from '@/components/insurance/InsuranceCustom.vue'
import InvoiceCustomVue from '@/components/invoices/InvoiceCustom.vue'
import PaymentCustomVue from '@/components/payments/PaymentCustom.vue'
import ExpenseCustomVue from '@/components/expenses/ExpenseCustom.vue'
import accordionForm from '@/components/analytics/accordionForm.vue'
import accordion from '@/components/whatsapp/accordion.vue'
import accordionEmail from '@/components/email/accordion.vue'
import accordionNotes from '@/components/notes/accordion.vue'
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

// Modal component imports
import JobFormModal from '@/components/jobs/JobFormModal.vue';
import EstimateFormModal from '@/components/estimates/EstimateFormModal.vue';
import InvoiceFormModal from '@/components/invoices/InvoiceFormModal.vue';
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue';
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal.vue';
import InsuranceFormModal from '@/components/insurance/InsuranceFormModal.vue';
import ApplianceFormModal from '@/components/Customers/ApplianceFormModal.vue';
import PreferredTechnicianModal from '@/components/Customers/PreferredTechnicianModal.vue';
import CommunicationPreferencesModal from '@/components/Customers/CommunicationPreferencesModal.vue';
import ScheduleModal from '@/components/misc/ScheduleModal.vue';
import ManualLogModal from '@/components/misc/ManualLogModal.vue';
import TaskFormModal from '@/components/misc/TaskFormModal.vue';
import CustomerHeader from '@/components/Customers/View/CustomerHeader.vue'
import CustomerValueSnapshot from '@/components/Customers/View/CustomerValueSnapshot.vue';
import CustomerDetailsCard from '@/components/Customers/View/CustomerDetailsCard.vue';
import CustomerCommunicationPrefs from '@/components/Customers/View/CustomerCommunicationPrefs.vue';
import CustomerAppliances from '@/components/Customers/View/CustomerAppliances.vue'; 
import CustomerRelatedRecords from '@/components/Customers/View/CustomerRelatedRecords.vue';
import CustomerActivityTabs from '@/components/Customers/View/CustomerActivityTabs.vue';
import CustomerVisitorActivity from '@/components/Customers/View/CustomerVisitorActivity.vue';

// Font Awesome imports
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, 
  faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faUsers, faUserCog, 
  faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, 
  faMoneyBillWave, faShieldAlt, faListOl, faSync, faStar, faComments, faClock, 
  faSignal, faLanguage, faExclamationTriangle, faMagic, faCopy
} from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar, faClock as farClock } from '@fortawesome/free-regular-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'

// Add all icons to library
library.add(
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, 
  faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faUsers, faUserCog, 
  faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, 
  faMoneyBillWave, faShieldAlt, faListOl, faWhatsapp, faSync, faStar, farStar, 
  faComments, faClock, farClock, faSignal, faLanguage, faExclamationTriangle, faMagic, faCopy
)

// --- Setup Stores ---
const toast = useToast();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const customerStore = useCustomerStore();

// --- Component-specific State ---
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const isBookingJob = ref(false);
const isEditingInfo = ref(false);
const showAddJobModal = ref(false);
const showAddEstimateModal = ref(false);
const showAddInvoiceModal = ref(false);
const showAddPaymentModal = ref(false);
const selectedEstimate = ref(null);
const selectedInvoice = ref(null);
const selectedPayment = ref(null);
const selectedExpense = ref(null);
const selectedInsurance = ref(null);
const selectedJob = ref(null);
const showAddExpenseModal = ref(false);
const showAddInsuranceModal = ref(false);
const showAddApplianceModal = ref(false);
const selectedAppliance = ref(null);
const showPreferredTechnicianModal = ref(false);
const showCommPrefsModal = ref(false);
const showScheduleModal = ref(false);
const suggestionToSchedule = ref(null);
const showManualLogModal = ref(false);
const suggestionToLog = ref(null);
const greetingToSchedule = ref(null);
const showTaskModal = ref(false);
const initialTaskDataForModal = ref({});
const technicians = ref([]);
const editableCustomer = ref({});

// Form and modal state
const notes = ref('');
const whatsapp = ref('');
const wkey = ref(0);
const nkey = ref(0);
const noteModalInstance = ref(null);
const whatsappModalInstance = ref(null);
const customerContextForModal = ref(null);


// AI Field Suggestion States
const isGeneratingAISuggestions = ref(false);
const aiSuggestedFields = ref({});
const showAISuggestions = ref(false);

// --- Computed Properties ---
const isLoading = computed(() => 
  customerStore.isLoading || isBookingJob.value
);

const relatedItems = computed(() => {
  const jobs = customerStore.customer?.jobs || [];
  const estimates = customerStore.customer?.estimate || [];
  const invoices = customerStore.customer?.invoice || [];
  const payments = customerStore.customer?.payments || [];
  const expenses = customerStore.customer?.expenses || [];
  const insurance = customerStore.customer?.insurance || [];
  const currentLineItems = customerStore.lineItems || [];

  return [
    { name: 'Jobs', icon: faBriefcase, data: jobs, component: JobVue, addRoute: 'add-job', queryKey: 'contact_id', itemKey: 'job' },
    { name: 'Estimates', icon: faFileInvoiceDollar, data: estimates, component: EstimateCustomVue, addRoute: 'add-estimate', queryKey: 'contact_id', itemKey: 'estimate' },
    { name: 'Invoices', icon: faReceipt, data: invoices, component: InvoiceCustomVue, addRoute: 'add-invoice', queryKey: 'contact_id', itemKey: 'invoice' },
    { name: 'Payments', icon: faMoneyBillWave, data: payments, component: PaymentCustomVue, addRoute: 'add-payment', queryKey: 'customer_id', itemKey: 'payment' },
    { name: 'Expenses', icon: faMoneyBillWave, data: expenses, component: ExpenseCustomVue, addRoute: 'add-expense', queryKey: 'customer_id', itemKey: 'expense' },
    { name: 'Insurance', icon: faShieldAlt, data: insurance, component: InsuranceCustomVue, addRoute: 'add-insurance-report', queryKey: 'contact_id', itemKey: 'insurance' },
    { name: 'Line Items', icon: faListOl, data: currentLineItems, component: ItemVue, addRoute: null, itemKey: 'item' }
  ];
});

const activityTabs = computed(() => [
  { name: 'All', component: null, type: 'all' },
  { name: 'Engagement', component: null, type: 'engagement' },
  { name: 'Notes', component: accordionNotes, type: 'note' },
  { name: 'Whatsapp', component: accordion, type: 'whatsapp' },
  { name: 'Email', component: accordionEmail, type: 'email' },
  { name: 'Forms', component: accordionForm, type: 'form' },
  { name: 'Receipts', component: null, type: 'receipts' },
]);

// --- Core Data Fetching Function ---
async function fetchCustomerData() {
  // Reset UI-specific state that depends on customer data
  resetUIState();

  try {
    // Use the store action to fetch customer data
    await customerStore.fetchCustomer(userStore.currentWebsite, route.query.customer_id);
    
    // Process activities with UUID (component-specific)
    if (customerStore.customer?.activities) {
      customerStore.customer.activities.forEach((a) => { a.uid = uuid.v1() });
    }

    // Initialize editable form data
    resetEditableCustomer();

    // Initialize Modals
    if (whatsappModalInstance.value?.destroy) whatsappModalInstance.value.destroy();
    if (noteModalInstance.value?.destroy) noteModalInstance.value.destroy();
    whatsappModalInstance.value = await whatsappModal(whatsapp, userStore.currentWebsite, customerStore.customer.phone);
    noteModalInstance.value = await noteModal(notes, userStore.currentWebsite, customerStore.customer.id, reloadTimeline);

    // Fetch additional data
    await fetchAdditionalData();
  } catch (error) {
    toast.error("Error fetching customer data. Please try again.");
  } finally {
    // Ensure tooltips are initialized after DOM updates
    await nextTick();
    tooltips();
  }
}

// --- Customer Information Management ---
function resetEditableCustomer() {
  // Use the store's resetEditableCustomer method
  customerStore.resetEditableCustomer();
}

// New function: Generate AI field suggestions
async function generateAIFieldSuggestions() {
  if (!customerStore.customer?.id) return;
  
  isGeneratingAISuggestions.value = true;
  showAISuggestions.value = true;
  aiSuggestedFields.value = {};
  
  try {
    // Create a payload of what fields are missing or empty
    const missingFields = [];
    const fieldsToCheck = ['address', 'phone', 'email', 'channel', 'message'];
    
    fieldsToCheck.forEach(field => {
      if (!customerStore.editableCustomer[field] || customerStore.editableCustomer[field].trim() === '') {
        missingFields.push(field);
      }
    });
    
    // Only proceed if we actually have missing fields
    if (missingFields.length > 0) {
      const response = await customerService.generateMissingFieldSuggestions(
        userStore.currentWebsite,
        customerStore.customer.id,
        missingFields
      );
      
      if (response && response.suggestions) {
        aiSuggestedFields.value = response.suggestions;
      }
    } else {
      showAISuggestions.value = false;
      toast.info("All fields are already filled. No AI suggestions needed.");
    }
  } catch (error) {
    console.error('Error generating AI field suggestions:', error);
    toast.error("Could not generate AI suggestions: " + (error.response?.data?.message || error.message));
  } finally {
    isGeneratingAISuggestions.value = false;
  }
}

// Helper to apply a specific AI suggestion to the form
function applyAISuggestion(field) {
  if (aiSuggestedFields.value[field]) {
    customerStore.editableCustomer[field] = aiSuggestedFields.value[field];
    // Remove the applied suggestion
    delete aiSuggestedFields.value[field];
    
    // If no more suggestions, hide the suggestion panel
    if (Object.keys(aiSuggestedFields.value).length === 0) {
      showAISuggestions.value = false;
    }
    
    toast.success(`Applied AI suggestion for ${field}`);
  }
}

// Apply all AI suggestions at once
function applyAllAISuggestions() {
  for (const field in aiSuggestedFields.value) {
    customerStore.editableCustomer[field] = aiSuggestedFields.value[field];
  }
  showAISuggestions.value = false;
  aiSuggestedFields.value = {};
  toast.success("Applied all AI suggestions");
}

// Helper to reset UI state on data reload
function resetUIState() {
  // Reset any component UI state that should be cleared when customer data changes
  isEditingInfo.value = false;
  selectedEstimate.value = null;
  selectedInvoice.value = null;
  selectedPayment.value = null;
  selectedExpense.value = null;
  selectedInsurance.value = null;
  selectedJob.value = null;
  selectedAppliance.value = null;
}

// Fetch additional customer-related data
async function fetchAdditionalData() {
  // Fetch financials
  customerStore.fetchCustomerFinancials(userStore.currentWebsite, route.query.customer_id);
  
  // Fetch visitor activity
  fetchVisitorActivity();
  
  // Fetch predictive maintenance alerts
  fetchPredictiveMaintenance();
  
  // Fetch service follow-ups
  fetchServiceFollowUps();
  
  // Fetch logged follow-ups
  fetchLoggedFollowUps();
  
  // Fetch scheduled messages
  fetchScheduledMessages();
  
  // Fetch holiday greetings
  fetchHolidayGreetings();
}

// Central reload function that refreshes all data
function reloadTimeline() {
  fetchCustomerData().then(() => {
    // Increment keys for accordion components to force re-render
    wkey.value += 1;
    nkey.value += 1;
  });
}

async function updateCustomer() {
  try {
    // Use the store action to update customer data with the store's editableCustomer
    await customerStore.updateCustomer(userStore.currentWebsite, {
      id: customerStore.customer.id,
      name: customerStore.editableCustomer.name,
      Phone: customerStore.editableCustomer.phone,
      Email: customerStore.editableCustomer.email,
      Reply: customerStore.editableCustomer.channel,
      address: customerStore.editableCustomer.address,
      Message: customerStore.editableCustomer.message,
      portal: customerStore.editableCustomer.portal,
      foreignID: customerStore.editableCustomer.foreignID,
      vid: customerStore.editableCustomer.foreignID,
    });
    
    toast.success("Customer updated successfully");
    isEditingInfo.value = false;
    reloadTimeline();
  } catch (error) {
    toast.error(`Error updating customer: ${error.response?.data?.message || error.message}`);
  }
}

// --- Navigation and UI Handlers ---
function handleNavigateBack() {
  router.back();
}

function handleEditInfo() {
  resetEditableCustomer();
  isEditingInfo.value = true;
}

function handleCancelEdit() {
  isEditingInfo.value = false;
  resetEditableCustomer();
}

function handleOpenNoteModal() {
  notes.value = '';
  noteModalInstance.value?.show();
}

function handleOpenWhatsappModal() {
  whatsapp.value = '';
  whatsappModalInstance.value?.show();
}

// --- AI Data Generation Functions ---
// Timeline Summary
async function fetchTimelineSummary() {
  try {
    await customerStore.fetchTimelineSummary(
      userStore.currentWebsite, 
      route.query.customer_id
    );
    toast.success("Timeline summary generated. Refreshing data...");
  } catch (error) {
    toast.error(`Error generating timeline summary: ${error.message}`);
  }
}

// Profitability Analysis
async function fetchProfitabilityAnalysis() {
  try {
    await customerStore.fetchProfitabilityAnalysis(
      userStore.currentWebsite, 
      route.query.customer_id
    );
    toast.success("Profitability analysis generated. Refreshing data...");
  } catch (error) {
    toast.error(`Error loading profitability analysis: ${error.message}`);
  }
}

// Sentiment Analysis
async function fetchSentimentAnalysis() {
  try {
    await customerStore.fetchSentimentAnalysis(
      userStore.currentWebsite, 
      route.query.customer_id
    );
    toast.success("Sentiment analysis generated. Refreshing data...");
  } catch (error) {
    toast.error(`Could not load sentiment analysis: ${error.message}`);
  }
}

// --- Visitor Activity ---
async function fetchVisitorActivity() {
  try {
    await customerStore.fetchVisitorActivity(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error(`Error loading visitor activity: ${error.message}`);
  }
}

// --- Modal and Operation Handlers ---
// Job Modal Handlers
function openAddJobModal() {
  selectedJob.value = null;
  showAddJobModal.value = true;
}

function handleViewJob(job) {
  selectedJob.value = job;
  showAddJobModal.value = true;
}

function handleJobSaved() {
  reloadTimeline();
}

// Estimate Modal Handlers
function openAddEstimateModal(estimate = null) {
  selectedEstimate.value = estimate;
  showAddEstimateModal.value = true;
}

function handleEstimateSaved() {
  reloadTimeline();
}

// Invoice Modal Handlers
function openAddInvoiceModal(invoice = null) {
  selectedInvoice.value = invoice;
  showAddInvoiceModal.value = true;
}

function handleInvoiceSaved() {
  reloadTimeline();
}

function handleViewInvoice(invoice) {
  openAddInvoiceModal(invoice);
}

function handleInvoiceCreated(newInvoice) {
  reloadTimeline();
  toast.info("Invoice list updated.");
}

// Payment Modal Handlers
function openAddPaymentModal(payment = null) {
  selectedPayment.value = payment;
  showAddPaymentModal.value = true;
}

function handlePaymentSaved() {
  reloadTimeline();
}

// Expense Modal Handlers
function openAddExpenseModal(expense = null) {
  selectedExpense.value = expense;
  showAddExpenseModal.value = true;
}

function handleExpenseSaved() {
  reloadTimeline();
}

function handleViewExpense(expense) {
  openAddExpenseModal(expense);
}

// Insurance Modal Handlers
function openAddInsuranceModal(insurance = null) {
  selectedInsurance.value = insurance;
  showAddInsuranceModal.value = true;
}

function handleInsuranceSaved() {
  reloadTimeline();
}

// Appliance Modal Handlers
function openAddApplianceModal() {
  selectedAppliance.value = null;
  showAddApplianceModal.value = true;
}

function openEditApplianceModal(applianceToEdit) {
  if (applianceToEdit) {
    selectedAppliance.value = { ...applianceToEdit };
    showAddApplianceModal.value = true;
  } else {
    toast.error("Could not find appliance to edit.");
  }
}

async function handleDeleteAppliance(applianceId) {
  if (!confirm('Are you sure you want to delete this appliance? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Use customer service through the store (would need to be added)
    await customerStore.deleteAppliance(
      userStore.currentWebsite, 
      applianceId
    );
    toast.success(`Appliance deleted successfully.`);
    await reloadTimeline();
  } catch (error) {
    toast.error(`Error deleting appliance: ${error.response?.data?.message || error.message}`);
  }
}

function handleApplianceSaved() {
  reloadTimeline();
}

// Communication and Technician Preferences
function openEditPreferredTechnicianModal() {
  showPreferredTechnicianModal.value = true;
}

function handlePreferredTechnicianSaved() {
  reloadTimeline();
}

function openEditCommPrefsModal() {
  showCommPrefsModal.value = true;
}

function handleCommPrefsSaved() {
  reloadTimeline();
}

// --- Follow-up and Suggestion Functions ---
async function fetchFollowupSuggestions() {
  try {
    // This would need to be added to CustomerStore
    await customerStore.fetchFollowupSuggestions(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error(`Error loading suggestions: ${error.message}`);
  }
}

// Maintenance Prediction Functions
async function fetchPredictiveMaintenance() {
  // This would need to be added to CustomerStore
  try {
    const appliances = customerStore.customer?.appliances;
    
    if (!appliances || appliances.length === 0) {
      return;
    }
    
    await customerStore.fetchPredictiveMaintenance(
      userStore.currentWebsite, 
      customerStore.customer.id
    );
  } catch (error) {
    toast.error(`Error loading predictions: ${error.message}`);
  }
}

// Handling Appliance Alerts
function getApplianceName(applianceId) {
  const appliance = customerStore.customer?.appliances?.find(a => a.id === applianceId);
  return appliance ? `${appliance.type} (${appliance.brand || 'Unknown Brand'})` : `Appliance ID ${applianceId}`;
}

// Scheduling Service Function
function handleScheduleServiceFromAlert(payload) {
  selectedJob.value = {
    customerId: customerStore.customer.id,
    customerName: customerStore.customer.name,
    customerPhone: customerStore.customer.phone,
    customerAddress: customerStore.customer.address,
    applianceType: payload.appliance?.type,
    applianceBrand: payload.appliance?.brand,
    applianceSerial: payload.appliance?.serialNumber,
    description: `Predictive Maintenance Alert for ${payload.appliance?.type || 'Appliance'}:\nNeeds: ${payload.alert?.needs || 'Check Required'}\nRisk: ${payload.alert?.risk || 'Unknown'}\nDetails: ${payload.alert?.details || ''}`,
    priority: 'Medium',
    websiteId: userStore.currentWebsite,
  };
  showAddJobModal.value = true;
  toast.info("Job modal opened with pre-filled alert details.");
}

// Dismissing Alerts
async function handleDismissAlert(applianceId) {
  try {
    // This would need to be added to CustomerStore
    await customerStore.dismissApplianceAlert(
      userStore.currentWebsite, 
      applianceId
    );
    toast.success(`Alert for ${getApplianceName(applianceId)} dismissed.`);
    await fetchPredictiveMaintenance(); // Refresh alerts
  } catch (error) {
    toast.error(`Failed to dismiss alert: ${error.message}`);
  }
}

// AI Appliance Detection
async function detectAppliancesAI() {
  if (!customerStore.customer?.id) return;
  
  try {
    // This would need to be added to CustomerStore
    await customerStore.detectAppliancesAI(
      userStore.currentWebsite, 
      customerStore.customer.id
    );
    toast.success("AI detection complete. Refreshing list...");
    reloadTimeline();
  } catch (error) {
    toast.error(`AI detection failed: ${error.message}`);
  }
}

// --- Follow-up and Scheduling Functions ---
async function fetchServiceFollowUps() {
  try {
    // This would need to be added to CustomerStore
    await customerStore.fetchServiceFollowUps(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error("Could not load service follow-up data.");
  }
}

async function fetchLoggedFollowUps() {
  try {
    // This would need to be added to CustomerStore
    await customerStore.fetchLoggedFollowUps(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error("Could not load follow-up history.");
  }
}

async function fetchScheduledMessages() {
  try {
    // This would need to be added to CustomerStore
    await customerStore.fetchScheduledMessages(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error(`Could not load scheduled messages: ${error.message}`);
  }
}

async function fetchHolidayGreetings() {
  try {
    // This would need to be added to CustomerStore
    await customerStore.fetchHolidayGreetings(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error(`Could not load greetings: ${error.message}`);
  }
}

// --- Message Handling Functions ---
// Suggestion Scheduling
function scheduleSuggestion(suggestion) {
  suggestionToSchedule.value = suggestion;
  showScheduleModal.value = true;
}

async function handleConfirmScheduleSuggestion(selectedDateTime) {
  if (!suggestionToSchedule.value) {
    toast.error("An error occurred. Please try again.");
    return;
  }

  const suggestion = suggestionToSchedule.value;
  const payload = {
    customerId: customerStore.customer.id,
    jobId: null,
    status: 'SCHEDULED',
    type: 'AI_SUGGESTION',
    messageContent: suggestion.draftMessage,
    followUpDate: selectedDateTime.toISOString(),
  };

  try {
    // This would need to be added to CustomerStore
    await customerStore.scheduleMessage(
      userStore.currentWebsite, 
      payload
    );
    toast.success(`Suggestion scheduled for ${selectedDateTime.toLocaleString()}.`);

    fetchFollowupSuggestions();
    fetchScheduledMessages();
  } catch (error) {
    toast.error(`Failed to schedule suggestion: ${error.message}`);
  } finally {
    suggestionToSchedule.value = null;
  }
}

// Greeting Scheduling
function scheduleGreeting(greeting) {
  suggestionToSchedule.value = null;
  greetingToSchedule.value = greeting;
  showScheduleModal.value = true;
}

async function handleConfirmScheduleGreeting(selectedDateTime) {
  if (!greetingToSchedule.value) {
    toast.error("An error occurred. Please try again.");
    return;
  }

  const greeting = greetingToSchedule.value;
  const payload = {
    customerId: customerStore.customer.id,
    jobId: null,
    status: 'SCHEDULED',
    type: 'GREETING',
    messageContent: greeting.draftMessage,
    followUpDate: selectedDateTime.toISOString(),
  };

  try {
    // This would need to be added to CustomerStore
    await customerStore.scheduleMessage(
      userStore.currentWebsite, 
      payload
    );
    toast.success(`Greeting scheduled for ${selectedDateTime.toLocaleString()}.`);

    fetchHolidayGreetings();
    fetchScheduledMessages();
  } catch (error) {
    toast.error(`Failed to schedule greeting: ${error.message}`);
  } finally {
    greetingToSchedule.value = null;
  }
}

// Cancel Scheduled Message
async function cancelScheduledMessage(followUpId) {
  try {
    // This would need to be added to CustomerStore
    await customerStore.cancelScheduledMessage(
      userStore.currentWebsite, 
      followUpId
    );
    toast.success("Scheduled message cancelled.");
    fetchScheduledMessages();
  } catch (error) {
    toast.error(`Failed to cancel message: ${error.message}`);
  }
}

// Suggestion Direct Sending
async function sendSuggestionNow(suggestion) {
  const channel = customerStore.customer?.preferredContactMethod || 'WHATSAPP';

  const payload = {
    customerId: customerStore.customer.id,
    message: suggestion.draftMessage,
    channel: channel,
    subject: suggestion.title || 'Following Up',
    logAsFollowUp: true,
    websiteId: userStore.currentWebsite,
  };

  try {
    // This would need to be added to CustomerStore
    await customerStore.sendDirectMessage(
      userStore.currentWebsite, 
      payload
    );
    toast.success(`Suggestion sent via ${channel}.`);
  } catch (error) {
    toast.error(`Failed to send suggestion: ${error.message}`);
  }
}

// Greeting Direct Sending
async function sendGreetingNow(greeting) {
  const channel = customerStore.customer?.preferredContactMethod || 'WHATSAPP';

  const payload = {
    customerId: customerStore.customer.id,
    message: greeting.draftMessage,
    channel: channel,
    subject: greeting.specificOccasion || 'A Message From Us',
    logAsFollowUp: true,
    websiteId: userStore.currentWebsite,
  };

  try {
    // This would need to be added to CustomerStore
    await customerStore.sendDirectMessage(
      userStore.currentWebsite, 
      payload
    );
    toast.success(`Greeting sent via ${channel}.`);
  } catch (error) {
    toast.error(`Failed to send greeting: ${error.message}`);
  }
}

// Manual Logging
function logSuggestionManually(suggestion) {
  suggestionToLog.value = suggestion;
  showManualLogModal.value = true;
}

async function handleConfirmManualLog(feedbackText) {
  if (!suggestionToLog.value) {
    toast.error("An error occurred. Please try again.");
    return;
  }

  const suggestion = suggestionToLog.value;
  const payload = {
    customerId: customerStore.customer.id,
    jobId: null,
    status: 'COMPLETED',
    type: 'MANUAL_LOG',
    messageContent: suggestion.draftMessage,
    feedback: feedbackText || `Manual action based on suggestion: ${suggestion.title}`,
    followUpDate: new Date().toISOString(),
  };

  try {
    // This would need to be added to CustomerStore
    await customerStore.scheduleMessage(
      userStore.currentWebsite, 
      payload
    );
    toast.success(`Manual interaction logged.`);

    fetchFollowupSuggestions();
    fetchLoggedFollowUps();
  } catch (error) {
    toast.error(`Failed to log interaction: ${error.message}`);
  } finally {
    suggestionToLog.value = null;
  }
}

// Dismiss Suggestion
async function dismissSuggestion(index) {
  const suggestion = customerStore.followupSuggestions[index];
  if (!suggestion || !suggestion.id) {
    toast.error("Cannot dismiss suggestion: ID missing.");
    return;
  }

  try {
    // This would need to be added to CustomerStore
    await customerStore.dismissSuggestion(
      userStore.currentWebsite, 
      suggestion.id
    );
    toast.success(`Suggestion dismissed.`);
    fetchFollowupSuggestions();
  } catch (error) {
    toast.error(`Failed to dismiss suggestion: ${error.message}`);
  }
}

// --- AI Job Booking ---
async function aiBookJob(customerId) {
  isBookingJob.value = true;
  try {
    await axios.post('ai-booking?id=' + userStore.currentWebsite, { data: customerId });
    toast.success("Customer job booked successfully");
    reloadTimeline();
  } catch (error) {
    toast.error("Error booking job via AI. Please try again.");
  } finally {
    isBookingJob.value = false;
  }
}

async function fetchCustomerFinancials() {
  try {
    await customerStore.fetchCustomerFinancials(
      userStore.currentWebsite, 
      route.query.customer_id
    );
  } catch (error) {
    toast.error(`Error loading financial data: ${error.message}`);
  }
}

// --- Task Management ---
async function handleSaveTask(taskData) {
  try {
    await axios.post(`task?id=${userStore.currentWebsite}`, taskData);
    toast.success(`Task "${taskData.title}" created successfully.`);
  } catch (error) {
    toast.error(`Failed to save task: ${error.response?.data?.message || error.message}`);
  }
}

// --- Technician Management ---
async function fetchTechnicians() {
  if (technicians.value.length > 0 || !userStore.currentWebsite) return;
  
  try {
    // This would need to be added to CustomerStore
    const techList = await customerStore.fetchTechnicians(userStore.currentWebsite);
    technicians.value = techList || [];
  } catch (error) {
    // Optional toast
  }
}

// --- Related Item Management ---
function handleAddRelatedItem(routeName, queryKey) {
  if (routeName === 'add-job') {
    openAddJobModal();
    return;
  }

  if (routeName === 'add-estimate' || routeName === 'add-invoice') {
    let context = {
      id: customerStore.customer?.id,
      name: customerStore.customer?.name,
      phone: customerStore.customer?.phone,
      address: customerStore.customer?.address,
    };

    const jobs = customerStore.customer?.jobs || [];
    if (jobs.length > 0) {
      const sortedJobs = [...jobs].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });
      
      const latestJob = sortedJobs[0];
      if (latestJob) {
        context.jobId = latestJob.id;
        context.employeeId = latestJob.employeeId;
        context.websiteId = latestJob.websiteId;
      }
    }

    customerContextForModal.value = context;

    if (routeName === 'add-estimate') {
      openAddEstimateModal();
    } else {
      openAddInvoiceModal();
    }
    return;
  }
  
  if (routeName === 'add-payment') {
    openAddPaymentModal();
    return;
  }

  if (routeName === 'add-expense') {
    openAddExpenseModal();
    return;
  }
  
  if (routeName === 'add-insurance-report') {
    openAddInsuranceModal();
    return;
  }

  const query = {};
  query[queryKey] = customerStore.customer?.id;

  if (routeName) {
    router.push({ name: routeName, query });
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  fetchCustomerData();
  fetchTechnicians();
});

// Watch dark mode changes
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});
</script>

<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <CustomerHeader
        :customer="customerStore.customer"
        :isLoading="customerStore.isFetchingCustomer"
        @navigate-back="handleNavigateBack"
        @open-note-modal="handleOpenNoteModal"
        @open-whatsapp-modal="handleOpenWhatsappModal"
        @open-add-job-modal="openAddJobModal"
        @reload-data="reloadTimeline"
        @ai-book-job="aiBookJob(customerStore.customer.id)"
      />

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <!-- Left Column: Customer Info & Related Items -->
        <div class="lg:col-span-4 space-y-6 lg:space-y-8">

          <!-- Client Value Snapshot Card -->
          <CustomerValueSnapshot 
            :customerFinancials="customerStore.customerFinancials"
            :latestProfitabilityAnalysis="customerStore.latestProfitabilityAnalysis"
            :isFetchingProfitabilityAnalysis="customerStore.isFetchingProfitabilityAnalysis"
            :profitabilityAnalysisError="customerStore.profitabilityAnalysisError"
            :customer="customerStore.customer"
            @fetch-profitability-analysis="fetchProfitabilityAnalysis"
            @fetch-financials="fetchCustomerFinancials"
          />

          <!-- Customer Information Card -->
          <CustomerDetailsCard
            :customer="customerStore.customer"
            :editableCustomer="customerStore.editableCustomer"
            :isEditing="isEditingInfo"
            :isUpdating="customerStore.isUpdatingCustomer"
            :isGeneratingAISuggestions="isGeneratingAISuggestions"
            :aiSuggestedFields="aiSuggestedFields"
            :showAISuggestions="showAISuggestions"
            @edit-info="handleEditInfo"
            @cancel-edit="handleCancelEdit"
            @update-customer="updateCustomer"
            @copy-to-clipboard="copyToClipboard"
            @edit-preferred-technician="openEditPreferredTechnicianModal"
            @generate-ai-suggestions="generateAIFieldSuggestions"
            @apply-ai-suggestion="applyAISuggestion"
            @apply-all-ai-suggestions="applyAllAISuggestions"
          />        

          <!-- Communication Preferences Card -->
          <CustomerCommunicationPrefs 
            :customer="customerStore.customer"
            @edit-comm-prefs="openEditCommPrefsModal"
          />

          <CustomerAppliances 
            :customer="customerStore.customer"
            :predictiveMaintenanceAlerts="customerStore.predictiveMaintenanceAlerts"
            :isFetchingPredMaint="customerStore.isFetchingPredMaint"
            :predMaintError="customerStore.predMaintError"
            :isDetectingAppliances="customerStore.isDetectingAppliances"
            @detect-appliances="detectAppliancesAI"
            @open-add-appliance-modal="openAddApplianceModal"
            @edit-appliance="openEditApplianceModal"
            @delete-appliance="handleDeleteAppliance"
            @schedule-service="handleScheduleServiceFromAlert"
            @dismiss-alert="handleDismissAlert"
            @fetch-predictive-maintenance="fetchPredictiveMaintenance"
          />

          <CustomerRelatedRecords 
            :relatedItems="relatedItems"
            @add-related-item="handleAddRelatedItem"
            @reload-timeline="reloadTimeline"
            @view-estimate="openAddEstimateModal"
            @view-invoice="openAddInvoiceModal"
            @view-payment="openAddPaymentModal"
            @view-expense="openAddExpenseModal"
            @view-insurance="openAddInsuranceModal"
            @view-job="handleViewJob"
          />

          <!-- Visitor Details (from Visitors.vue modal, adapted for customer context) -->
          <CustomerVisitorActivity
            :visitorActivity="customerStore.visitorActivity"
            :isFetchingVisitorActivity="customerStore.isFetchingVisitorActivity"
            :visitorActivityError="customerStore.visitorActivityError"
            :websiteId="userStore.currentWebsite"
            :customerId="route.query.customer_id"
            @fetch-visitor-activity="fetchVisitorActivity"
          />

        </div>

        <div class="lg:col-span-8">
          <!-- Right Column: Activity Timeline / Tabs -->
          <CustomerActivityTabs
            :activityTabs="activityTabs"
            :customer="customerStore.customer"
            :latestTimelineSummary="customerStore.latestTimelineSummary"
            :latestSentimentAnalysis="customerStore.latestSentimentAnalysis"
            :isFetchingTimelineSummary="customerStore.isFetchingTimelineSummary"
            :isFetchingSentiment="customerStore.isFetchingSentiment"
            :timelineSummaryError="customerStore.timelineSummaryError"
            :sentimentError="customerStore.sentimentError"
            :parsedSentimentContent="customerStore.parsedSentimentContent"
            :followupSuggestions="customerStore.followupSuggestions"
            :scheduledMessages="customerStore.scheduledMessages"
            :loggedFollowUps="customerStore.loggedFollowUps"
            :serviceFollowUps="customerStore.serviceFollowUps"
            :holidayGreetings="customerStore.holidayGreetings"
            :isFetchingSuggestions="customerStore.isFetchingSuggestions"
            :suggestionsError="customerStore.suggestionsError"
            :isFetchingScheduled="customerStore.isFetchingScheduled"
            :scheduledError="customerStore.scheduledError"
            :isFetchingGreetings="customerStore.isFetchingGreetings"
            :greetingsError="customerStore.greetingsError"
            :wkey="wkey"
            :nkey="nkey"
            :isFetchingCustomer="customerStore.isFetchingCustomer"
            @fetch-timeline-summary="fetchTimelineSummary"
            @fetch-sentiment-analysis="fetchSentimentAnalysis"
            @fetch-suggestions="fetchFollowupSuggestions"
            @schedule-suggestion="scheduleSuggestion"
            @send-suggestion-now="sendSuggestionNow"
            @log-suggestion-manually="logSuggestionManually"
            @dismiss-suggestion="dismissSuggestion"
            @fetch-scheduled-messages="fetchScheduledMessages"
            @cancel-scheduled-message="cancelScheduledMessage"
            @schedule-greeting="scheduleGreeting"
            @send-greeting-now="sendGreetingNow"
            @fetch-holiday-greetings="fetchHolidayGreetings"
          />
        </div>
      </div>

      <!-- Modals -->
      <!-- Note Modal -->
      <div id="noteModal" data-modal-placement="center" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full" inert>
        <div class="relative w-full max-w-2xl max-h-full">
          <div class="relative bg-white rounded-lg shadow dark:bg-gray-800 modal-content-modern">
            <div class="flex items-center justify-between p-4 sm:p-5 border-b rounded-t dark:border-gray-600">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Add Note</h3>
              <button id="noteModalClose" type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="noteModal">
                <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                <span class="sr-only">Close modal</span>
              </button>
            </div>
            <div class="p-4 sm:p-5 space-y-4">
              <TipTapEditor v-model="notes" placeholder="Start typing to leave a note..." class="input-modern min-h-[150px]" />
            </div>
            <div class="flex items-center p-4 sm:p-5 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
              <button id="noteModalSave" data-modal-hide="noteModal" type="button" class="btn-primary-modern">Save Note</button>
              <button id="noteModalCloses" data-modal-hide="noteModal" type="button" class="btn-secondary-modern">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Whatsapp Modal -->
       <div id="whatsappModal" data-modal-placement="center" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full" inert>
         <div class="relative w-full max-w-2xl max-h-full">
           <div class="relative bg-white rounded-lg shadow dark:bg-gray-800 modal-content-modern">
             <div class="flex items-center justify-between p-4 sm:p-5 border-b rounded-t dark:border-gray-600">
               <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Send WhatsApp</h3>
               <button id="whatsappModalClose" type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="whatsappModal">
                 <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                 <span class="sr-only">Close modal</span>
               </button>
             </div>
             <div class="p-4 sm:p-5 space-y-4">
               <TipTapEditor v-model="whatsapp" placeholder="Start typing to send a whatsapp message..." class="input-modern min-h-[150px]" />
             </div>
             <div class="flex items-center p-4 sm:p-5 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
               <button id="whatsappModalSave" data-modal-hide="whatsappModal" type="button" class="btn-primary-modern">Send WhatsApp</button>
               <button id="whatsappModalCloses" data-modal-hide="whatsappModal" type="button" class="btn-secondary-modern">Cancel</button>
             </div>
           </div>
         </div>
       </div>
    
      <!-- Add Job Modal -->
      <JobFormModal
        v-model="showAddJobModal"
        :customer-data="customerStore.customer"
        :job-data="selectedJob"
        @job-saved="handleJobSaved"
      />

      <!-- Add/Edit Estimate Modal -->
      <EstimateFormModal
        v-model="showAddEstimateModal"
        :customer-data="customerContextForModal || customerStore.customer"
        :estimate-data="selectedEstimate"
        @estimate-saved="handleEstimateSaved"
        @invoice-created="handleInvoiceCreated"
        :technicians="technicians"
        :customer-jobs="customerStore.customer.jobs" 
      />

      <!-- Add/Edit Invoice Modal -->
      <InvoiceFormModal
        v-model="showAddInvoiceModal"
        :customer-data="customerContextForModal || customerStore.customer"
        :invoice-data="selectedInvoice"
        @invoice-saved="handleInvoiceSaved"
        :technicians="technicians"
        :customer-jobs="customerStore.customer.jobs" 
      />

      <!-- Add/Edit Payment Modal -->
      <PaymentFormModal
        v-model="showAddPaymentModal"
        :customer-data="customerStore.customer"
        :payment-data="selectedPayment"
        @payment-saved="handlePaymentSaved"
      />

      <!-- Add/Edit Expense Modal -->
      <ExpenseFormModal
        v-model="showAddExpenseModal"
        :customer-data="customerStore.customer"
        :expense-data="selectedExpense"
        @expense-saved="handleExpenseSaved"
      />

      <!-- Add/Edit Insurance Report Modal -->
      <InsuranceFormModal
        v-model="showAddInsuranceModal"
        :customer-data="customerStore.customer"
        :insurance-data="selectedInsurance"
        @insurance-saved="handleInsuranceSaved"
      />

      <!-- Add/Edit Appliance Modal -->
      <ApplianceFormModal
        v-model="showAddApplianceModal"
        :appliance="selectedAppliance"
        :customer-id="customerStore.customer.id"
        @saved="handleApplianceSaved"
      />

      <!-- Preferred Technician Modal -->
      <PreferredTechnicianModal
        v-model="showPreferredTechnicianModal"
        :customer-id="customerStore.customer.id"
        :current-technician-id="customerStore.customer.preferredTechnicianId"
        @saved="handlePreferredTechnicianSaved"
      />

      <!-- Communication Preferences Modal -->
      <CommunicationPreferencesModal
        v-model="showCommPrefsModal"
        :customer-id="customerStore.customer.id"
        :current-preferences="{
          preferredContactMethod: customerStore.customer.preferredContactMethod,
          preferredContactTimes: customerStore.customer.preferredContactTimes,
          communicationFrequencyPreference: customerStore.customer.communicationFrequencyPreference,
          languagePreference: customerStore.customer.languagePreference
        }"
        @saved="handleCommPrefsSaved"
      />

      <!-- Schedule Modal for Suggestions/Greetings -->
      <ScheduleModal
        v-model:isOpen="showScheduleModal"
        :title="suggestionToSchedule ? 'Schedule Suggestion' : (greetingToSchedule ? 'Schedule Greeting' : 'Schedule Message')"
        :message-preview="suggestionToSchedule?.draftMessage || greetingToSchedule?.draftMessage || ''"
        :initial-date="suggestionToSchedule?.occasionDate || greetingToSchedule?.occasionDate"
        @confirm-schedule="suggestionToSchedule ? handleConfirmScheduleSuggestion($event) : handleConfirmScheduleGreeting($event)"
      />

      <!-- Manual Log Modal for Suggestions -->
      <ManualLogModal
        v-model:isOpen="showManualLogModal"
        :suggestion-context="suggestionToLog?.draftMessage || suggestionToLog?.title || ''"
        @confirm-log="handleConfirmManualLog"
      />

      <!-- Task Form Modal -->
      <TaskFormModal
        v-model:isOpen="showTaskModal"
        :initial-task-data="initialTaskDataForModal"
        @save-task="handleSaveTask"
      />
      
      <!-- Loading Overlay -->
     <div v-if="isLoading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
        <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
     </div>
   </div> <!-- End container -->
 </div> <!-- End main div -->
</template>