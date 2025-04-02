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
        <div class="fixed inset-0 bg-black bg-opacity-30" />
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
                {{ isEditing ? 'Edit Appliance' : 'Add New Appliance' }}
              </DialogTitle>
              <form @submit.prevent="saveAppliance" class="mt-4 space-y-4">
                <div>
                  <label for="appliance-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type <span class="text-red-500">*</span></label>
                  <input type="text" id="appliance-type" v-model="formData.type" required
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                </div>
                <div>
                  <label for="appliance-brand" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                  <input type="text" id="appliance-brand" v-model="formData.brand"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                </div>
                <div>
                  <label for="appliance-model" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Model Number</label>
                  <input type="text" id="appliance-model" v-model="formData.modelNumber"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                </div>
                <div>
                  <label for="appliance-serial" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</label>
                  <input type="text" id="appliance-serial" v-model="formData.serialNumber"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                </div>
                <div>
                  <label for="appliance-last-service" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Service Date</label>
                  <input type="date" id="appliance-last-service" v-model="formData.lastServiceDate"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                         <!-- Note: Browser date picker format might vary -->
                </div>

                 <!-- Error Message Display -->
                 <div v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-400">
                   {{ errorMessage }}
                 </div>

                <div class="mt-6 flex justify-end space-x-3">
                  <button type="button" @click="closeModal"
                          class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    Cancel
                  </button>
                  <button type="submit" :disabled="isLoading"
                          class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50">
                    <ScaleLoader v-if="isLoading" color="#fff" height="16px" class="mr-2" />
                    {{ isLoading ? 'Saving...' : (isEditing ? 'Update Appliance' : 'Add Appliance') }}
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
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore'; // Import user store
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { format, parseISO } from 'date-fns'; // For handling date formatting

const props = defineProps({
  modelValue: Boolean, // Controls modal visibility (v-model)
  appliance: { // The appliance object to edit (null if adding)
    type: Object,
    default: null,
  },
  customerId: { // The ID of the customer this appliance belongs to
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore(); // Initialize user store
const isLoading = ref(false);
const errorMessage = ref('');

const defaultFormData = () => ({
  type: '',
  brand: '',
  modelNumber: '',
  serialNumber: '',
  lastServiceDate: '', // Store as YYYY-MM-DD for input[type=date]
  customerId: props.customerId,
});

const formData = ref(defaultFormData());

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.appliance?.id);

// Watch for changes in the appliance prop to populate the form for editing
watch(() => props.appliance, (newAppliance) => {
  if (newAppliance && newAppliance.id) {
    formData.value = {
      ...defaultFormData(), // Start with defaults
      ...newAppliance, // Overwrite with appliance data
      // Format date for input field if it exists
      lastServiceDate: newAppliance.lastServiceDate
        ? format(parseISO(newAppliance.lastServiceDate), 'yyyy-MM-dd')
        : '',
    };
  } else {
    // Reset form if prop becomes null (e.g., switching from edit to add)
    formData.value = defaultFormData();
  }
}, { immediate: true }); // Run immediately to populate form on initial open

function closeModal() {
  isOpen.value = false;
  // Optional: Reset form state after a short delay to allow closing animation
  setTimeout(() => {
     formData.value = defaultFormData();
     errorMessage.value = '';
     isLoading.value = false;
  }, 300);
}

async function saveAppliance() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const apiUrl = import.meta.env.VITE_API_URL; // Ensure your API URL is in .env
    const payload = { ...formData.value };

    // Ensure lastServiceDate is null if empty, otherwise keep the YYYY-MM-DD format
    if (!payload.lastServiceDate) {
        payload.lastServiceDate = null;
    }

    let response;
    // Get websiteId from the store
    const websiteId = userStore.currentWebsite;

    if (!websiteId) {
        errorMessage.value = "Cannot save appliance: Website ID is missing.";
        toast.error(errorMessage.value);
        isLoading.value = false;
        return; // Prevent API call without websiteId
    }

    if (isEditing.value) {
      // PUT request for updating
      // Removed console.log
      // Actual API call
      response = await axios.put(`appliances/${props.appliance.id}?id=${websiteId}`, payload);
      // Removed simulation code
      // Removed simulation code
      toast.success('Appliance updated successfully');
    } else {
      // POST request for creating
      // Removed console.log
      // Actual API call
      response = await axios.post(`appliances?id=${websiteId}`, payload);
      // Removed simulation code
      // Removed simulation code
      toast.success('Appliance added successfully');
    }

    // Removed console.log
    emit('saved'); // Notify parent component
    closeModal();

  } catch (error) {
    // Removed console.error
    errorMessage.value = `Failed to save appliance: ${error.response?.data?.message || error.message || 'Unknown error'}`;
    toast.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* Add any specific styles if needed */
</style>