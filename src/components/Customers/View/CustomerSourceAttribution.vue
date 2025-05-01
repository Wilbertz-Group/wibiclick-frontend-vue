<template>
  <section class="card-modern overflow-hidden shadow-xl">
    <!-- Gradient header with icon and refresh -->
    <div class="bg-gradient-to-r from-emerald-800/90 via-teal-800/90 to-cyan-700/90 p-5 relative overflow-hidden">
      <div class="absolute right-0 top-0 w-32 h-32 rounded-full bg-cyan-500/20 blur-xl -mr-10 -mt-10"></div>
      <div class="absolute left-20 bottom-0 w-16 h-16 rounded-full bg-emerald-500/20 blur-lg -mb-8"></div>
      <div class="flex justify-between items-center relative z-10">
        <h2 class="text-lg font-semibold text-white flex items-center">
          <font-awesome-icon icon="project-diagram" class="mr-3 text-cyan-200" />
          Source Attribution
        </h2>
        <button
          @click="fetchAttribution"
          class="text-cyan-200 hover:text-white rounded-full p-2 hover:bg-cyan-600/30 transition-all duration-150"
          :disabled="loading"
          aria-label="Refresh source attribution"
        >
          <font-awesome-icon icon="sync" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <div class="bg-gradient-to-b from-gray-900 to-gray-800 p-0">
      <div v-if="loading" class="flex flex-col items-center justify-center py-14">
        <div class="w-12 h-12 rounded-full bg-cyan-800/30 flex items-center justify-center mb-3">
          <span class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
        </div>
        <p class="text-sm text-cyan-300 animate-pulse">Loading source attribution...</p>
      </div>

      <div v-else-if="error" class="text-sm p-8 text-center">
        <div class="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-2xl" />
        </div>
        <p class="text-red-300 mb-3">{{ error }}</p>
        <button @click="fetchAttribution" class="px-4 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-200 rounded-md transition-colors text-sm">
          <font-awesome-icon icon="sync" class="mr-2" /> Retry
        </button>
      </div>

      <div v-else-if="!attribution" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="w-16 h-16 mx-auto bg-cyan-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="project-diagram" class="text-cyan-400 text-xl" />
        </div>
        <p class="text-cyan-300 font-medium mb-1">No source attribution data</p>
        <p class="text-gray-400 text-sm max-w-xs">No source attribution information is available for this customer.</p>
      </div>

      <div v-else class="px-6 py-8">
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <span class="text-xs text-gray-400">First Source:</span>
            <span class="text-sm text-emerald-300 font-semibold">{{ attribution.firstSource || '-' }}</span>
            <span class="ml-4 text-xs text-gray-400">Detail:</span>
            <span class="text-xs bg-cyan-700/20 text-cyan-200 px-2 py-0.5 rounded font-medium uppercase">
              {{ attribution.firstSourceDetail || '-' }}
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <span class="text-xs text-gray-400">First Referrer:</span>
            <span class="text-sm text-cyan-200">
              <a v-if="attribution.firstReferrer" :href="attribution.firstReferrer" class="hover:underline" target="_blank" rel="noopener">
                {{ attribution.firstReferrer }}
              </a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <span class="text-xs text-gray-400">Last Source:</span>
            <span class="text-sm text-emerald-300 font-semibold">{{ attribution.lastSource || '-' }}</span>
            <span class="ml-4 text-xs text-gray-400">Detail:</span>
            <span class="text-xs bg-cyan-700/20 text-cyan-200 px-2 py-0.5 rounded font-medium uppercase">
              {{ attribution.lastSourceDetail || '-' }}
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <span class="text-xs text-gray-400">Last Referrer:</span>
            <span class="text-sm text-cyan-200">
              <a v-if="attribution.lastReferrer" :href="attribution.lastReferrer" class="hover:underline" target="_blank" rel="noopener">
                {{ attribution.lastReferrer }}
              </a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400">First Visit:</span>
            <span class="text-sm text-white">{{ formatDate(attribution.firstVisitTimestamp) || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400">Last Visit:</span>
            <span class="text-sm text-white">{{ formatDate(attribution.lastVisitTimestamp) || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400">Campaign Data (UTM):</span>
            <div v-if="hasUtm" class="grid grid-cols-2 gap-2">
              <div v-if="attribution.campaign" class="flex items-center gap-2">
                <span class="text-xs text-cyan-300 font-medium uppercase">Campaign:</span>
                <span class="text-sm text-white">{{ attribution.campaign }}</span>
              </div>
              <div v-if="attribution.medium" class="flex items-center gap-2">
                <span class="text-xs text-cyan-300 font-medium uppercase">Medium:</span>
                <span class="text-sm text-white">{{ attribution.medium }}</span>
              </div>
              <div v-if="attribution.term" class="flex items-center gap-2">
                <span class="text-xs text-cyan-300 font-medium uppercase">Term:</span>
                <span class="text-sm text-white">{{ attribution.term }}</span>
              </div>
              <div v-if="attribution.content" class="flex items-center gap-2">
                <span class="text-xs text-cyan-300 font-medium uppercase">Content:</span>
                <span class="text-sm text-white">{{ attribution.content }}</span>
              </div>
            </div>
            <div v-else class="text-gray-400 text-sm">-</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';

interface SourceAttribution {
  id: string;
  visitorId: string;
  customerId: string;
  firstSource: string | null;
  firstSourceDetail: string | null;
  firstReferrer: string | null;
  firstVisitTimestamp: string | null;
  lastSource: string | null;
  lastSourceDetail: string | null;
  lastReferrer: string | null;
  lastVisitTimestamp: string | null;
  campaign: string | null;
  content: string | null;
  medium: string | null;
  term: string | null;
  websiteId: string;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  customerId: string | number;
}>();

const attribution = ref<SourceAttribution | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchAttribution = async () => {
  if (!props.customerId) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await axios.get('/api/track/source-attribution', {
      params: { customerId: props.customerId }
    });
    attribution.value = data.attribution;
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load source attribution';
    attribution.value = null;
  } finally {
    loading.value = false;
  }
};

const hasUtm = computed(() =>
  attribution.value &&
  (attribution.value.campaign || attribution.value.medium || attribution.value.term || attribution.value.content)
);

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

onMounted(fetchAttribution);
watch(() => props.customerId, fetchAttribution);
</script>

<style scoped>
.card-modern {
  border-radius: 1rem;
  background: #181f2a;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12);
  margin-bottom: 1.5rem;
}
</style>