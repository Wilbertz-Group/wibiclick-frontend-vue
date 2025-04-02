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
                Set Preferred Technician
              </DialogTitle>
              <form @submit.prevent="savePreference" class="mt-4 space-y-4">
                <div v-if="isFetchingTechnicians" class="text-center py-4">
                  <p class="text-sm text-gray-500 dark:text-gray-400">Loading technicians...</p>
                  <!-- Optional: Add spinner -->
                </div>
                <div v-else-if="fetchError" class="text-sm text-red-600 dark:text-red-400">
                  Error loading technicians: {{ fetchError }}
                </div>
                <div v-else>
                  <label for="preferred-technician" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Technician</label>
                  <select id="preferred-technician" v-model="selectedTechnicianId"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100 appearance-none">
                    <option :value="null">-- None --</option>
                    <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                      {{ tech.firstName }} {{ tech.lastName }}
                    </option>
                  </select>
                </div>

                <!-- Error Message Display -->
                <div v-if="saveError" class="mt-2 text-sm text-red-600 dark:text-red-400">
                  {{ saveError }}
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                  <button type="button" @click="closeModal"
                          class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    Cancel
                  </button>
                  <button type="submit" :disabled="isSaving || isFetchingTechnicians"
                          class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50">
                    <ScaleLoader v-if="isSaving" color="#fff" height="16px" class="mr-2" />
                    {{ isSaving ? 'Saving...' : 'Save Preference' }}
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
import { ref, watch, computed, defineProps, defineEmits, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from "@/stores/UserStore";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

const props = defineProps({
  modelValue: Boolean, // Controls modal visibility (v-model)
  customerId: {
    type: [String, Number],
    required: true,
  },
  currentTechnicianId: { // Pass the current preference ID
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();
const technicians = ref([]);
const selectedTechnicianId = ref(props.currentTechnicianId);
const isFetchingTechnicians = ref(false);
const fetchError = ref('');
const isSaving = ref(false);
const saveError = ref('');

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

async function fetchTechnicians() {
  isFetchingTechnicians.value = true;
  fetchError.value = '';
  try {
    // Actual API call to fetch technicians
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`); // Use relative path and websiteId query param
    // Removed console.log
    // Removed simulation code
    // Removed simulation code
    // Removed simulation code
    // Removed simulation code
    // Removed simulation code
    // Removed simulation code
    technicians.value = response.data.employees || []; // Assuming API returns { employees: [...] }
  } catch (error) {
    // Removed console.error
    fetchError.value = `Failed to load technicians: ${error.response?.data?.message || error.message}`;
    toast.error(fetchError.value);
  } finally {
    isFetchingTechnicians.value = false;
  }
}

function closeModal() {
  isOpen.value = false;
  // Reset errors after a delay
  setTimeout(() => {
     fetchError.value = '';
     saveError.value = '';
     isSaving.value = false;
     // Don't reset selectedTechnicianId here, keep it synced with prop
  }, 300);
}

async function savePreference() {
  isSaving.value = true;
  saveError.value = '';
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const payload = { technicianId: selectedTechnicianId.value }; // API expects { technicianId: number | null }

    // Removed console.log
    // Actual API call: PUT /customers/:id/preferred-technician
    const websiteId = userStore.currentWebsite;
    if (!websiteId) {
        saveError.value = "Cannot save preference: Website ID is missing.";
        toast.error(saveError.value);
        isSaving.value = false;
        return;
    }
    await axios.put(`customers/${props.customerId}/preferred-technician?id=${websiteId}`, payload);
    // Removed simulation code

    toast.success('Preferred technician updated successfully');
    emit('saved'); // Notify parent component to refresh data
    closeModal();

  } catch (error) {
    // Removed console.error
    saveError.value = `Failed to save preference: ${error.response?.data?.message || error.message}`;
    toast.error(saveError.value);
  } finally {
    isSaving.value = false;
  }
}

// Fetch technicians when the modal is opened
watch(isOpen, (newValue) => {
  if (newValue && technicians.value.length === 0) { // Fetch only if modal opens and list is empty
    fetchTechnicians();
  }
  // Sync selected ID with prop when modal opens
  if (newValue) {
      selectedTechnicianId.value = props.currentTechnicianId;
  }
});

// Also fetch on initial mount if needed, though watching isOpen is usually sufficient
// onMounted(() => {
//   if (isOpen.value) {
//      fetchTechnicians();
//   }
// });

</script>