<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-cyan-300 font-semibold">Attribution Flow Analysis</h3>
      <div class="flex items-center gap-2">
        <select 
          v-model="selectedModel" 
          class="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:border-cyan-500 focus:outline-none"
        >
          <option value="first_touch">First Touch</option>
          <option value="last_touch">Last Touch</option>
          <option value="linear">Linear</option>
          <option value="time_decay">Time Decay</option>
        </select>
        <div class="text-xs text-gray-400">Attribution Model</div>
      </div>
    </div>

    <div v-if="!attribution" class="text-center py-8 text-gray-400">
      No attribution data available
    </div>

    <div v-else class="space-y-6">
      <!-- Attribution Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gradient-to-r from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <font-awesome-icon :icon="getChannelIcon(attribution.firstSource)" class="text-emerald-400" />
            <span class="text-emerald-300 font-semibold">First Touch</span>
          </div>
          <div class="text-white font-medium">{{ formatSource(attribution.firstSource) }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ formatDate(attribution.firstVisitTimestamp) }}</div>
        </div>

        <div class="bg-gradient-to-r from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <font-awesome-icon :icon="getChannelIcon(attribution.lastSource)" class="text-amber-400" />
            <span class="text-amber-300 font-semibold">Last Touch</span>
          </div>
          <div class="text-white font-medium">{{ formatSource(attribution.lastSource) }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ formatDate(attribution.lastVisitTimestamp) }}</div>
        </div>

        <div class="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <font-awesome-icon icon="chart-line" class="text-purple-400" />
            <span class="text-purple-300 font-semibold">Attribution</span>
          </div>
          <div class="text-white font-medium">{{ selectedModel.replace('_', ' ').toUpperCase() }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ getAttributionWeight() }}% credit</div>
        </div>
      </div>

      <!-- Flow Chart Visualization -->
      <div class="relative bg-gray-900/60 rounded-lg p-6 border border-gray-700/50">
        <h4 class="text-cyan-300 font-semibold mb-4">Customer Journey Flow</h4>
        
        <!-- Journey Path -->
        <div class="relative">
          <!-- Connection Line -->
          <div class="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 opacity-30 transform -translate-y-1/2 rounded-full"></div>
          
          <!-- Touchpoints -->
          <div class="flex justify-between items-center relative z-10">
            <!-- First Touch -->
            <div class="flex flex-col items-center group cursor-pointer" @click="selectedTouchpoint = 'first'">
              <div class="relative">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg transform transition-all group-hover:scale-110 group-hover:shadow-xl">
                  <font-awesome-icon :icon="getChannelIcon(attribution.firstSource)" class="text-white text-xl" />
                </div>
                <div class="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                  1
                </div>
                <!-- Attribution Weight -->
                <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  {{ getFirstTouchWeight() }}%
                </div>
              </div>
              <div class="text-sm font-semibold text-emerald-300 mt-10">{{ formatSource(attribution.firstSource) }}</div>
              <div class="text-xs text-gray-400 text-center max-w-24">{{ attribution.firstSourceDetail || 'Direct' }}</div>
            </div>

            <!-- Middle Touchpoints (if any) -->
            <div v-if="hasMiddleTouchpoints" class="flex flex-col items-center">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <font-awesome-icon icon="ellipsis-h" class="text-white" />
              </div>
              <div class="text-xs text-cyan-300 mt-2">{{ middleTouchpointsCount }} more</div>
            </div>

            <!-- Last Touch -->
            <div class="flex flex-col items-center group cursor-pointer" @click="selectedTouchpoint = 'last'">
              <div class="relative">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg transform transition-all group-hover:scale-110 group-hover:shadow-xl">
                  <font-awesome-icon :icon="getChannelIcon(attribution.lastSource)" class="text-white text-xl" />
                </div>
                <div class="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                  {{ totalTouchpoints }}
                </div>
                <!-- Attribution Weight -->
                <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  {{ getLastTouchWeight() }}%
                </div>
              </div>
              <div class="text-sm font-semibold text-amber-300 mt-10">{{ formatSource(attribution.lastSource) }}</div>
              <div class="text-xs text-gray-400 text-center max-w-24">{{ attribution.lastSourceDetail || 'Direct' }}</div>
            </div>

            <!-- Conversion Point -->
            <div v-if="hasConversion" class="flex flex-col items-center">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <font-awesome-icon icon="star" class="text-white text-xl" />
              </div>
              <div class="text-sm font-semibold text-purple-300 mt-2">Conversion</div>
              <div class="text-xs text-gray-400">Goal achieved</div>
            </div>
          </div>
        </div>

        <!-- Journey Timeline -->
        <div class="mt-8 pt-4 border-t border-gray-700">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <div>{{ formatDate(attribution.firstVisitTimestamp) }}</div>
            <div v-if="journeyDuration">Journey Duration: {{ journeyDuration }}</div>
            <div>{{ formatDate(attribution.lastVisitTimestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- Campaign Intelligence -->
      <div v-if="hasUtmData" class="bg-gray-900/60 rounded-lg p-6 border border-gray-700/50">
        <h4 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="bullseye" class="mr-2" />
          Campaign Intelligence
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="utm in utmParams" :key="utm.key" class="group">
            <div 
              class="bg-gray-800/60 rounded-lg p-4 border border-gray-600/50 transition-all hover:border-cyan-500/50 hover:bg-gray-800/80"
              :class="{ 'border-cyan-500/50 bg-gray-800/80': attribution[utm.key] }"
            >
              <div class="flex items-center gap-2 mb-2">
                <font-awesome-icon :icon="utm.icon" class="text-cyan-400" />
                <div class="text-xs text-gray-400 uppercase font-semibold">{{ utm.label }}</div>
              </div>
              <div class="text-sm text-white font-medium break-all">
                {{ attribution[utm.key] || 'Not set' }}
              </div>
              <div v-if="attribution[utm.key]" class="text-xs text-cyan-300 mt-1">
                ✓ Tracked
              </div>
            </div>
          </div>
        </div>

        <!-- Campaign Performance Insights -->
        <div v-if="attribution.campaign" class="mt-6 p-4 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <font-awesome-icon icon="lightbulb" class="text-cyan-400" />
            <span class="text-cyan-300 font-semibold">Campaign Insights</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-400">Campaign:</span>
              <span class="text-white ml-2 font-medium">{{ attribution.campaign }}</span>
            </div>
            <div v-if="attribution.medium">
              <span class="text-gray-400">Channel Performance:</span>
              <span class="text-white ml-2">{{ getChannelPerformance(attribution.medium) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Referrer Analysis -->
      <div v-if="hasReferrerData" class="bg-gray-900/60 rounded-lg p-6 border border-gray-700/50">
        <h4 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="external-link-alt" class="mr-2" />
          Referrer Analysis
        </h4>
        
        <div class="space-y-4">
          <div v-if="attribution.firstReferrer" class="group">
            <div class="flex items-start gap-3 p-4 bg-gray-800/60 rounded-lg border border-gray-600/50 hover:border-emerald-500/50 transition-all">
              <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="flag" class="text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-emerald-300 mb-1">First Referrer</div>
                <a 
                  :href="attribution.firstReferrer" 
                  target="_blank" 
                  rel="noopener"
                  class="text-cyan-200 hover:text-cyan-100 break-all text-sm flex items-center gap-1"
                >
                  {{ attribution.firstReferrer }}
                  <font-awesome-icon icon="external-link-alt" class="text-xs" />
                </a>
                <div class="text-xs text-gray-400 mt-1">
                  Domain: {{ extractDomain(attribution.firstReferrer) }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="attribution.lastReferrer && attribution.lastReferrer !== attribution.firstReferrer" class="group">
            <div class="flex items-start gap-3 p-4 bg-gray-800/60 rounded-lg border border-gray-600/50 hover:border-amber-500/50 transition-all">
              <div class="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="bullseye" class="text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-amber-300 mb-1">Last Referrer</div>
                <a 
                  :href="attribution.lastReferrer" 
                  target="_blank" 
                  rel="noopener"
                  class="text-cyan-200 hover:text-cyan-100 break-all text-sm flex items-center gap-1"
                >
                  {{ attribution.lastReferrer }}
                  <font-awesome-icon icon="external-link-alt" class="text-xs" />
                </a>
                <div class="text-xs text-gray-400 mt-1">
                  Domain: {{ extractDomain(attribution.lastReferrer) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attribution Model Comparison -->
      <div class="bg-gray-900/60 rounded-lg p-6 border border-gray-700/50">
        <h4 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="balance-scale" class="mr-2" />
          Attribution Model Comparison
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            v-for="model in attributionModels" 
            :key="model.key"
            class="p-4 rounded-lg border-2 transition-all cursor-pointer"
            :class="selectedModel === model.key 
              ? 'border-cyan-500 bg-cyan-500/10' 
              : 'border-gray-600 bg-gray-800/60 hover:border-gray-500'"
            @click="selectedModel = model.key"
          >
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon :icon="model.icon" class="text-cyan-400" />
              <span class="text-sm font-semibold text-white">{{ model.label }}</span>
            </div>
            <div class="text-xs text-gray-400 mb-2">{{ model.description }}</div>
            <div class="text-lg font-bold text-cyan-300">
              {{ getModelCredit(model.key) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Touchpoint Details Modal -->
      <div v-if="selectedTouchpoint" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" @click="selectedTouchpoint = null">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-cyan-300 font-semibold">Touchpoint Details</h4>
            <button @click="selectedTouchpoint = null" class="text-gray-400 hover:text-white">
              <font-awesome-icon icon="times" />
            </button>
          </div>
          
          <div class="space-y-3">
            <div>
              <span class="text-gray-400">Source:</span>
              <span class="text-white ml-2 font-medium">
                {{ formatSource(selectedTouchpoint === 'first' ? attribution.firstSource : attribution.lastSource) }}
              </span>
            </div>
            <div>
              <span class="text-gray-400">Details:</span>
              <span class="text-white ml-2">
                {{ (selectedTouchpoint === 'first' ? attribution.firstSourceDetail : attribution.lastSourceDetail) || 'Not available' }}
              </span>
            </div>
            <div>
              <span class="text-gray-400">Timestamp:</span>
              <span class="text-white ml-2">
                {{ formatDate(selectedTouchpoint === 'first' ? attribution.firstVisitTimestamp : attribution.lastVisitTimestamp) }}
              </span>
            </div>
            <div v-if="selectedTouchpoint === 'first' ? attribution.firstReferrer : attribution.lastReferrer">
              <span class="text-gray-400">Referrer:</span>
              <a 
                :href="selectedTouchpoint === 'first' ? attribution.firstReferrer : attribution.lastReferrer" 
                target="_blank" 
                class="text-cyan-300 hover:text-cyan-200 ml-2 break-all"
              >
                {{ selectedTouchpoint === 'first' ? attribution.firstReferrer : attribution.lastReferrer }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps<{
  attribution: any;
}>();

const selectedModel = ref('first_touch');
const selectedTouchpoint = ref<string | null>(null);

const utmParams = [
  { key: 'campaign', label: 'Campaign', icon: 'bullseye' },
  { key: 'medium', label: 'Medium', icon: 'broadcast-tower' },
  { key: 'content', label: 'Content', icon: 'file-alt' },
  { key: 'term', label: 'Term', icon: 'search' }
];

const attributionModels = [
  {
    key: 'first_touch',
    label: 'First Touch',
    description: 'All credit to first interaction',
    icon: 'flag'
  },
  {
    key: 'last_touch',
    label: 'Last Touch',
    description: 'All credit to last interaction',
    icon: 'bullseye'
  },
  {
    key: 'linear',
    label: 'Linear',
    description: 'Equal credit distribution',
    icon: 'equals'
  },
  {
    key: 'time_decay',
    label: 'Time Decay',
    description: 'More credit to recent touches',
    icon: 'clock'
  }
];

const hasUtmData = computed(() => {
  return props.attribution && utmParams.some(utm => props.attribution[utm.key]);
});

const hasReferrerData = computed(() => {
  return props.attribution && (props.attribution.firstReferrer || props.attribution.lastReferrer);
});

const hasMiddleTouchpoints = computed(() => {
  // For now, assume if first and last are different, there might be middle touchpoints
  return props.attribution && 
    props.attribution.firstSource !== props.attribution.lastSource;
});

const middleTouchpointsCount = computed(() => {
  // This would come from actual journey data
  return hasMiddleTouchpoints.value ? 1 : 0;
});

const totalTouchpoints = computed(() => {
  return 2 + middleTouchpointsCount.value;
});

const hasConversion = computed(() => {
  // This would be determined by checking if visitor converted
  return props.attribution && props.attribution.customerId;
});

const journeyDuration = computed(() => {
  if (!props.attribution?.firstVisitTimestamp || !props.attribution?.lastVisitTimestamp) {
    return null;
  }
  
  const start = new Date(props.attribution.firstVisitTimestamp);
  const end = new Date(props.attribution.lastVisitTimestamp);
  const diffMs = end.getTime() - start.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

function getChannelIcon(source: string) {
  const iconMap: Record<string, string> = {
    'DIRECT_TRAFFIC': 'globe',
    'ORGANIC_SEARCH': 'search',
    'PAID_SEARCH': 'dollar-sign',
    'SOCIAL_MEDIA': 'share-alt',
    'EMAIL': 'envelope',
    'REFERRAL': 'external-link-alt',
    'GOOGLE_ADS': 'google',
    'FACEBOOK_ADS': 'facebook',
    'BING_ADS': 'search',
    'TIKTOK_ADS': 'video',
    'TWITTER_ADS': 'twitter',
    'UNKNOWN': 'question'
  };
  return iconMap[source] || 'question';
}

function formatSource(source: string) {
  if (!source) return 'Unknown';
  return source.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function extractDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getAttributionWeight() {
  // Return the weight based on selected model
  switch (selectedModel.value) {
    case 'first_touch': return 100;
    case 'last_touch': return 100;
    case 'linear': return 50;
    case 'time_decay': return 70;
    default: return 100;
  }
}

function getFirstTouchWeight() {
  switch (selectedModel.value) {
    case 'first_touch': return 100;
    case 'last_touch': return 0;
    case 'linear': return 50;
    case 'time_decay': return 30;
    default: return 100;
  }
}

function getLastTouchWeight() {
  switch (selectedModel.value) {
    case 'first_touch': return 0;
    case 'last_touch': return 100;
    case 'linear': return 50;
    case 'time_decay': return 70;
    default: return 0;
  }
}

function getModelCredit(modelKey: string) {
  switch (modelKey) {
    case 'first_touch': return formatSource(props.attribution?.firstSource) === formatSource(props.attribution?.lastSource) ? 100 : 100;
    case 'last_touch': return 100;
    case 'linear': return 50;
    case 'time_decay': return 70;
    default: return 0;
  }
}

function getChannelPerformance(medium: string) {
  const performanceMap: Record<string, string> = {
    'cpc': 'Paid advertising performing well',
    'organic': 'Strong SEO presence',
    'social': 'Good social media engagement',
    'email': 'Effective email marketing',
    'referral': 'Strong partnership network'
  };
  return performanceMap[medium?.toLowerCase()] || 'Channel analysis available';
}
</script>