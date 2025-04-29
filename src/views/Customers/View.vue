<script setup>
import axios from "axios";
import { uuid } from 'vue-uuid';
import { onMounted, ref, computed, watchEffect, nextTick } from "vue"; // Added nextTick
import { useToast } from 'vue-toast-notification';
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/UserStore"
import { tooltips, noteModal, whatsappModal, formatRelativeTime, tryParseJson, copyToClipboard, formatAbsoluteDateTime } from '../../helpers';
import JobVue from '@/components/jobs/Job.vue' // Keep for related items
import TipTapEditor from '@/components/editor/TipTapEditor.vue';
import ItemVue from '@/components/line-items/item.vue' // Keep for related items
import EstimateCustomVue from '@/components/estimates/EstimateCustom.vue' // Custom component for modal-based interaction
import InsuranceCustomVue from '@/components/insurance/InsuranceCustom.vue' // Custom component for modal-based interaction
import InvoiceCustomVue from '@/components/invoices/InvoiceCustom.vue' // Custom component for modal-based interaction
import PaymentCustomVue from '@/components/payments/PaymentCustom.vue' // Custom component for modal-based interaction
import ExpenseCustomVue from '@/components/expenses/ExpenseCustom.vue' // Custom component for modal-based interaction
import accordionJob from '@/components/jobs/accordion.vue'
import accordionCustomer from '@/components/Customers/accordion.vue'
import accordionView from '@/components/analytics/accordionView.vue'
import accordionClick from '@/components/analytics/accordionClick.vue'
import accordionForm from '@/components/analytics/accordionForm.vue'
import accordionLineitem from '@/components/line-items/accordion.vue'
import accordion from '@/components/whatsapp/accordion.vue'
import accordionEmail from '@/components/email/accordion.vue'
import accordionNotes from '@/components/notes/accordion.vue'
import accordionInvoice from '@/components/invoices/accordion.vue'
import accordionEstimate from '@/components/estimates/accordion.vue'
import accordionInsurance from '@/components/insurance/accordion.vue'
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { TabGroup, TabList, Tab, TabPanels, TabPanel, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue' // Added Disclosure
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faUsers, faUserCog, faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, faMoneyBillWave, faShieldAlt, faListOl, faSync, faStar, faComments, faClock, faSignal, faLanguage, faExclamationTriangle, faMagic, faCopy // Added faCopy
} from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar, faClock as farClock } from '@fortawesome/free-regular-svg-icons' // Added regular star, clock
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons' // Added WhatsApp brand icon
import JobFormModal from '@/components/jobs/JobFormModal.vue'; // Import job modal
import EstimateFormModal from '@/components/estimates/EstimateFormModal.vue'; // Import estimate modal
import InvoiceFormModal from '@/components/invoices/InvoiceFormModal.vue'; // Import invoice modal
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue'; // Import payment modal
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal.vue'; // Import expense modal
import InsuranceFormModal from '@/components/insurance/InsuranceFormModal.vue'; // Import insurance modal
import ApplianceCard from '@/components/Customers/ApplianceCard.vue'; // Import Appliance Card
import ApplianceFormModal from '@/components/Customers/ApplianceFormModal.vue'; // Import Appliance Form Modal
import PreferredTechnicianModal from '@/components/Customers/PreferredTechnicianModal.vue'; // Import Preferred Technician Modal
import CommunicationPreferencesModal from '@/components/Customers/CommunicationPreferencesModal.vue'; // Import Comm Prefs Modal
import ScheduleModal from '@/components/misc/ScheduleModal.vue'; // Import Schedule Modal
import ManualLogModal from '@/components/misc/ManualLogModal.vue'; // Import Manual Log Modal
import TaskFormModal from '@/components/misc/TaskFormModal.vue'; // Import Task Form Modal
import { formatDistanceToNow, format } from 'date-fns'; // Import date-fns functions
import CustomerHeader from '@/components/Customers/View/CustomerHeader.vue'
import CustomerValueSnapshot from '@/components/Customers/View/CustomerValueSnapshot.vue';
import CustomerDetailsCard from '@/components/Customers/View/CustomerDetailsCard.vue';
import CustomerCommunicationPrefs from '@/components/Customers/View/CustomerCommunicationPrefs.vue';
import CustomerAppliances from '@/components/Customers/View/CustomerAppliances.vue'; 
import CustomerRelatedRecords from '@/components/Customers/View/CustomerRelatedRecords.vue';
import CustomerActivityTabs from '@/components/Customers/View/CustomerActivityTabs.vue';

library.add(
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faUsers, faUserCog, faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, faMoneyBillWave, faShieldAlt, faListOl, faWhatsapp, faSync, faStar, farStar, faComments, faClock, farClock, faSignal, faLanguage, faExclamationTriangle, faMagic, faCopy // Added faCopy
)

// --- State ---
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Add dark mode state
const isFetchingCustomer = ref(false);
const visitorActivity = ref(null);
const isFetchingVisitorActivity = ref(false);
const visitorActivityError = ref(null);
const isUpdatingCustomer = ref(false);
const isBookingJob = ref(false); // Keep AI booking state if needed
const isEditingInfo = ref(false); // State to toggle edit mode for customer info
const showAddJobModal = ref(false); // State for the job modal visibility
const showAddEstimateModal = ref(false); // State for the estimate modal visibility
const showAddInvoiceModal = ref(false); // State for the invoice modal visibility
const showAddPaymentModal = ref(false); // State for the payment modal visibility
const selectedEstimate = ref(null); // State for the selected estimate when editing
const selectedInvoice = ref(null); // State for the selected invoice when editing
const selectedPayment = ref(null); // State for the selected payment when editing
const selectedExpense = ref(null); // State for the selected expense when editing
const selectedInsurance = ref(null); // State for the selected insurance report when editing
const selectedJob = ref(null); // State for the selected job when editing
const showAddExpenseModal = ref(false); // State for the expense modal visibility
const showAddInsuranceModal = ref(false); // State for the insurance modal visibility
const showAddApplianceModal = ref(false); // State for appliance modal (add/edit)
const selectedAppliance = ref(null); // State for selected appliance being edited/viewed
const showPreferredTechnicianModal = ref(false); // State for preferred technician modal
const showCommPrefsModal = ref(false); // State for communication preferences modal
const showScheduleModal = ref(false); // State for schedule modal
const suggestionToSchedule = ref(null); // State to hold suggestion being scheduled
const showManualLogModal = ref(false); // State for manual log modal
const suggestionToLog = ref(null); // State to hold suggestion being logged
const greetingToSchedule = ref(null); // State to hold greeting being scheduled
const showTaskModal = ref(false); // State for task modal
const initialTaskDataForModal = ref({}); // State to pre-fill task modal
const technicians = ref([]); // State for technicians list (might be fetched within modal now)
const customerFinancials = ref({ totalRevenue: null, totalCosts: null, netProfit: null }); // State for customer financials
const isDetectingAppliances = ref(false); // Loading state for AI appliance detection

// --- AI Analysis State ---
// Old state (kept for fetch triggers, cleared on load)
const timelineSummary = ref('');
const profitabilityAnalysis = ref('');
const sentimentAnalysis = ref(null); // Keep old structure for now if needed by fetchSentimentAnalysis

// New state for latest history
const latestTimelineSummary = ref(null); // Will hold { content: string, generatedAt: string } | null
const latestProfitabilityAnalysis = ref(null); // Will hold { content: string, generatedAt: string } | null
const latestSentimentAnalysis = ref(null); // Will hold { content: string, generatedAt: string } | null

// Loading/Error states for AI fetches (Needed for individual refresh triggers)
const isFetchingTimelineSummary = ref(false);
const timelineSummaryError = ref(null);
const isFetchingProfitabilityAnalysis = ref(false);
const profitabilityAnalysisError = ref(null);
const isFetchingSentiment = ref(false);
const sentimentError = ref(null);

// Other AI/Engagement state
const followupSuggestions = ref([]);
const isFetchingSuggestions = ref(false);
const suggestionsError = ref(null);
const predictiveMaintenanceAlerts = ref([]);
const isFetchingPredMaint = ref(false);
const predMaintError = ref(null);
const serviceFollowUps = ref([]);
const loggedFollowUps = ref([]);
const holidayGreetings = ref([]);
const scheduledMessages = ref([]);
const isFetchingScheduled = ref(false);
const scheduledError = ref(null);
const isFetchingGreetings = ref(false);
const greetingsError = ref(null);

const lineItems = ref([])
const notes = ref('') // Model for note modal
const whatsapp = ref('') // Model for whatsapp modal
const customer = ref({
  id: '', name: '', phone: '', email: '', channel: '', address: '', message: '', hubspotLink: '', foreignID: '', portal: '', jobs: [], estimate: [], invoice: [], employeeId: '', createdAt: '', updatedAt: '', activities: [], payments: [], expenses: [], insurance: [], appliances: [], referredBy: null, referrals: [], preferredTechnicianId: null, preferredTechnician: null, // Added technician preference
  preferredContactMethod: null, preferredContactTimes: null, communicationFrequencyPreference: null, languagePreference: 'en', // Added communication preferences
  aiAnalysisHistory: [] // Expect this from backend now
})
const editableCustomer = ref({}); // For editing form

const toast = useToast()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const wkey = ref(0) // Keep for potential accordion re-renders
const nkey = ref(0) // Keep for potential accordion re-renders
const noteModalInstance = ref(null);
const whatsappModalInstance = ref(null);
const customerContextForModal = ref(null); // State to hold specific context for add modals

// --- Computed ---
const isLoading = computed(() => isFetchingCustomer.value || isUpdatingCustomer.value || isBookingJob.value);

// Computed property to parse sentiment analysis content
const parsedSentimentContent = computed(() => {
  if (latestSentimentAnalysis.value?.content && typeof latestSentimentAnalysis.value.content === 'string') {
    return tryParseJson(latestSentimentAnalysis.value.content); // tryParseJson returns object or null
  }
  // If content is already an object (or not a string), return it directly (or null if undefined)
  return latestSentimentAnalysis.value?.content || null;
});

const relatedItems = computed(() => {
  // Add safety checks for customer.value and its properties
  const jobs = customer.value?.jobs || [];
  const estimates = customer.value?.estimate || [];
  const invoices = customer.value?.invoice || [];
  const payments = customer.value?.payments || [];
  const expenses = customer.value?.expenses || [];
  const insurance = customer.value?.insurance || [];
  const currentLineItems = lineItems.value || []; // Assuming lineItems is already handled

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
  { name: 'All', component: null, type: 'all' }, // Added type for consistency
  { name: 'Engagement', component: null, type: 'engagement' }, // Moved Engagement Hub tab
  { name: 'Notes', component: accordionNotes, type: 'note' },
  { name: 'Whatsapp', component: accordion, type: 'whatsapp' },
  { name: 'Email', component: accordionEmail, type: 'email' },
  { name: 'Forms', component: accordionForm, type: 'form' },
  { name: 'Receipts', component: null, type: 'receipts' }, // Added Receipts tab
]);

async function fetchVisitorActivity() {
  isFetchingVisitorActivity.value = true;
  visitorActivityError.value = null;
  try {
    const response = await axios.get(`/websites/${userStore.currentWebsite}/visitor-activity?customerId=${route.query.customer_id}`);
    visitorActivity.value = response.data;
  } catch (error) {
    visitorActivityError.value = error.response?.data?.message || error.message || "Failed to load visitor activity";
    toast.error(`Error loading visitor activity: ${visitorActivityError.value}`);
  } finally {
    isFetchingVisitorActivity.value = false;
  }
}

async function fetchContacts() {
  isFetchingCustomer.value = true;
  // Reset latest analysis state on fetch
  latestProfitabilityAnalysis.value = null;
  latestTimelineSummary.value = null;
  latestSentimentAnalysis.value = null;
  // Clear old state refs (if keeping them for fetch triggers)
  profitabilityAnalysis.value = '';
  timelineSummary.value = '';
  sentimentAnalysis.value = null;

  try {
    const response = await axios.get(
      `customer?id=${userStore.currentWebsite}&custId=${route.query.customer_id}`
    );
    customer.value = response.data.customer || customer.value; // Ensure fallback

    // --- Process AI Analysis History ---
    if (Array.isArray(customer.value?.aiAnalysisHistory)) {
      // Find the latest entry for each type (history is sorted desc by backend)
      latestProfitabilityAnalysis.value = customer.value.aiAnalysisHistory.find(
        h => h.analysisType === 'customerProfitabilityAnalysis'
      ) || null;
      latestTimelineSummary.value = customer.value.aiAnalysisHistory.find(
        h => h.analysisType === 'interactionTimelineSummary'
      ) || null;
      latestSentimentAnalysis.value = customer.value.aiAnalysisHistory.find(
        h => h.analysisType === 'sentimentAnalysis'
      ) || null;

      // AI history processing complete
    }
    // --- End AI History Processing ---


    // Process activities
    if (customer.value?.activities) {
      customer.value.activities.forEach((a) => { a.uid = uuid.v1() });
    }

    // Process line items
    let items = [];
    if (Array.isArray(customer.value?.estimate) && customer.value.estimate?.length && !customer.value.invoice?.length) {
      for (const item of customer.value.estimate) { items = [...items, ...(item.lineItem || [])]; }
    }
    if (Array.isArray(customer.value?.invoice) && customer.value.invoice?.length) {
      for (const item of customer.value.invoice) { items = [...items, ...(item.lineItem || [])]; }
    }
    lineItems.value = items;

    // Ensure related arrays exist
    customer.value.payments = customer.value.payments || [];
    customer.value.expenses = customer.value.expenses || [];
    customer.value.insurance = customer.value.insurance || [];
    customer.value.jobs = customer.value.jobs || [];
    customer.value.estimate = customer.value.estimate || [];
    customer.value.invoice = customer.value.invoice || [];
    customer.value.activities = customer.value.activities || []; // Ensure activities array exists
    customer.value.appliances = customer.value.appliances || []; // Ensure appliances array exists
    customer.value.referredBy = customer.value.referredBy || null; // Ensure referredBy exists
    customer.value.referrals = customer.value.referrals || []; // Ensure referrals array exists
    customer.value.preferredTechnicianId = customer.value.preferredTechnicianId || null; // Ensure preferredTechnicianId exists
    customer.value.preferredTechnician = customer.value.preferredTechnician || null; // Ensure preferredTechnician object exists
    // Communication Preferences Initialization
    customer.value.preferredContactMethod = customer.value.preferredContactMethod || null;
    customer.value.preferredContactTimes = customer.value.preferredContactTimes || null;
    customer.value.communicationFrequencyPreference = customer.value.communicationFrequencyPreference || null;
    customer.value.languagePreference = customer.value.languagePreference || 'en';


    // Initialize editable form data
    resetEditableCustomer();

    // Initialize Modals (assuming helpers return instances)
    // Ensure modal helpers are robust against re-initialization or handle it gracefully
    if (whatsappModalInstance.value?.destroy) whatsappModalInstance.value.destroy();
    if (noteModalInstance.value?.destroy) noteModalInstance.value.destroy();
    whatsappModalInstance.value = await whatsappModal(whatsapp, userStore.currentWebsite, customer.value.phone);
    noteModalInstance.value = await noteModal(notes, userStore.currentWebsite, customer.value.id, reloadTimeline);

    // Fetch predictive maintenance alerts after main data is loaded
    fetchPredictiveMaintenance();
    // Fetch service follow-ups
    fetchServiceFollowUps();

  } catch (error) {
    // Removed console.error
    toast.error("Error fetching customer data. Please try again.");
  } finally {
    isFetchingCustomer.value = false;
    // Ensure tooltips are initialized/re-initialized after potential DOM updates
    await nextTick(); // Wait for DOM updates
    tooltips();
  }
}

function reloadTimeline() { // Reverted signature
  fetchContacts().then(() => {
    // Fetch financials after main customer data is loaded/refreshed
    fetchCustomerFinancials();
    fetchLoggedFollowUps(); // Fetch logged follow-ups on reload
    fetchScheduledMessages(); // Fetch scheduled messages on reload
    // Removed debug log block
  });
  wkey.value += 1;
  nkey.value += 1;
}

function resetEditableCustomer() {
  editableCustomer.value = {
    name: customer.value.name || '',
    phone: customer.value.phone || '',
    email: customer.value.email || '',
    channel: customer.value.channel || '',
    address: customer.value.address || '',
    message: customer.value.message || '', // Assuming 'message' is the field for 'Lead Source / Details'
    portal: customer.value.portal || '',
    foreignID: customer.value.foreignID || '',
    preferredTechnicianId: customer.value.preferredTechnicianId || null, // Added preferred technician ID
    // Communication Preferences
    preferredContactMethod: customer.value.preferredContactMethod || null,
    preferredContactTimes: customer.value.preferredContactTimes || '', // Assuming string for now
    communicationFrequencyPreference: customer.value.communicationFrequencyPreference || null,
    languagePreference: customer.value.languagePreference || 'en'
  };
}

async function updateCustomer() {
  isUpdatingCustomer.value = true;
  try {
    const backendData = {
      name: editableCustomer.value.name,
      Phone: editableCustomer.value.phone,
      Email: editableCustomer.value.email,
      Reply: editableCustomer.value.channel, // Map channel -> Reply
      address: editableCustomer.value.address,
      Message: editableCustomer.value.message, // Map message -> Message
      portal: editableCustomer.value.portal,
      foreignID: editableCustomer.value.foreignID,
      vid: editableCustomer.value.foreignID, // Map foreignID -> vid
    };

    await axios.post('add-customer?id=' + userStore.currentWebsite, { data: backendData });
    toast.success("Customer updated successfully");
    isEditingInfo.value = false; // Exit edit mode
    reloadTimeline(); // Call reloadTimeline to refresh data consistently
  } catch (error) {
    // Removed console.error
    toast.error(`Error updating customer: ${error.response?.data?.message || error.message}`);
  } finally {
    isUpdatingCustomer.value = false;
  }
}

async function aiBookJob(customerId) {
  // Keep this function if AI booking is still relevant
  isBookingJob.value = true;
  try {
    await axios.post('ai-booking?id=' + userStore.currentWebsite, { data: customerId });
    toast.success("Customer job booked successfully");
    reloadTimeline();
  } catch (error) {
    // Removed console.error
    toast.error("Error booking job via AI. Please try again.");
  } finally {
    isBookingJob.value = false;
  }
}

function handleNavigateBack() {
  router.back();
}

function handleOpenNoteModal() {
  notes.value = ''; // Clear previous content
  noteModalInstance.value?.show();
}

function handleOpenWhatsappModal() {
  whatsapp.value = ''; // Clear previous content
  whatsappModalInstance.value?.show();
}

function handleEditInfo() {
  resetEditableCustomer(); // Ensure form starts with current data
  isEditingInfo.value = true;
}

function handleCancelEdit() {
  isEditingInfo.value = false;
  resetEditableCustomer(); // Reset any changes made in the form
}

// --- Job Modal Handlers ---
function openAddJobModal() {
  selectedJob.value = null; // Ensure we are in 'add' mode
  showAddJobModal.value = true;
}

function handleViewJob(job) {
  selectedJob.value = job; // Set the job data for editing
  showAddJobModal.value = true; // Open the modal
}

function handleJobSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data (including jobs list)
}

// --- Estimate Modal Handlers ---
function openAddEstimateModal(estimate = null) {
  selectedEstimate.value = estimate;
  showAddEstimateModal.value = true;
}

// Modified to accept emitted ID
function handleEstimateSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data
}

function handleViewEstimate(estimate) {
  // Open the estimate modal with the selected estimate for viewing/editing
  openAddEstimateModal(estimate);
}

// --- Invoice Modal Handlers ---
function openAddInvoiceModal(invoice = null) {
  selectedInvoice.value = invoice;
  showAddInvoiceModal.value = true;
}

// Modified to accept emitted ID
function handleInvoiceSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data
}

function handleViewInvoice(invoice) {
  // Open the invoice modal with the selected invoice for viewing/editing
  openAddInvoiceModal(invoice);
}

// --- Handle Invoice Creation from Estimate ---
function handleInvoiceCreated(newInvoice) {
  // Removed debug log
  reloadTimeline(); // Refresh data to show the new invoice
  // Optionally, open the new invoice immediately
  // handleViewInvoice(newInvoice); // Uncomment this line if you want to open the new invoice modal
  toast.info("Invoice list updated."); // Give feedback that the list is refreshed
}

// --- Payment Modal Handlers ---
function openAddPaymentModal(payment = null) {
  selectedPayment.value = payment;
  showAddPaymentModal.value = true;
}

function handlePaymentSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data (including payments list)
}

function handleViewPayment(payment) {
  // Open the payment modal with the selected payment for viewing/editing
  openAddPaymentModal(payment);
}

// --- Expense Modal Handlers ---
function openAddExpenseModal(expense = null) {
  selectedExpense.value = expense;
  showAddExpenseModal.value = true;
}

function handleExpenseSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data (including expenses list)
}

function handleViewExpense(expense) {
  // Open the expense modal with the selected expense for viewing/editing
  openAddExpenseModal(expense);
}

// --- Insurance Modal Handlers ---
function openAddInsuranceModal(insurance = null) {
  selectedInsurance.value = insurance;
  showAddInsuranceModal.value = true;
}

function handleInsuranceSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data (including insurance list)
}

function handleViewInsurance(insurance) {
  // Open the insurance modal with the selected report for viewing/editing
  openAddInsuranceModal(insurance);
}

// --- Appliance Modal Handlers (Placeholders) ---
function openAddApplianceModal() {
  selectedAppliance.value = null;
  showAddApplianceModal.value = true;
  // TODO: Implement actual modal display logic & component
  // Actual modal component will handle display
}

// Modify to accept the full appliance object
function openEditApplianceModal(applianceToEdit) {
  if (applianceToEdit) {
    selectedAppliance.value = { ...applianceToEdit }; // Clone to avoid direct mutation
    showAddApplianceModal.value = true; // Reuse the same modal flag for add/edit
    // Actual modal component will handle display
  } else {
    toast.error("Could not find appliance to edit.");
  }
}

async function handleDeleteAppliance(applianceId) {
  // TODO: Add a more robust confirmation dialog (e.g., using a modal library)
  if (!confirm('Are you sure you want to delete this appliance? This action cannot be undone.')) {
      return;
  }
  try {
    // Actual API call
    // Ensure the correct API endpoint is used (e.g., including websiteId if needed by backend auth/routing)
    await axios.delete(`appliances/${applianceId}?id=${userStore.currentWebsite}`); // Assuming websiteId is needed in query
    toast.success(`Appliance deleted successfully.`);
    // Refresh data after deletion
    await reloadTimeline(); // Ensure data is refreshed
  } catch (error) {
    // Removed console.error
    toast.error(`Error deleting appliance: ${error.response?.data?.message || error.message}`);
  }
}

function handleApplianceSaved() {
  // Modal's v-model handles closing
  reloadTimeline(); // Refresh customer data to show updated appliance list
}


// --- Preferred Technician Modal Handler ---
function openEditPreferredTechnicianModal() {
  showPreferredTechnicianModal.value = true; // Open the modal
}

function handlePreferredTechnicianSaved() {
  // Modal v-model handles closing
  reloadTimeline(); // Refresh customer data to show updated preference
}

// --- Communication Preferences Modal Handler ---
function openEditCommPrefsModal() {
  showCommPrefsModal.value = true; // Open the modal
}

function handleCommPrefsSaved() {
    // Modal v-model handles closing
    reloadTimeline(); // Refresh customer data to show updated preferences
}

// --- LLM Fetch Functions ---
// These functions now trigger the backend to generate AND save the analysis.
// The result displayed will be from the latest history fetched in fetchContacts.
async function fetchTimelineSummary() {
  isFetchingTimelineSummary.value = true;
  timelineSummaryError.value = null;
  // Don't clear latestTimelineSummary.value here, let fetchContacts handle update

  try {
    // Call backend to generate (and save)
    await axios.post(`customers/${route.query.customer_id}/timeline-summary?id=${userStore.currentWebsite}`);
    toast.success("Timeline summary generated. Refreshing data...");
    // Reload all customer data to get the latest history entry
    await fetchContacts();
  } catch (error) {
    // Removed console.error
    timelineSummaryError.value = error.response?.data?.message || error.message || "Failed to generate summary.";
    toast.error(`Error generating timeline summary: ${timelineSummaryError.value}`);
  } finally {
    isFetchingTimelineSummary.value = false;
  }
}

async function fetchFollowupSuggestions() {
  isFetchingSuggestions.value = true;
  suggestionsError.value = null;
  followupSuggestions.value = [];

  try {
    // Actual API call
    // Assuming websiteId is needed as a query param for backend routing/auth
    const response = await axios.post(`customers/${route.query.customer_id}/followup-suggestions?id=${userStore.currentWebsite}`);
    // Assuming backend returns { suggestions: [...] } which might be stringified JSON from n8n
    const suggestions = response.data.suggestions;
    followupSuggestions.value = typeof suggestions === 'string' ? JSON.parse(suggestions) : suggestions || [];


  } catch (error) {
    // Removed console.error
    suggestionsError.value = error.response?.data?.message || error.message || "Failed to load suggestions.";
    toast.error(`Error loading suggestions: ${suggestionsError.value}`);
  } finally {
    isFetchingSuggestions.value = false;
  }
}

// Placeholder actions for suggestions
function scheduleSuggestion(suggestion) { // Made non-async as it just opens modal
  suggestionToSchedule.value = suggestion; // Store the suggestion data
  showScheduleModal.value = true; // Open the modal
}

async function handleConfirmScheduleSuggestion(selectedDateTime) {
  if (!suggestionToSchedule.value) {
    // Removed console.error
    toast.error("An error occurred. Please try again.");
    return;
  }

  const suggestion = suggestionToSchedule.value;
  const payload = {
      customerId: customer.value.id,
      jobId: null, // Suggestions aren't typically tied to a specific job
      status: 'SCHEDULED',
      type: 'AI_SUGGESTION',
      messageContent: suggestion.draftMessage,
      followUpDate: selectedDateTime.toISOString(), // Use date from modal
  };

  try {
      await axios.post(`follow-ups?id=${userStore.currentWebsite}`, payload);
      toast.success(`Suggestion scheduled for ${selectedDateTime.toLocaleString()}.`);

      // Refetch suggestions and scheduled messages to update UI reliably
      fetchFollowupSuggestions();
      fetchScheduledMessages();

  } catch (error) {
      // Removed console.error
      toast.error(`Failed to schedule suggestion: ${error.response?.data?.message || error.message}`);
  } finally {
      suggestionToSchedule.value = null; // Clear the stored suggestion
  }
}
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
async function sendSuggestionNow(suggestion) {

  // Determine channel (use customer preference or default, e.g., WhatsApp)
  const channel = customer.value?.preferredContactMethod || 'WHATSAPP'; // Default to WhatsApp if not set

  const payload = {
      customerId: customer.value.id,
      message: suggestion.draftMessage,
      channel: channel,
      subject: suggestion.title || 'Following Up', // Use suggestion title as subject for email
      logAsFollowUp: true, // Log this send action
      websiteId: userStore.currentWebsite, // Needed for WhatsApp
  };

  try {
      // Call the new direct messaging endpoint
      await axios.post(`messaging/send-direct?id=${userStore.currentWebsite}`, payload); // Assuming websiteId needed for auth/context
      toast.success(`Suggestion sent via ${channel}.`);
      // Optionally remove the suggestion from the list
      // followupSuggestions.value = followupSuggestions.value.filter(s => s !== suggestion); // Need unique ID
  } catch (error) {
      // Removed console.error
      toast.error(`Failed to send suggestion: ${error.response?.data?.message || error.message}`);
  }
  // Removed example comment block
  // try {
  //   await axios.post(`/messaging/send?id=${userStore.currentWebsite}`, {
  //     customerId: customer.value.id,
  //     channel: suggestion.channel || customer.value.preferredContactMethod || 'whatsapp', // Determine channel
  //     message: suggestion.draftMessage
  //   });
  //   toast.success("Suggestion sent successfully (placeholder).");
  //   // Optionally remove the suggestion from the list or update its state
  // } catch (error) {
  //   console.error("Error sending suggestion:", error);
  //   toast.error("Failed to send suggestion.");
  // }
}
function logSuggestionManually(suggestion) { // Made non-async
  suggestionToLog.value = suggestion; // Store the suggestion
  showManualLogModal.value = true; // Open the modal
}

async function handleConfirmManualLog(feedbackText) {
  if (!suggestionToLog.value) {
    // Removed console.error
    toast.error("An error occurred. Please try again.");
    return;
  }

  const suggestion = suggestionToLog.value;
  const payload = {
      customerId: customer.value.id,
      jobId: null,
      status: 'COMPLETED', // Or 'LOGGED'
      type: 'MANUAL_LOG',
      messageContent: suggestion.draftMessage, // Store original suggestion context
      feedback: feedbackText || `Manual action based on suggestion: ${suggestion.title}`, // Use feedback from modal
      followUpDate: new Date().toISOString(), // Log when it happened
  };

  try {
      await axios.post(`follow-ups?id=${userStore.currentWebsite}`, payload);
      toast.success(`Manual interaction logged.`);

      // Refetch suggestions and logged follow-ups to update UI reliably
      fetchFollowupSuggestions();
      fetchLoggedFollowUps();

  } catch (error) {
      // Removed console.error
      toast.error(`Failed to log interaction: ${error.response?.data?.message || error.message}`);
  } finally {
      suggestionToLog.value = null; // Clear the stored suggestion
  }
}
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
async function dismissSuggestion(index) {
  const suggestionToDismiss = followupSuggestions.value[index];
  if (!suggestionToDismiss || !suggestionToDismiss.id) {
      // Removed console.error
      toast.error("Cannot dismiss suggestion: ID missing.");
      return;
  }
  const suggestionId = suggestionToDismiss.id;

  // Optimistic UI update
  const originalSuggestions = [...followupSuggestions.value];
  followupSuggestions.value.splice(index, 1);

  try {
      // Call backend to update status
      await axios.post(`suggestions/${suggestionId}/dismiss?id=${userStore.currentWebsite}`);
      toast.success(`Suggestion dismissed.`);
      // Refetch suggestions to ensure UI is accurate (already removed optimistically)
      fetchFollowupSuggestions();
  } catch (error) {
      // Removed console.error
      toast.error(`Failed to dismiss suggestion: ${error.response?.data?.message || error.message}`);
      // Revert UI change on error
      followupSuggestions.value = originalSuggestions;
  }
}

async function fetchProfitabilityAnalysis() {
  isFetchingProfitabilityAnalysis.value = true;
  profitabilityAnalysisError.value = null;
  // Don't clear latestProfitabilityAnalysis.value here

  try {
    // Call backend to generate (and save)
    await axios.post(`customers/${route.query.customer_id}/profitability-analysis?id=${userStore.currentWebsite}`);
    toast.success("Profitability analysis generated. Refreshing data...");
    // Reload all customer data to get the latest history entry
    await fetchContacts();
  } catch (error) {
    // Removed console.error
    profitabilityAnalysisError.value = error.response?.data?.message || error.message || "Failed to load analysis.";
    toast.error(`Error loading profitability analysis: ${profitabilityAnalysisError.value}`);
  } finally {
    isFetchingProfitabilityAnalysis.value = false;
  }
}

async function fetchPredictiveMaintenance() {
  isFetchingPredMaint.value = true;
  predMaintError.value = null;
  predictiveMaintenanceAlerts.value = [];
  const appliances = customer.value?.appliances; // Get appliances once

  // Need customer appliances to exist first
  if (!appliances || appliances.length === 0) {
      isFetchingPredMaint.value = false;
      return;
  }

  try {
    const alertPromises = appliances.map(async (appliance) => {
      try {
        // Actual API call per appliance
        const response = await axios.post(`appliances/${appliance.id}/predict-maintenance?id=${userStore.currentWebsite}`); // Assuming websiteId needed
        // Assuming backend returns { prediction: { risk: ..., needs: ... } or null }
        if (response.data.prediction) {
          return { applianceId: appliance.id, alert: response.data.prediction };
        }
        return null;
      } catch (err) {
        // Removed console.error
        // Optionally add error state per appliance or just log it
        return null; // Return null on error for this appliance
      }
    });

    const results = await Promise.all(alertPromises);
    predictiveMaintenanceAlerts.value = results.filter(alert => alert !== null); // Filter out nulls from errors or no-alert responses

  } catch (error) { // Catch errors from Promise.all or initial checks
    // Removed console.error
    predMaintError.value = error.response?.data?.message || error.message || "Failed to load predictions.";
    toast.error(`Error loading predictions: ${predMaintError.value}`);
  } finally {
    isFetchingPredMaint.value = false;
  }
}

async function fetchServiceFollowUps() {
  serviceFollowUps.value = []; // Clear previous
  try {
    // Actual API call
    // Assuming websiteId is needed as query param
    const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&id=${userStore.currentWebsite}`);
    // Assuming backend returns { followUps: [...] }
    serviceFollowUps.value = response.data.followUps || [];

  } catch (error) {
     // Removed console.error
     toast.error("Could not load service follow-up data.");
  }
}

// --- Predictive Maintenance Helpers/Actions ---
function getApplianceName(applianceId) {
  const appliance = customer.value?.appliances?.find(a => a.id === applianceId);
  return appliance ? `${appliance.type} (${appliance.brand || 'Unknown Brand'})` : `Appliance ID ${applianceId}`;
}

// Renamed function
function handleScheduleServiceFromAlert(payload) { // payload contains { appliance, alert }
  // TODO: Implement scheduling from alert.
  // 1. Construct a preliminary job object based on the appliance and alert details.
  //    - Use customer ID, appliance details (type, brand, serial), alert reason (e.g., "Predictive Maintenance Alert: " + payload.alert.needs).
  //    - Potentially pre-fill description, priority.
  // 2. Set `selectedJob.value` to this preliminary job object.
  // 3. Set `showAddJobModal.value = true` to open the JobFormModal, pre-filled.
  selectedJob.value = {
      customerId: customer.value.id,
      customerName: customer.value.name, // Pass customer name for display in modal
      customerPhone: customer.value.phone, // Pass phone
      customerAddress: customer.value.address, // Pass address
      applianceType: payload.appliance?.type,
      applianceBrand: payload.appliance?.brand,
      applianceSerial: payload.appliance?.serialNumber,
      // Construct a meaningful description
      description: `Predictive Maintenance Alert for ${payload.appliance?.type || 'Appliance'}:\nNeeds: ${payload.alert?.needs || 'Check Required'}\nRisk: ${payload.alert?.risk || 'Unknown'}\nDetails: ${payload.alert?.details || ''}`,
      priority: 'Medium', // Or determine based on risk
      // Add other necessary fields if the modal requires them (e.g., websiteId)
      websiteId: userStore.currentWebsite,
  };
  showAddJobModal.value = true;
  toast.info("Job modal opened with pre-filled alert details.");
}

// Handler for dismissing a predictive maintenance alert
async function handleDismissAlert(applianceId) {
    const alertIndex = predictiveMaintenanceAlerts.value.findIndex(a => a.applianceId === applianceId);
    if (alertIndex === -1) return; // Alert not found

    // Remove the alert from the local state immediately for responsiveness
    const dismissedAlert = predictiveMaintenanceAlerts.value.splice(alertIndex, 1)[0]; // Keep optimistic removal

    // Call backend to persist dismissal
    try {
      await axios.post(`appliances/${applianceId}/dismiss-alert?id=${userStore.currentWebsite}`);
      toast.success(`Alert for ${getApplianceName(applianceId)} dismissed.`);
      // UI already updated optimistically
    } catch (error) {
      // Removed console.error
      toast.error(`Failed to dismiss alert on server: ${error.response?.data?.message || error.message}. It might reappear.`);
      // Revert UI change if backend call failed
      predictiveMaintenanceAlerts.value.splice(alertIndex, 0, dismissedAlert);
    }
    // Removed placeholder toast
}

// Placeholder actions for greetings
function scheduleGreeting(greeting) { // Made non-async
  // Clear suggestion state in case it was used last
  suggestionToSchedule.value = null;
  greetingToSchedule.value = greeting; // Store the greeting data
  showScheduleModal.value = true; // Open the modal
}

async function handleConfirmScheduleGreeting(selectedDateTime) {
  if (!greetingToSchedule.value) {
    // Removed console.error
    toast.error("An error occurred. Please try again.");
    return;
  }

  const greeting = greetingToSchedule.value;
  const payload = {
      customerId: customer.value.id,
      jobId: null,
      status: 'SCHEDULED',
      type: 'GREETING', // Set type to GREETING
      messageContent: greeting.draftMessage,
      followUpDate: selectedDateTime.toISOString(), // Use date from modal
  };

  try {
      await axios.post(`follow-ups?id=${userStore.currentWebsite}`, payload);
      toast.success(`Greeting scheduled for ${selectedDateTime.toLocaleString()}.`);

      // Refetch greetings and scheduled messages to update UI reliably
      fetchHolidayGreetings(); // Refetch the list which now comes from scheduled items
      fetchScheduledMessages();

  } catch (error) {
      // Removed console.error
      toast.error(`Failed to schedule greeting: ${error.response?.data?.message || error.message}`);
  } finally {
      greetingToSchedule.value = null; // Clear the stored greeting
  }
}
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here
// Removed old API call logic from here

async function sendGreetingNow(greeting) {

  // Determine channel (use customer preference or default, e.g., WhatsApp)
  const channel = customer.value?.preferredContactMethod || 'WHATSAPP'; // Default to WhatsApp if not set

  const payload = {
      customerId: customer.value.id,
      message: greeting.draftMessage,
      channel: channel,
      subject: greeting.specificOccasion || 'A Message From Us', // Use occasion as subject for email
      logAsFollowUp: true, // Log this send action
      websiteId: userStore.currentWebsite, // Needed for WhatsApp
  };

  try {
      // Call the new direct messaging endpoint
      await axios.post(`messaging/send-direct?id=${userStore.currentWebsite}`, payload);
      toast.success(`Greeting sent via ${channel}.`);
      // Optionally remove the greeting from the list
      // holidayGreetings.value = holidayGreetings.value.filter(g => g !== greeting); // Need unique ID
  } catch (error) {
      // Removed console.error
      toast.error(`Failed to send greeting: ${error.response?.data?.message || error.message}`);
  }
  // Removed example comment block
  // Removed example comment block
  // Removed example comment block
  // Removed example comment block
  // Removed example comment block
  //   toast.success("Greeting sent successfully (placeholder).");
  //   // Optionally remove the greeting from the list or update its state
  // } catch (error) {
  //   console.error("Error sending greeting:", error);
  //   toast.error("Failed to send greeting.");
  // }
}

async function fetchScheduledMessages() {
  isFetchingScheduled.value = true;
  scheduledError.value = null;
  scheduledMessages.value = [];
  try {
    // Call the backend endpoint, filtering for status 'SCHEDULED'
    const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&status=SCHEDULED&id=${userStore.currentWebsite}`);
    // Assuming backend returns { followUps: [...] }
    scheduledMessages.value = response.data.followUps || [];
  } catch (error) {
     // Removed console.error
     scheduledError.value = error.response?.data?.message || error.message || "Failed to load scheduled messages.";
     toast.error(`Could not load scheduled messages: ${scheduledError.value}`);
  } finally {
    isFetchingScheduled.value = false;
  }
}

async function cancelScheduledMessage(followUpId) {

  // Optimistically remove from UI first for better UX
  const originalMessages = [...scheduledMessages.value];
  scheduledMessages.value = scheduledMessages.value.filter(msg => msg.id !== followUpId);

  try {
      // Call backend to update status to CANCELLED
      await axios.put(`follow-ups/${followUpId}?id=${userStore.currentWebsite}`, { status: 'CANCELLED' });
      toast.success("Scheduled message cancelled.");
      // No need to filter again, already done optimistically
  } catch (error) {
      // Removed console.error
      toast.error(`Failed to cancel message: ${error.response?.data?.message || error.message}`);
      // Revert UI change if backend call failed
      scheduledMessages.value = originalMessages;
  }
  // Removed placeholder toast
}

async function fetchSentimentAnalysis() {
  isFetchingSentiment.value = true;
  sentimentError.value = null;
  // Don't clear latestSentimentAnalysis.value here

  try {
    // Call backend to generate (and save)
    await axios.post(`customers/${route.query.customer_id}/analyze-sentiment?id=${userStore.currentWebsite}`);
    toast.success("Sentiment analysis generated. Refreshing data...");
    // Reload all customer data to get the latest history entry
    await fetchContacts();
  } catch (error) {
     // Removed console.error
     sentimentError.value = error.response?.data?.message || error.message || "Failed to load sentiment analysis.";
     toast.error(`Could not load sentiment analysis: ${sentimentError.value}`);
  } finally {
    isFetchingSentiment.value = false;
  }
}


// Fetch logged/historical follow-ups for Engagement Hub
async function fetchLoggedFollowUps() {
  loggedFollowUps.value = []; // Clear previous
  try {
    // Call the backend endpoint, filtering for completed/relevant statuses if needed
    const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&id=${userStore.currentWebsite}`); // Assuming websiteId needed
    // Assuming backend returns { followUps: [...] }
    loggedFollowUps.value = response.data.followUps || [];
  } catch (error) {
     // Removed console.error
     toast.error("Could not load follow-up history.");
  }
}

// Fetch suggested holiday/occasion greetings
async function fetchHolidayGreetings() {
    isFetchingGreetings.value = true; // Set loading state
    greetingsError.value = null; // Clear previous error
    holidayGreetings.value = []; // Clear previous
    try {
        // Fetch SCHEDULED greetings from the backend
        // The backend task /tasks/generate-scheduled-greetings now handles detection and scheduling.
        const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&status=SCHEDULED&type=GREETING&id=${userStore.currentWebsite}`);
        // Assuming backend returns { followUps: [...] }
        // We need to map the followUp data to the structure expected by the template if different
        holidayGreetings.value = (response.data.followUps || []).map(followUp => ({
            followUpId: followUp.id, // Store the ID for cancellation
            occasionDate: followUp.followUpDate,
            draftMessage: followUp.messageContent,
            // Attempt to extract specific occasion from title/content if needed, otherwise use type
            specificOccasion: followUp.messageContent?.split('\n')[0] || 'Scheduled Greeting', // Basic extraction attempt
            occasionType: 'Greeting' // Or derive from followUp.type if more specific types were stored
        }));

    } catch (error) {
        greetingsError.value = error.message || "Failed to load greetings.";
        toast.error(`Could not load greetings: ${greetingsError.value}`);
    } finally {
        isFetchingGreetings.value = false; // Clear loading state
    }
}



function createFollowupForAlert(alertData) {
  // Construct initial data for the modal
  const applianceName = getApplianceName(alertData.applianceId) || `Appliance ID ${alertData.applianceId}`;
  initialTaskDataForModal.value = {
      title: `Follow up on Predictive Alert: ${applianceName}`,
      description: `Predictive maintenance alert triggered for ${applianceName}.\nNeeds: ${alertData.alert?.needs || 'Check Required'}\nRisk: ${alertData.alert?.risk || 'Unknown'}\nDetails: ${alertData.alert?.details || 'N/A'}`,
      customerId: customer.value.id, // Link task to this customer
      // assigneeId: null, // Default to unassigned
      // dueDate: null, // Default to no due date
  };
  showTaskModal.value = true; // Open the modal
}

async function handleSaveTask(taskData) {
  // TODO: Implement backend API call (e.g., POST /tasks)
  // Ensure the backend endpoint exists and handles task creation,
  // linking to customerId, assigneeId, etc.
  try {
    // Call the backend endpoint to create the task
    const response = await axios.post(`task?id=${userStore.currentWebsite}`, taskData); // Use singular 'task' endpoint
    toast.success(`Task "${taskData.title}" created successfully.`);
    // Optionally refresh a task list if displayed on this page (e.g., if tasks were shown in activity feed)
    // reloadTimeline(); // Or a specific task list fetch function
    // Removed placeholder toast
  } catch (error) {
    // Removed console.error
    toast.error(`Failed to save task: ${error.response?.data?.message || error.message}`);
  }
}

// This function seems to have been corrupted, restoring definition
function dismissPredMaintAlert(applianceId) {
  // Remove from local state - Note: Backend call is handled by handleDismissAlert
  predictiveMaintenanceAlerts.value = predictiveMaintenanceAlerts.value.filter(a => a.applianceId !== applianceId);
}


// --- Formatting Helpers ---
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';

  // Use Intl.NumberFormat for locale-aware currency formatting
  try {
    return new Intl.NumberFormat('en-ZA', { // Use South African locale
      style: 'currency',
      currency: 'ZAR', // Specify ZAR currency code
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    // Removed console.error
    // Fallback to basic formatting on error
    return `R ${Number(value).toFixed(2)}`;
  }
}

function getProfitClass(value) {
  if (value === null || value === undefined) return 'text-gray-500';
  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

function getSentimentClass(sentiment) {
  if (!sentiment) return 'text-gray-500 dark:text-gray-400'; // Default/unknown
  const lowerSentiment = sentiment.toLowerCase();
  if (lowerSentiment === 'positive') return 'text-green-600 dark:text-green-400';
  if (lowerSentiment === 'negative') return 'text-red-600 dark:text-red-400';
  if (lowerSentiment === 'neutral') return 'text-yellow-600 dark:text-yellow-400'; // Or gray
  return 'text-gray-500 dark:text-gray-400'; // Fallback
}

// --- Data Fetching ---
async function fetchCustomerFinancials() {
  // Placeholder: Fetch or calculate customer financials
  // Reset state before fetching
  customerFinancials.value = { totalRevenue: null, totalCosts: null, netProfit: null };
  try {
    // Actual API call
    const response = await axios.get(`customers/${route.query.customer_id}/financials?id=${userStore.currentWebsite}`); // Assuming websiteId needed
    // Assuming backend returns { totalRevenue: number, totalCosts: number, netProfit: number }
    customerFinancials.value = response.data;

  } catch (error) {
    // Removed console.error
    toast.error("Could not load customer financial summary.");
    customerFinancials.value = { totalRevenue: null, totalCosts: null, netProfit: null }; // Reset on error
  }
}

async function fetchTechnicians() {
  // Fetch technicians if not already fetched
  if (technicians.value.length > 0 || !userStore.currentWebsite) return;
  try {
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    technicians.value = response.data.employees || [];
  } catch (error) {
    // Removed console.error
    // toast.error('Error fetching technicians'); // Optional
  }
}

// --- AI Appliance Detection ---
async function detectAppliancesAI() {
  if (!customer.value?.id) return;

  isDetectingAppliances.value = true;
  toast.info("AI is analyzing communications for appliances...");

  try {
    const response = await axios.post(`customers/${customer.value.id}/detect-appliances?id=${userStore.currentWebsite}`);
    const addedCount = response.data.count || 0;
    if (addedCount > 0) {
      toast.success(`AI detection complete. Added ${addedCount} new appliance(s). Refreshing list...`);
      reloadTimeline(); // Reload customer data to show new appliances
    } else {
      toast.info(response.data.message || "AI detection complete. No new appliances found.");
    }
  } catch (error) {
    // Removed console.error
    toast.error(`AI detection failed: ${error.response?.data?.error || error.message}`);
  } finally {
    isDetectingAppliances.value = false;
  }
}

function handleAddRelatedItem(routeName, queryKey) {
    // If adding a job, open the job modal instead of navigating
    if (routeName === 'add-job') {
      openAddJobModal();
      return; // Stop further execution
    }

    // --- New logic for Estimate and Invoice ---
    if (routeName === 'add-estimate' || routeName === 'add-invoice') {
        // Prepare context for the modal
        let context = {
            id: customer.value?.id,
            name: customer.value?.name,
            phone: customer.value?.phone,
            address: customer.value?.address,
            // Add other base customer fields if needed by the modal
        };

        // Find the latest job
        const jobs = customer.value?.jobs || [];
        if (jobs.length > 0) {
            // Sort jobs by createdAt descending (assuming createdAt exists and is a valid date string/object)
            const sortedJobs = [...jobs].sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt) : 0;
              const dateB = b.createdAt ? new Date(b.createdAt) : 0;
              // Handle potential invalid dates
              if (isNaN(dateA) && isNaN(dateB)) return 0;
              if (isNaN(dateA)) return 1; // Put invalid dates earlier (older)
              if (isNaN(dateB)) return -1; // Put invalid dates earlier (older)
              return dateB - dateA;
            });
            const latestJob = sortedJobs[0];

            if (latestJob) {
                context.jobId = latestJob.id;
                // Assuming employeeId/websiteId are directly on the job object. Adjust if nested (e.g., latestJob.employee.id)
                context.employeeId = latestJob.employeeId;
                context.websiteId = latestJob.websiteId;
            }
        }

        customerContextForModal.value = context; // Set the context for the modal

        // Open the correct modal (without passing data directly, modal will use customerContextForModal via prop)
        if (routeName === 'add-estimate') {
            openAddEstimateModal();
        } else { // routeName === 'add-invoice'
            openAddInvoiceModal();
        }
        return; // Stop further execution
    }
    
    // If adding a payment, open the payment modal instead of navigating
    if (routeName === 'add-payment') {
      openAddPaymentModal();
      return; // Stop further execution
    }

    // If adding an expense, open the expense modal instead of navigating
    if (routeName === 'add-expense') {
      openAddExpenseModal();
      return; // Stop further execution
    }
    
    // If adding an insurance report, open the insurance modal instead of navigating
    if (routeName === 'add-insurance-report') {
      openAddInsuranceModal();
      return; // Stop further execution
    }

    const query = {};
    // Always add contact/customer id
    query[queryKey] = customer.value?.id;

    if (routeName) {
        router.push({ name: routeName, query });
    }
}

// --- Lifecycle ---
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  fetchContacts().then(() => {
     // Fetch financials after initial customer data is loaded
     fetchCustomerFinancials();
     fetchLoggedFollowUps(); // Fetch logged follow-ups
     fetchHolidayGreetings(); // Fetch holiday greetings
     fetchScheduledMessages(); // Fetch scheduled messages
     fetchVisitorActivity(); // Fetch visitor activity
  });
  fetchTechnicians(); // Fetch technicians on mount
  // tooltips(); // Moved to finally block of fetchContacts
});

// Watch dark mode changes
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  // Potentially update chart colors or other theme-dependent elements here if needed
});

</script>

<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <CustomerHeader
        :customer="customer"
        :isLoading="isFetchingCustomer"
        @navigate-back="handleNavigateBack"
        @open-note-modal="handleOpenNoteModal"
        @open-whatsapp-modal="handleOpenWhatsappModal"
        @open-add-job-modal="openAddJobModal"
        @reload-data="reloadTimeline"
      />

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <!-- Left Column: Customer Info & Related Items -->
        <div class="lg:col-span-4 space-y-6 lg:space-y-8">

          <!-- Client Value Snapshot Card -->
          <CustomerValueSnapshot 
            :customerFinancials="customerFinancials"
            :latestProfitabilityAnalysis="latestProfitabilityAnalysis"
            :isFetchingProfitabilityAnalysis="isFetchingProfitabilityAnalysis"
            :profitabilityAnalysisError="profitabilityAnalysisError"
            @fetch-profitability-analysis="fetchProfitabilityAnalysis"
          />

          <!-- Customer Information Card -->
          <CustomerDetailsCard
            :customer="customer"
            :editableCustomer="editableCustomer"
            :isEditing="isEditingInfo"
            :isUpdating="isUpdatingCustomer"
            @edit-info="handleEditInfo"
            @cancel-edit="handleCancelEdit"
            @update-customer="updateCustomer"
            @copy-to-clipboard="copyToClipboard"
            @edit-preferred-technician="openEditPreferredTechnicianModal"
          />         

          <!-- Communication Preferences Card -->
          <CustomerCommunicationPrefs 
            :customer="customer"
            @edit-comm-prefs="openEditCommPrefsModal"
          />

          <CustomerAppliances 
            :customer="customer"
            :predictiveMaintenanceAlerts="predictiveMaintenanceAlerts"
            :isFetchingPredMaint="isFetchingPredMaint"
            :predMaintError="predMaintError"
            :isDetectingAppliances="isDetectingAppliances"
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
        <section v-if="visitorActivity && visitorActivity.visitors && visitorActivity.visitors.length > 0" class="card-modern p-5 sm:p-6 mt-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <font-awesome-icon icon="user" class="mr-2 text-indigo-600 dark:text-indigo-400" />
            Visitor Details
          </h2>
          <div class="space-y-8">
            <div v-for="visitor in visitorActivity.visitors" :key="visitor.visitorId" class="border-b border-gray-200 dark:border-gray-700/50 pb-6 last:border-b-0 last:pb-0">
              <!-- Visitor Profile -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mb-2">
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Last Seen:</p>
                  <p>{{ formatAbsoluteDateTime(visitor.lastSeen) }}</p>
                </div>
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Total Views:</p>
                  <p>{{ visitor.totalViews }}</p>
                </div>
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Total Clicks:</p>
                  <p>{{ visitor.totalClicks }}</p>
                </div>
              </div>

              <!-- Recent Activity -->
              <div v-if="visitor.recentActivity && visitor.recentActivity.length > 0" class="mt-2">
                <h4 class="text-md font-semibold mb-2 text-gray-900 dark:text-white">Recent Activity</h4>
                <div class="space-y-2 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4">
                  <div v-for="(activity, idx) in visitor.recentActivity" :key="idx" class="flex items-start">
                    <div class="flex-shrink-0 mt-0.5">
                      <font-awesome-icon
                        :icon="activity.type === 'click' ? 'mouse-pointer' : 'eye'"
                        class="text-xs mr-2"
                        :class="{
                          'text-green-500': activity.type === 'click',
                          'text-blue-500': activity.type === 'view'
                        }"
                      />
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {{ activity.type }}:
                        <span class="text-gray-500 dark:text-gray-400 normal-case">
                          {{ activity.button || activity.page }}
                        </span>
                      </p>
                      <p class="text-2xs text-gray-400 dark:text-gray-500">
                        {{ formatAbsoluteDateTime(activity.timestamp) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                No recent activity for this visitor.
              </div>
            </div>
          </div>
        </section>

        </div>

        <div class="lg:col-span-8">
          <!-- Right Column: Activity Timeline / Tabs -->
          <CustomerActivityTabs
            :activityTabs="activityTabs"
            :customer="customer"
            :latestTimelineSummary="latestTimelineSummary"
            :latestSentimentAnalysis="latestSentimentAnalysis"
            :isFetchingTimelineSummary="isFetchingTimelineSummary"
            :isFetchingSentiment="isFetchingSentiment"
            :timelineSummaryError="timelineSummaryError"
            :sentimentError="sentimentError"
            :parsedSentimentContent="parsedSentimentContent"
            :followupSuggestions="followupSuggestions"
            :scheduledMessages="scheduledMessages"
            :loggedFollowUps="loggedFollowUps"
            :serviceFollowUps="serviceFollowUps"
            :holidayGreetings="holidayGreetings"
            :isFetchingSuggestions="isFetchingSuggestions"
            :suggestionsError="suggestionsError"
            :isFetchingScheduled="isFetchingScheduled"
            :scheduledError="scheduledError"
            :isFetchingGreetings="isFetchingGreetings"
            :greetingsError="greetingsError"
            :wkey="wkey"
            :nkey="nkey"
            :isFetchingCustomer="isFetchingCustomer"
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

      <!-- Modals (Keep Flowbite structure, ensure triggers use new styles) -->
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
        :customer-data="customer"
        :job-data="selectedJob"
        @job-saved="handleJobSaved"
      />

      <!-- Add/Edit Estimate Modal -->
      <EstimateFormModal
        v-model="showAddEstimateModal"
        :customer-data="customerContextForModal || customer"
        :estimate-data="selectedEstimate"
        @estimate-saved="handleEstimateSaved"
        @invoice-created="handleInvoiceCreated"
        :technicians="technicians"
        :customer-jobs="customer.jobs" 
      />

      <!-- Add/Edit Invoice Modal -->
      <InvoiceFormModal
        v-model="showAddInvoiceModal"
        :customer-data="customerContextForModal || customer"
        :invoice-data="selectedInvoice"
        @invoice-saved="handleInvoiceSaved"
        :technicians="technicians"
        :customer-jobs="customer.jobs" 
      />

      <!-- Add/Edit Payment Modal -->
      <PaymentFormModal
        v-model="showAddPaymentModal"
        :customer-data="customer"
        :payment-data="selectedPayment"
        @payment-saved="handlePaymentSaved"
      />

      <!-- Add/Edit Expense Modal -->
      <ExpenseFormModal
        v-model="showAddExpenseModal"
        :customer-data="customer"
        :expense-data="selectedExpense"
        @expense-saved="handleExpenseSaved"
      />

      <!-- Add/Edit Insurance Report Modal -->
      <InsuranceFormModal
        v-model="showAddInsuranceModal"
        :customer-data="customer"
        :insurance-data="selectedInsurance"
        @insurance-saved="handleInsuranceSaved"
      />

      <!-- Add/Edit Appliance Modal -->
      <ApplianceFormModal
        v-model="showAddApplianceModal"
        :appliance="selectedAppliance"
        :customer-id="customer.id"
        @saved="handleApplianceSaved"
      />

      <!-- Preferred Technician Modal -->
      <PreferredTechnicianModal
        v-model="showPreferredTechnicianModal"
        :customer-id="customer.id"
        :current-technician-id="customer.preferredTechnicianId"
        @saved="handlePreferredTechnicianSaved"
      />

      <!-- Communication Preferences Modal -->
      <CommunicationPreferencesModal
        v-model="showCommPrefsModal"
        :customer-id="customer.id"
        :current-preferences="{
          preferredContactMethod: customer.preferredContactMethod,
          preferredContactTimes: customer.preferredContactTimes,
          communicationFrequencyPreference: customer.communicationFrequencyPreference,
          languagePreference: customer.languagePreference
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
    </div> <!-- End container -->

      <!-- Loading Overlay -->
     <div v-if="isLoading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
        <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
     </div>
   </div> <!-- End main div -->
 </template>