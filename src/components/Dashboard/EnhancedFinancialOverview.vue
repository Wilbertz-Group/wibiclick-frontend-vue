<!-- wibiclick-frontend-vue/src/components/Dashboard/EnhancedFinancialOverview.vue -->
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import axios from 'axios'

const props = defineProps({
  financialOverview: {
    type: Object,
    default: () => null
  },
  websiteId: {
    type: String,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  loadingData: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh-data'])

const activeMetricsView = ref('cards') // 'cards' or 'table'
const showAdvancedMetrics = ref(false)

// Format currency (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

// Format percentage
const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A'
  return value.toFixed(1) + '%'
}

// Get percentage change with sign
const getPercentageChange = (current, previous) => {
  if (previous === null || previous === undefined || current === null || current === undefined) return 'N/A'
  if (previous === 0) return current === 0 ? '0.00' : '∞' // Handle division by zero
  const change = (((current - previous) / Math.abs(previous)) * 100)
  return change.toFixed(1) // Use one decimal place
}

// Helper function to format key names
const formatTitle = (key) => {
  if (!key) return ''
  // Improved formatting for keys like 'profitMargin'
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

// Get CSS class for comparison values
const getComparisonClass = (data, key) => {
  const current = data?.current
  const previous = data?.previous
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return 'text-gray-500 dark:text-gray-400'
  }

  if (key === 'totalExpenses') {
    // For expenses, lower is better
    return current < previous 
      ? 'text-green-600 dark:text-green-400' 
      : current > previous 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-gray-500 dark:text-gray-400'
  }
  
  // For other metrics, higher is generally better
  return current > previous 
    ? 'text-green-600 dark:text-green-400' 
    : current < previous 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-gray-500 dark:text-gray-400'
}

// Get icon for comparison values
const getComparisonIcon = (data, key) => {
  const current = data?.current
  const previous = data?.previous
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return 'minus'
  }

  if (key === 'totalExpenses') {
    // For expenses, lower is better (down arrow is good)
    return current < previous 
      ? 'arrow-down' 
      : current > previous 
        ? 'arrow-up' 
        : 'minus'
  }
  
  // For other metrics, higher is better (up arrow is good)
  return current > previous 
    ? 'arrow-up' 
    : current < previous 
      ? 'arrow-down' 
      : 'minus'
}

// Calculate profit trends over time
const profitTrends = computed(() => {
  if (!props.financialOverview) return { growing: false, consistent: false, rate: 0 }
  
  const current = props.financialOverview.netProfit?.current || 0
  const previous = props.financialOverview.netProfit?.previous || 0
  
  // Calculate monthly growth rate
  const growthRate = previous !== 0 ? ((current - previous) / previous) * 100 : 0
  
  return { 
    growing: current > previous, 
    consistent: Math.abs(growthRate) < 15, // Less than 15% change is considered stable
    rate: growthRate.toFixed(1)
  }
})

// Calculate additional financial ratios
const financialRatios = computed(() => {
  if (!props.financialOverview) return {}
  
  const earnings = props.financialOverview.totalEarnings?.current || 0
  const expenses = props.financialOverview.totalExpenses?.current || 0
  const profit = props.financialOverview.netProfit?.current || 0
  
  // Expense ratio (expenses/earnings)
  const expenseRatio = earnings !== 0 ? (expenses / earnings) * 100 : 0
  
  // Profit margin (already included in financialOverview)
  const profitMargin = props.financialOverview.profitMargin?.current || 0
  
  // Earnings to expense ratio (earnings/expenses)
  const earningsToExpenseRatio = expenses !== 0 ? earnings / expenses : 0
  
  // Return on expense (profit/expenses)
  const returnOnExpense = expenses !== 0 ? (profit / expenses) * 100 : 0
  
  return {
    expenseRatio: expenseRatio.toFixed(1),
    profitMargin: profitMargin.toFixed(1),
    earningsToExpenseRatio: earningsToExpenseRatio.toFixed(2),
    returnOnExpense: returnOnExpense.toFixed(1)
  }
})

// Calculate health score (0-100) based on multiple factors
const financialHealthScore = computed(() => {
  if (!props.financialOverview) return { score: 0, status: 'N/A' }
  
  let score = 50 // Start with neutral score
  
  // Factor 1: Profit margin (0-30 points)
  const profitMargin = props.financialOverview.profitMargin?.current || 0
  if (profitMargin > 30) score += 30
  else if (profitMargin > 0) score += profitMargin
  else score -= Math.min(20, Math.abs(profitMargin))
  
  // Factor 2: Profit trend (0-30 points)
  const profitTrend = profitTrends.value
  if (profitTrend.growing) score += 15
  if (profitTrend.consistent) score += 15
  else if (parseFloat(profitTrend.rate) > 0) score += parseFloat(profitTrend.rate)
  else score -= Math.min(20, Math.abs(parseFloat(profitTrend.rate)))
  
  // Factor 3: Earnings to expense ratio (0-20 points)
  const earningsToExpense = parseFloat(financialRatios.value.earningsToExpenseRatio || 0)
  if (earningsToExpense > 2) score += 20
  else if (earningsToExpense > 1) score += (earningsToExpense - 1) * 20
  else score -= Math.min(20, (1 - earningsToExpense) * 20)
  
  // Determine status
  let status = 'Poor'
  if (score >= 90) status = 'Excellent'
  else if (score >= 75) status = 'Strong'
  else if (score >= 60) status = 'Good'
  else if (score >= 40) status = 'Fair'
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))
  
  return { score: Math.round(score), status }
})

// Method to handle refresh
const refreshData = () => {
  emit('refresh-data')
}
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <!-- Header with title, toggle, and refresh button -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Financial Overview</h2>
        <div 
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" 
          :class="financialHealthScore.score >= 60 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : financialHealthScore.score >= 40
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'"
        >
          {{ financialHealthScore.status }}
          <span class="ml-1">{{ financialHealthScore.score }}/100</span>
        </div>
      </div>
      
      <div class="flex items-center space-x-3 mt-2 sm:mt-0">
        <!-- View toggle -->
        <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
          <button 
            @click="activeMetricsView = 'cards'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              activeMetricsView === 'cards' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
          >
            <font-awesome-icon icon="th-large" class="mr-1" />
            Cards
          </button>
          <button 
            @click="activeMetricsView = 'table'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              activeMetricsView === 'table' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
          >
            <font-awesome-icon icon="table" class="mr-1" />
            Table
          </button>
        </div>
        
        <!-- Advanced metrics toggle -->
        <button @click="showAdvancedMetrics = !showAdvancedMetrics" class="btn-ghost-modern text-xs">
          <font-awesome-icon :icon="showAdvancedMetrics ? 'compress-alt' : 'expand-alt'" class="mr-1" />
          {{ showAdvancedMetrics ? 'Simple View' : 'Advanced Metrics' }}
        </button>
        
        <!-- Refresh button -->
        <button @click="refreshData" class="btn-icon-modern" title="Refresh financial data">
          <font-awesome-icon icon="sync" :class="{ 'fa-spin': loadingData }" />
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loadingData && !financialOverview" class="flex justify-center items-center py-16">
      <ScaleLoader color="#4f46e5" />
      <p class="ml-4 text-sm text-gray-500 dark:text-gray-400">Loading financial data...</p>
    </div>
    
    <!-- Main Content -->
    <template v-else-if="financialOverview">
      <div class="grid grid-cols-1 gap-8">
        <!-- Financial Metrics Section -->
        <div>
          <!-- Card View -->
          <div v-if="activeMetricsView === 'cards'" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <!-- Basic Metrics -->
            <div
              v-for="(data, key) in financialOverview"
              :key="key"
              class="p-4 rounded-lg border"
              :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
            >
              <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ formatTitle(key) }}
              </h3>
              <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ key === 'profitMargin' ? formatPercentage(data.current) : formatCurrency(data.current) }}
              </p>
              <div class="flex items-center mt-1">
                <p class="text-xs" :class="getComparisonClass(data, key)">
                  <font-awesome-icon :icon="getComparisonIcon(data, key)" class="mr-0.5" />
                  {{ getPercentageChange(data.current, data.previous) }}%
                </p>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
            
            <!-- Advanced Metrics (if enabled) -->
            <template v-if="showAdvancedMetrics">
              <!-- Expense Ratio -->
              <div 
                class="p-4 rounded-lg border"
                :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
              >
                <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                  Expense Ratio
                </h3>
                <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
                  {{ financialRatios.expenseRatio }}%
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Expenses / Earnings
                </p>
              </div>
              
              <!-- Earnings/Expense Ratio -->
              <div 
                class="p-4 rounded-lg border"
                :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
              >
                <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                  Earnings/Expense Ratio
                </h3>
                <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
                  {{ financialRatios.earningsToExpenseRatio }}x
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How much earned per R1 spent
                </p>
              </div>
              
              <!-- Return on Expense -->
              <div 
                class="p-4 rounded-lg border"
                :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
              >
                <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                  Return on Expense
                </h3>
                <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-white' : 'text-gray-900'">
                  {{ financialRatios.returnOnExpense }}%
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Profit / Expenses
                </p>
              </div>
              
              <!-- Profit Trend -->
              <div 
                class="p-4 rounded-lg border"
                :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
              >
                <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                  Profit Trend
                </h3>
                <p class="text-xl font-bold mt-1" :class="profitTrends.growing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ profitTrends.growing ? 'Growing' : 'Declining' }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Avg. {{ profitTrends.rate }}% per month
                </p>
              </div>
            </template>
          </div>
          
          <!-- Table View -->
          <div v-else-if="activeMetricsView === 'table'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead :class="isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'">
                <tr>
                  <th class="th-modern">Metric</th>
                  <th class="th-modern text-right">Current</th>
                  <th class="th-modern text-right">Previous</th>
                  <th class="th-modern text-right">Change</th>
                </tr>
              </thead>
              <tbody class="divide-y" :class="isDarkMode ? 'divide-gray-700/50' : 'divide-gray-100'">
                <tr 
                  v-for="(data, key) in financialOverview" 
                  :key="key" 
                  class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <td class="td-modern font-medium">{{ formatTitle(key) }}</td>
                  <td class="td-modern text-right">
                    {{ key === 'profitMargin' ? formatPercentage(data.current) : formatCurrency(data.current) }}
                  </td>
                  <td class="td-modern text-right">
                    {{ key === 'profitMargin' ? formatPercentage(data.previous) : formatCurrency(data.previous) }}
                  </td>
                  <td 
                    class="td-modern text-right"
                    :class="getComparisonClass(data, key)"
                  >
                    <font-awesome-icon :icon="getComparisonIcon(data, key)" class="mr-0.5" />
                    {{ getPercentageChange(data.current, data.previous) }}%
                  </td>
                </tr>
                
                <!-- Advanced metrics in table (if enabled) -->
                <template v-if="showAdvancedMetrics">
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td class="td-modern font-medium">Expense Ratio</td>
                    <td class="td-modern text-right">{{ financialRatios.expenseRatio }}%</td>
                    <td class="td-modern text-right">—</td>
                    <td class="td-modern text-right">—</td>
                  </tr>
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td class="td-modern font-medium">Earnings/Expense Ratio</td>
                    <td class="td-modern text-right">{{ financialRatios.earningsToExpenseRatio }}x</td>
                    <td class="td-modern text-right">—</td>
                    <td class="td-modern text-right">—</td>
                  </tr>
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td class="td-modern font-medium">Return on Expense</td>
                    <td class="td-modern text-right">{{ financialRatios.returnOnExpense }}%</td>
                    <td class="td-modern text-right">—</td>
                    <td class="td-modern text-right">—</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Distribution Summary (non-chart version) -->
        <div v-if="showAdvancedMetrics" class="border rounded-lg p-4" :class="isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'">
          <h3 class="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">Earnings Distribution</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Company Earnings -->
            <div class="flex flex-col">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <span class="w-3 h-3 bg-indigo-500 rounded-full mr-1.5"></span>
                  Company Earnings
                </span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formatCurrency(financialOverview.companyEarnings?.current || 0) }}
                </span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                <div 
                  class="h-2 bg-indigo-500 rounded-full" 
                  :style="{
                    width: `${
                      ((financialOverview.companyEarnings?.current || 0) / 
                      ((financialOverview.companyEarnings?.current || 0) + 
                      (financialOverview.technicianEarnings?.current || 0))) * 100
                    }%`
                  }"
                ></div>
              </div>
              <span class="text-xs mt-1 self-end font-medium text-indigo-600 dark:text-indigo-400">
                {{ Math.round(
                  ((financialOverview.companyEarnings?.current || 0) / 
                  ((financialOverview.companyEarnings?.current || 0) + 
                  (financialOverview.technicianEarnings?.current || 0))) * 100
                ) }}%
              </span>
            </div>
            
            <!-- Technician Earnings -->
            <div class="flex flex-col">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <span class="w-3 h-3 bg-emerald-500 rounded-full mr-1.5"></span>
                  Technician Earnings
                </span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formatCurrency(financialOverview.technicianEarnings?.current || 0) }}
                </span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                <div 
                  class="h-2 bg-emerald-500 rounded-full" 
                  :style="{
                    width: `${
                      ((financialOverview.technicianEarnings?.current || 0) / 
                      ((financialOverview.companyEarnings?.current || 0) + 
                      (financialOverview.technicianEarnings?.current || 0))) * 100
                    }%`
                  }"
                ></div>
              </div>
              <span class="text-xs mt-1 self-end font-medium text-emerald-600 dark:text-emerald-400">
                {{ Math.round(
                  ((financialOverview.technicianEarnings?.current || 0) / 
                  ((financialOverview.companyEarnings?.current || 0) + 
                  (financialOverview.technicianEarnings?.current || 0))) * 100
                ) }}%
              </span>
            </div>
            
            <!-- Total Summary -->
            <div class="sm:col-span-2 pt-3 border-t" :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total Earnings:</span>
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(
                    (financialOverview.companyEarnings?.current || 0) + 
                    (financialOverview.technicianEarnings?.current || 0)
                  ) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Empty State -->
    <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
      <font-awesome-icon icon="chart-line" class="text-5xl mb-3 opacity-30" />
      <p>No financial data available for this period.</p>
      <button @click="refreshData" class="btn-secondary-modern mt-4">
        <font-awesome-icon icon="sync" class="mr-2" />
        Refresh
      </button>
    </div>
  </section>
</template>