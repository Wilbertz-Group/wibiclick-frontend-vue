<!-- GeographicVisualization.vue -->
<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <h3 class="text-cyan-300 font-semibold mb-4">Visitor Geographic Distribution</h3>
    
    <div v-if="loading" class="flex justify-center py-8">
      <span class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
    </div>
    
    <div v-else-if="error" class="text-center py-8 text-red-300">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Country Distribution -->
      <div class="mb-8">
        <h4 class="text-sm font-medium text-cyan-200 mb-4">By Country</h4>
        <div class="space-y-2">
          <div v-for="country in countryDistribution" :key="country.country" 
               class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-300">{{ country.country }}</span>
              <span class="text-xs text-gray-500">({{ country.countryCode }})</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-700 rounded-full h-2">
                <div class="bg-cyan-500 h-2 rounded-full" 
                     :style="{ width: `${(country._count / maxCountryCount) * 100}%` }">
                </div>
              </div>
              <span class="text-sm text-gray-400 w-12 text-right">{{ country._count }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- South African Regions -->
      <div v-if="hasSouthAfricanVisitors">
        <h4 class="text-sm font-medium text-cyan-200 mb-4">South African Regions</h4>
        <div class="space-y-2">
          <div v-for="region in southAfricanRegions" :key="region.region" 
               class="flex items-center justify-between">
            <span class="text-sm text-gray-300">{{ region.region }}</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-700 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full" 
                     :style="{ width: `${(region._count / maxRegionCount) * 100}%` }">
                </div>
              </div>
              <span class="text-sm text-gray-400 w-12 text-right">{{ region._count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{
  websiteId: string;
}>();

const countryDistribution = ref<any[]>([]);
const southAfricanRegions = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const maxCountryCount = computed(() => {
  return Math.max(...countryDistribution.value.map(c => c._count), 1);
});

const maxRegionCount = computed(() => {
  return Math.max(...southAfricanRegions.value.map(r => r._count), 1);
});

const hasSouthAfricanVisitors = computed(() => {
  return southAfricanRegions.value.length > 0;
});

async function fetchGeographicData() {
  loading.value = true;
  error.value = null;
  
  try {
    const { data } = await axios.get('/api/analytics/visitors/geographic', {
      params: { websiteId: props.websiteId }
    });
    
    countryDistribution.value = data.countries;
    southAfricanRegions.value = data.southAfricanRegions;
  } catch (err: any) {
    error.value = 'Failed to load geographic data';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchGeographicData);
</script>