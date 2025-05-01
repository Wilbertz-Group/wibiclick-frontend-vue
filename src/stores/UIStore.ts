// wibiclick-frontend-vue/src/stores/UIStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import useUserStore from './UserStore'; // Adjust path if needed

export const useUIStore = defineStore('ui', () => {
  const isGlobalJobModalOpen = ref(false);
  const globalJobModalData = ref(null);
  const isFetchingJobData = ref(false);
  const userStore = useUserStore(); // Get user store for website ID

  async function openGlobalJobModal(jobId: string | number) {
    if (!jobId) return;
    globalJobModalData.value = null; // Clear previous data
    isFetchingJobData.value = true;
    isGlobalJobModalOpen.value = true; // Open modal immediately

    try {
      // Fetch the specific job details - adjust endpoint if needed
      // Ensure the backend /job endpoint returns necessary details including employee
      const response = await axios.get(`/job?id=${jobId}&websiteId=${userStore.currentWebsite}`); // Pass websiteId too
      globalJobModalData.value = response.data.job; // Adjust based on actual API response
    } catch (error) {
      console.error("Error fetching job details for modal:", error);
      // Optionally show a toast error using useToast() if imported
      closeGlobalJobModal(); // Close modal on error
    } finally {
      isFetchingJobData.value = false;
    }
  }

  function closeGlobalJobModal() {
    isGlobalJobModalOpen.value = false;
    globalJobModalData.value = null;
    isFetchingJobData.value = false;
  }

  return {
    isGlobalJobModalOpen,
    globalJobModalData,
    isFetchingJobData,
    openGlobalJobModal,
    closeGlobalJobModal,
  };
});