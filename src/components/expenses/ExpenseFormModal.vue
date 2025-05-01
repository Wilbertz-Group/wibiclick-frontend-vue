<!-- wibiclick-frontend-vue/src/components/expenses/ExpenseFormModal.vue -->
<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import  useUserStore  from "@/stores/UserStore";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import { ArrowUpTrayIcon, PhotoIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'; // Added icons

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  customerData: {
    type: Object,
    default: null,
  },
  expenseData: {
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'expense-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false); // For save operation
const loadingRelated = ref(false); // For fetching dropdown data
const processingImage = ref(false); // For n8n OCR processing
const imageProcessingError = ref(null); // Error message from n8n
const imageProcessingSuccess = ref(false); // Flag for successful OCR

// --- Image Upload State ---
const selectedFile = ref(null);
const selectedFileName = ref('');
const selectedFilePreview = ref(null); // For image preview
const dragOver = ref(false); // For dropzone styling
const latestJobTechnicianId = ref(null); // Added ref for latest job's tech
const existingImageUrl = ref(null); // Added ref for existing image URL when editing

// --- Dropdown Data ---
const employees = ref([]);
const jobs = ref([]);

// --- Form State ---
const expenseForm = reactive({
  id: '',
  customerId: '',
  amount: 0,
  date: moment().format('YYYY-MM-DD'),
  type: 'OTHER',
  description: '',
  employeeId: null,
  jobId: null,
  // We don't store the image URL here yet, backend will handle it
});

const EXPENSE_TYPES = ['FUEL', 'PARTS', 'BONUS', 'OTHER'];

const isEditing = computed(() => !!expenseForm.id);
const n8nWebhookUrl = 'https://n8n.wilbertzgroup.com/webhook/process-expense-image'; // Configurable?

// --- Fetching Logic ---
async function fetchEmployees() {
  // ... (existing code - unchanged)
  if (employees.value.length > 0 || !userStore.currentWebsite) return; // Avoid refetching
  loadingRelated.value = true;
  try {
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    employees.value = response.data.employees.map(employee => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`
    }));
  } catch (error) {
    // Removed console.error
    toast.error("Error fetching employees");
  } finally {
    // Keep loadingRelated true until jobs are also fetched if needed
  }
}

async function fetchJobsForCustomer(customerId) {
  // ... (existing code - unchanged)
  jobs.value = [{ value: null, label: 'No Job' }]; // Start with default
  if (!customerId || !userStore.currentWebsite) {
      loadingRelated.value = false; // Ensure loading stops if no customer
      return;
  }
  // loadingRelated is already true from fetchEmployees or set here
  loadingRelated.value = true;
  latestJobTechnicianId.value = null; // Reset before fetching
  try {
    // Assuming the backend endpoint returns jobs with employeeId and slotStart
    const response = await axios.get(`jobs-for-contact?id=${userStore.currentWebsite}&contactId=${customerId}`);
    const rawJobs = response.data.jobs || [];

    // Sort raw jobs by date descending (handle null dates)
    rawJobs.sort((a, b) => {
        const dateA = a.slotStart ? new Date(a.slotStart) : null;
        const dateB = b.slotStart ? new Date(b.slotStart) : null;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // Put null dates last
        if (!dateB) return -1; // Put null dates last
        return dateB - dateA; // Sort descending
    });

    // Map to dropdown format
    const customerJobsForDropdown = rawJobs.map(job => ({
      value: job.id,
      label: `Job #${job.jobStatus || job.id.substring(0, 5)} - ${job.slotStart ? moment(job.slotStart).format('YYYY-MM-DD') : 'No Date'}`
    }));

    jobs.value = [{ value: null, label: 'No Job' }, ...customerJobsForDropdown]; // Add fetched jobs after 'No Job'

    // Find the latest job (first one after sorting) and its technician
    if (rawJobs.length > 0) {
        const latestJob = rawJobs[0];
        // Removed console.log
        // Access nested employee ID
        if (latestJob.employee && latestJob.employee.id) {
            latestJobTechnicianId.value = latestJob.employee.id;
            // Removed console.log
        } else {
            // Removed console.log
        }
        // We'll pre-select the job ID in prefillForm
    }

  } catch (error) {
    // Removed console.error
    toast.error("Error fetching jobs for customer");
  } finally {
    loadingRelated.value = false; // Finish loading related data
  }
}


// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetImageState = () => {
    selectedFile.value = null;
    selectedFileName.value = '';
    selectedFilePreview.value = null;
    processingImage.value = false;
    imageProcessingError.value = null;
    imageProcessingSuccess.value = false;
    dragOver.value = false;
};

const resetExpenseForm = () => {
  Object.assign(expenseForm, {
    id: '',
    customerId: '',
    amount: 0,
    date: moment().format('YYYY-MM-DD'),
    type: 'OTHER',
    description: '',
    employeeId: null,
    jobId: null,
  });
  jobs.value = [{ value: null, label: 'No Job' }];
  existingImageUrl.value = null; // Clear existing image URL
  resetImageState(); // Also reset image state
};

const prefillForm = async (customer, expense) => {
  resetExpenseForm(); // Resets image state too
  await fetchEmployees();

  let effectiveCustomerId = '';
  if (expense && expense.customerId) {
      effectiveCustomerId = expense.customerId;
  } else if (customer && customer.id) {
      effectiveCustomerId = customer.id;
  }
  expenseForm.customerId = effectiveCustomerId;

  if (effectiveCustomerId) {
      await fetchJobsForCustomer(effectiveCustomerId);
  } else {
      loadingRelated.value = false;
  }

  if (expense) {
    Object.assign(expenseForm, {
      id: expense.id,
      amount: expense.amount || 0,
      date: expense.date ? moment(expense.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      type: expense.type || 'OTHER',
      description: expense.description || '',
      employeeId: expense.employeeId || null,
      jobId: expense.jobId || null,
    });
    // Set existing image URL if editing and URL exists
    if (expense && expense.imageUrl) {
        existingImageUrl.value = expense.imageUrl;
    }
    // Note: We don't prefill the image here as it's for OCR on *new* uploads within the modal session
  } else if (customer && effectiveCustomerId) {
      // If adding NEW expense for a customer, try pre-selecting latest job and tech
      // Removed console.log
      if (jobs.value.length > 1) { // Check if any jobs were loaded besides "No Job"
          const latestJobOption = jobs.value[1]; // The first actual job after sorting
          expenseForm.jobId = latestJobOption.value;
          // Removed console.log
      } else {
          // Removed console.log
      }

      // Removed console.log
      if (latestJobTechnicianId.value) {
          const technicianExists = employees.value.some(emp => emp.value === latestJobTechnicianId.value);
          // Removed console.log
          if (technicianExists) {
               expenseForm.employeeId = latestJobTechnicianId.value;
               // Removed console.log
          } else {
              console.warn(`Latest job technician (${latestJobTechnicianId.value}) not found in employee list.`);
              // Optionally fetch the specific employee if needed, or leave null
          }
      } else {
           // Removed console.log
      }
  }
};

// --- Image Handling ---
const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    setFile(file);
  }
  // Reset input value to allow selecting the same file again
  if (event.target) event.target.value = '';
};

const handleDrop = (event) => {
  dragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    setFile(file);
  }
};

const setFile = (file) => {
    // Basic validation (type, size) - adjust as needed
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP).');
        return;
    }
    if (file.size > maxSize) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
    }

    selectedFile.value = file;
    selectedFileName.value = file.name;
    imageProcessingError.value = null; // Clear previous errors
    imageProcessingSuccess.value = false;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedFilePreview.value = e.target?.result;
    };
    reader.readAsDataURL(file);

    // Automatically trigger processing
    processImage();
};

const removeFile = () => {
    resetImageState();
};

const processImage = async () => {
    if (!selectedFile.value) return;

    processingImage.value = true;
    imageProcessingError.value = null;
    imageProcessingSuccess.value = false;
    const formData = new FormData();
    formData.append('file', selectedFile.value); // n8n expects the file under the key 'file'

    try {
        const response = await axios.post(n8nWebhookUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Assuming n8n returns JSON like: { amount: 123.45, date: '2024-03-30', description: '...', type: 'FUEL' }
        const data = response.data.output; // Adjust based on actual n8n output structure

        // --- Apply OCR results to form ---
        let changesMade = false;
        if (data.amount && !isNaN(parseFloat(data.amount))) {
            expenseForm.amount = parseFloat(data.amount);
            changesMade = true;
        }
        if (data.date && moment(data.date, moment.ISO_8601, true).isValid()) { // Check if date is valid ISO or common format
             expenseForm.date = moment(data.date).format('YYYY-MM-DD');
             changesMade = true;
        } else if (data.date && moment(data.date, 'YYYY-MM-DD', true).isValid()) {
             expenseForm.date = data.date; // Already in correct format
             changesMade = true;
        }
        if (data.description && typeof data.description === 'string') {
            expenseForm.description = data.description.trim();
            changesMade = true;
        }
        if (data.type && typeof data.type === 'string' && EXPENSE_TYPES.includes(data.type.toUpperCase())) {
            expenseForm.type = data.type.toUpperCase();
            changesMade = true;
        } else if (data.type) {
            // If type is suggested but not exact match, maybe add to description?
            if (expenseForm.description) {
                 expenseForm.description += ` (Suggested Type: ${data.type})`;
            } else {
                 expenseForm.description = `Suggested Type: ${data.type}`;
            }
            changesMade = true; // Still count as change
        }

        if (changesMade) {
            toast.success('Expense details extracted from image!');
            imageProcessingSuccess.value = true;
        } else {
            toast.info('Could not extract details from image, or details match current form.');
            imageProcessingError.value = 'No details extracted or matched.'; // Set a mild error/info state
        }

    } catch (error) {
        // Removed console.error
        const errorMessage = error.response?.data?.message || error.message || 'Failed to process image.';
        imageProcessingError.value = `OCR Error: ${errorMessage}`;
        toast.error(imageProcessingError.value);
    } finally {
        processingImage.value = false;
    }
};


// --- Form Submission ---
const submitExpense = async () => {
  loading.value = true;
  try {
    // Use FormData ONLY if there's a file to upload
    const useFormData = !!selectedFile.value;
    let payload;
    let headers = { 'Content-Type': 'application/json' }; // Default

    const expenseDetails = {
      amount: parseFloat(expenseForm.amount),
      date: moment(expenseForm.date).toISOString(),
      type: expenseForm.type,
      description: expenseForm.description,
      // Only include customerId if a specific job is selected
      customerId: expenseForm.jobId ? expenseForm.customerId : undefined,
      employeeId: expenseForm.employeeId,
      jobId: expenseForm.jobId || undefined,
    };

    // --- Validation ---
    if (!expenseDetails.employeeId) {
        toast.error("Employee is required."); loading.value = false; return;
    }
    if (!expenseDetails.type) {
        toast.error("Expense Type is required."); loading.value = false; return;
    }
    if (!expenseDetails.description) {
        toast.error("Description is required."); loading.value = false; return;
    }
    if (isNaN(expenseDetails.amount) || expenseDetails.amount < 0) {
        toast.error("Valid Amount is required."); loading.value = false; return;
    }
    // --- End Validation ---


    if (useFormData) {
        payload = new FormData();
        // Append expense data as JSON string under a specific key (e.g., 'data')
        // The backend needs to expect this structure
        payload.append('data', JSON.stringify(expenseDetails));
        payload.append('file', selectedFile.value); // Append the actual file
        // Let the browser set the Content-Type for FormData
        headers = {}; // Remove explicit Content-Type
    } else {
        payload = expenseDetails; // Send as JSON
    }

    let endpoint = `add-expense?id=${userStore.currentWebsite}`;
    let method = 'post';

    if (isEditing.value) {
      // If editing, include ID. Decide if image upload is allowed during edit.
      // For now, assume editing might replace the image if a new one is selected.
      const editPayload = { ...expenseDetails, id: expenseForm.id };
      if (useFormData) {
          payload = new FormData();
          payload.append('data', JSON.stringify(editPayload));
          payload.append('file', selectedFile.value);
          headers = {};
      } else {
          payload = editPayload; // Send JSON
          headers = { 'Content-Type': 'application/json' };
      }
      method = 'put';
      endpoint = `expense/${expenseForm.id}?id=${userStore.currentWebsite}`;
    }

    const response = await axios({
        method,
        url: endpoint,
        data: payload,
        headers: headers // Pass dynamic headers
    });

    toast.success(response.data.message || 'Expense saved successfully');
    emit('expense-saved');
    closeModal();
  } catch (error) {
    // Removed console.error
    // Check if backend sent specific file upload error
    const backendError = error.response?.data?.message || error.message;
    toast.error(`Error submitting expense: ${backendError}`);
  } finally {
    loading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    prefillForm(props.customerData, props.expenseData);
  } else {
      resetExpenseForm();
  }
});

watch(() => props.expenseData, (newExpenseData) => {
    if (props.modelValue) {
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
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&amp;#8203;</span>
        <!-- Modal panel -->
        <div class="modal-content-modern sm:max-w-xl"> <!-- Adjusted width -->
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Expense' : 'Add New Expense' }}
            <span v-if="customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitExpense" class="space-y-4">
            <div class="max-h-[65vh] overflow-y-auto pr-2 space-y-5">

              <!-- Image Upload Section -->
              <div class="space-y-2">
                 <!-- Dynamically change label based on editing state and if image exists -->
                <label class="label-modern">{{ isEditing && existingImageUrl ? 'Receipt Image' : 'Upload Receipt (Optional)' }}</label>
                <div
                  :class="[
                    'mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-150 ease-in-out',
                    dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  ]"
                  @dragover.prevent="dragOver = true"
                  @dragleave.prevent="dragOver = false"
                  @drop.prevent="handleDrop"
                >
                  <!-- Show Existing Image when editing and no new file selected -->
                   <div v-if="isEditing && existingImageUrl && !selectedFile" class="w-full text-left">
                     <div class="flex items-center space-x-3">
                       <a :href="existingImageUrl" target="_blank" rel="noopener noreferrer" class="flex-shrink-0" title="Click to view larger">
                         <img :src="existingImageUrl" alt="Existing Receipt" class="h-16 w-16 object-cover rounded-md border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity">
                       </a>
                       <div class="flex-grow min-w-0">
                         <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Current receipt image.</p>
                         <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Drop a new file or <label for="file-upload-replace" class="cursor-pointer font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">click here</label> to replace.</p>
                       </div>
                       <!-- Hidden input still needed for click-to-replace, use different ID -->
                       <input id="file-upload-replace" name="file-upload-replace" type="file" class="sr-only" @change="handleFileChange" accept="image/png, image/jpeg, image/gif, image/webp">
                     </div>
                   </div>

                  <!-- Show Upload Prompt when adding new OR editing without existing image -->
                  <div class="space-y-1 text-center" v-else-if="!selectedFile">
                    <PhotoIcon class="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                    <div class="flex text-sm text-gray-600 dark:text-gray-400">
                      <label for="file-upload" class="relative cursor-pointer bg-white dark:bg-transparent rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" class="sr-only" @change="handleFileChange" accept="image/png, image/jpeg, image/gif, image/webp">
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
                  </div>

                  <!-- Show New File Preview and Status (when a new file IS selected) -->
                  <div v-if="selectedFile" class="w-full text-left">
                    <div class="flex items-start space-x-3">
                      <img v-if="selectedFilePreview" :src="selectedFilePreview" alt="Preview" class="h-16 w-16 object-cover rounded-md flex-shrink-0">
                      <PhotoIcon v-else class="h-16 w-16 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <div class="flex-grow min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ selectedFileName }}</p>
                         <!-- Indicate replacement if applicable -->
                         <p v-if="isEditing && existingImageUrl" class="text-xs text-orange-500 dark:text-orange-400">Will replace existing image.</p>
                        <div v-if="processingImage" class="mt-1 flex items-center space-x-2">
                           <ScaleLoader :loading="true" color="#4f46e5" height="16px" width="3px" />
                           <span class="text-xs text-indigo-600 dark:text-indigo-400">Processing image...</span>
                        </div>
                         <div v-if="imageProcessingSuccess && !processingImage" class="mt-1 flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                           <CheckCircleIcon class="h-4 w-4" />
                           <span>OCR successful, form updated.</span>
                        </div>
                        <div v-if="imageProcessingError && !processingImage" class="mt-1 text-xs text-red-600 dark:text-red-400 break-words">
                           {{ imageProcessingError }}
                        </div>
                      </div>
                      <button @click="removeFile" type="button" class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-auto flex-shrink-0" :disabled="processingImage">
                        <XCircleIcon class="h-5 w-5" />
                        <span class="sr-only">Remove file</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- End Image Upload Section -->


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

                 <!-- Hidden Customer ID -->
                 <input type="hidden" v-model="expenseForm.customerId" />

              </div>

            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading || loadingRelated || processingImage">
                <span v-if="loading">Saving...</span>
                <span v-else>{{ isEditing ? 'Update Expense' : 'Add Expense' }}</span>
              </button>
              <button @click="closeModal" type="button" class="btn-secondary-modern w-full sm:w-auto" :disabled="loading || processingImage">
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