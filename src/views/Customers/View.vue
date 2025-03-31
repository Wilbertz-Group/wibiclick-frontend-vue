<script setup>
import axios from "axios";
import { uuid } from 'vue-uuid';
import { onMounted, ref, computed, watchEffect, nextTick } from "vue"; // Added nextTick
import { useToast } from 'vue-toast-notification';
import { useRouter, useRoute } from "vue-router";
// import { formatDistanceToNow } from 'date-fns'; // Removed duplicate import - used within formatRelativeTime helper
import { useUserStore } from "@/stores/UserStore"
import { tooltips, noteModal, whatsappModal } from '../../helpers';
import JobVue from '@/components/jobs/Job.vue' // Keep for related items
import TipTapEditor from '@/components/editor/TipTapEditor.vue';
import ItemVue from '@/components/line-items/item.vue' // Keep for related items
import EstimateCustomVue from '@/components/estimates/EstimateCustom.vue' // Custom component for modal-based interaction
import InsuranceCustomVue from '@/components/insurance/InsuranceCustom.vue' // Custom component for modal-based interaction
import InvoiceCustomVue from '@/components/invoices/InvoiceCustom.vue' // Custom component for modal-based interaction
import PaymentCustomVue from '@/components/payments/PaymentCustom.vue' // Custom component for modal-based interaction
import ExpenseCustomVue from '@/components/expenses/ExpenseCustom.vue' // Custom component for modal-based interaction
// Accordions might be used for related items in the new design
// import accordionPayment from '@/components/payments/PaymentAccordion.vue' // No longer needed directly here
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
// Removed CustomerCard, CustomerInfoForm, CustomerActivityTabs imports as they will be integrated directly or refactored
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faUsers, faUserCog, faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, faMoneyBillWave, faShieldAlt, faListOl, faSync, faStar, faComments, faClock, faSignal, faLanguage, faExclamationTriangle, faMagic // Added icons, faUsers, faStar, faUserCog, comms icons, warning icon, magic icon
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
import { formatDistanceToNow } from 'date-fns'; // Import date-fns function

library.add(
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faUsers, faUserCog, faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, faMoneyBillWave, faShieldAlt, faListOl, faWhatsapp, faSync, faStar, farStar, faComments, faClock, farClock, faSignal, faLanguage, faExclamationTriangle, faMagic // Added faUsers, faStar, farStar, faUserCog, comms icons, warning icon, magic icon
)

// --- State ---
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Add dark mode state
const isFetchingCustomer = ref(false);
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
  // { name: 'Views', component: accordionView, type: 'view' }, // Removed Views tab
  // { name: 'Clicks', component: accordionClick, type: 'click' }, // Removed Clicks tab
  { name: 'Forms', component: accordionForm, type: 'form' },
  { name: 'Receipts', component: null, type: 'receipts' }, // Added Receipts tab
]);

// --- Methods ---

// Helper function for relative time formatting
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", error);
    return ''; // Return empty string on error
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

      // Log found history for debugging
      console.log("Latest Profitability:", latestProfitabilityAnalysis.value);
      console.log("Latest Summary:", latestTimelineSummary.value);
      console.log("Latest Sentiment:", latestSentimentAnalysis.value);
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
    console.log('fetchContacts - Updated expenses:', JSON.stringify(customer.value.expenses)); // Added log
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
    console.error("Error fetching customer data:", error);
    toast.error("Error fetching customer data. Please try again.");
  } finally {
    isFetchingCustomer.value = false;
    // Ensure tooltips are initialized/re-initialized after potential DOM updates
    await nextTick(); // Wait for DOM updates
    tooltips();
  }
}

function reloadTimeline() {
  fetchContacts().then(() => {
    // Fetch financials after main customer data is loaded/refreshed
    fetchCustomerFinancials();
    fetchLoggedFollowUps(); // Fetch logged follow-ups on reload
    fetchScheduledMessages(); // Fetch scheduled messages on reload
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
    console.error("Error updating customer:", error);
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
    console.error("Error booking job via AI:", error);
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

function handleEstimateSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data (including estimates list)
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

function handleInvoiceSaved() {
  // No need to explicitly close modal, v-model handles it
  reloadTimeline(); // Refresh customer data (including invoices list)
}

function handleViewInvoice(invoice) {
  // Open the invoice modal with the selected invoice for viewing/editing
  openAddInvoiceModal(invoice);
}

// --- Handle Invoice Creation from Estimate ---
function handleInvoiceCreated(newInvoice) {
  console.log("Invoice created from estimate:", newInvoice);
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
  console.log("Opening Add Appliance Modal");
  // TODO: Implement actual modal display logic & component
  // Actual modal component will handle display
}

// Modify to accept the full appliance object
function openEditApplianceModal(applianceToEdit) {
  if (applianceToEdit) {
    selectedAppliance.value = { ...applianceToEdit }; // Clone to avoid direct mutation
    showAddApplianceModal.value = true; // Reuse the same modal flag for add/edit
    console.log("Opening Edit Appliance Modal for:", applianceToEdit.id);
    // Actual modal component will handle display
  } else {
    toast.error("Could not find appliance to edit.");
  }
}

async function handleDeleteAppliance(applianceId) {
  console.log("Attempting to delete appliance:", applianceId);
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
    console.error("Error deleting appliance:", error);
    toast.error(`Error deleting appliance: ${error.response?.data?.message || error.message}`);
  }
}

function handleApplianceSaved() {
  // Modal's v-model handles closing
  reloadTimeline(); // Refresh customer data to show updated appliance list
}


// --- Preferred Technician Modal Handler ---
function openEditPreferredTechnicianModal() {
  console.log("Opening Edit Preferred Technician Modal");
  showPreferredTechnicianModal.value = true; // Open the modal
}

function handlePreferredTechnicianSaved() {
  // Modal v-model handles closing
  reloadTimeline(); // Refresh customer data to show updated preference
}

// --- Communication Preferences Modal Handler ---
function openEditCommPrefsModal() {
  console.log("Opening Edit Communication Preferences Modal");
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
  console.log("Fetching AI Timeline Summary...");
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
    console.error("Error fetching timeline summary:", error);
    timelineSummaryError.value = error.response?.data?.message || error.message || "Failed to generate summary.";
    toast.error(`Error generating timeline summary: ${timelineSummaryError.value}`);
  } finally {
    isFetchingTimelineSummary.value = false;
  }
}

async function fetchFollowupSuggestions() {
  console.log("Fetching AI Follow-up Suggestions...");
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
    console.error("Error fetching suggestions:", error);
    suggestionsError.value = error.response?.data?.message || error.message || "Failed to load suggestions.";
    toast.error(`Error loading suggestions: ${suggestionsError.value}`);
  } finally {
    isFetchingSuggestions.value = false;
  }
}

// Placeholder actions for suggestions
function scheduleSuggestion(suggestion) { // Made non-async as it just opens modal
  console.log("Opening schedule modal for suggestion:", suggestion);
  suggestionToSchedule.value = suggestion; // Store the suggestion data
  showScheduleModal.value = true; // Open the modal
}

async function handleConfirmScheduleSuggestion(selectedDateTime) {
  if (!suggestionToSchedule.value) {
    console.error("No suggestion selected for scheduling.");
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
      console.error("Error scheduling suggestion:", error);
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
  console.log("Sending suggestion now:", suggestion);

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
      console.error("Error sending suggestion now:", error);
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
  console.log("Opening manual log modal for suggestion:", suggestion);
  suggestionToLog.value = suggestion; // Store the suggestion
  showManualLogModal.value = true; // Open the modal
}

async function handleConfirmManualLog(feedbackText) {
  if (!suggestionToLog.value) {
    console.error("No suggestion selected for manual logging.");
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
      console.error("Error logging manual interaction:", error);
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
      console.error("Cannot dismiss suggestion: ID missing.", suggestionToDismiss);
      toast.error("Cannot dismiss suggestion: ID missing.");
      return;
  }
  const suggestionId = suggestionToDismiss.id;
  console.log("Dismissing suggestion:", suggestionId);

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
      console.error("Error dismissing suggestion:", error);
      toast.error(`Failed to dismiss suggestion: ${error.response?.data?.message || error.message}`);
      // Revert UI change on error
      followupSuggestions.value = originalSuggestions;
  }
}

async function fetchProfitabilityAnalysis() {
  console.log("Fetching AI Profitability Analysis...");
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
    console.error("Error fetching profitability analysis:", error);
    profitabilityAnalysisError.value = error.response?.data?.message || error.message || "Failed to load analysis.";
    toast.error(`Error loading profitability analysis: ${profitabilityAnalysisError.value}`);
  } finally {
    isFetchingProfitabilityAnalysis.value = false;
  }
}

async function fetchPredictiveMaintenance() {
  console.log("Fetching Predictive Maintenance Alerts...");
  isFetchingPredMaint.value = true;
  predMaintError.value = null;
  predictiveMaintenanceAlerts.value = [];
  const appliances = customer.value?.appliances; // Get appliances once

  // Need customer appliances to exist first
  if (!appliances || appliances.length === 0) {
      console.log("No appliances found for predictive maintenance check.");
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
        console.error(`Error fetching prediction for appliance ${appliance.id}:`, err.response?.data || err.message);
        // Optionally add error state per appliance or just log it
        return null; // Return null on error for this appliance
      }
    });

    const results = await Promise.all(alertPromises);
    predictiveMaintenanceAlerts.value = results.filter(alert => alert !== null); // Filter out nulls from errors or no-alert responses
    console.log("Fetched predictive maintenance alerts:", predictiveMaintenanceAlerts.value);

  } catch (error) { // Catch errors from Promise.all or initial checks
    console.error("Error fetching predictive maintenance:", error);
    predMaintError.value = error.response?.data?.message || error.message || "Failed to load predictions.";
    toast.error(`Error loading predictions: ${predMaintError.value}`);
  } finally {
    isFetchingPredMaint.value = false;
  }
}

async function fetchServiceFollowUps() {
  console.log("Fetching Service Follow-ups...");
  serviceFollowUps.value = []; // Clear previous
  try {
    // Actual API call
    // Assuming websiteId is needed as query param
    const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&id=${userStore.currentWebsite}`);
    // Assuming backend returns { followUps: [...] }
    serviceFollowUps.value = response.data.followUps || [];
    console.log("Fetched service follow-ups:", serviceFollowUps.value);

  } catch (error) {
     console.error("Error fetching service follow-ups:", error);
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
  console.log("Scheduling service for alert:", payload.alert, "for appliance:", payload.appliance);
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
    console.log("Dismissing alert for appliance ID:", applianceId);
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
      console.error("Error dismissing alert on backend:", error);
      toast.error(`Failed to dismiss alert on server: ${error.response?.data?.message || error.message}. It might reappear.`);
      // Revert UI change if backend call failed
      predictiveMaintenanceAlerts.value.splice(alertIndex, 0, dismissedAlert);
    }
    // Removed placeholder toast
}

// Placeholder actions for greetings
function scheduleGreeting(greeting) { // Made non-async
  console.log("Opening schedule modal for greeting:", greeting);
  // Clear suggestion state in case it was used last
  suggestionToSchedule.value = null;
  greetingToSchedule.value = greeting; // Store the greeting data
  showScheduleModal.value = true; // Open the modal
}

async function handleConfirmScheduleGreeting(selectedDateTime) {
  if (!greetingToSchedule.value) {
    console.error("No greeting selected for scheduling.");
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
      console.error("Error scheduling greeting:", error);
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
  console.log("Sending greeting now:", greeting);

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
      console.error("Error sending greeting now:", error);
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
  console.log("Fetching Scheduled Messages...");
  isFetchingScheduled.value = true;
  scheduledError.value = null;
  scheduledMessages.value = [];
  try {
    // Call the backend endpoint, filtering for status 'SCHEDULED'
    const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&status=SCHEDULED&id=${userStore.currentWebsite}`);
    // Assuming backend returns { followUps: [...] }
    scheduledMessages.value = response.data.followUps || [];
    console.log("Fetched scheduled messages:", scheduledMessages.value);
  } catch (error) {
     console.error("Error fetching scheduled messages:", error);
     scheduledError.value = error.response?.data?.message || error.message || "Failed to load scheduled messages.";
     toast.error(`Could not load scheduled messages: ${scheduledError.value}`);
  } finally {
    isFetchingScheduled.value = false;
  }
}

async function cancelScheduledMessage(followUpId) {
  console.log("Cancelling scheduled message:", followUpId);

  // Optimistically remove from UI first for better UX
  const originalMessages = [...scheduledMessages.value];
  scheduledMessages.value = scheduledMessages.value.filter(msg => msg.id !== followUpId);

  try {
      // Call backend to update status to CANCELLED
      await axios.put(`follow-ups/${followUpId}?id=${userStore.currentWebsite}`, { status: 'CANCELLED' });
      toast.success("Scheduled message cancelled.");
      // No need to filter again, already done optimistically
  } catch (error) {
      console.error("Error cancelling scheduled message:", error);
      toast.error(`Failed to cancel message: ${error.response?.data?.message || error.message}`);
      // Revert UI change if backend call failed
      scheduledMessages.value = originalMessages;
  }
  // Removed placeholder toast
}

async function fetchSentimentAnalysis() {
  console.log("Fetching Sentiment Analysis...");
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
     console.error("Error fetching sentiment analysis:", error);
     sentimentError.value = error.response?.data?.message || error.message || "Failed to load sentiment analysis.";
     toast.error(`Could not load sentiment analysis: ${sentimentError.value}`);
  } finally {
    isFetchingSentiment.value = false;
  }
}


// Fetch logged/historical follow-ups for Engagement Hub
async function fetchLoggedFollowUps() {
  console.log("Fetching Logged Follow-ups...");
  loggedFollowUps.value = []; // Clear previous
  try {
    // Call the backend endpoint, filtering for completed/relevant statuses if needed
    const response = await axios.get(`follow-ups?customerId=${route.query.customer_id}&id=${userStore.currentWebsite}`); // Assuming websiteId needed
    // Assuming backend returns { followUps: [...] }
    loggedFollowUps.value = response.data.followUps || [];
    console.log("Fetched logged follow-ups:", loggedFollowUps.value);
  } catch (error) {
     console.error("Error fetching logged follow-ups:", error);
     toast.error("Could not load follow-up history.");
  }
}

// Fetch suggested holiday/occasion greetings
async function fetchHolidayGreetings() {
    console.log("Fetching Holiday/Occasion Greetings...");
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
        console.log("Fetched scheduled greetings:", holidayGreetings.value);

    } catch (error) {
        greetingsError.value = error.message || "Failed to load greetings.";
        toast.error(`Could not load greetings: ${greetingsError.value}`);
    } finally {
        isFetchingGreetings.value = false; // Clear loading state
    }
}



function createFollowupForAlert(alertData) {
  console.log("Opening task modal for alert:", alertData);
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
  console.log("Saving task:", taskData);
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
    console.error("Error saving task:", error);
    toast.error(`Failed to save task: ${error.response?.data?.message || error.message}`);
  }
}

// This function seems to have been corrupted, restoring definition
function dismissPredMaintAlert(applianceId) {
  console.log("Dismissing predictive maintenance alert for appliance:", applianceId);
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
    console.error("Currency formatting error:", error);
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
  console.log("Fetching customer financials...");
  // Reset state before fetching
  customerFinancials.value = { totalRevenue: null, totalCosts: null, netProfit: null };
  try {
    // Actual API call
    const response = await axios.get(`customers/${route.query.customer_id}/financials?id=${userStore.currentWebsite}`); // Assuming websiteId needed
    // Assuming backend returns { totalRevenue: number, totalCosts: number, netProfit: number }
    customerFinancials.value = response.data;
    console.log('fetchCustomerFinancials - Received financials:', JSON.stringify(response.data)); // Added log

  } catch (error) {
    console.error("Error fetching/calculating customer financials:", error);
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
    console.error('Error fetching technicians:', error);
    // toast.error('Error fetching technicians'); // Optional
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
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <div class="flex items-center space-x-3">
          <button @click="handleNavigateBack" class="btn-icon-modern" title="Go Back">
            <font-awesome-icon icon="arrow-left" />
          </button>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
              {{ customer.name || 'Loading Customer...' }}              
                <a v-if="customer.portal && customer.foreignID" :href="'https://app.hubspot.com/contacts/'+customer.portal+'/contact/'+customer.foreignID" target="_blank" class="ml-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400" title="View on HubSpot">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 cursor-pointer rounded-full shadow bg-[#ff7a59] hover:bg-[#ff7a59] p-2 text-white" x="0px" y="0px"
                            width="64" height="64"
                            viewBox="0,0,256,256">
                            <g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,256v-256h256v256z" id="bgRectangle"></path></g><g fill="#fffefe" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(8,8)"><path d="M7.5,4c-1.38071,0 -2.5,1.11929 -2.5,2.5c0,1.38071 1.11929,2.5 2.5,2.5c0.47179,-0.00127 0.93359,-0.13602 1.33203,-0.38867l7.48633,5.64062c-0.82356,1.02723 -1.31836,2.32885 -1.31836,3.74805c0,1.55169 0.59408,2.96031 1.56055,4.02539l-3.04492,3.04492c-0.16808,-0.04579 -0.34142,-0.06943 -0.51562,-0.07031c-1.10457,0 -2,0.89543 -2,2c0,1.10457 0.89543,2 2,2c0.62094,-0.00084 1.20627,-0.29004 1.58419,-0.78272c0.37793,-0.49268 0.50558,-1.13296 0.34549,-1.7329l3.20898,-3.20898c0.00049,0.00027 0.00146,-0.00027 0.00195,0c0.85016,0.4618 1.82375,0.72461 2.85938,0.72461c3.314,0 6,-2.686 6,-6c0,-2.9724 -2.16333,-5.43311 -5,-5.91016v-3.35938c0.78227,-0.45329 1.16316,-1.37503 0.92906,-2.24831c-0.2341,-0.87329 -1.02495,-1.48092 -1.92906,-1.48216c-0.90412,0.00123 -1.69497,0.60887 -1.92906,1.48216c-0.2341,0.87329 0.14679,1.79502 0.92906,2.24831v3.35938c-0.77851,0.13092 -1.50439,0.41247 -2.15039,0.8125l-7.89258,-5.94727c0.13516,-0.73009 -0.06121,-1.48249 -0.53591,-2.05341c-0.4747,-0.57093 -1.17862,-0.90131 -1.92112,-0.90166zM21,15c1.654,0 3,1.346 3,3c0,1.654 -1.346,3 -3,3c-1.654,0 -3,-1.346 -3,-3c0,-1.654 1.346,-3 3,-3z"></path></g></g>
                          </svg>
                </a>
            </h1>
            <p v-if="customer.createdAt" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Customer since {{ new Date(customer.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
           <button @click="reloadTimeline" class="btn-icon-modern" title="Refresh Data" aria-label="Refresh customer data">
             <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingCustomer }" />
           </button>
          <button @click="handleOpenNoteModal" data-modal-toggle="noteModal" type="button" class="btn-secondary-modern" title="Add Note"> <!-- Added data-modal-toggle -->
            <font-awesome-icon icon="sticky-note" class="mr-1.5 h-4 w-4" /> Note
          </button>
          <button @click="handleOpenWhatsappModal" data-modal-toggle="whatsappModal" type="button" class="btn-secondary-modern" title="Send WhatsApp"> <!-- Added data-modal-toggle -->
            <font-awesome-icon :icon="['fab', 'whatsapp']" class="mr-1.5 h-4 w-4" /> WhatsApp
          </button>
          <!-- Add Job Button (Example using primary style) -->
          <button @click="openAddJobModal" class="btn-primary-modern" title="Add New Job"> 
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Job
          </button>
        </div>
      </header>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <!-- Left Column: Customer Info & Related Items -->
        <div class="lg:col-span-4 space-y-6 lg:space-y-8">

          <!-- Client Value Snapshot Card -->
          <section class="card-modern p-5 sm:p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Value Snapshot</h2>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</p>
                <p class="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">{{ formatCurrency(customerFinancials.totalRevenue) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Costs</p>
                <p class="text-xl font-semibold text-red-600 dark:text-red-400 mt-1">{{ formatCurrency(customerFinancials.totalCosts) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Profit</p>
                <p class="text-xl font-semibold mt-1" :class="getProfitClass(customerFinancials.netProfit)">{{ formatCurrency(customerFinancials.netProfit) }}</p>
              </div>
            </div>
            <!-- LLM Profitability Analysis -->
            <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50">
               <div class="flex justify-between items-center mb-2">
                 <h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AI Analysis</h4>
                 <div class="flex items-center space-x-2">
                    <span v-if="latestProfitabilityAnalysis?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                        {{ formatRelativeTime(latestProfitabilityAnalysis.generatedAt) }}
                    </span>
                    <button @click="fetchProfitabilityAnalysis" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingProfitabilityAnalysis" aria-label="Refresh AI profitability analysis">
                        <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingProfitabilityAnalysis }" />
                    </button>
                 </div>
               </div>
               <div v-if="isFetchingProfitabilityAnalysis" class="text-center py-2">
                 <p class="text-xs text-gray-500 dark:text-gray-400">Generating analysis...</p>
               </div>
               <div v-else-if="profitabilityAnalysisError" class="text-xs text-red-600 dark:text-red-400">
                 Error: {{ profitabilityAnalysisError }}
               </div>
               <!-- Display latest analysis using v-html -->
               <div v-else-if="latestProfitabilityAnalysis?.content" v-html="latestProfitabilityAnalysis.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2"></div>
               <!-- Empty state -->
               <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic">
                 No analysis available. Click refresh to generate.
               </div>
            </div>
          </section>

          <!-- Customer Information Card -->
          <section class="card-modern p-5 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h2>
              <button v-if="!isEditingInfo" @click="handleEditInfo" class="btn-ghost-modern text-xs" aria-label="Edit customer details">
                <font-awesome-icon icon="edit" class="mr-1" /> Edit
              </button>
            </div>

            <!-- Display Mode -->
            <div v-if="!isEditingInfo" class="space-y-3 text-sm">
              <div v-if="customer.phone" class="flex items-center">
                <font-awesome-icon icon="phone" class="w-4 h-4 mr-2.5 text-gray-400" />
                <a :href="'tel:'+customer.phone" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">{{ customer.phone }}</a>
              </div>
              <div v-if="customer.email" class="flex items-center">
                <font-awesome-icon icon="envelope" class="w-4 h-4 mr-2.5 text-gray-400" />
                <a :href="'mailto:'+customer.email" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">{{ customer.email }}</a>
              </div>
              <div v-if="customer.address" class="flex items-start">
                <font-awesome-icon icon="map-marker-alt" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span class="text-gray-700 dark:text-gray-300">{{ customer.address }}</span>
              </div>
              <div v-if="customer.channel" class="flex items-center">
                 <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Channel: {{ customer.channel }}</span>
              </div>
               <div v-if="customer.message" class="flex items-start">
                 <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
                 <span class="text-gray-700 dark:text-gray-300">Details: {{ customer.message }}</span>
               </div>
              <div v-if="customer.portal" class="flex items-center">
                 <font-awesome-icon icon="building" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Portal: {{ customer.portal }}</span>
              </div>
              <div v-if="customer.foreignID" class="flex items-center">
                 <font-awesome-icon icon="link" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Foreign ID: {{ customer.foreignID }}</span>
              </div>
              <!-- Referral Info -->
              <div v-if="customer.referredBy" class="flex items-center">
                <font-awesome-icon icon="user" class="w-4 h-4 mr-2.5 text-gray-400" /> <!-- Placeholder icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Referred By:
                  <!-- TODO: Add link to referrer customer view if possible -->
                  <span class="font-medium ml-1">{{ customer.referredBy.name || 'N/A' }}</span>
                </span>
              </div>
              <div v-if="customer.referrals && customer.referrals.length > 0" class="flex items-start">
                <font-awesome-icon icon="users" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" /> <!-- Placeholder icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Referred Clients:
                  <ul class="list-disc list-inside ml-1 mt-1">
                    <li v-for="referral in customer.referrals" :key="referral.id">
                      <!-- TODO: Add link to referred customer view if possible -->
                      {{ referral.name || 'N/A' }}
                    </li>
                  </ul>
                </span>
              </div>
              <!-- Preferred Technician -->
              <div class="flex items-center">
                <font-awesome-icon icon="user-cog" class="w-4 h-4 mr-2.5 text-gray-400" /> <!-- Placeholder icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Preferred Technician:
                  <span class="font-medium ml-1">{{ customer.preferredTechnician?.name || 'None' }}</span>
                  <!-- TODO: Add Edit button/modal trigger here -->
                  <button @click="openEditPreferredTechnicianModal" class="btn-ghost-modern text-xs ml-2 p-0.5" aria-label="Edit preferred technician">
                    <font-awesome-icon icon="edit" />
                  </button>
                </span>
              </div>
            </div>

            <!-- Edit Mode Form -->
            <form v-else @submit.prevent="updateCustomer" class="space-y-4">
              <div>
                <label for="edit-name" class="label-modern">Name</label>
                <input type="text" id="edit-name" v-model="editableCustomer.name" required class="input-modern" />
              </div>
              <div>
                <label for="edit-phone" class="label-modern">Phone</label>
                <input type="tel" id="edit-phone" v-model="editableCustomer.phone" class="input-modern" />
              </div>
              <div>
                <label for="edit-email" class="label-modern">Email</label>
                <input type="email" id="edit-email" v-model="editableCustomer.email" class="input-modern" />
              </div>
              <div>
                <label for="edit-address" class="label-modern">Address</label>
                <textarea id="edit-address" v-model="editableCustomer.address" rows="2" class="input-modern"></textarea>
              </div>
               <div>
                 <label for="edit-channel" class="label-modern">Channel</label>
                 <input type="text" id="edit-channel" v-model="editableCustomer.channel" class="input-modern" />
               </div>
               <div>
                 <label for="edit-message" class="label-modern">Lead Source / Details</label>
                 <textarea id="edit-message" v-model="editableCustomer.message" rows="2" class="input-modern"></textarea>
               </div>
               <div>
                 <label for="edit-portal" class="label-modern">Portal</label>
                 <input type="text" id="edit-portal" v-model="editableCustomer.portal" class="input-modern" />
               </div>
               <div>
                 <label for="edit-foreignID" class="label-modern">Foreign ID</label>
                 <input type="text" id="edit-foreignID" v-model="editableCustomer.foreignID" class="input-modern" />
               </div>
              <div class="flex justify-end space-x-3 pt-2">
                <button type="button" @click="handleCancelEdit" class="btn-secondary-modern">Cancel</button>
                <button type="submit" class="btn-primary-modern" :disabled="isUpdatingCustomer">
                  {{ isUpdatingCustomer ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </section>

          <!-- Communication Preferences Card -->
          <section class="card-modern p-5 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Communication Preferences</h3>
              <!-- TODO: Add Edit button/modal trigger here -->
              <button @click="openEditCommPrefsModal" class="btn-ghost-modern text-xs" aria-label="Edit communication preferences">
                <font-awesome-icon icon="edit" class="mr-1" /> Edit
              </button>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex items-center">
                <font-awesome-icon icon="comments" class="w-4 h-4 mr-2.5 text-gray-400" /> <!-- Placeholder icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Method: <span class="font-medium ml-1">{{ customer.preferredContactMethod || 'Any' }}</span>
                </span>
              </div>
              <div class="flex items-center">
                <font-awesome-icon :icon="['far', 'clock']" class="w-4 h-4 mr-2.5 text-gray-400" /> <!-- Use regular clock icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Times: <span class="font-medium ml-1">{{ customer.preferredContactTimes || 'Any' }}</span>
                </span>
              </div>
              <div class="flex items-center">
                <font-awesome-icon icon="signal" class="w-4 h-4 mr-2.5 text-gray-400" /> <!-- Placeholder icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Frequency: <span class="font-medium ml-1">{{ customer.communicationFrequencyPreference || 'Moderate' }}</span>
                </span>
              </div>
              <div class="flex items-center">
                <font-awesome-icon icon="language" class="w-4 h-4 mr-2.5 text-gray-400" /> <!-- Placeholder icon -->
                <span class="text-gray-700 dark:text-gray-300">
                  Language: <span class="font-medium ml-1">{{ customer.languagePreference || 'en' }}</span>
                </span>
              </div>
            </div>
          </section>

          <!-- Client Appliances Section -->
          <section class="card-modern p-5 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Client Appliances</h3>
              <button @click="openAddApplianceModal()" class="btn-primary-modern text-sm" aria-label="Add new appliance for this client">
                <font-awesome-icon icon="plus" class="mr-1.5 h-3 w-3" /> Add Appliance
              </button>
            </div>
            <!-- Loading State for Predictive Maintenance -->
            <div v-if="isFetchingPredMaint" class="text-center py-4">
              <Spinner />
              <p class="text-sm text-gray-500 mt-2">Checking predictive maintenance...</p>
            </div>
            <!-- Error State for Predictive Maintenance -->
            <div v-else-if="predMaintError" class="text-center py-4 text-red-600 dark:text-red-400">
              <p>Error checking maintenance: {{ predMaintError }}</p>
              <button @click="fetchPredictiveMaintenance" class="btn-secondary-modern mt-2">Retry</button>
            </div>
            <!-- Appliance List (only show if not loading/erroring on maint check) -->
            <div v-else-if="customer.appliances && customer.appliances.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-1">
              <ApplianceCard
                v-for="appliance in customer.appliances"
                :key="appliance.id"
                :appliance="appliance"
                :alert="predictiveMaintenanceAlerts.find(a => a.applianceId === appliance.id)?.alert"
                @edit="openEditApplianceModal(appliance)"
                @delete="handleDeleteAppliance(appliance.id)"
                @schedule-service="handleScheduleServiceFromAlert"
                @dismiss-alert="handleDismissAlert"
              />
            </div>
            <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
              No appliances recorded for this client yet.
            </div>
          </section>

          <!-- Related Items Accordion -->
          <section class="space-y-3">
             <h2 class="text-lg font-semibold text-gray-900 dark:text-white px-1">Related Records</h2>
             <Disclosure v-for="itemGroup in relatedItems" :key="itemGroup.name" v-slot="{ open }">
               <div class="card-modern p-0 overflow-hidden">
                 <DisclosureButton class="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 transition-colors">
                   <div class="flex items-center">
                     <font-awesome-icon :icon="itemGroup.icon" class="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                     <span>{{ itemGroup.name }}</span>
                     <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ itemGroup.data?.length || 0 }})</span>
                   </div>
                   <div class="flex items-center space-x-2">
                      <button v-if="itemGroup.addRoute" @click.stop="handleAddRelatedItem(itemGroup.addRoute, itemGroup.queryKey)" class="btn-ghost-modern p-1 h-6 w-6" :title="'Add ' + itemGroup.name">
                         <font-awesome-icon icon="plus" class="h-3 w-3" />
                      </button>
                      <font-awesome-icon :icon="open ? 'chevron-up' : 'chevron-down'" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                   </div>
                 </DisclosureButton>
                 <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-out"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                     <DisclosurePanel class="px-4 pt-2 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/50 max-h-96 overflow-y-auto bg-gray-900 dark:bg-gray-200">
                     <div v-if="itemGroup.data && itemGroup.data.length > 0" class="space-y-3 mt-3">
                       <!-- Render the specific component for each item -->
                       <component
                         v-for="item in itemGroup.data"
                         :is="itemGroup.component"
                         :[itemGroup.itemKey]="item"
                         :key="item.id || item.uid || JSON.stringify(item)"
                         @reload-timeline="reloadTimeline"
                         @edit-estimate="openAddEstimateModal"
                         @view-estimate="handleViewEstimate"
                         @edit-invoice="openAddInvoiceModal"
                         @view-invoice="handleViewInvoice"
                         @edit-payment="openAddPaymentModal"
                         @view-payment="handleViewPayment"
                         @edit-expense="openAddExpenseModal"
                         @view-expense="handleViewExpense"
                         @edit-insurance="openAddInsuranceModal"
                         @view-insurance="handleViewInsurance"
                         @edit-job="handleViewJob"
                         class="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 bg-[#ffffff]"
                       />
                     </div>
                     <p v-else class="mt-3 text-center text-gray-500">No {{ itemGroup.name.toLowerCase() }} found.</p>
                   </DisclosurePanel>
                 </transition>
               </div>
             </Disclosure>
          </section>

        </div>

        <!-- Right Column: Activity Timeline / Tabs -->
        <div class="lg:col-span-8">
          <section class="card-modern p-0 overflow-hidden min-h-[60vh] lg:min-h-[75vh] flex flex-col"> 
             <TabGroup>
               <TabList class="flex-shrink-0 flex space-x-1 rounded-t-lg bg-gray-100 dark:bg-gray-900/50 p-1 border-b border-gray-200 dark:border-gray-700/50"> 
                 <Tab
                   v-for="tab in activityTabs"
                   :key="tab.name"
                   v-slot="{ selected }"
                   as="template"
                 >
                   <button
                     :class="[
                       'w-full rounded-md py-2 px-3 text-sm font-medium leading-5',
                       'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 dark:ring-offset-gray-800 ring-white ring-opacity-60',
                       selected
                         ? 'bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300'
                         : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.30] dark:hover:bg-black/[0.15] hover:text-gray-800 dark:hover:text-gray-200',
                       'transition-colors duration-150'
                     ]"
                   >
                     {{ tab.name }}
                   </button>
                 </Tab>
               </TabList>

              <TabPanels class="flex-grow p-6 sm:p-6 overflow-y-auto ml-5 relative min-h-[200px]">
                <!-- Loading Indicator -->
                <div v-if="isFetchingCustomer" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                  <p class="text-gray-500 dark:text-gray-400 mr-2">Loading activities...</p>
                  <scale-loader :loading="true" color="#4f46e5" height="25px" width="4px" />
                </div>

                <!-- Actual Tab Content (rendered only when not fetching) -->
                <template v-else>
                  <TabPanel
                    v-for="(tab, idx) in activityTabs"
                    :key="idx"
                   :class="['focus:outline-none h-full']" 
                 >
                   <!-- Render 'All' Activities (simplified) -->
                   <div v-if="tab.name === 'All'" class="space-y-4 h-full">

                     <!-- AI Timeline Summary Section -->
                     <div class="mb-6 p-4 border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
                       <div class="flex justify-between items-center mb-2">
                         <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">AI Relationship Summary</h4>
                         <div class="flex items-center space-x-2">
                            <span v-if="latestTimelineSummary?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                                {{ formatRelativeTime(latestTimelineSummary.generatedAt) }}
                            </span>
                            <button @click="fetchTimelineSummary" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingTimelineSummary" aria-label="Refresh AI summary">
                                <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingTimelineSummary }" />
                            </button>
                         </div>
                       </div>
                       <div v-if="isFetchingTimelineSummary" class="text-center py-4">
                         <p class="text-sm text-gray-500 dark:text-gray-400">Generating summary...</p>
                         <!-- Optional: Add a small spinner here -->
                       </div>
                       <div v-else-if="timelineSummaryError" class="text-sm text-red-600 dark:text-red-400">
                         Error generating summary: {{ timelineSummaryError }}
                       </div>
                       <!-- Use v-html to render HTML from backend -->
                       <div v-else-if="latestTimelineSummary?.content" v-html="latestTimelineSummary.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2"></div>
                       <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                         Click the refresh button to generate an AI summary of the customer's interaction history.
                       </div>
                     </div>
                     <!-- End AI Timeline Summary Section -->

                     <!-- AI Sentiment Analysis Section -->
                     <div class="mb-6 p-4 border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow-sm">
                       <div class="flex justify-between items-center mb-2">
                         <h4 class="text-sm font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">AI Sentiment Analysis</h4>
                         <div class="flex items-center space-x-2">
                            <span v-if="latestSentimentAnalysis?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                                {{ formatRelativeTime(latestSentimentAnalysis.generatedAt) }}
                            </span>
                            <button @click="fetchSentimentAnalysis" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingSentiment" aria-label="Refresh AI sentiment analysis">
                                <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingSentiment }" />
                            </button>
                         </div>
                       </div>
                       <div v-if="isFetchingSentiment" class="text-center py-4">
                         <p class="text-sm text-gray-500 dark:text-gray-400">Analyzing sentiment...</p>
                       </div>
                       <div v-else-if="sentimentError" class="text-sm text-red-600 dark:text-red-400">
                         Error analyzing sentiment: {{ sentimentError }}
                       </div>
                       <!-- Display Sentiment Analysis from JSON object -->
                       <div v-else-if="latestSentimentAnalysis?.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                          <!-- Display overallSummary directly -->
                          <p><strong>Overall Summary:</strong> {{ latestSentimentAnalysis.content.overallSummary || 'N/A' }}</p>
                          <!-- Display individual messages, urgent issues, opportunities -->
                          <div v-if="latestSentimentAnalysis.content.individualMessages && latestSentimentAnalysis.content.individualMessages.length > 0">
                            <strong>Individual Messages Summary ({{ latestSentimentAnalysis.content.individualMessages.length }}):</strong>
                            <ul class="list-disc list-inside ml-1 text-xs max-h-20 overflow-y-auto border dark:border-gray-600 p-1 rounded"> <!-- Added style -->
                              <li v-for="(msg, mIndex) in latestSentimentAnalysis.content.individualMessages" :key="mIndex">
                                {{ msg.date }} - {{ msg.sentiment }}: {{ msg.keyPoints?.join(', ') || 'No key points' }}
                              </li>
                            </ul>
                          </div>
                           <div v-if="latestSentimentAnalysis.content.urgentIssues && latestSentimentAnalysis.content.urgentIssues.length > 0">
                            <strong>Urgent Issues:</strong>
                            <ul class="list-disc list-inside ml-1 text-xs text-red-500 dark:text-red-400"> <!-- Style urgent issues -->
                              <li v-for="(issue, iIndex) in latestSentimentAnalysis.content.urgentIssues" :key="iIndex">{{ issue }}</li>
                            </ul>
                          </div>
                          <div v-if="latestSentimentAnalysis.content.opportunities && latestSentimentAnalysis.content.opportunities.length > 0">
                            <strong>Opportunities:</strong>
                            <ul class="list-disc list-inside ml-1 text-xs text-green-600 dark:text-green-400"> <!-- Style opportunities -->
                              <li v-for="(opp, oIndex) in latestSentimentAnalysis.content.opportunities" :key="oIndex">{{ opp }}</li>
                            </ul>
                          </div>
                          <!-- Timestamp already shown in header -->
                       </div>
                       <!-- Empty state -->
                       <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                         No sentiment analysis available. Click refresh to generate.
                       </div>
                     </div>
                     <!-- End AI Sentiment Analysis Section -->

                     <!-- AI Profitability Analysis Section -->
                     <div class="mb-6 p-4 border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm">
                       <div class="flex justify-between items-center mb-2">
                         <h4 class="text-sm font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider">AI Profitability Analysis</h4>
                         <div class="flex items-center space-x-2">
                            <span v-if="latestProfitabilityAnalysis?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                                {{ formatRelativeTime(latestProfitabilityAnalysis.generatedAt) }}
                            </span>
                            <button @click="fetchProfitabilityAnalysis" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingProfitabilityAnalysis" aria-label="Refresh AI profitability analysis">
                                <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingProfitabilityAnalysis }" />
                            </button>
                         </div>
                       </div>
                       <div v-if="isFetchingProfitabilityAnalysis" class="text-center py-4">
                         <p class="text-sm text-gray-500 dark:text-gray-400">Analyzing profitability...</p>
                       </div>
                       <div v-else-if="profitabilityAnalysisError" class="text-sm text-red-600 dark:text-red-400">
                         Error analyzing profitability: {{ profitabilityAnalysisError }}
                       </div>
                       <!-- Use v-html to render HTML from backend -->
                       <div v-else-if="latestProfitabilityAnalysis?.content" v-html="latestProfitabilityAnalysis.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2"></div>
                       <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                         Click the refresh button to generate an AI analysis of customer profitability.
                       </div>
                     </div>
                     <!-- End AI Profitability Analysis Section -->

                     <p v-if="!customer.activities || customer.activities.length === 0" class="text-center text-gray-500 py-8">No activities recorded yet.</p>
                      <template v-else>
                         <!-- Loop through all activities and try to determine type -->
                         <div v-for="activity in customer.activities" :key="activity.uid" class="activity-item">
                            <!-- Basic display - ideally, use specific accordion components -->
                            <component
                              :is="accordionNotes"
                              v-if="activity.type === 'note'"
                              :note="activity"
                              class="mb-3"
                            />
                            <template v-else-if="activity.type === 'whatsapp'">                              
                              <component
                                :is="accordion"
                                :whatsapp="activity"
                                class="mb-3"
                              />
                            </template>
                             <component
                               :is="accordionEmail"
                               v-else-if="activity.type === 'email'"
                               :email="activity"
                               class="mb-3"
                             />
                             <component
                               :is="accordionView"
                               v-else-if="activity.type === 'view'"
                               :view="activity"
                               class="mb-3"
                             />
                             <component
                               :is="accordionClick"
                               v-else-if="activity.type === 'click'"
                               :click="activity"
                               class="mb-3"
                             />
                             <component
                               :is="accordionForm"
                               v-else-if="activity.type === 'form'"
                               :form="activity"
                               class="mb-3"
                             />
                             <!-- Fallback for unknown types -->
                             <!-- <div v-else class="text-xs p-2 border dark:border-gray-700 rounded mb-3">
                                <span class="font-semibold">{{ activity.type || 'Activity' }}</span> - {{ new Date(activity.createdAt).toLocaleString() }}
                                <pre class="text-xs mt-1 whitespace-pre-wrap">{{ activity.content || JSON.stringify(activity) }}</pre>
                             </div> -->
                         </div>
                      </template>
                   </div>
                   <!-- Render Receipts Gallery -->
                   <div v-else-if="tab.name === 'Receipts'" class="space-y-4 h-full">
                      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expense Receipts</h3>
                      <div v-if="!customer.expenses || customer.expenses.filter(e => e.imageUrl).length === 0" class="text-center text-gray-500 py-8">
                        No expense receipts found for this customer.
                      </div>
                      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div v-for="expense in customer.expenses.filter(e => e.imageUrl)" :key="expense.id" class="group relative">
                          <a :href="expense.imageUrl" target="_blank" rel="noopener noreferrer" class="block aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                            <img :src="expense.imageUrl" :alt="'Receipt for ' + expense.description" class="pointer-events-none object-cover group-hover:opacity-75 transition-opacity w-full h-full">
                          </a>
                          <p class="pointer-events-none mt-1 block truncate text-xs font-medium text-gray-700 dark:text-gray-300">{{ expense.description }}</p>
                          <p class="pointer-events-none block text-xs font-medium text-gray-500 dark:text-gray-400">{{ new Date(expense.date).toLocaleDateString() }} - {{ formatCurrency(expense.amount) }}</p>
                        </div>
                      </div>
                   </div>
                   <!-- Render Engagement Hub -->
                   <div v-else-if="tab.name === 'Engagement'" class="space-y-6 h-full">
                     <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Proactive Engagement Hub</h3>

                     <!-- LLM Suggestions Section -->
                     <section class="card-modern p-4">
                       <div class="flex justify-between items-center mb-3">
                          <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200">AI Suggestions</h4>
                          <button @click="fetchFollowupSuggestions" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingSuggestions" aria-label="Refresh AI suggestions">
                             <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingSuggestions }" />
                          </button>
                       </div>
                       <div v-if="isFetchingSuggestions" class="text-center py-3 text-sm text-gray-500 dark:text-gray-400">Loading suggestions...</div>
                       <div v-else-if="suggestionsError" class="text-sm text-red-600 dark:text-red-400">Error: {{ suggestionsError }}</div>
                       <div v-else-if="followupSuggestions && followupSuggestions.length > 0" class="space-y-3">
                          <!-- Placeholder for suggestion display -->
                          <div v-for="(suggestion, index) in followupSuggestions" :key="index" class="border rounded p-3 text-sm bg-gray-50 dark:bg-gray-700/30">
                             <p class="font-medium mb-1">{{ suggestion.title }} (Reason: {{ suggestion.reason }})</p>
                             <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Timing: {{ suggestion.timing }}</p>
                             <!-- Use v-html for draft message -->
                             <div v-html="suggestion.draftMessage" class="bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-xs space-y-1"></div>
                             <div class="flex justify-end space-x-2 mt-2">
                                <button class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="scheduleSuggestion(suggestion)">Schedule</button>
                                <button class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="sendSuggestionNow(suggestion)">Send Now</button>
                                <button class="btn-ghost-modern text-xs py-0.5 px-1.5" @click="logSuggestionManually(suggestion)">Log Manual</button>
                                <button class="btn-ghost-modern text-xs py-0.5 px-1.5 text-red-500" @click="dismissSuggestion(index)">Dismiss</button>
                             </div>
                          </div>
                       </div>
                       <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No AI suggestions available. Click refresh to check.</div>
                     </section>

                     <!-- Scheduled Messages Section -->
                     <section class="card-modern p-4">
                        <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Scheduled Messages</h4>
                        <div class="flex justify-between items-center mb-2">
                           <!-- Refresh button -->
                           <button @click="fetchScheduledMessages" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingScheduled" aria-label="Refresh scheduled messages">
                              <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingScheduled }" />
                           </button>
                        </div>
                        <!-- Loading State -->
                        <div v-if="isFetchingScheduled" class="text-center py-3 text-sm text-gray-500 dark:text-gray-400">Loading scheduled messages...</div>
                        <!-- Error State -->
                        <div v-else-if="scheduledError" class="text-sm text-red-600 dark:text-red-400">Error: {{ scheduledError }}</div>
                        <!-- Message List -->
                        <div v-else-if="scheduledMessages && scheduledMessages.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-1">
                           <div v-for="message in scheduledMessages" :key="message.id" class="border rounded p-3 text-sm bg-gray-50 dark:bg-gray-700/30 flex justify-between items-start">
                              <div>
                                 <p class="font-medium mb-1">
                                    Scheduled for: {{ message.scheduledAt ? new Date(message.scheduledAt).toLocaleString() : 'N/A' }}
                                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ message.type || 'Follow-up' }})</span>
                                 </p>
                                 <p class="italic bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-xs">"{{ message.messageContent || 'No content' }}"</p>
                              </div>
                              <button
                                 @click="cancelScheduledMessage(message.id)"
                                 class="btn-ghost-modern text-xs py-0.5 px-1.5 text-red-500 ml-2 flex-shrink-0"
                                 title="Cancel this scheduled message"
                              >
                                 Cancel
                              </button>
                           </div>
                        </div>
                        <!-- Empty State -->
                        <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No messages currently scheduled.</div>
                     </section>

                     <!-- Logged Follow-ups & Satisfaction Section -->
                     <section class="card-modern p-4">
                        <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Follow-up History & Satisfaction</h4>

                        <!-- Follow-up History Display -->
                        <div class="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700/50">
                           <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">History</h5>
                           <div v-if="loggedFollowUps && loggedFollowUps.length > 0" class="space-y-2 max-h-40 overflow-y-auto pr-1">
                              <div v-for="followUp in loggedFollowUps" :key="followUp.id" class="text-xs">
                                 <p>
                                    <span class="font-medium">{{ new Date(followUp.createdAt).toLocaleDateString() }}:</span>
                                    Status: {{ followUp.status }}
                                    <span v-if="followUp.jobId"> (Job #{{ followUp.jobId }})</span>
                                 </p>
                                 <p v-if="followUp.feedback" class="italic text-gray-600 dark:text-gray-400 pl-2">"{{ followUp.feedback }}"</p>
                              </div>
                           </div>
                            <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">No logged follow-up history found.</p>
                        </div>


                        <!-- Post-Service Satisfaction Display -->
                        <div class=""> <!-- Removed margin/padding top as it's now below history -->
                           <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Satisfaction</h5>
                            <!-- TODO: Fetch and loop through recent ServiceFollowUp records -->
                            <div v-if="serviceFollowUps && serviceFollowUps.length > 0">
                              <div v-for="followUp in serviceFollowUps.slice(0, 3)" :key="followUp.id" class="text-xs border-b dark:border-gray-700/50 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                                 <p>Job #{{ followUp.jobId }} ({{ followUp.status }})</p>
                                 <p v-if="followUp.satisfactionRating">
                                    Rating:
                                    <span class="text-yellow-500 ml-1">
                                       <template v-for="i in 5" :key="i">
                                         <font-awesome-icon :icon="i <= followUp.satisfactionRating ? 'star' : ['far', 'star']" />
                                       </template>
                                    </span>
                                 </p>
                                 <p v-if="followUp.feedback" class="italic text-gray-600 dark:text-gray-400">"{{ followUp.feedback }}"</p>
                              </div>
                            </div>
                            <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">No recent satisfaction feedback recorded.</p>
                            <!-- Optional Button to trigger survey -->
                            <!-- <button class="btn-ghost-modern text-xs mt-2">Trigger Survey for Last Job</button> -->
                        </div>

                        <button class="btn-secondary-modern text-sm mt-4">Log Manual Follow-up</button>
                     </section>

                      <!-- Holiday/Occasion Messages Section -->
                     <section class="card-modern p-4">
                        <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Suggested Greetings</h4>
                        <!-- Loading State -->
                        <div v-if="isFetchingGreetings" class="text-center py-4">
                          <Spinner />
                          <p class="text-sm text-gray-500 mt-2">Loading greetings...</p>
                        </div>
                        <!-- Error State -->
                        <div v-else-if="greetingsError" class="text-center py-4 text-red-600 dark:text-red-400">
                          <p>Error loading greetings: {{ greetingsError }}</p>
                          <button @click="fetchHolidayGreetings" class="btn-secondary-modern mt-2">Retry</button>
                        </div>
                        <!-- Display fetched greetings -->
                        <div v-else-if="holidayGreetings && holidayGreetings.length > 0" class="space-y-3">
                           <div v-for="(greeting, index) in holidayGreetings" :key="index" class="border rounded p-3 text-sm bg-gray-50 dark:bg-gray-700/30">
                              <p class="font-medium mb-1">{{ greeting.specificOccasion }} ({{ greeting.occasionType }}) - {{ new Date(greeting.occasionDate).toLocaleDateString() }}</p>
                              <!-- Use v-html for draft message -->
                              <div v-html="greeting.draftMessage" class="bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-xs space-y-1"></div>
                              <div class="flex justify-end space-x-2 mt-2">
                                 <!-- Actions are now implemented -->
                                 <!-- Show Schedule button only if not already scheduled -->
                                 <button v-if="!greeting.followUpId" class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="scheduleGreeting(greeting)">Schedule</button>
                                 <button class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="sendGreetingNow(greeting)">Send Now</button>
                                 <!-- Show Cancel button only if scheduled -->
                                 <button v-if="greeting.followUpId" class="btn-ghost-modern text-xs py-0.5 px-1.5 text-red-500" @click="cancelScheduledMessage(greeting.followUpId)">Cancel Scheduled</button>
                              </div>
                           </div>
                        </div>
                        <!-- Empty State -->
                        <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No suggested greetings available at this time.</p>
                     </section>

                   </div>
                   <!-- Render Specific Activity Type using Accordions -->
                   <div v-else class="space-y-3 h-full">
                      <p v-if="!customer.activities || customer.activities.filter(a => a.type === tab.type).length === 0" class="text-center text-gray-500 py-8">No {{ tab.name.toLowerCase() }} recorded yet.</p>
                      <template v-else>
                        <template v-for="activity in customer.activities.filter(a => a.type === tab.type)" :key="(tab.name === 'Whatsapp' ? wkey : nkey) + activity.uid">
                           <!-- Add logging here -->
                           <!-- {{ tab.type === 'whatsapp' ? console.log(`WhatsApp Activity (${tab.name} Tab):`, JSON.stringify(activity)) : '' }} -->
                           <component
                             :is="tab.component"
                             :[tab.type]="activity"
                           />
                        </template>
                      </template>
                   </div>
                 </TabPanel>
                </template>
               </TabPanels>
             </TabGroup>
          </section>
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

     </div> <!-- End container -->
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
/>

<!-- Add/Edit Invoice Modal -->
<InvoiceFormModal
  v-model="showAddInvoiceModal"
  :customer-data="customerContextForModal || customer"
  :invoice-data="selectedInvoice"
  @invoice-saved="handleInvoiceSaved"
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
     

<!-- Loading Overlay -->
     <div v-if="isLoading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
        <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
     </div>
   </div> <!-- End main div -->
 </template>

<style>
/* Import modern styles used in Jobs.vue - Assuming these are globally available or defined in a main CSS file */
/* If not global, copy the necessary .input-modern, .btn-*, .card-modern, .label-modern etc. styles here or import them */

/* Minimalist Input Styles (Copied from Jobs.vue for completeness) */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat bg-right;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

.label-modern {
  @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}

/* Modern Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}
.btn-ghost-modern {
  @apply inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 rounded;
  @apply hover:bg-indigo-100 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm; /* Added backdrop-blur */
}

/* Modal Styles */
.modal-content-modern {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl; /* Simplified base */
}

/* Custom scrollbar styles (optional) */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; } /* Adjusted track */
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* Ensure date/time inputs are stylable */
input[type="date"],
input[type="datetime-local"] {
  @apply appearance-none;
}
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  @apply filter dark:invert opacity-50 cursor-pointer;
}

/* TipTap Editor basic styling */
.ProseMirror {
  @apply min-h-[100px] p-2 focus:outline-none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  @apply text-gray-400 dark:text-gray-500 pointer-events-none h-0;
}

/* Activity Item basic styling */
.activity-item {
  /* Add specific styling for different activity types if needed */
}

/* Ensure DisclosurePanel content doesn't overflow card */
.card-modern .overflow-y-auto {
  scrollbar-gutter: stable; /* Prevent layout shift when scrollbar appears */
}

</style>