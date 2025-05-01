// wibiclick-frontend-vue/src/components/payments/PaymentFormModal.vue
<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import  useUserStore  from "@/stores/UserStore";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'; // Added for loading indicators

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // Base customer info
    type: Object,
    required: true, // Make required as we need the ID
  },
  paymentData: { // For editing existing payment
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'payment-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false); // General loading state for save
const loadingRelated = ref(false); // Loading state for dropdown data

// --- Dropdown Data ---
const jobs = ref([]);
const invoices = ref([]);
const estimates = ref([]);
const technicians = ref([]);

// --- Form State (aligned with AddPayment.vue + modal needs) ---
const paymentForm = reactive({
  id: '', // For editing
  customerId: '',
  type: 'INVOICE', // Default type like AddPayment.vue (Invoice/Deposit) - Backend might use this for linking logic
  status: 'successful', // Default status
  amount: 0, // Changed from amountInCents
  currency: 'ZAR', // Assuming ZAR for now
  jobId: null, // Use null for empty selection
  invoiceId: null,
  estimateId: null,
  employeeId: null,
  paymentMethod: 'card', // How payment was made (card, eft, cash)
  notes: '',
  paymentDate: moment().format('YYYY-MM-DD'), // Added payment date
});

// --- Constants ---
// These seem more like payment *reasons* or links in AddPayment.vue, keep for consistency if backend uses 'type' this way
const PAYMENT_TYPES = ['INVOICE', 'DEPOSIT'];
// How the payment was actually made
const PAYMENT_METHODS = ['card', 'eft', 'cash', 'other'];
const PAYMENT_STATUSES = ['successful', 'pending', 'failed'];

const isEditing = computed(() => !!paymentForm.id);

// --- Fetching Logic ---
async function fetchTechnicians() {
  if (technicians.value.length > 0 || !userStore.currentWebsite) return; // Avoid refetching
  loadingRelated.value = true;
  try {
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    technicians.value = response.data.employees.map(tech => ({
      value: tech.id,
      label: `${tech.firstName} ${tech.lastName}`
    }));
  } catch (error) {
    // Removed console.error
    toast.error("Error fetching technicians");
  } finally {
    loadingRelated.value = false;
  }
}

async function fetchJobs(customerId) {
  if (!customerId || !userStore.currentWebsite) {
    jobs.value = [];
    return;
  }
  loadingRelated.value = true;
  try {
    const response = await axios.get(`jobs-for-contact?id=${userStore.currentWebsite}&contactId=${customerId}`);
    jobs.value = response.data.jobs.map(job => ({
      value: job.id,
      label: `Job #${job.jobStatus || job.id.substring(0, 5)} - ${job.slotStart ? job.slotStart.split('T')[0] : 'No Date'}`, // Added fallback label
      slotStart: job.slotStart,
      employeeId: job.employee?.id // Capture employeeId associated with job
    })).sort((a, b) => { // Sort by date descending, handle null dates
        const dateA = a.slotStart ? new Date(a.slotStart) : 0;
        const dateB = b.slotStart ? new Date(b.slotStart) : 0;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
     });

    // Auto-select most recent job if not editing and jobs exist
    if (!isEditing.value && jobs.value.length > 0) {
       // paymentForm.jobId = jobs.value[0].value; // Let user select explicitly
       // paymentForm.employeeId = jobs.value[0].employeeId; // Set tech based on job selection later
    }

  } catch (error) {
    // Removed console.error
    toast.error("Error fetching jobs");
    jobs.value = []; // Clear on error
  } finally {
    loadingRelated.value = false;
  }
}

async function fetchInvoices(customerId, jobId = null) {
  if (!customerId || !userStore.currentWebsite) {
    invoices.value = [];
    return;
  }
  loadingRelated.value = true;
  let url = `invoices?id=${userStore.currentWebsite}&customerId=${customerId}`;
  if (jobId) url += `&jobId=${jobId}`; // Filter by job if selected
  try {
    const response = await axios.get(url);
    invoices.value = response.data.invoices.map(invoice => ({
      value: invoice.id,
      label: `Inv #${invoice.number || invoice.id.substring(0,5)} - R${invoice.sales}`, // Simplified label
      amount: invoice.sales * 100 // Store amount in cents
    }));
  } catch (error) {
    // Removed console.error
    toast.error("Error fetching invoices");
    invoices.value = []; // Clear on error
  } finally {
    loadingRelated.value = false;
  }
}

async function fetchEstimates(customerId, jobId = null) {
   if (!customerId || !userStore.currentWebsite) {
    estimates.value = [];
    return;
  }
  loadingRelated.value = true;
  let url = `estimates?id=${userStore.currentWebsite}&customerId=${customerId}`;
  if (jobId) url += `&jobId=${jobId}`; // Filter by job if selected
  try {
    const response = await axios.get(url);
    estimates.value = response.data.estimates.map(estimate => ({
      value: estimate.id,
      label: `Est #${estimate.number || estimate.id.substring(0,5)} - R${estimate.sales}` // Simplified label
    }));
  } catch (error) {
    // Removed console.error
    toast.error("Error fetching estimates");
    estimates.value = []; // Clear on error
  } finally {
    loadingRelated.value = false;
  }
}

// --- Event Handlers ---
function handleJobSelection() {
  const selectedJobId = paymentForm.jobId;
  const customerId = paymentForm.customerId;

  // Reset related fields
  paymentForm.invoiceId = null;
  paymentForm.estimateId = null;
  invoices.value = [];
  estimates.value = [];

  // Set technician based on selected job
  const selectedJob = jobs.value.find(job => job.value === selectedJobId);
  paymentForm.employeeId = selectedJob ? selectedJob.employeeId : null;

  // Fetch related invoices and estimates
  if (selectedJobId && customerId) {
    fetchInvoices(customerId, selectedJobId);
    fetchEstimates(customerId, selectedJobId);
  }
}

function handleInvoiceSelection() {
  const selectedInvoiceId = paymentForm.invoiceId;
  const selectedInvoice = invoices.value.find(invoice => invoice.value === selectedInvoiceId);
  if (selectedInvoice) {
    paymentForm.amount = selectedInvoice.amount / 100; // Auto-fill amount (convert from cents)
    paymentForm.type = 'INVOICE'; // Set type to INVOICE when invoice is selected
  } else if (!paymentForm.estimateId) { // Only reset amount if estimate not also selected
     // paymentForm.amount = 0; // Don't reset if user might manually enter
  }
}

function handleEstimateSelection() {
    // If an estimate is selected, maybe set type to DEPOSIT? Or clear invoice selection?
    // For now, just ensure estimateId is tracked. Backend logic might handle linking.
    if (paymentForm.estimateId) {
        paymentForm.type = 'DEPOSIT'; // Assume payment against estimate is a deposit
        // paymentForm.invoiceId = null; // Optionally clear invoice if estimate is chosen
    }
}

// --- Modal Control ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetPaymentForm = () => {
  Object.assign(paymentForm, {
    id: '',
    customerId: '',
    type: 'INVOICE',
    status: 'successful',
    amount: 0, // Changed from amountInCents
    currency: 'ZAR',
    jobId: null,
    invoiceId: null,
    estimateId: null,
    employeeId: null,
    paymentMethod: 'card',
    notes: '',
    paymentDate: moment().format('YYYY-MM-DD'), // Reset date to today
  });
  // Clear dropdowns
  jobs.value = [];
  invoices.value = [];
  estimates.value = [];
  // technicians are fetched once, keep them
};

const prefillForm = async (customer, payment) => {
  resetPaymentForm();

  if (customer && customer.id) {
    paymentForm.customerId = customer.id;
    // Fetch initial related data for the customer
    await fetchJobs(customer.id); // Fetch jobs first
    await fetchTechnicians(); // Fetch technicians
  }

  // If editing, populate with existing payment data
  if (payment) {
    Object.assign(paymentForm, {
      id: payment.id,
      customerId: payment.customerId,
      type: payment.type || 'INVOICE', // Backend type (INVOICE/DEPOSIT)
      status: payment.status || 'successful',
      amount: (payment.amountInCents || 0) / 100, // Convert cents to currency unit
      currency: payment.currency || 'ZAR',
      jobId: payment.jobId || null,
      invoiceId: payment.invoiceId || null,
      estimateId: payment.estimateId || null,
      employeeId: payment.employeeId || null,
      // Prioritize actual paymentMethod field from backend data
      paymentMethod: payment.paymentMethod || 'other', // Default to 'other' if missing
      notes: payment.notes || '',
      // Format existing date if present, otherwise default to today
      paymentDate: payment.paymentDate ? moment(payment.paymentDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
    });

    // If editing, fetch invoices/estimates related to the specific job
    if (paymentForm.jobId && paymentForm.customerId) {
       await fetchInvoices(paymentForm.customerId, paymentForm.jobId);
       await fetchEstimates(paymentForm.customerId, paymentForm.jobId);
    } else if (paymentForm.customerId) {
        // Fetch all invoices/estimates for customer if no job linked
       await fetchInvoices(paymentForm.customerId);
       await fetchEstimates(paymentForm.customerId);
    }
  } else {
      // If adding new, potentially pre-select technician based on user or default
      // paymentForm.employeeId = userStore.userId; // Example
  }
};

const submitPayment = async () => {
  loading.value = true;
  try {
    // Convert amount from currency unit to cents for backend
    const amountInCents = Math.round(parseFloat(paymentForm.amount) * 100);
    if (isNaN(amountInCents)) {
        toast.error("Invalid amount entered.");
        loading.value = false;
        return;
    }

    const payload = {
      amountInCents: amountInCents, // Send amount in cents
      currency: paymentForm.currency,
      type: paymentForm.type, // INVOICE or DEPOSIT
      status: paymentForm.status,
      customerId: paymentForm.customerId,
      jobId: paymentForm.jobId || undefined, // Send null/undefined if not selected
      invoiceId: paymentForm.invoiceId || undefined,
      estimateId: paymentForm.estimateId || undefined,
      employeeId: paymentForm.employeeId || undefined,
      paymentMethod: paymentForm.paymentMethod, // card, eft, cash etc.
      notes: paymentForm.notes,
      paymentDate: paymentForm.paymentDate, // Add payment date to payload
    };

    // If editing, include the ID
    if (isEditing.value) {
      payload.id = paymentForm.id;
    }

    // Determine the correct endpoint (add or update)
    let endpoint = `add-payment?id=${userStore.currentWebsite}`;
    let method = 'post';

    if (isEditing.value) {
      method = 'put';
      // Align endpoint with EditPayment.vue pattern
      endpoint = `update-payment/${paymentForm.id}?id=${userStore.currentWebsite}`;
      // ID is now in the URL, no longer needed in payload for update (usually)
      // delete payload.id; // Keep it in payload for now unless backend confirms it's not needed
    }

    const response = await axios({ method, url: endpoint, data: payload });

    toast.success(response.data.message || 'Payment saved successfully');
    emit('payment-saved');
    closeModal();
  } catch (error) {
    // Removed console.error
    toast.error(`Error submitting payment: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form
    prefillForm(props.customerData, props.paymentData);
  } else {
      resetPaymentForm(); // Reset when closing
  }
});

// Watch for direct changes to paymentData prop while modal is open (less common)
watch(() => props.paymentData, (newPaymentData) => {
    if (props.modelValue) { // Only prefill if modal is already open
        prefillForm(props.customerData, newPaymentData);
    }
});

</script>

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <!-- Modal positioning -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <!-- Modal panel -->
        <div class="modal-content-modern sm:max-w-2xl"> <!-- Increased max-width -->
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Payment' : 'Add New Payment' }}
            <span v-if="customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitPayment" class="space-y-4">
            <div class="max-h-[65vh] overflow-y-auto pr-2 space-y-5"> <!-- Added space-y-5 -->

              <!-- Loading Indicator for related data -->
              <div v-if="loadingRelated" class="text-center py-4">
                 <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
                 <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading related data...</p>
              </div>

              <!-- Payment Details Section -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label for="payment-customer" class="label-modern">Customer</label>
                    <input type="text" id="payment-customer" :value="customerData?.name || 'N/A'" disabled class="input-modern bg-gray-100 dark:bg-gray-700 cursor-not-allowed" />
                    <!-- Hidden input to ensure customerId is part of the form state if needed, though it's in reactive state -->
                    <input type="hidden" v-model="paymentForm.customerId" />
                 </div>

                 <div>
                   <label for="payment-amount" class="label-modern">Amount</label>
                    <div class="relative">
                       <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">R</span>
                       <input type="number" id="payment-amount" v-model="paymentForm.amount" required min="0" step="0.01" class="input-modern pl-7 text-right" />
                    </div>
                 </div>

                 <div>
                   <label for="payment-type" class="label-modern">Payment Type</label>
                   <select id="payment-type" v-model="paymentForm.type" required class="input-modern input-modern--select">
                     <option v-for="type in PAYMENT_TYPES" :key="type" :value="type">{{ type }}</option>
                   </select>
                 </div>

                 <div>
                   <label for="payment-method" class="label-modern">Payment Method</label>
                   <select id="payment-method" v-model="paymentForm.paymentMethod" required class="input-modern input-modern--select">
                     <option v-for="method in PAYMENT_METHODS" :key="method" :value="method">{{ method }}</option>
                   </select>
                 </div>

                 <div>
                   <label for="payment-status" class="label-modern">Status</label>
                   <select id="payment-status" v-model="paymentForm.status" required class="input-modern input-modern--select">
                     <option v-for="status in PAYMENT_STATUSES" :key="status" :value="status">{{ status }}</option>
                   </select>
                 </div>

                 <div>
                   <label for="payment-date" class="label-modern">Payment Date</label>
                   <input type="date" id="payment-date" v-model="paymentForm.paymentDate" required class="input-modern" />
                 </div>

                 <!-- Linkage Section -->
                 <div>
                   <label for="payment-job" class="label-modern">Link to Job</label>
                   <select id="payment-job" v-model="paymentForm.jobId" @change="handleJobSelection" class="input-modern input-modern--select" :disabled="!paymentForm.customerId || loadingRelated">
                     <option :value="null">-- Select Job --</option>
                     <option v-for="job in jobs" :key="job.value" :value="job.value">{{ job.label }}</option>
                   </select>
                 </div>

                 <div>
                   <label for="payment-invoice" class="label-modern">Link to Invoice (Optional)</label>
                   <select id="payment-invoice" v-model="paymentForm.invoiceId" @change="handleInvoiceSelection" class="input-modern input-modern--select" :disabled="!paymentForm.customerId || loadingRelated">
                      <option :value="null">-- Select Invoice --</option>
                      <option v-for="invoice in invoices" :key="invoice.value" :value="invoice.value">{{ invoice.label }}</option>
                   </select>
                 </div>

                 <div>
                   <label for="payment-estimate" class="label-modern">Link to Estimate (Optional)</label>
                   <select id="payment-estimate" v-model="paymentForm.estimateId" @change="handleEstimateSelection" class="input-modern input-modern--select" :disabled="!paymentForm.customerId || loadingRelated">
                      <option :value="null">-- Select Estimate --</option>
                      <option v-for="estimate in estimates" :key="estimate.value" :value="estimate.value">{{ estimate.label }}</option>
                   </select>
                 </div>

                 <div>
                   <label for="payment-technician" class="label-modern">Technician</label>
                   <select id="payment-technician" v-model="paymentForm.employeeId" class="input-modern input-modern--select" :disabled="loadingRelated">
                      <option :value="null">-- Select Technician --</option>
                      <option v-for="tech in technicians" :key="tech.value" :value="tech.value">{{ tech.label }}</option>
                   </select>
                 </div>

                 <!-- Notes Section -->
                 <div class="sm:col-span-2">
                   <label for="payment-notes" class="label-modern">Notes (Optional)</label>
                   <textarea id="payment-notes" v-model="paymentForm.notes" rows="3" class="input-modern" placeholder="Add any payment notes here"></textarea>
                 </div>

              </div>

            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading || loadingRelated">
                <span v-if="loading">Saving...</span>
                <span v-else>{{ isEditing ? 'Update Payment' : 'Add Payment' }}</span>
              </button>
              <button @click="closeModal" type="button" class="btn-secondary-modern w-full sm:w-auto" :disabled="loading">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Re-use styles from View.vue or global styles if available */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern:disabled {
    @apply bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-70;
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
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.modal-content-modern {
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full p-6 sm:p-8; /* Base width, max-width set inline */
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content-modern,
.modal-fade-leave-active .modal-content-modern {
  transition: all 0.3s ease;
}
.modal-fade-enter-from .modal-content-modern,
.modal-fade-leave-to .modal-content-modern {
   transform: translateY(20px) scale(0.98);
   opacity: 0;
}
/* Custom scrollbar for modal content */
.modal-content-modern .overflow-y-auto::-webkit-scrollbar { width: 6px; height: 6px; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-700/50; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
</style>