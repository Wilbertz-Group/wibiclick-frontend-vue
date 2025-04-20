<template>
  <div class="rankings-table border rounded p-4  shadow">
    <div class="font-semibold mb-2">Rankings</div>
    <div v-if="loading" class="text-gray-400 py-4 text-center">Loading...</div>
    <table v-else-if="rankings && rankings.length" class="min-w-full text-sm">
      <thead>
        <tr>
          <th class="text-left px-2 py-1">#</th>
          <th class="text-left px-2 py-1">Type</th>
          <th class="text-left px-2 py-1">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ranking, idx) in rankings" :key="ranking.id || idx">
          <td class="px-2 py-1">{{ idx + 1 }}</td>
          <td class="px-2 py-1 capitalize">{{ ranking.type }}</td>
          <td class="px-2 py-1">{{ ranking.value }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-gray-400 py-4 text-center">No rankings available.</div>
  </div>
</template>

<script setup>
defineProps({
  rankings: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});
</script>