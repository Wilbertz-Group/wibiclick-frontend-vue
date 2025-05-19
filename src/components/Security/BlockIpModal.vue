<script setup>
import { ref } from 'vue';
import securityService from '@/services/securityService';

const props = defineProps({
  websiteId: {
    type: String,
    required: true
  }
});
const emit = defineEmits(['close', 'ip-added']);

const ip = ref('');
const loading = ref(false);
const error = ref('');

function validateIp(value) {
  // Simple IPv4/IPv6 regex
  const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4.test(value) || ipv6.test(value);
}

async function submit() {
  error.value = '';
  if (!validateIp(ip.value)) {
    error.value = 'Please enter a valid IP address.';
    return;
  }
  loading.value = true;
  try {
    await securityService.addBlockedIp(props.websiteId, ip.value);
    emit('ip-added');
    ip.value = '';
  } catch (e) {
    error.value = 'Failed to block IP.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative">
      <button
        class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        @click="emit('close')"
        aria-label="Close"
      >
        &times;
      </button>
      <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Block New IP</h3>
      <form @submit.prevent="submit">
        <input
          v-model="ip"
          type="text"
          placeholder="Enter IP address"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :disabled="loading"
        />
        <div v-if="error" class="text-red-500 mb-2">{{ error }}</div>
        <div class="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            @click="emit('close')"
            :disabled="loading"
          >Cancel</button>
          <button
            type="submit"
            class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
            :disabled="loading"
          >
            <span v-if="loading">Blocking...</span>
            <span v-else>Block IP</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>