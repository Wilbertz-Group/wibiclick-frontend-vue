<script setup>
import { useUIStore } from '@/stores/UIStore'; // Adjust path if needed
import { storeToRefs } from 'pinia';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'; // Or your preferred loader

const uiStore = useUIStore();
const { isGlobalJobModalOpen, globalJobModalData, isFetchingJobData } = storeToRefs(uiStore);

const closeModal = () => {
  uiStore.closeGlobalJobModal();
};

// Helper function to format dates (or import from helpers)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Use a more robust date formatting method if available
  try {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString; // Fallback to original string if formatting fails
  }
}
</script>

<template>
  <transition name="modal-fade"> <!-- Use a transition like other modals -->
    <div v-if="isGlobalJobModalOpen" class="fixed z-[60] inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true"> <!-- Increased z-index -->
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <!-- Modal positioning -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="px-6 py-4">
             <div class="flex justify-between items-center pb-3 border-b dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                  Job Details
                </h3>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                </button>
              </div>

              <div class="mt-4 max-h-[70vh] overflow-y-auto pr-2 text-sm text-gray-700 dark:text-gray-300">
                <div v-if="isFetchingJobData" class="flex justify-center items-center h-40">
                   <ScaleLoader :loading="true" color="#4f46e5" height="30px" width="4px" />
                </div>
                <div v-else-if="globalJobModalData" class="space-y-3">
                  <p><strong>Job ID:</strong> {{ globalJobModalData.id }}</p>
                  <p><strong>Customer:</strong> {{ globalJobModalData.customer?.name || 'N/A' }}</p>
                  <p><strong>Technician:</strong> {{ globalJobModalData.employee?.firstName || '' }} {{ globalJobModalData.employee?.lastName || '' }}</p>
                  <p><strong>Status:</strong> {{ globalJobModalData.jobStatus || 'N/A' }}</p>
                  <p><strong>Issue:</strong> {{ globalJobModalData.issue || 'N/A' }}</p>
                  <p><strong>Description:</strong> {{ globalJobModalData.description || 'N/A' }}</p>
                  <p><strong>Address:</strong> {{ globalJobModalData.address || 'N/A' }}</p>
                  <p><strong>Created:</strong> {{ formatDate(globalJobModalData.createdAt) }}</p>
                  <!-- Add more fields as needed -->
                </div>
                 <div v-else class="text-center text-gray-500 py-10">
                    Failed to load job data.
                 </div>
              </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 text-right">
            <button @click="closeModal" type="button" class="btn-secondary-modern"> <!-- Use your button style -->
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Add modal transition styles if not global */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
/* Add other necessary styles */
.btn-secondary-modern { /* Example */
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>