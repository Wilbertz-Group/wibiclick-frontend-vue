import { ref, watch, onMounted } from "vue";
import axios from "axios";

/**
 * Composable for fetching and managing page details:
 * - metrics
 * - rankings
 * - updateLogs
 * - visitors
 * 
 * @param {Object} page - The page object (must have an id)
 * @returns {Object} - Reactive state and fetchAll method
 */
/**
 * @param {Ref} page - The page ref (must have an id)
 * @param {Object} [options] - Optional options object
 * @param {Object} [options.axiosInstance] - Optional axios instance for testability
 */
export function usePageDetails(page, options = {}) {
  const axiosInstance = options.axiosInstance || axios;

  // Helper to get id from ref or plain object
  function getPageId() {
    return page && (page.value ? page.value.id : page.id);
  }
  const metrics = ref({});
  const rankings = ref([]);
  const updateLogs = ref([]);
  const visitors = ref([]);
  const isLoading = ref({
    metrics: false,
    rankings: false,
    updateLogs: false,
    visitors: false
  });

  const fetchMetrics = async () => {
    isLoading.value.metrics = true;
    try {
      const id = getPageId();
      if (!id) return;
      const res = await axiosInstance.get(`/api/pages/${id}/performance`);
      metrics.value = res.data.performance || {};
    } catch {
      metrics.value = {};
    } finally {
      isLoading.value.metrics = false;
    }
  };

  const fetchRankings = async () => {
    isLoading.value.rankings = true;
    try {
      const id = getPageId();
      if (!id) return;
      const res = await axiosInstance.get(`/api/pages/${id}/rankings`);
      rankings.value = res.data.rankings || [];
    } catch {
      rankings.value = [];
    } finally {
      isLoading.value.rankings = false;
    }
  };

  const fetchUpdateLogs = async () => {
    isLoading.value.updateLogs = true;
    try {
      const id = getPageId();
      if (!id) return;
      const res = await axiosInstance.get(`/api/pages/${id}/updates`);
      updateLogs.value = res.data.updates || [];
    } catch {
      updateLogs.value = [];
    } finally {
      isLoading.value.updateLogs = false;
    }
  };

  const fetchVisitors = async () => {
    isLoading.value.visitors = true;
    try {
      const id = getPageId();
      if (!id) return;
      const res = await axiosInstance.get(`/api/pages/${id}/visitors`);
      visitors.value = res.data.visitors || [];
    } catch {
      visitors.value = [];
    } finally {
      isLoading.value.visitors = false;
    }
  };

  const fetchAll = () => {
    const id = getPageId();
    if (!id) return;
    fetchMetrics();
    fetchRankings();
    fetchUpdateLogs();
    fetchVisitors();
  };

  watch(
    () => getPageId(),
    (newId, oldId) => {
      if (newId && newId !== oldId) fetchAll();
    },
    { immediate: true }
  );

  onMounted(() => {
    const id = getPageId();
    if (id) fetchAll();
  });

  return {
    metrics,
    rankings,
    updateLogs,
    visitors,
    isLoading,
    fetchAll
  };
}