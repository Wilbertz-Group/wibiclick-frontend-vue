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
            <DialogPanel class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                Edit Communication Preferences
              </DialogTitle>
              <form @submit.prevent="savePreferences" class="mt-4 space-y-4">

                <!-- Preferred Contact Method -->
                <div>
                  <label for="comm-method" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Contact Method</label>
                  <select id="comm-method" v-model="formData.preferredContactMethod"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100 appearance-none">
                    <option :value="null">-- Any --</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                <!-- Preferred Contact Times -->
                <div>
                  <label for="comm-times" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Contact Times</label>
                  <input type="text" id="comm-times" v-model="formData.preferredContactTimes" placeholder="e.g., Weekdays 9am-5pm"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                   <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter preferred days/times or leave blank for any time.</p>
                </div>

                <!-- Communication Frequency -->
                <div>
                  <label for="comm-frequency" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Communication Frequency</label>
                  <select id="comm-frequency" v-model="formData.communicationFrequencyPreference"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100 appearance-none">
                    <option :value="null">-- Default (Moderate) --</option>
                    <option value="MINIMAL">Minimal (Essential Only)</option>
                    <option value="MODERATE">Moderate (Updates &amp; Reminders)</option>
                    <option value="FREQUENT">Frequent (Promotions &amp; News)</option>
                  </select>
                </div>

                <!-- Language Preference -->
                <div>
                  <label for="comm-language" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Language</label>
                  <input type="text" id="comm-language" v-model="formData.languagePreference" placeholder="e.g., en, es, fr"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100">
                   <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter language code (e.g., 'en' for English).</p>
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
                  <button type="submit" :disabled="isSaving"
                          class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50">
                    <ScaleLoader v-if="isSaving" color="#fff" height="16px" class="mr-2" />
                    {{ isSaving ? 'Saving...' : 'Save Preferences' }}
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

const props = defineProps({
  modelValue: Boolean, // Controls modal visibility (v-model)
  customerId: {
    type: [String, Number],
    required: true,
  },
  currentPreferences: { // Pass the current preferences object
    type: Object,
    default: () => ({
        preferredContactMethod: null,
        preferredContactTimes: '',
        communicationFrequencyPreference: null,
        languagePreference: 'en'
    })
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore(); // Initialize user store
const isSaving = ref(false);
const saveError = ref('');

// Initialize form data based on props
const defaultFormData = () => ({
  preferredContactMethod: props.currentPreferences?.preferredContactMethod || null,
  preferredContactTimes: props.currentPreferences?.preferredContactTimes || '',
  communicationFrequencyPreference: props.currentPreferences?.communicationFrequencyPreference || null,
  languagePreference: props.currentPreferences?.languagePreference || 'en',
});

const formData = ref(defaultFormData());

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Watch for changes in the currentPreferences prop to update the form
// This is useful if the modal stays mounted but the underlying data changes
watch(() => props.currentPreferences, (newPrefs) => {
    formData.value = {
        preferredContactMethod: newPrefs?.preferredContactMethod || null,
        preferredContactTimes: newPrefs?.preferredContactTimes || '',
        communicationFrequencyPreference: newPrefs?.communicationFrequencyPreference || null,
        languagePreference: newPrefs?.languagePreference || 'en',
    };
}, { deep: true }); // Use deep watch for object changes

// Reset form when modal opens based on current props
watch(isOpen, (newValue) => {
  if (newValue) {
    formData.value = defaultFormData();
    saveError.value = ''; // Clear previous errors
  }
});


function closeModal() {
  isOpen.value = false;
  // Optional: Reset error after a delay
  setTimeout(() => {
     saveError.value = '';
     isSaving.value = false;
  }, 300);
}

async function savePreferences() {
  isSaving.value = true;
  saveError.value = '';
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const payload = { ...formData.value };

    // Ensure empty strings become nulls where appropriate for the backend
    if (payload.preferredContactMethod === '') payload.preferredContactMethod = null;
    if (payload.preferredContactTimes === '') payload.preferredContactTimes = null;
    if (payload.communicationFrequencyPreference === '') payload.communicationFrequencyPreference = null;
    if (payload.languagePreference === '') payload.languagePreference = 'en'; // Default to 'en' if empty


    console.log(`Saving communication preferences for customer ${props.customerId}:`, payload);
    // Actual API call: PUT /customers/:id/communication-preferences
    const websiteId = userStore.currentWebsite;
    if (!websiteId) {
        saveError.value = "Cannot save preferences: Website ID is missing.";
        toast.error(saveError.value);
        isSaving.value = false;
        return;
    }
    await axios.put(`customers/${props.customerId}/communication-preferences?id=${websiteId}`, payload);
    // Removed simulation code

    toast.success('Communication preferences updated successfully');
    emit('saved'); // Notify parent component to refresh data
    closeModal();

  } catch (error) {
    console.error("Error saving communication preferences:", error);
    saveError.value = `Failed to save preferences: ${error.response?.data?.message || error.message}`;
    toast.error(saveError.value);
  } finally {
    isSaving.value = false;
  }
}
</script>