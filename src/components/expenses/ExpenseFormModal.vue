<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'; // Added

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // To link expense to customer (can be null if adding expense not from customer view)
    type: Object,
    default: null,
  },
  expenseData: { // For editing existing expense
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'expense-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false); // For save operation
const loadingRelated = ref(false); // For fetching dropdown data

// --- Dropdown Data ---
const employees = ref([]);
const jobs = ref([]); // Will hold jobs relevant to the customer

// --- Form State (aligned with Add/EditExpense.vue) ---
const expenseForm = reactive({
  id: '', // Will be empty for new expenses
  customerId: '', // Link to customer (might be prefilled)
  amount: 0,
  date: moment().format('YYYY-MM-DD'),
  type: 'OTHER', // Default expense type
  description: '',
  employeeId: null, // Added
  jobId: null,      // Added
});

const EXPENSE_TYPES = ['FUEL', 'PARTS', 'BONUS', 'OTHER']; // Match Expense.vue

const isEditing = computed(() => !!expenseForm.id);

// --- Fetching Logic ---
async function fetchEmployees() {
  if (employees.value.length > 0 || !userStore.currentWebsite) return; // Avoid refetching
  loadingRelated.value = true;
  try {
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    employees.value = response.data.employees.map(employee => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    toast.error("Error fetching employees");
  } finally {
    // Keep loadingRelated true until jobs are also fetched if needed
  }
}

async function fetchJobsForCustomer(customerId) {
  jobs.value = [{ value: null, label: 'No Job' }]; // Start with default
  if (!customerId || !userStore.currentWebsite) {
      loadingRelated.value = false; // Ensure loading stops if no customer
      return;
  }
  // loadingRelated is already true from fetchEmployees or set here
  loadingRelated.value = true;
  try {
    const response = await axios.get(`jobs-for-contact?id=${userStore.currentWebsite}&contactId=${customerId}`);
    const customerJobs = response.data.jobs.map(job => ({
      value: job.id,
      // Use more descriptive label if possible
      label: `Job #${job.jobStatus || job.id.substring(0, 5)} - ${job.slotStart ? moment(job.slotStart).format('YYYY-MM-DD') : 'No Date'}`
    })).sort((a, b) => { // Sort by date descending
        const dateA = a.label.includes('No Date') ? 0 : new Date(a.label.split(' - ')[1]);
        const dateB = b.label.includes('No Date') ? 0 : new Date(b.label.split(' - ')[1]);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
    });
    jobs.value = [...jobs.value, ...customerJobs]; // Add fetched jobs after 'No Job'
  } catch (error) {
    console.error('Error fetching jobs for customer:', error);
    toast.error("Error fetching jobs for customer");
  } finally {
    loadingRelated.value = false; // Finish loading related data
  }
}


// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetExpenseForm = () => {
  Object.assign(expenseForm, {
    id: '',
    customerId: '',
    amount: 0,
    date: moment().format('YYYY-MM-DD'),
    type: 'OTHER',
    description: '',
    employeeId: null, // Reset added field
    jobId: null,      // Reset added field
  });
  // Don't reset employees, reset jobs
  jobs.value = [{ value: null, label: 'No Job' }];
};

const prefillForm = async (customer, expense) => {
  resetExpenseForm();
  await fetchEmployees(); // Fetch employees regardless

  let effectiveCustomerId = '';
  if (expense && expense.customerId) {
      effectiveCustomerId = expense.customerId;
  } else if (customer && customer.id) {
      effectiveCustomerId = customer.id;
  }
  expenseForm.customerId = effectiveCustomerId; // Set customer ID first

  if (effectiveCustomerId) {
      await fetchJobsForCustomer(effectiveCustomerId); // Fetch jobs for the relevant customer
  } else {
      loadingRelated.value = false; // Ensure loading stops if no customer
  }


  // If editing, populate with existing expense data
  if (expense) {
    Object.assign(expenseForm, {
      id: expense.id,
      // customerId is already set above
      amount: expense.amount || 0,
      date: expense.date ? moment(expense.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      type: expense.type || 'OTHER',
      description: expense.description || '',
      employeeId: expense.employeeId || null, // Prefill added field
      jobId: expense.jobId || null,          // Prefill added field
    });
  } else if (customer) {
      // If adding new FROM customer view, customerId is set
      // Optionally pre-select employee if needed (e.g., current user)
      // expenseForm.employeeId = userStore.userId;
  }
};

const submitExpense = async () => {
  loading.value = true;
  try {
    const payload = {
      amount: parseFloat(expenseForm.amount),
      date: moment(expenseForm.date).toISOString(), // Send ISO string
      type: expenseForm.type,
      description: expenseForm.description,
      customerId: expenseForm.customerId || undefined, // Include customerId if available
      employeeId: expenseForm.employeeId, // Include employeeId
      jobId: expenseForm.jobId || undefined, // Include jobId (send undefined if null)
    };

    // Validate required fields that might be null
    if (!payload.employeeId) {
        toast.error("Employee is required.");
        loading.value = false;
        return;
    }
     if (!payload.type) {
        toast.error("Expense Type is required.");
        loading.value = false;
        return;
    }
     if (!payload.description) {
        toast.error("Description is required.");
        loading.value = false;
        return;
    }
     if (isNaN(payload.amount) || payload.amount < 0) {
        toast.error("Valid Amount is required.");
        loading.value = false;
        return;
    }


    let endpoint = `add-expense?id=${userStore.currentWebsite}`;
    let method = 'post';

    if (isEditing.value) {
      payload.id = expenseForm.id; // Include ID for update payload
      method = 'put';
      // Align endpoint with EditExpense.vue pattern
      endpoint = `expense/${expenseForm.id}?id=${userStore.currentWebsite}`;
    }

    const response = await axios({ method, url: endpoint, data: payload });

    toast.success(response.data.message || 'Expense saved successfully');
    emit('expense-saved');
    closeModal();
  } catch (error) {
    console.error("Error submitting expense:", error);
    toast.error(`Error submitting expense: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form
    // Pass both customerData and expenseData to prefill
    prefillForm(props.customerData, props.expenseData);
  } else {
      resetExpenseForm(); // Reset when closing
  }
});

// Watch for direct changes to expenseData prop while modal is open
watch(() => props.expenseData, (newExpenseData) => {
    if (props.modelValue) { // Only prefill if modal is already open
        prefillForm(props.customerData, newExpenseData);
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
        <div class="modal-content-modern sm:max-w-xl"> <!-- Adjusted width -->
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Expense' : 'Add New Expense' }}
            <span v-if="customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitExpense" class="space-y-4">
            <div class="max-h-[65vh] overflow-y-auto pr-2 space-y-5">

              <!-- Loading Indicator for related data -->
              <div v-if="loadingRelated" class="text-center py-4">
                 <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
                 <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading data...</p>
              </div>

              <!-- Expense Details Section -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="expense-type" class="label-modern">Type *</label>
                  <select id="expense-type" v-model="expenseForm.type" required class="input-modern input-modern--select">
                    <option disabled value="">-- Select Type --</option>
                    <option v-for="typeOpt in EXPENSE_TYPES" :key="typeOpt" :value="typeOpt">{{ typeOpt }}</option>
                  </select>
                </div>

                <div>
                  <label for="expense-employee" class="label-modern">Employee *</label>
                  <select id="expense-employee" v-model="expenseForm.employeeId" required class="input-modern input-modern--select" :disabled="loadingRelated">
                     <option :value="null" disabled>-- Select Employee --</option>
                     <option v-for="emp in employees" :key="emp.value" :value="emp.value">{{ emp.label }}</option>
                  </select>
                </div>

                <div>
                  <label for="expense-amount" class="label-modern">Amount *</label>
                   <div class="relative">
                     <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">R</span>
                     <input type="number" id="expense-amount" v-model="expenseForm.amount" required min="0" step="0.01" class="input-modern pl-7 text-right" />
                   </div>
                </div>

                 <div>
                  <label for="expense-date" class="label-modern">Date *</label>
                  <input type="date" id="expense-date" v-model="expenseForm.date" required class="input-modern" />
                </div>

                <div class="sm:col-span-2">
                  <label for="expense-job" class="label-modern">Link to Job (Optional)</label>
                  <select id="expense-job" v-model="expenseForm.jobId" class="input-modern input-modern--select" :disabled="loadingRelated || !expenseForm.customerId">
                     <option v-for="job in jobs" :key="job.value" :value="job.value">{{ job.label }}</option>
                  </select>
                   <p v-if="!expenseForm.customerId && !loadingRelated" class="text-xs text-gray-500 mt-1">Select a customer to link to a job.</p>
                </div>

                 <div class="sm:col-span-2">
                  <label for="expense-description" class="label-modern">Description *</label>
                  <textarea id="expense-description" v-model="expenseForm.description" rows="3" required class="input-modern" placeholder="Enter expense description"></textarea>
                </div>

                 <!-- Hidden Customer ID if needed for context, though it's in the form state -->
                 <input type="hidden" v-model="expenseForm.customerId" />

              </div>

            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading || loadingRelated">
                <span v-if="loading">Saving...</span>
                <span v-else>{{ isEditing ? 'Update Expense' : 'Add Expense' }}</span>
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
/* Re-use styles from View.vue or global styles */
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