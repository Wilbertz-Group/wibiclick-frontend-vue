<template>
  <div class="page-detail-view">
    <h2 class="text-xl font-semibold mb-2">{{ page.title || page.url || 'Page Details' }}</h2>
    <div class="text-gray-500 text-sm mb-4">{{ page.url }}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PerformanceMetricsDisplay :metrics="metrics" :loading="isLoading.metrics" />
      <RankingsTable :rankings="rankings" :loading="isLoading.rankings" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <UpdateLogList :logs="updateLogs" :loading="isLoading.updateLogs" />
      <VisitorsTable :visitors="visitors" :loading="isLoading.visitors" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import PerformanceMetricsDisplay from "./PerformanceMetricsDisplay.vue";
import RankingsTable from "./RankingsTable.vue";
import UpdateLogList from "./UpdateLogList.vue";
import VisitorsTable from "./VisitorsTable.vue";
import { usePageDetails } from "@/composables/usePageDetails.js";

const props = defineProps({
  page: {
    type: Object,
    required: true
  }
});

// Wrap props.page in a computed ref for reactivity
const pageRef = computed(() => props.page);

const {
  metrics,
  rankings,
  updateLogs,
  visitors,
  isLoading
} = usePageDetails(pageRef);
</script>

<style scoped>
.page-detail-view {
  padding: 1rem 0;
}
</style>