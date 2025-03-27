<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TipTapEditor from '@/components/editor/TipTapEditor.vue'; // Import TipTapEditor

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // To link report to customer
    type: Object,
    default: () => ({}),
  },
  insuranceData: { // For editing existing report
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'insurance-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false);

// --- Form State ---
const insuranceForm = reactive({
  id: '', // Will be empty for new reports
  customerId: '',
  number: '', // Report number
  status: 'pending', // Default status
  report_date: moment().format('YYYY-MM-DD'), // Date of report creation/update
  notes: '', // Changed from details to notes
  // Add other relevant fields like provider, policy_no, claim_no etc. if needed
});

// Match statuses from Insurance.vue and old Edit.vue
const INSURANCE_STATUSES = ['pending', 'processing', 'paid', 'accepted', 'sent', 'rejected']; // Added rejected

const isEditing = computed(() => !!insuranceForm.id);

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetInsuranceForm = () => {
  Object.assign(insuranceForm, {
    id: '',
    customerId: '',
    number: '',
    status: 'pending',
    report_date: moment().format('YYYY-MM-DD'),
    notes: '', // Changed from details
  });
};

const prefillForm = (customer) => {
  resetInsuranceForm();

  if (customer && customer.id) {
    insuranceForm.customerId = customer.id;
  }

  // If editing, populate with existing insurance data
  if (props.insuranceData) {
    Object.assign(insuranceForm, {
      id: props.insuranceData.id,
      customerId: props.insuranceData.customerId || (customer && customer.id) || '',
      number: props.insuranceData.number || '',
      status: props.insuranceData.status || 'pending',
      // Use issuedAt from old data if available, otherwise createdAt, otherwise now
      report_date: props.insuranceData.issuedAt ? moment(props.insuranceData.issuedAt).format('YYYY-MM-DD') : (props.insuranceData.createdAt ? moment(props.insuranceData.createdAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')),
      notes: props.insuranceData.notes || props.insuranceData.details || '', // Use notes first, fallback to details
    });
  } else {
      // Fetch next report number for new reports? (Optional, depends on backend)
      // fetchNextReportNumber();
  }
};

// Optional: Function to get the next report number
// async function fetchNextReportNumber() { ... }

const submitInsuranceReport = async () => {
  loading.value = true;
  try {
    // Construct payload similar to old Edit.vue
    const payload = {
      id: isEditing.value ? insuranceForm.id : undefined, // Include ID only if editing
      number: insuranceForm.number,
      status: insuranceForm.status,
      customerId: insuranceForm.customerId,
      notes: insuranceForm.notes, // Use notes instead of details
      issuedAt: moment(insuranceForm.report_date).toISOString(), // Send date as issuedAt
      name: 'Insurance Report', // Default name as in old Edit.vue
      employeeId: props.insuranceData?.employeeId || userStore.user?.id || '', // Get from existing data or current user
      websiteId: props.insuranceData?.websiteId || userStore.currentWebsite || '', // Get from existing data or current website
      items: props.insuranceData?.items || [], // Get from existing data or default to empty array
    };

    // Use POST for both add and update, matching old Edit.vue
    const endpoint = `add-insurance-report?id=${userStore.currentWebsite}`;
    const method = 'post';

    const response = await axios({ method, url: endpoint, data: payload });

    toast.success(response.data.message || 'Insurance report saved successfully');
    emit('insurance-saved');
    closeModal();
  } catch (error) {
    console.error("Error submitting insurance report:", error);
    toast.error(`Error submitting report: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form
    prefillForm(props.customerData);
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
        <div class="modal-content-modern">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Insurance Report' : 'Add New Insurance Report' }}
            <span v-if="customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitInsuranceReport" class="space-y-4">
            <div class="max-h-[60vh] overflow-y-auto pr-2">
              <!-- Insurance Report Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Report Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="insurance-number" class="label-modern">Report Number</label>
                    <input type="text" id="insurance-number" v-model="insuranceForm.number" class="input-modern" placeholder="e.g., CLAIM-123" />
                  </div>
                   <div>
                    <label for="insurance-date" class="label-modern">Report Date</label>
                    <input type="date" id="insurance-date" v-model="insuranceForm.report_date" required class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="insurance-status" class="label-modern">Status</label>
                    <select id="insurance-status" v-model="insuranceForm.status" required class="input-modern input-modern--select">
                      <option v-for="status in INSURANCE_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                   <div class="sm:col-span-2">
                    <label for="insurance-notes" class="label-modern">Details / Notes</label>
                    <TipTapEditor id="insurance-notes" v-model="insuranceForm.notes" placeholder="Enter details about the insurance report or claim..." class="input-modern min-h-[150px]" />
                  </div>
                  <!-- Add more fields here if needed (Provider, Policy No, Claim No, etc.) -->
                </div>
              </div>

            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                {{ loading ? 'Saving...' : (isEditing ? 'Update Report' : 'Add Report') }}
              </button>
              <button @click="closeModal" type="button" class="btn-secondary-modern w-full sm:w-auto">
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
/* Re-use styles from View.vue or global styles */
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
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6 sm:p-8; /* Adjusted max-width */
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