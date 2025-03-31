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
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                {{ title || 'Schedule Message' }}
              </DialogTitle>
              <div class="mt-4 space-y-4">
                 <p v-if="messagePreview" class="text-sm text-gray-600 dark:text-gray-400 border-l-4 border-gray-300 pl-3 italic">
                    "{{ messagePreview }}"
                 </p>

                 <div>
                    <label for="schedule-datetime" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date & Time:</label>
                    <date-picker
                        v-model:value="selectedDateTime"
                        type="datetime"
                        format="YYYY-MM-DD HH:mm"
                        :show-second="false"
                        placeholder="Select date and time"
                        input-class="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        :disabled-date="disablePastDates"
                        :minute-step="5"
                        :default-value="initialDate || new Date()"
                    />
                    <!-- TODO: Add Timezone information/warning? -->
                 </div>

              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" class="btn-secondary-modern" @click="closeModal">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn-primary-modern"
                  @click="confirmSchedule"
                  :disabled="!selectedDateTime"
                >
                  Confirm Schedule
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import 'vue-datepicker-next/locale/en'; // Or your preferred locale

const props = defineProps({
  isOpen: Boolean,
  initialDate: {
    type: [Date, String, Number],
    default: null,
  },
  messagePreview: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Schedule Message',
  }
});

const emit = defineEmits(['update:isOpen', 'confirm-schedule']);

const selectedDateTime = ref(null);

// Initialize date picker when modal opens or initialDate changes
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedDateTime.value = props.initialDate ? new Date(props.initialDate) : new Date();
    // Ensure time is not in the past if initial date is today
    if (selectedDateTime.value.toDateString() === new Date().toDateString() && selectedDateTime.value < new Date()) {
        selectedDateTime.value = new Date(); // Default to now if initial time is past
    }
  }
}, { immediate: true });

watch(() => props.initialDate, (newVal) => {
    if (props.isOpen && newVal) {
        selectedDateTime.value = new Date(newVal);
         if (selectedDateTime.value.toDateString() === new Date().toDateString() && selectedDateTime.value < new Date()) {
            selectedDateTime.value = new Date();
        }
    } else if (props.isOpen) {
         selectedDateTime.value = new Date(); // Default to now if initialDate becomes null while open
    }
});


function closeModal() {
  emit('update:isOpen', false);
}

function confirmSchedule() {
  if (selectedDateTime.value) {
    // Ensure selected time is not in the past
    if (selectedDateTime.value < new Date()) {
        alert("Cannot schedule for a past date/time."); // Basic validation
        return;
    }
    emit('confirm-schedule', selectedDateTime.value);
    closeModal();
  }
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
/* Adjust input styles if necessary */
.mx-input {
  /* Tailwind classes might be applied via input-class prop, but you can override here */
}
</style>