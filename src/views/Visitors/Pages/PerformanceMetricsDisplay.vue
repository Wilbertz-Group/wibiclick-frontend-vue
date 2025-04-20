<template>
  <div class="performance-metrics border rounded p-4 shadow">
    <div class="font-semibold mb-2">Performance Metrics</div>
    <div v-if="loading" class="text-gray-400 py-4 text-center">Loading...</div>
    <div v-else-if="metrics">
      <ul class="space-y-1">
        <li v-for="(value, key) in metrics" :key="key" class="flex justify-between">
          <span class="capitalize">{{ key.replace(/([A-Z])/g, ' $1') }}</span>
          <span class="font-mono">{{ value }}</span>
        </li>
      </ul>
    </div>
    <div v-else class="text-gray-400 py-4 text-center">No metrics available.</div>
  </div>
</template>

<script setup>
defineProps({
  metrics: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});
</script>

<script>
export default { name: 'PerformanceMetricsDisplay' }
</script>