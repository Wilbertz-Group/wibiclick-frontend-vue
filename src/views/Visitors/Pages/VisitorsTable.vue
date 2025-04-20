<template>
  <div class="visitors-table border rounded p-4  shadow">
    <div class="font-semibold mb-2">Visitors</div>
    <div v-if="loading" class="text-gray-400 py-4 text-center">Loading...</div>
    <table v-else-if="visitors && visitors.length" class="min-w-full text-sm">
      <thead>
        <tr>
          <th class="text-left px-2 py-1">#</th>
          <th class="text-left px-2 py-1">Visitor</th>
          <th class="text-left px-2 py-1">Customer</th>
          <th class="text-left px-2 py-1">Visit Time</th>
          <th class="text-left px-2 py-1">Device</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(visitor, idx) in visitors" :key="visitor.id || idx">
          <td class="px-2 py-1">{{ idx + 1 }}</td>
          <td class="px-2 py-1">{{ visitor.name || visitor.identifier || 'Anonymous' }}</td>
          <td class="px-2 py-1">
            <template v-if="visitor.customer && visitor.customer.name">
              <RouterLink
                :to="{ name: 'contact', query: { customer_id: visitor.customerId } }"
                class="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {{ visitor.customer.name }}
              </RouterLink>
            </template>
            <template v-else>-</template>
          </td>
          <td class="px-2 py-1">{{ formatDate(visitor.createdAt) }}</td>
          <td class="px-2 py-1">{{ visitor.device || '-' }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-gray-400 py-4 text-center">No visitors found.</div>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns';
import { RouterLink } from 'vue-router';

const props = defineProps({
  visitors: {
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
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy, h:mm a');
  } catch (e) {
    return '';
  }
}
</script>