<template>
  <div>
    <div class="mb-2 font-semibold text-lg">All Pages</div>
    <div v-if="loading" class="text-gray-400 py-4 text-center">Loading...</div>
    <ul v-else class="divide-y divide-gray-200 border rounded">
      <li
        v-for="page in pages"
        :key="page.id"
        :class="[
          'cursor-pointer px-4 py-3 hover:bg-blue-900 transition',
          selectedPageId === page.id ? 'bg-blue-900 font-bold' : ''
        ]"
        @click="$emit('select', page.id)"
      >
        <div class="flex items-center justify-between">
          <span>{{ page.title || page.url || 'Untitled Page' }}</span>
          <span v-if="selectedPageId === page.id" class="text-blue-600 text-xs ml-2">Selected</span>
        </div>
        <div class="text-xs text-gray-500 truncate">{{ page.url }}</div>
      </li>
      <li v-if="!pages.length" class="text-gray-400 py-4 text-center">No pages found.</li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  pages: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedPageId: {
    type: [String, Number],
    default: null
  }
});
</script>