<!-- AttributionFlowChart.vue -->
<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <h3 class="text-cyan-300 font-semibold mb-6">Attribution Journey</h3>
    
    <div class="relative">
      <!-- Journey Line -->
      <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-600/30 transform -translate-y-1/2"></div>
      
      <!-- Journey Points -->
      <div class="flex justify-between relative">
        <!-- First Touch -->
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mb-2 relative z-10">
            <font-awesome-icon icon="flag" class="text-white" />
          </div>
          <div class="text-sm font-semibold text-emerald-300">First Touch</div>
          <div class="text-xs text-gray-400">{{ attribution?.firstSource || 'Unknown' }}</div>
          <div class="text-xs text-gray-500">{{ attribution?.firstSourceDetail || '-' }}</div>
          <div class="text-xs text-gray-500">{{ formatDate(attribution?.firstVisitTimestamp) }}</div>
        </div>

        <!-- Last Touch -->
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mb-2 relative z-10">
            <font-awesome-icon icon="bullseye" class="text-white" />
          </div>
          <div class="text-sm font-semibold text-amber-300">Last Touch</div>
          <div class="text-xs text-gray-400">{{ attribution?.lastSource || 'Unknown' }}</div>
          <div class="text-xs text-gray-500">{{ attribution?.lastSourceDetail || '-' }}</div>
          <div class="text-xs text-gray-500">{{ formatDate(attribution?.lastVisitTimestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- UTM Parameters Breakdown -->
    <div v-if="hasUtmData" class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="utm in utmParams" :key="utm.key" class="bg-gray-900/50 rounded-lg p-3">
        <div class="text-xs text-gray-400 uppercase">{{ utm.label }}</div>
        <div class="text-sm text-cyan-300 font-medium">{{ attribution[utm.key] || '-' }}</div>
      </div>
    </div>

    <!-- Referrer Information -->
    <div v-if="attribution?.firstReferrer || attribution?.lastReferrer" class="mt-6">
      <h4 class="text-sm font-medium text-cyan-300 mb-3">Referrer Information</h4>
      <div class="space-y-2">
        <div v-if="attribution?.firstReferrer" class="flex items-start gap-2">
          <span class="text-xs text-gray-400 w-20">First:</span>
          <a :href="attribution.firstReferrer" target="_blank" rel="noopener"
             class="text-sm text-cyan-200 hover:text-cyan-100 break-all">
            {{ attribution.firstReferrer }}
          </a>
        </div>
        <div v-if="attribution?.lastReferrer" class="flex items-start gap-2">
          <span class="text-xs text-gray-400 w-20">Last:</span>
          <a :href="attribution.lastReferrer" target="_blank" rel="noopener"
             class="text-sm text-cyan-200 hover:text-cyan-100 break-all">
            {{ attribution.lastReferrer }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps<{
  attribution: any;
}>();

const utmParams = [
  { key: 'campaign', label: 'Campaign' },
  { key: 'medium', label: 'Medium' },
  { key: 'content', label: 'Content' },
  { key: 'term', label: 'Term' }
];

const hasUtmData = computed(() => {
  return props.attribution && utmParams.some(utm => props.attribution[utm.key]);
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
</script>