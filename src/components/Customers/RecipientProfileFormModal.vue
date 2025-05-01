<!-- wibiclick-frontend-vue/src/components/Customers/RecipientProfileFormModal.vue -->
<script setup>
import { ref, reactive, watch, computed } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toast-notification';
import  useUserStore  from "@/stores/UserStore";

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerId: { // ID of the customer to associate the profile with
    type: String,
    required: true,
  },
  profileData: { // For editing existing profile
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'profile-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false);

const profileForm = reactive({
  id: '',
  profileName: '',
  name: '',
  address: '',
  phone: '',
  vatNumber: '',
  isDefault: false,
});

const isEditing = computed(() => !!profileForm.id);

// Watch for changes in profileData to prefill the form when editing
watch(() => props.profileData, (newProfileData) => {
  if (newProfileData && props.modelValue) { // Prefill only when modal is open and data exists
    profileForm.id = newProfileData.id || '';
    profileForm.profileName = newProfileData.profileName || '';
    profileForm.name = newProfileData.name || '';
    profileForm.address = newProfileData.address || '';
    profileForm.phone = newProfileData.phone || '';
    profileForm.vatNumber = newProfileData.vatNumber || '';
    profileForm.isDefault = newProfileData.isDefault || false;
  } else {
    resetForm(); // Reset if no data or modal closed
  }
}, { immediate: true }); // Run immediately to catch initial prop value

// Watch for modal closing to reset the form
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

function resetForm() {
  profileForm.id = '';
  profileForm.profileName = '';
  profileForm.name = '';
  profileForm.address = '';
  profileForm.phone = '';
  profileForm.vatNumber = '';
  profileForm.isDefault = false;
}

const closeModal = () => {
  emit('update:modelValue', false);
};

const saveProfile = async () => {
  loading.value = true;
  try {
    const payload = {
      ...profileForm,
      customerId: props.customerId,
      websiteId: userStore.currentWebsite,
    };

    let response;
    if (isEditing.value) {
      // Update existing profile - This route seems correct based on the controller
      response = await axios.put(`/recipient-profiles/${profileForm.id}?id=${userStore.currentWebsite}`, payload);
    } else {
      // Create new profile - Use the correct route with customerId
      response = await axios.post(`/customers/${props.customerId}/recipient-profiles?id=${userStore.currentWebsite}`, payload);
    }

    toast.success(response.data.message || `Recipient profile ${isEditing.value ? 'updated' : 'added'} successfully!`);
    emit('profile-saved', response.data.profile || payload); // Emit event with saved profile data
    closeModal();

  } catch (error) {
    console.error("Error saving recipient profile:", error);
    toast.error(`Error saving profile: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="fixed z-40 inset-0 overflow-y-auto" aria-labelledby="profile-modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <!-- Modal positioning -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&amp;#8203;</span>
        <!-- Modal panel -->
        <div class="modal-content-modern sm:max-w-lg">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="profile-modal-title">
            {{ isEditing ? 'Edit Recipient Profile' : 'Add New Recipient Profile' }}
          </h3>

          <form @submit.prevent="saveProfile" class="space-y-4">
            <div class="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
              <div>
                <label for="profile-name" class="label-modern">Profile Nickname *</label>
                <input type="text" id="profile-name" v-model="profileForm.profileName" required class="input-modern" placeholder="e.g., Head Office, Property A" />
                 <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">A short name to easily identify this profile.</p>
              </div>
              <div>
                <label for="recipient-name" class="label-modern">Recipient Name *</label>
                <input type="text" id="recipient-name" v-model="profileForm.name" required class="input-modern" placeholder="Company or Person Name" />
              </div>
              <div>
                <label for="recipient-address" class="label-modern">Address</label>
                <textarea id="recipient-address" v-model="profileForm.address" rows="3" class="input-modern" placeholder="Street Address, City, etc."></textarea>
              </div>
              <div>
                <label for="recipient-phone" class="label-modern">Phone</label>
                <input type="tel" id="recipient-phone" v-model="profileForm.phone" class="input-modern" placeholder="Contact Phone Number" />
              </div>
              <div>
                <label for="recipient-vat" class="label-modern">VAT Number (Optional)</label>
                <input type="text" id="recipient-vat" v-model="profileForm.vatNumber" class="input-modern" placeholder="VAT Registration Number" />
              </div>
              <div class="flex items-center">
                <input id="is-default" type="checkbox" v-model="profileForm.isDefault" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
                <label for="is-default" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Set as default profile for this customer
                </label>
              </div>
            </div>

            <div class="pt-5 sm:pt-6 flex flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern" :disabled="loading">
                {{ loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Profile') }}
              </button>
              <button @click="closeModal" type="button" class="btn-secondary-modern">
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
/* Re-use styles from parent modals or global styles */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
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
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full p-6 sm:p-8;
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