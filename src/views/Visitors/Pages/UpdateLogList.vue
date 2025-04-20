<template>
  <div class="update-log-list border rounded p-4  shadow">
    <div class="font-semibold mb-2">Update Logs</div>
    <div v-if="loading" class="text-gray-400 py-4 text-center">Loading...</div>
    <ul v-else-if="logs && logs.length" class="space-y-2">
      <li v-for="log in logs" :key="log.id" class="border-b pb-2 last:border-b-0">
        <div class="flex justify-between items-center">
          <span class="font-medium">{{ log.action }}</span>
          <span class="text-xs text-gray-400 dark:text-white">{{ formatDate(log.timestamp) }}</span>
        </div>
        <div class="text-xs text-gray-600">{{ log.description }}</div>
      </li>
    </ul>
    <div v-else class="text-gray-400 py-4 text-center">No update logs available.</div>
  </div>
</template>

<script setup>
const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}
</script>