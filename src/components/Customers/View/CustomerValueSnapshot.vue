<script setup>
import { ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { formatRelativeTime } from '@/helpers';

const props = defineProps({
  customerFinancials: {
    type: Object,
    required: true
  },
  latestProfitabilityAnalysis: Object,
  isFetchingProfitabilityAnalysis: Boolean,
  profitabilityAnalysisError: String
});

const emit = defineEmits(['fetch-profitability-analysis']);

// Formatting helpers
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `R ${Number(value).toFixed(2)}`;
  }
};

const getProfitClass = (value) => {
  if (value === null || value === undefined) return 'text-gray-500';
  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
};
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Value Snapshot</h2>
    <div class="grid grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</p>
        <p class="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">{{ formatCurrency(customerFinancials.totalRevenue) }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Costs</p>
        <p class="text-xl font-semibold text-red-600 dark:text-red-400 mt-1">{{ formatCurrency(customerFinancials.totalCosts) }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Profit</p>
        <p class="text-xl font-semibold mt-1" :class="getProfitClass(customerFinancials.netProfit)">{{ formatCurrency(customerFinancials.netProfit) }}</p>
      </div>
    </div>
    <!-- LLM Profitability Analysis -->
    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50">
       <div class="flex justify-between items-center mb-2">
         <h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AI Analysis</h4>
         <div class="flex items-center space-x-2">
            <span v-if="latestProfitabilityAnalysis?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                {{ formatRelativeTime(latestProfitabilityAnalysis.generatedAt) }}
            </span>
            <button @click="emit('fetch-profitability-analysis')" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingProfitabilityAnalysis" aria-label="Refresh AI profitability analysis">
                <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingProfitabilityAnalysis }" />
            </button>
         </div>
       </div>
       <div v-if="isFetchingProfitabilityAnalysis" class="text-center py-2">
         <p class="text-xs text-gray-500 dark:text-gray-400">Generating analysis...</p>
       </div>
       <div v-else-if="profitabilityAnalysisError" class="text-xs text-red-600 dark:text-red-400">
         Error: {{ profitabilityAnalysisError }}
       </div>
       <!-- Display latest analysis using v-html -->
       <div v-else-if="latestProfitabilityAnalysis?.content" v-html="latestProfitabilityAnalysis.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2"></div>
       <!-- Empty state -->
       <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic">
         No analysis available. Click refresh to generate.
       </div>
    </div>
  </section>
</template>