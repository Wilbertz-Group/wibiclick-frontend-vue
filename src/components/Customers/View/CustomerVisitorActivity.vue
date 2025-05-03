<!-- CustomerVisitorActivity.vue -->
<template>
  <div v-if="visitorActivity || !isFetchingVisitorActivity" class="card-modern overflow-hidden shadow-xl">
    <!-- Gradient header with analytics theme -->
    <div class="bg-gradient-to-r from-violet-800/90 via-indigo-800/90 to-blue-700/90 p-5 relative overflow-hidden">
      <div class="absolute right-0 top-0 w-32 h-32 rounded-full bg-blue-500/20 blur-xl -mr-10 -mt-10"></div>
      <div class="absolute left-20 bottom-0 w-16 h-16 rounded-full bg-violet-500/20 blur-lg -mb-8"></div>
      <div class="flex justify-between items-center relative z-10">
        <h2 class="text-lg font-semibold text-white flex items-center">
          <font-awesome-icon icon="chart-line" class="mr-3 text-blue-200" />
          Visitor Journey Analytics
        </h2>
        <div class="flex items-center gap-2">
          <button
            v-if="visitorActivity?.id"
            @click="viewFullVisitorProfile"
            class="text-blue-200 hover:text-white px-3 py-1 rounded-md hover:bg-blue-600/30 text-sm flex items-center gap-2 transition-all duration-150"
          >
            <font-awesome-icon icon="external-link-alt" class="text-xs" />
            Full Profile
          </button>
          <button
            @click="$emit('fetch-visitor-activity')"
            class="text-blue-200 hover:text-white rounded-full p-2 hover:bg-blue-600/30 transition-all duration-150"
            :disabled="isFetchingVisitorActivity"
            aria-label="Refresh visitor data"
          >
            <font-awesome-icon 
              icon="sync" 
              :class="{ 'animate-spin': isFetchingVisitorActivity }" 
            />
          </button>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-b from-gray-900 to-gray-800 p-0">
      <!-- Loading State -->
      <div v-if="isFetchingVisitorActivity" class="flex flex-col items-center justify-center py-12">
        <div class="w-12 h-12 rounded-full bg-blue-800/30 flex items-center justify-center mb-3">
          <span class="animate-spin inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"></span>
        </div>
        <p class="text-sm text-blue-300 animate-pulse">Loading visitor journey data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="visitorActivityError" class="text-sm p-8 text-center">
        <div class="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-2xl" />
        </div>
        <p class="text-red-300 mb-3">{{ visitorActivityError }}</p>
        <button 
          @click="$emit('fetch-visitor-activity')" 
          class="px-4 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-200 rounded-md transition-colors text-sm"
        >
          <font-awesome-icon icon="sync" class="mr-2" /> Retry
        </button>
      </div>

      <!-- No Data State -->
      <div v-else-if="!visitorActivity" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="w-16 h-16 mx-auto bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="user-slash" class="text-blue-400 text-xl" />
        </div>
        <p class="text-blue-300 font-medium mb-1">No visitor activity data</p>
        <p class="text-gray-400 text-sm max-w-xs">This customer doesn't have any recorded visitor activity yet.</p>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Engagement Summary Stats -->
        <div class="p-6 border-b border-gray-700">
          <div class="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div class="bg-gray-800/50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-blue-400">
                {{ visitorActivity?.totalPageViews || 0 }}
              </div>
              <div class="text-sm text-gray-400">Total Page Views</div>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-400">
                {{ visitorActivity?.totalSessions || 0 }}
              </div>
              <div class="text-sm text-gray-400">Sessions</div>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-purple-400">
                {{ formatDuration(visitorActivity?.totalTimeOnSite) }}
              </div>
              <div class="text-sm text-gray-400">Time on Site</div>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-amber-400">
                {{ formatDate(visitorActivity?.firstVisitDate) }}
              </div>
              <div class="text-sm text-gray-400">First Visit</div>
            </div>
          </div>
        </div>

        <!-- Attribution Journey -->
        <div v-if="visitorActivity?.sourceAttribution" class="p-6 border-b border-gray-700">
          <h3 class="text-sm font-semibold text-blue-300 mb-4 flex items-center">
            <font-awesome-icon icon="project-diagram" class="mr-2" />
            Attribution Journey
          </h3>
          
          <div class="relative">
            <!-- Journey Line -->
            <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-600/30 transform -translate-y-1/2"></div>
            
            <!-- Journey Points -->
            <div class="flex justify-between relative">
              <!-- First Touch -->
              <div class="flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mb-2 relative z-10">
                  <font-awesome-icon icon="flag" class="text-white text-sm" />
                </div>
                <div class="text-xs font-semibold text-emerald-300">First Touch</div>
                <div class="text-xs text-gray-400">{{ visitorActivity.sourceAttribution?.firstSource || 'Unknown' }}</div>
                <div class="text-xs text-gray-500">{{ visitorActivity.sourceAttribution?.firstSourceDetail || '-' }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(visitorActivity.sourceAttribution?.firstVisitTimestamp) }}</div>
              </div>

              <!-- Last Touch -->
              <div class="flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center mb-2 relative z-10">
                  <font-awesome-icon icon="bullseye" class="text-white text-sm" />
                </div>
                <div class="text-xs font-semibold text-amber-300">Last Touch</div>
                <div class="text-xs text-gray-400">{{ visitorActivity.sourceAttribution?.lastSource || 'Unknown' }}</div>
                <div class="text-xs text-gray-500">{{ visitorActivity.sourceAttribution?.lastSourceDetail || '-' }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(visitorActivity.sourceAttribution?.lastVisitTimestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- UTM Parameters -->
          <div v-if="hasUtmData" class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="utm in utmParams" :key="utm.key" class="bg-gray-900/50 rounded-lg p-2">
              <div class="text-xs text-gray-400 uppercase">{{ utm.label }}</div>
              <div class="text-sm text-blue-300 font-medium truncate">
                {{ visitorActivity.sourceAttribution[utm.key] || '-' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Device & Location Info -->
        <div class="p-6 border-b border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Device Information -->
            <div>
              <h3 class="text-sm font-semibold text-blue-300 mb-3 flex items-center">
                <font-awesome-icon icon="desktop" class="mr-2" />
                Device Information
              </h3>
              <div class="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Device:</span>
                  <span class="text-white capitalize">{{ visitorActivity?.deviceType || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Browser:</span>
                  <span class="text-white">{{ visitorActivity?.browser }} {{ visitorActivity?.browserVersion }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">OS:</span>
                  <span class="text-white">{{ visitorActivity?.os }} {{ visitorActivity?.osVersion }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Screen:</span>
                  <span class="text-white">{{ visitorActivity?.screenResolution || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Geographic Information -->
            <div>
              <h3 class="text-sm font-semibold text-blue-300 mb-3 flex items-center">
                <font-awesome-icon icon="globe" class="mr-2" />
                Geographic Information
              </h3>
              <div class="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Country:</span>
                  <span class="text-white">{{ visitorActivity?.country || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Region:</span>
                  <span class="text-white">{{ visitorActivity?.region || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">City:</span>
                  <span class="text-white">{{ visitorActivity?.city || '-' }}</span>
                </div>
                <div v-if="visitorActivity?.latitude && visitorActivity?.longitude" class="pt-2">
                  <a 
                    :href="`https://www.google.com/maps?q=${visitorActivity.latitude},${visitorActivity.longitude}`"
                    target="_blank"
                    class="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    <font-awesome-icon icon="map-marker-alt" class="mr-2" />
                    View on Map
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Timeline -->
        <div v-if="visitorActivity?.sessions?.length" class="p-6 border-b border-gray-700">
          <h3 class="text-sm font-semibold text-blue-300 mb-4 flex items-center">
            <font-awesome-icon icon="history" class="mr-2" />
            Session Timeline
          </h3>
          
          <div class="space-y-4 max-h-96 overflow-y-auto pr-2">
            <div 
              v-for="(session, index) in visitorActivity.sessions" 
              :key="session.id" 
              class="relative"
            >
              <!-- Session Card -->
              <div class="bg-gray-900/50 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="text-sm font-semibold text-blue-300">
                      Session #{{ visitorActivity.sessions.length - index }}
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ formatSessionDate(session.startedAt) }}
                    </div>
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ session.pageViewCount }} pages • {{ formatDuration(session.duration) }}
                  </div>
                </div>
                
                <!-- Session Details -->
                <div class="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <span class="text-gray-400">Entry Page:</span>
                    <div class="text-gray-300 truncate">{{ session.entryPage || '-' }}</div>
                  </div>
                  <div>
                    <span class="text-gray-400">Exit Page:</span>
                    <div class="text-gray-300 truncate">{{ session.exitPage || '-' }}</div>
                  </div>
                  <div v-if="session.sessionSource">
                    <span class="text-gray-400">Source:</span>
                    <div class="text-gray-300">
                      {{ session.sessionSource }} 
                      <span v-if="session.sessionMedium" class="text-gray-500">/ {{ session.sessionMedium }}</span>
                    </div>
                  </div>
                  <div v-if="session.sessionCampaign">
                    <span class="text-gray-400">Campaign:</span>
                    <div class="text-blue-400">{{ session.sessionCampaign }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Timeline Connector -->
              <div v-if="index < visitorActivity.sessions.length - 1" class="absolute left-4 top-full w-0.5 h-4 bg-blue-600/30"></div>
            </div>
          </div>
        </div>

        <!-- Recent Click Activity -->
        <div v-if="visitorActivity?.clicks?.length" class="p-6">
          <h3 class="text-sm font-semibold text-blue-300 mb-4 flex items-center">
            <font-awesome-icon icon="mouse-pointer" class="mr-2" />
            Recent Click Activity
          </h3>
          
          <div class="space-y-2 max-h-64 overflow-y-auto pr-2">
            <div 
              v-for="click in visitorActivity.clicks" 
              :key="click.id" 
              class="flex items-center gap-3 bg-gray-900/30 rounded-lg p-3"
            >
              <div class="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="mouse-pointer" class="text-green-400 text-sm" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-300">
                  <span class="font-medium">{{ click.button || 'Button' }}</span>
                  <span v-if="click.page?.url" class="text-gray-500 ml-2">
                    on {{ formatPageUrl(click.page.url) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(click.clicksDate) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  visitorActivity: {
    type: Object,
    default: null
  },
  isFetchingVisitorActivity: {
    type: Boolean,
    default: false
  },
  visitorActivityError: {
    type: String,
    default: null
  },
  websiteId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['fetch-visitor-activity']);

const router = useRouter();

const utmParams = [
  { key: 'campaign', label: 'Campaign' },
  { key: 'medium', label: 'Medium' },
  { key: 'content', label: 'Content' },
  { key: 'term', label: 'Term' }
];

const hasUtmData = computed(() => {
  return props.visitorActivity?.sourceAttribution && 
    utmParams.some(utm => props.visitorActivity.sourceAttribution[utm.key]);
});

function viewFullVisitorProfile() {
  if (props.visitorActivity?.id) {
    router.push({ 
      name: 'VisitorView', 
      params: { visitorId: props.visitorActivity.id } 
    });
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatSessionDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDuration(seconds) {
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

function formatPageUrl(url) {
  if (!url) return '-';
  try {
    const urlObj = new URL(url);
    return urlObj.pathname === '/' ? 'Home' : urlObj.pathname;
  } catch {
    return url;
  }
}
</script>

<style scoped>
.card-modern {
  border-radius: 1rem;
  background: #181f2a;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12);
  margin-bottom: 1.5rem;
}

/* Custom scrollbar for timeline */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.7);
}
</style>