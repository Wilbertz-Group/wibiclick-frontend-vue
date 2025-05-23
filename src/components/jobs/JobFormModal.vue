// wibiclick-frontend-vue/src/components/jobs/JobFormModal.vue
<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faMagic } from '@fortawesome/free-solid-svg-icons'; // Added faCheck, faMagic

library.add(faCheck, faMagic); // Register icons used in this component

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // Pre-fill data
    type: Object,
    default: () => ({}),
  },
  jobData: { // For editing existing job
    type: Object,
    default: null,
  },
  // Add technicians prop if fetching in parent
  // technicians: {
  //   type: Array,
  //   required: true,
  // }
});

const emit = defineEmits(['update:modelValue', 'job-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false); // Loading state for submission
const technicians = ref([]); // Fetch technicians locally for now
const suggestedTechnicians = ref([]); // State for AI suggestions
const isSuggestingTechnician = ref(false); // Loading state for suggestions
const suggestionError = ref(null); // Error state for suggestions

// --- Form State ---
const jobForm = reactive({
  id: '', // Will be empty for new jobs
  customerId: '',
  name: '',
  jobStatus: 'scheduled', // Default status
  callout: 'R350', // Default callout
  location: '',
  address: '',
  phone: '',
  slotStart: '',
  slotTime: '1hr', // Default duration
  employeeId: '',
  to_do: '',
  issue: '',
  notify: false,
});

const JOB_STATUSES = [ // Keep statuses needed for add/edit
  'scheduled', 'quoting', 'quoted', 'accepted', 'cancelled', 'no parts',
  'pending', 'invoiced', 'done', 'paid', 'to order parts', 'parts ordered',
  'parts arrived', 'parts installed', 'parts paid', 'parts not paid',
  'parts not installed', 'parts not ordered', 'parts not available',
  'parts not needed', 'parts not found', 'follow-up', 'waiting for price',
  'waiting for parts', 'waiting for customer', 'waiting for payment'
];

const isEditing = computed(() => !!jobForm.id); // Determine if editing based on ID

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
  // Optional: Delay reset slightly for animation if needed
  // setTimeout(resetJobForm, 300);
};

const resetJobForm = () => {
  Object.assign(jobForm, {
    id: '', customerId: '', name: '', jobStatus: 'scheduled', callout: 'R350',
    location: '', address: '', phone: '', slotStart: '', slotTime: '1hr',
    employeeId: '', to_do: '', issue: '', notify: false
  });
};

const prefillForm = (customer) => {
  resetJobForm(); // Start fresh
  if (customer && customer.id) {
    jobForm.customerId = customer.id;
    jobForm.name = customer.name || '';
    jobForm.phone = customer.phone || '';
    jobForm.address = customer.address || '';
    jobForm.location = customer.location || ''; // Assuming customer might have location
    jobForm.issue = customer.message || ''; // Use customer message as initial issue
    // Set default slotStart to tomorrow 9 AM for convenience?
    jobForm.slotStart = moment().add(1, 'day').hour(9).minute(0).second(0).format('YYYY-MM-DDTHH:mm');
  }

  // If editing, populate with existing job data
  if (props.jobData) {
    Object.assign(jobForm, {
      id: props.jobData.id,
      customerId: props.jobData.customer.id,
      // Remove name from here to ensure we always use customer name
      jobStatus: props.jobData.jobStatus || 'scheduled',
      callout: props.jobData.callout || 'R350',
      location: props.jobData.location || '',
      address: props.jobData.address || '', // Use job address if available, fallback to customer address
      phone: props.jobData.phone || '', // Use job phone if available, fallback to customer phone
      slotStart: props.jobData.slotStart ? moment(props.jobData.slotStart).format('YYYY-MM-DDTHH:mm') : '',
      slotTime: props.jobData.slotTime || '1hr',
      employeeId: props.jobData.employee.id || '',
      to_do: props.jobData.to_do || '',
      issue: props.jobData.issue || '',
      notify: props.jobData.notify || false, // Assuming notify is a boolean
    });
    // Ensure customer details are always used
    if (customer && customer.id) {
        // Always use customer name
        jobForm.name = customer.name || '';
        // For other fields, prioritize job data if available
        jobForm.phone = jobForm.phone || customer.phone || '';
        jobForm.address = jobForm.address || customer.address || '';
        jobForm.location = jobForm.location || customer.location || '';
    }
  }
};

const submitJob = async () => {
  loading.value = true;
  try {
    const jobData = {
      ...jobForm,
      websiteId: userStore.currentWebsite,
      slotStart: jobForm.slotStart ? moment(jobForm.slotStart).toISOString() : null,
      // Ensure customerId is set if not editing (it should be from prefill)
      customerId: jobForm.customerId || props.customerData?.id,
    };

    // Backend endpoint handles create vs update based on presence/absence of jobData.id
    const url = `add-job?id=${userStore.currentWebsite}`;
    await axios.post(url, jobData);

    toast.success(isEditing.value ? 'Job updated successfully' : 'Job added successfully');
    emit('job-saved'); // Notify parent
    closeModal();
  } catch (error) {
    // Removed console.error
    toast.error(`Error submitting job: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

const fetchTechnicians = async () => {
  // Fetch technicians if not passed as prop
  if (!userStore.currentWebsite) return;
  try {
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    technicians.value = response.data.employees || [];
  } catch (error) {
    // Removed console.error
    // toast.error('Error fetching technicians'); // Optional
  }
};

async function suggestTechnician() {
  // Removed console.log
  isSuggestingTechnician.value = true;
  suggestionError.value = null;
  suggestedTechnicians.value = []; // Clear previous suggestions

  try {
    // Prepare context for the backend
    const context = {
      customerId: props.customerData?.id,
      issueDescription: jobForm.issue,
      // TODO: Determine appliance type if relevant/available.
      // This could be achieved if:
      // 1. The job form included an appliance selection field.
      // 2. The jobData prop (when editing) reliably contained linked appliance info.
      // 3. We could reliably parse the appliance type from jobForm.issue.
      // For now, sending null as the backend should handle its absence.
      applianceType: null,
      // Send slot start and time for availability checking
      slotStart: jobForm.slotStart ? moment(jobForm.slotStart).toISOString() : null,
      slotTime: jobForm.slotTime,
      // Backend will fetch available technicians and customer history
    };

    // Actual API call
    // Assuming websiteId is needed as a query param for backend routing/auth
    const response = await axios.post(`jobs/match-technician?id=${userStore.currentWebsite}`, context);

    // Assuming backend returns { recommendations: { primaryRecommendation: {...}, alternatives: [...] } }
    const recommendations = response.data.recommendations;

    if (recommendations?.primaryRecommendation) {
        // Store suggestions (adjust structure as needed)
        suggestedTechnicians.value = [
            { technician: recommendations.primaryRecommendation, isPrimary: true },
            ...(recommendations.alternatives || [])
        ];

        // Display suggestion (e.g., via toast) and maybe pre-select
        const primary = recommendations.primaryRecommendation;
        toast.success(`Suggested: ${primary.technicianName} (Reason: ${primary.reasoning?.join(', ') || 'AI Match'})`);

        // Optional: Automatically select the primary suggestion
        // jobForm.employeeId = primary.technicianId;
    } else {
         toast.warning("No suitable technician suggestion found.");
         suggestedTechnicians.value = []; // Ensure it's empty
    }

  } catch (error) {
    // Removed console.error
    suggestionError.value = error.response?.data?.message || error.message || "Failed to get suggestion.";
    toast.error(`Error suggesting technician: ${suggestionError.value}`);
  } finally {
    isSuggestingTechnician.value = false;
  }
}

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, always prefill with customer data first.
    // prefillForm will handle checking props.jobData internally for editing.
    prefillForm(props.jobData || props.customerData);

    // Fetch technicians if needed
    if (technicians.value.length === 0) {
       fetchTechnicians();
    }
  } else {
    // Optional: Reset form when modal closes if not handled by closeModal delay
    // resetJobForm();
  }
});

// --- Lifecycle ---
// onMounted(() => {
//   // Fetch technicians initially if component might be rendered hidden
//   fetchTechnicians();
// });

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
            {{ isEditing ? 'Edit Job Details' : 'Add New Job' }}
            <span v-if="!isEditing && customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitJob" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2"> 
              <div>
                <label for="job-name" class="label-modern">Customer Name</label>
                <input type="text" id="job-name" v-model="jobForm.name" required class="input-modern" />
              </div>
              <div>
                <label for="job-status" class="label-modern">Job Status</label>
                <select id="job-status" v-model="jobForm.jobStatus" required class="input-modern input-modern--select">
                  <option v-for="status in JOB_STATUSES" :key="status" :value="status">{{ status }}</option>
                </select>
              </div>
              <div>
                <label for="job-callout" class="label-modern">Callout Fee</label>
                <input type="text" id="job-callout" v-model="jobForm.callout" required class="input-modern" />
              </div>
              <div>
                <label for="job-location" class="label-modern">Location</label>
                <input type="text" id="job-location" v-model="jobForm.location" required class="input-modern" />
              </div>
              <div>
                <label for="job-address" class="label-modern">Customer Address</label>
                <input type="text" id="job-address" v-model="jobForm.address" required class="input-modern" />
              </div>
              <div>
                <label for="job-phone" class="label-modern">Customer Phone</label>
                <input type="tel" id="job-phone" v-model="jobForm.phone" required class="input-modern" />
              </div>
              <div>
                <label for="job-slotStart" class="label-modern">Job Start Date</label>
                <input type="datetime-local" id="job-slotStart" v-model="jobForm.slotStart" required class="input-modern" />
              </div>
              <div>
                <label for="job-slotTime" class="label-modern">Job Duration</label>
                <select id="job-slotTime" v-model="jobForm.slotTime" required class="input-modern input-modern--select">
                  <option v-for="duration in ['1hr', '2hrs', '3hrs', '4hrs']" :key="duration" :value="duration">{{ duration }}</option>
                </select>
              </div>
              <div>
                <label for="job-employeeId" class="label-modern">Assign Employee</label>
                <select id="job-employeeId" v-model="jobForm.employeeId" required class="input-modern input-modern--select">
                  <option value="">Select Technician</option>
                  <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                    {{ tech.firstName }} {{ tech.lastName }}
                  </option>
                </select>
                <button
                   type="button"
                   @click="suggestTechnician"
                   class="btn-secondary-modern text-xs mt-1.5 py-1 px-2"
                   :disabled="isSuggestingTechnician"
                   aria-label="Suggest technician based on AI matching"
                 >
                   <font-awesome-icon icon="magic" class="mr-1 h-3 w-3" :class="{ 'fa-spin': isSuggestingTechnician }" />
                   Suggest
                </button>
                <!-- Display Suggestions -->
                <div v-if="suggestionError" class="text-xs text-red-500 mt-1">Error: {{ suggestionError }}</div>
                <ul v-if="suggestedTechnicians.length > 0" class="mt-2 text-xs space-y-1.5 border-t border-gray-200 dark:border-gray-700/50 pt-2">
                   <!-- Improved display for suggestions -->
                   <li v-for="(suggestion, index) in suggestedTechnicians"
                       :key="suggestion.technician?.technicianId || suggestion.technicianId || index"
                       :class="[
                         'flex justify-between items-center p-2 rounded-md border',
                         (suggestion.technician?.technicianId || suggestion.technicianId) === jobForm.employeeId
                           ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                           : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50',
                         suggestion.isPrimary ? 'border-l-4 border-l-indigo-500 pl-1.5' : '' // Extra indicator for primary
                       ]"
                   >
                      <div class="flex-grow mr-2">
                        <div class="flex items-center">
                           <!-- Checkmark for selected -->
                           <FontAwesomeIcon
                               v-if="(suggestion.technician?.technicianId || suggestion.technicianId) === jobForm.employeeId"
                               icon="check"
                               class="w-3 h-3 mr-1.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                           />
                           <strong v-if="suggestion.isPrimary" class="text-indigo-600 dark:text-indigo-400 mr-1 flex-shrink-0">[Primary]</strong>
                           <!-- Access name/id based on structure -->
                           <span class="font-medium text-gray-800 dark:text-gray-200">{{ suggestion.technician?.technicianName || suggestion.technicianName }}</span>
                        </div>
                        <span v-if="suggestion.technician?.reasoning" class="block text-gray-500 dark:text-gray-400 text-xxs italic mt-0.5">({{ suggestion.technician.reasoning.join(', ') }})</span>
                      </div>
                      <button
                        type="button"
                        @click="jobForm.employeeId = suggestion.technician?.technicianId || suggestion.technicianId"
                        :class="[
                           'btn-ghost-modern text-xxs py-0.5 px-1.5 flex-shrink-0',
                           (suggestion.technician?.technicianId || suggestion.technicianId) === jobForm.employeeId ? 'opacity-50 cursor-default' : '' // Dim if already selected
                        ]"
                        :disabled="(suggestion.technician?.technicianId || suggestion.technicianId) === jobForm.employeeId"
                        title="Select this technician"
                      >
                        {{ (suggestion.technician?.technicianId || suggestion.technicianId) === jobForm.employeeId ? 'Selected' : 'Select' }}
                      </button>
                   </li>
                </ul>
              </div>
              <div>
                <label for="job-to_do" class="label-modern">To Do (Optional)</label>
                <input type="text" id="job-to_do" v-model="jobForm.to_do" class="input-modern" />
              </div>
              <div class="sm:col-span-2">
                <label for="job-issue" class="label-modern">Issue / Description</label>
                <textarea id="job-issue" v-model="jobForm.issue" required rows="4" class="input-modern"></textarea>
              </div>
              <div class="sm:col-span-2">
                <label class="flex items-center">
                  <input type="checkbox" v-model="jobForm.notify" class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600">
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Notify Employee upon creation/update</span>
                </label>
              </div>
            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                {{ loading ? 'Saving...' : (isEditing ? 'Update Job' : 'Add Job') }}
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
/* Re-use styles from Jobs.vue or global styles */
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
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:w-full p-6 sm:p-8;
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