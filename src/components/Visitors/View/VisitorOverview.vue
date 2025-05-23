<template>
  <div class="card-modern p-6 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Visitor Overview</h2>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <span v-if="geoSummary">From: {{ geoSummary }}</span>
        </div>
      </div>
      <div>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          :class="isBot
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'"
        >
          <font-awesome-icon :icon="isBot ? 'robot' : 'user'" class="mr-1 text-base" />
          {{ isBot ? 'Bot Detected' : 'Human Visitor' }}
          <span v-if="botTag" class="ml-2 text-gray-500 dark:text-gray-400">({{ botTag }})</span>
        </span>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
      <div>
        <div class="text-xs text-gray-400">First Visit</div>
        <div class="font-semibold">{{ formatDate(firstVisit) }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Last Visit</div>
        <div class="font-semibold">{{ formatDate(lastVisit) }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Total Sessions</div>
        <div class="font-semibold">{{ totalSessions }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Avg. Session Duration</div>
        <div class="font-semibold">{{ avgSessionDuration }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Pages per Session</div>
        <div class="font-semibold">{{ pagesPerSession }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Total Page Views</div>
        <div class="font-semibold">{{ totalPageViews }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Total Time on Site</div>
        <div class="font-semibold">{{ totalTimeOnSite }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Language</div>
        <div class="font-semibold">{{ language || '-' }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Timezone</div>
        <div class="font-semibold">{{ timezone || '-' }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Region</div>
        <div class="font-semibold">{{ region || '-' }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Country Code</div>
        <div class="font-semibold">{{ countryCode || '-' }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Postal Code</div>
        <div class="font-semibold">{{ postalCode || '-' }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-400">Latitude / Longitude</div>
        <div class="font-semibold">{{ latitude ?? '-' }}, {{ longitude ?? '-' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps<{
  firstVisit?: string | null;
  lastVisit?: string | null;
  totalSessions?: number;
  avgSessionDuration?: number;
  pagesPerSession?: number;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  language?: string | null;
  totalPageViews?: number | null;
  totalTimeOnSite?: number | null;
  isBot?: boolean;
  botTag?: string | null;
}>();

const geoSummary = computed(() => {
  if (props.city && props.country) return `${props.city}, ${props.country}`;
  if (props.country) return props.country;
  return null;
});

const isBot = computed(() => !!props.isBot);
const botTag = computed(() => props.botTag);

function formatDate(date: string | null | undefined) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

const firstVisit = computed(() => props.firstVisit);
const lastVisit = computed(() => props.lastVisit);
const totalSessions = computed(() => props.totalSessions ?? '-');
const avgSessionDuration = computed(() =>
  props.avgSessionDuration !== undefined && props.avgSessionDuration !== null
    ? `${Math.round(props.avgSessionDuration / 60)} min`
    : '-'
);
const pagesPerSession = computed(() =>
  props.pagesPerSession !== undefined && props.pagesPerSession !== null
    ? props.pagesPerSession.toFixed(1)
    : '-'
);
const totalPageViews = computed(() => props.totalPageViews ?? '-');
const totalTimeOnSite = computed(() =>
  props.totalTimeOnSite !== undefined && props.totalTimeOnSite !== null
    ? `${props.totalTimeOnSite} sec`
    : '-'
);
const region = computed(() => props.region);
const countryCode = computed(() => props.countryCode);
const postalCode = computed(() => props.postalCode);
const latitude = computed(() => props.latitude);
const longitude = computed(() => props.longitude);
const timezone = computed(() => props.timezone);
const language = computed(() => props.language);
</script>