<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                {{ title || 'Create New Task' }}
              </DialogTitle>
              <form @submit.prevent="saveTask" class="mt-4 space-y-4">
                 <div>
                    <label for="task-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title:</label>
                    <input
                        id="task-title"
                        v-model="taskForm.title"
                        type="text"
                        required
                        class="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        placeholder="Enter task title"
                    />
                 </div>
                 <div>
                    <label for="task-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</label>
                    <textarea
                        id="task-description"
                        v-model="taskForm.description"
                        rows="4"
                        class="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        placeholder="Enter task details..."
                    ></textarea>
                 </div>
                 <div>
                    <label for="task-assignee" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To: (Optional)</label>
                    <select
                        id="task-assignee"
                        v-model="taskForm.assigneeId"
                        class="form-select w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        <option value="">-- Unassigned --</option>
                        <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                            {{ employee.firstName }} {{ employee.lastName }}
                        </option>
                    </select>
                    <p v-if="isFetchingEmployees" class="text-xs text-gray-500 mt-1">Loading employees...</p>
                    <p v-if="fetchEmployeesError" class="text-xs text-red-500 mt-1">{{ fetchEmployeesError }}</p>
                 </div>
                 <div>
                    <label for="task-due-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date: (Optional)</label>
                    <date-picker
                        v-model:value="taskForm.dueDate"
                        type="date"
                        format="YYYY-MM-DD"
                        placeholder="Select due date"
                        input-class="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        :disabled-date="disablePastDates"
                        value-type="format"
                    />
                 </div>

                 <!-- Hidden field for related customerId if needed -->
                 <input type="hidden" v-model="taskForm.customerId" />

                 <div class="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button type="button" class="btn-secondary-modern" @click="closeModal">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn-primary-modern"
                      :disabled="!taskForm.title"
                    >
                      Save Task
                    </button>
                 </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import 'vue-datepicker-next/locale/en';
import axios from 'axios'; // Import axios
import { useUserStore } from "@/stores/UserStore"; // Import user store for websiteId

const userStore = useUserStore();

const props = defineProps({
  isOpen: Boolean,
  initialTaskData: { // Used to pre-fill form (e.g., from an alert)
    type: Object,
    default: () => ({ title: '', description: '', customerId: null })
  },
  title: {
    type: String,
    default: 'Create New Task',
  }
});

const emit = defineEmits(['update:isOpen', 'save-task']);

const taskForm = ref({
  title: '',
  description: '',
  assigneeId: '',
  dueDate: null,
  customerId: null, // To link task to customer
});

const employees = ref([]);
const isFetchingEmployees = ref(false);
const fetchEmployeesError = ref(null);

// Fetch employees when component mounts (or modal opens)
async function fetchEmployees() {
  if (employees.value.length > 0) return; // Don't refetch if already loaded

  isFetchingEmployees.value = true;
  fetchEmployeesError.value = null;
  try {
    // Assuming websiteId is needed for context
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    employees.value = response.data.employees || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    fetchEmployeesError.value = "Failed to load employees.";
  } finally {
    isFetchingEmployees.value = false;
  }
}

// Initialize form when modal opens or initial data changes
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    taskForm.value = {
        title: props.initialTaskData?.title || '',
        description: props.initialTaskData?.description || '',
        assigneeId: props.initialTaskData?.assigneeId || '',
        dueDate: props.initialTaskData?.dueDate || null,
        customerId: props.initialTaskData?.customerId || null,
    };
    fetchEmployees(); // Fetch employees when modal opens
  }
}, { immediate: true });

watch(() => props.initialTaskData, (newVal) => {
    if (props.isOpen && newVal) {
         taskForm.value = { ...taskForm.value, ...newVal };
    }
}, { deep: true });


function closeModal() {
  emit('update:isOpen', false);
}

function saveTask() {
  // Basic validation passed via :disabled and required attribute
  emit('save-task', { ...taskForm.value });
  closeModal();
}

// Helper to disable past dates in the calendar view
const disablePastDates = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today
  return date < today;
};

</script>

<style>
/* Optional: Add custom styling for the datepicker if needed */
.mx-datepicker {
    width: 100% !important;
}
</style>