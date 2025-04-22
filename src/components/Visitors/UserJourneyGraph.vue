<template>
  <div class="card-modern p-4">
    <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">User Journey</h4>
    <div v-if="journeyData && journeyData.length > 0">
      <ul class="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
        <li v-for="(step, index) in journeyData" :key="index">
          <strong>{{ step.eventType }}:</strong> {{ step.pageUrl }} ({{ new Date(step.timestamp).toLocaleString() }})
        </li>
      </ul>
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400">
      No journey data available for this visitor.
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  journeyData: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
/* Add any specific styles for the journey graph here */
/* Using existing modern styles from Visitors.vue */
.card-modern {
 @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}
</style>