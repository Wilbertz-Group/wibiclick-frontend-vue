<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import securityService from '@/services/securityService';
import BlockIpModal from './BlockIpModal.vue';

const props = defineProps({
  websiteId: {
    type: String,
    required: true
  }
});

const blockedIps = ref([]);
const loading = ref(false);
const error = ref('');
const showAddModal = ref(false);

// Pagination
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const paginatedIps = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return blockedIps.value.slice(start, start + pageSize.value);
});

async function fetchBlockedIps() {
  loading.value = true;
  error.value = '';
  try {
    const ips = await securityService.getBlockedIps(props.websiteId);
    blockedIps.value = ips;
    total.value = ips.length;
  } catch (e) {
    error.value = 'Failed to load blocked IPs.';
  } finally {
    loading.value = false;
  }
}

async function removeIp(ip) {
  if (!confirm(`Unblock IP ${ip}?`)) return;
  loading.value = true;
  error.value = '';
  try {
    await securityService.removeBlockedIp(props.websiteId, ip);
    await fetchBlockedIps();
  } catch (e) {
    error.value = 'Failed to remove IP.';
  } finally {
    loading.value = false;
  }
}

function handleIpAdded() {
  showAddModal.value = false;
  fetchBlockedIps();
}

onMounted(fetchBlockedIps);
watch(() => props.websiteId, fetchBlockedIps);
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Blocked IPs</h2>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        @click="showAddModal = true"
      >
        Block New IP
      </button>
    </div>
    <BlockIpModal
      v-if="showAddModal"
      :website-id="websiteId"
      @close="showAddModal = false"
      @ip-added="handleIpAdded"
    />
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else>
      <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>
      <div v-if="blockedIps.length === 0" class="text-gray-500">No blocked IPs.</div>
      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP Address</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ip in paginatedIps" :key="ip">
                <td class="px-4 py-2 text-gray-800 dark:text-gray-100">{{ ip }}</td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="text-red-600 hover:text-red-800 font-medium"
                    @click="removeIp(ip)"
                  >
                    Unblock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="flex justify-end items-center mt-4 space-x-2" v-if="total > pageSize">
          <button
            class="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            :disabled="page === 1"
            @click="page--"
          >Prev</button>
          <span class="text-sm text-gray-600 dark:text-gray-300">Page {{ page }} of {{ Math.ceil(total / pageSize) }}</span>
          <button
            class="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            :disabled="page >= Math.ceil(total / pageSize)"
            @click="page++"
          >Next</button>
        </div>
      </div>
    </div>
  </div>
</template>