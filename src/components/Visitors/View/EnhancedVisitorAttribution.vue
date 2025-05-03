<!-- EnhancedVisitorAttribution.vue -->
<template>
  <section class="card-modern overflow-hidden shadow-xl">
    <!-- Tabs for different views -->
    <div class="bg-gradient-to-r from-emerald-800/90 via-teal-800/90 to-cyan-700/90 p-4 relative overflow-hidden">
      <div class="absolute right-0 top-0 w-32 h-32 rounded-full bg-cyan-500/20 blur-xl -mr-10 -mt-10"></div>
      <div class="absolute left-20 bottom-0 w-16 h-16 rounded-full bg-emerald-500/20 blur-lg -mb-8"></div>
      <div class="flex flex-wrap gap-2 justify-between items-center relative z-10">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 rounded-lg transition-all',
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'bg-cyan-700/30 text-cyan-200 hover:bg-cyan-700/50'
            ]"
          >
            <font-awesome-icon :icon="tab.icon" class="mr-2" />
            {{ tab.label }}
          </button>
        </div>
        <button
          @click="fetchData"
          class="text-cyan-200 hover:text-white rounded-full p-2 hover:bg-cyan-600/30 transition-all duration-150"
          :disabled="loading"
          aria-label="Refresh visitor data"
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
        <p class="text-sm text-cyan-300 animate-pulse">Loading visitor data...</p>
      </div>

      <div v-else-if="error" class="text-sm p-8 text-center">
        <div class="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-2xl" />
        </div>
        <p class="text-red-300 mb-3">{{ error }}</p>
        <button @click="fetchData" class="px-4 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-200 rounded-md transition-colors text-sm">
          <font-awesome-icon icon="sync" class="mr-2" /> Retry
        </button>
      </div>

      <div v-else-if="!visitor" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="w-16 h-16 mx-auto bg-cyan-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="user-slash" class="text-cyan-400 text-xl" />
        </div>
        <p class="text-cyan-300 font-medium mb-1">No visitor data</p>
        <p class="text-gray-400 text-sm max-w-xs">No visitor information is available.</p>
      </div>

      <div v-else class="p-6">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Geographic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
                <font-awesome-icon icon="globe" class="mr-2" />
                Geographic Information
              </h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">Country:</span>
                  <span class="text-white">{{ visitor?.country || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Region:</span>
                  <span class="text-white">{{ visitor?.region || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">City:</span>
                  <span class="text-white">{{ visitor?.city || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Timezone:</span>
                  <span class="text-white">{{ visitor?.timezone || '-' }}</span>
                </div>
                <div v-if="visitor?.latitude && visitor?.longitude" class="mt-4">
                  <a 
                    :href="`https://www.google.com/maps?q=${visitor.latitude},${visitor.longitude}`"
                    target="_blank"
                    class="text-cyan-400 hover:text-cyan-300 text-sm flex items-center"
                  >
                    <font-awesome-icon icon="map-marker-alt" class="mr-2" />
                    View on Map
                  </a>
                </div>
              </div>
            </div>

            <!-- Device Information -->
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
                <font-awesome-icon icon="desktop" class="mr-2" />
                Device Information
              </h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">Device:</span>
                  <span class="text-white capitalize">{{ visitor?.deviceType || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Browser:</span>
                  <span class="text-white">{{ visitor?.browser }} {{ visitor?.browserVersion }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">OS:</span>
                  <span class="text-white">{{ visitor?.os }} {{ visitor?.osVersion }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Screen:</span>
                  <span class="text-white">{{ visitor?.screenResolution || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Language:</span>
                  <span class="text-white">{{ visitor?.language || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Engagement Stats -->
          <div class="bg-gray-800/50 rounded-lg p-4">
            <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
              <font-awesome-icon icon="chart-line" class="mr-2" />
              Engagement Statistics
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-cyan-400">{{ visitor?.totalPageViews || 0 }}</div>
                <div class="text-sm text-gray-400">Page Views</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-cyan-400">{{ visitor?.totalSessions || 0 }}</div>
                <div class="text-sm text-gray-400">Sessions</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-cyan-400">{{ formatDuration(visitor?.totalTimeOnSite) }}</div>
                <div class="text-sm text-gray-400">Time on Site</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-cyan-400">{{ avgTimePerSession }}</div>
                <div class="text-sm text-gray-400">Avg Session</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attribution Tab -->
        <div v-if="activeTab === 'attribution'" class="space-y-6">
          <AttributionFlowChart :attribution="attribution" />
        </div>

        <!-- Journey Tab -->
        <div v-if="activeTab === 'journey'" class="space-y-6">
          <VisitorJourneyTimeline :visitorId="visitorId" />
        </div>

        <!-- Sessions Tab -->
        <div v-if="activeTab === 'sessions'" class="space-y-6">
          <SessionHistoryList :sessions="sessions" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';
import AttributionFlowChart from './AttributionFlowChart.vue';
import VisitorJourneyTimeline from './VisitorJourneyTimeline.vue';
import SessionHistoryList from './SessionHistoryList.vue';

interface Visitor {
  id: string;
  utk: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  deviceType: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  screenResolution: string | null;
  language: string | null;
  totalPageViews: number;
  totalSessions: number;
  totalTimeOnSite: number;
  lastPageVisited: string | null;
  customerId: string | null;
  sourceAttribution: any;
  sessions: any[];
  customer: any;
}

const props = defineProps<{
  visitorId: string;
}>();

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'user' },
  { id: 'attribution', label: 'Attribution', icon: 'project-diagram' },
  { id: 'journey', label: 'Journey', icon: 'route' },
  { id: 'sessions', label: 'Sessions', icon: 'history' }
];

const activeTab = ref('overview');
const visitor = ref<Visitor | null>(null);
const attribution = ref<any>(null);
const sessions = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const avgTimePerSession = computed(() => {
  if (!visitor.value || !visitor.value.totalSessions || !visitor.value.totalTimeOnSite) {
    return '0s';
  }
  const avgSeconds = Math.round(visitor.value.totalTimeOnSite / visitor.value.totalSessions);
  return formatDuration(avgSeconds);
});

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

async function fetchData() {
  if (!props.visitorId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const { data } = await axios.get(`/api/analytics/visitor/${props.visitorId}`);
    visitor.value = data.visitor;
    attribution.value = data.visitor.sourceAttribution;
    sessions.value = data.visitor.sessions || [];
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load visitor data';
    visitor.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
watch(() => props.visitorId, fetchData);
</script>

<style scoped>
.card-modern {
  border-radius: 1rem;
  background: #181f2a;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12);
  margin-bottom: 1.5rem;
}
</style>