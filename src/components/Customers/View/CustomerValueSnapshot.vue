<!-- Enhanced wibiclick-frontend-vue/src/components/Customers/View/CustomerValueSnapshot.vue -->
<script setup>
import { computed, onMounted, watch, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { formatCurrency, getProfitClass, formatRelativeTime } from '@/utils/formatters';

const props = defineProps({
  customerFinancials: {
    type: Object,
    required: true
  },
  latestProfitabilityAnalysis: Object,
  isFetchingProfitabilityAnalysis: Boolean,
  profitabilityAnalysisError: String,
  customer: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['fetch-profitability-analysis', 'fetch-financials']);

// Local state for animations and interactions
const isExpanded = ref(false);
const animationKey = ref(0);
const hoveredMetric = ref(null);

// --- ENHANCED FINANCIAL CALCULATIONS ---

// Total invoiced amount (expected revenue)
const totalInvoiced = computed(() => {
  let total = 0;
  
  if (Array.isArray(props.customer?.invoice)) {
    total = props.customer.invoice.reduce((sum, invoice) => {
      return sum + (Number(invoice.sales) || 0);
    }, 0);
  }
  
  return total;
});

// Total received payments
const totalPaid = computed(() => {
  let total = 0;
  
  if (Array.isArray(props.customer?.payments)) {
    total = props.customer.payments.reduce((sum, payment) => {
      if (payment.status === 'successful') {
        return sum + (Number(payment.total) || 0);
      }
      return sum;
    }, 0);
  }
  
  return total;
});

// Outstanding balance (invoiced but not paid)
const outstandingBalance = computed(() => {
  return totalInvoiced.value - totalPaid.value;
});

// Total expenses recorded for this customer
const totalExpenses = computed(() => {
  let total = 0;
  
  // Direct expenses
  if (Array.isArray(props.customer?.expenses)) {
    total += props.customer.expenses.reduce((sum, expense) => {
      return sum + (Number(expense.amount) || 0);
    }, 0);
  }
  
  // Parts costs from jobs
  if (Array.isArray(props.customer?.jobs)) {
    total += props.customer.jobs.reduce((sum, job) => {
      const partsCost = (Number(job.parts) || 0) + (Number(job.partsExpense) || 0);
      const fuelExpense = Number(job.fuelExpense) || 0;
      return sum + partsCost + fuelExpense;
    }, 0);
  }
  
  return total;
});

// Actual profit (payments received minus expenses)
const actualProfit = computed(() => {
  return totalPaid.value - totalExpenses.value;
});

// Potential profit (invoiced amount minus expenses)
const potentialProfit = computed(() => {
  return totalInvoiced.value - totalExpenses.value;
});

// Job completion rate
const jobCompletionRate = computed(() => {
  if (!Array.isArray(props.customer?.jobs) || props.customer.jobs.length === 0) {
    return null;
  }
  
  const totalJobs = props.customer.jobs.length;
  const completedJobs = props.customer.jobs.filter(job => 
    ['completed', 'invoiced', 'paid'].includes(job.jobStatus?.toLowerCase())
  ).length;
  
  return (completedJobs / totalJobs) * 100;
});

// Invoice payment rate (percentage of invoices paid)
const invoicePaymentRate = computed(() => {
  if (!Array.isArray(props.customer?.invoice) || props.customer.invoice.length === 0) {
    return null;
  }
  
  const totalInvoices = props.customer.invoice.length;
  const paidInvoices = props.customer.invoice.filter(invoice => invoice.paid).length;
  
  return (paidInvoices / totalInvoices) * 100;
});

// Customer lifetime value calculation
const customerLifetimeValue = computed(() => {
  if (!props.customer?.createdAt) return 0;
  
  const customerAge = Date.now() - new Date(props.customer.createdAt).getTime();
  const monthsActive = Math.max(1, customerAge / (1000 * 60 * 60 * 24 * 30));
  const monthlyValue = totalPaid.value / monthsActive;
  
  // Project 24 months forward
  return monthlyValue * 24;
});

// Revenue growth trend (comparing recent vs older invoices)
const revenueGrowthTrend = computed(() => {
  if (!Array.isArray(props.customer?.invoice) || props.customer.invoice.length < 2) {
    return null;
  }
  
  const invoices = [...props.customer.invoice]
    .filter(inv => inv.createdAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  if (invoices.length < 2) return null;
  
  const half = Math.floor(invoices.length / 2);
  const olderHalf = invoices.slice(0, half);
  const newerHalf = invoices.slice(half);
  
  const olderAvg = olderHalf.reduce((sum, inv) => sum + (Number(inv.sales) || 0), 0) / olderHalf.length;
  const newerAvg = newerHalf.reduce((sum, inv) => sum + (Number(inv.sales) || 0), 0) / newerHalf.length;
  
  if (olderAvg === 0) return null;
  
  return ((newerAvg - olderAvg) / olderAvg) * 100;
});

// Risk indicators
const riskIndicators = computed(() => {
  const risks = [];
  
  if (outstandingBalance.value > totalPaid.value * 0.3) {
    risks.push({ type: 'payment', message: 'High outstanding balance', level: 'high' });
  }
  
  if (invoicePaymentRate.value !== null && invoicePaymentRate.value < 60) {
    risks.push({ type: 'payment', message: 'Low payment rate', level: 'medium' });
  }
  
  if (jobCompletionRate.value !== null && jobCompletionRate.value < 70) {
    risks.push({ type: 'service', message: 'Low job completion rate', level: 'medium' });
  }
  
  if (actualProfit.value < 0) {
    risks.push({ type: 'profit', message: 'Negative profit margin', level: 'high' });
  }
  
  return risks;
});

// Performance score (0-100)
const performanceScore = computed(() => {
  let score = 50; // Base score
  
  // Payment performance (30% weight)
  if (invoicePaymentRate.value !== null) {
    score += (invoicePaymentRate.value - 50) * 0.3;
  }
  
  // Job completion performance (20% weight)
  if (jobCompletionRate.value !== null) {
    score += (jobCompletionRate.value - 50) * 0.2;
  }
  
  // Profitability (30% weight)
  const profitMargin = totalPaid.value > 0 ? (actualProfit.value / totalPaid.value) * 100 : 0;
  score += (profitMargin - 10) * 0.3; // Assuming 10% is average
  
  // Growth trend (20% weight)
  if (revenueGrowthTrend.value !== null) {
    score += Math.min(20, Math.max(-20, revenueGrowthTrend.value)) * 0.2;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
});

// Get performance color class
const getPerformanceColor = (score) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

// Format percentage with color
const formatPercentageWithColor = (value, isGrowth = false) => {
  if (value === null) return { text: 'N/A', class: 'text-gray-500' };
  
  const formatted = `${value >= 0 && isGrowth ? '+' : ''}${Math.round(value)}%`;
  let colorClass = 'text-gray-600 dark:text-gray-400';
  
  if (isGrowth) {
    colorClass = value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  } else {
    if (value >= 80) colorClass = 'text-green-600 dark:text-green-400';
    else if (value >= 60) colorClass = 'text-yellow-600 dark:text-yellow-400';
    else if (value >= 40) colorClass = 'text-orange-600 dark:text-orange-400';
    else colorClass = 'text-red-600 dark:text-red-400';
  }
  
  return { text: formatted, class: colorClass };
};

// Refresh data and trigger animations
const refreshData = () => {
  emit('fetch-financials');
  animationKey.value += 1;
};

// Trigger fetches when component mounts
onMounted(() => {
  if (props.customer?.id) {
    emit('fetch-financials');
  }
});

// Watch for customer changes to fetch financials
watch(() => props.customer?.id, (newId) => {
  if (newId) {
    emit('fetch-financials');
  }
}, { immediate: true });
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-xl shadow-blue-100/50 dark:shadow-black/20">
    
    <!-- Decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl"></div>
      <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-xl"></div>
    </div>
    
    <!-- Header with enhanced styling -->
    <div class="relative z-10 flex justify-between items-center p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <FontAwesomeIcon icon="chart-line" class="text-white text-lg" />
        </div>
        <div>
          <h2 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Customer Value Analytics
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Real-time financial insights</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Performance Score Badge -->
        <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm">
          <div class="w-2 h-2 rounded-full" :class="performanceScore >= 70 ? 'bg-green-500' : performanceScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'"></div>
          <span class="text-xs font-semibold" :class="getPerformanceColor(performanceScore)">
            {{ performanceScore }}/100
          </span>
        </div>
        
        <button 
          @click="refreshData" 
          class="group flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 rounded-xl border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:scale-105" 
          title="Refresh financial data"
        >
          <FontAwesomeIcon icon="sync" class="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </button>
        
        <button 
          @click="isExpanded = !isExpanded"
          class="group flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 rounded-xl border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
          title="Toggle detailed view"
        >
          <FontAwesomeIcon 
            :icon="isExpanded ? 'chevron-up' : 'chevron-down'" 
            class="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200"
          />
        </button>
      </div>
    </div>
    
    <!-- Key Metrics Grid with enhanced visual hierarchy -->
    <div class="relative z-10 p-6">
      <!-- Primary Financial Overview -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Total Revenue -->
        <div 
          class="group relative p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
          @mouseenter="hoveredMetric = 'revenue'"
          @mouseleave="hoveredMetric = null"
        >
          <div class="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon="chart-line" class="text-blue-500 text-lg" />
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Total Invoiced</p>
          <p class="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-100">{{ formatCurrency(totalInvoiced) }}</p>
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <!-- Total Received -->
        <div 
          class="group relative p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
          @mouseenter="hoveredMetric = 'received'"
          @mouseleave="hoveredMetric = null"
        >
          <div class="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon="money-bill-wave" class="text-green-500 text-lg" />
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider mb-1">Total Received</p>
          <p class="text-lg lg:text-xl font-bold text-green-900 dark:text-green-100">{{ formatCurrency(totalPaid) }}</p>
          <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <!-- Net Profit -->
        <div 
          class="group relative p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
          @mouseenter="hoveredMetric = 'profit'"
          @mouseleave="hoveredMetric = null"
        >
          <div class="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon="trophy" class="text-purple-500 text-lg" />
            <div class="w-2 h-2 rounded-full animate-pulse" :class="actualProfit >= 0 ? 'bg-green-500' : 'bg-red-500'"></div>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Net Profit</p>
          <p class="text-lg lg:text-xl font-bold" :class="getProfitClass(actualProfit)">{{ formatCurrency(actualProfit) }}</p>
          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <!-- Outstanding Balance -->
        <div 
          class="group relative p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
          @mouseenter="hoveredMetric = 'outstanding'"
          @mouseleave="hoveredMetric = null"
        >
          <div class="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon="exclamation-triangle" class="text-orange-500 text-lg" />
            <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
          <p class="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">Outstanding</p>
          <p class="text-lg lg:text-xl font-bold text-orange-900 dark:text-orange-100">{{ formatCurrency(outstandingBalance) }}</p>
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>
      
      <!-- Performance Indicators -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- Payment Rate with Progress Bar -->
        <div class="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm" v-if="invoicePaymentRate !== null">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Rate</span>
            <span class="text-lg font-bold" :class="formatPercentageWithColor(invoicePaymentRate).class">
              {{ formatPercentageWithColor(invoicePaymentRate).text }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-1000 ease-out"
              :class="invoicePaymentRate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                     invoicePaymentRate >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                     'bg-gradient-to-r from-red-400 to-red-500'"
              :style="`width: ${Math.min(100, Math.max(0, invoicePaymentRate))}%`"
            ></div>
          </div>
        </div>
        
        <!-- Job Completion Rate -->
        <div class="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm" v-if="jobCompletionRate !== null">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Job Completion</span>
            <span class="text-lg font-bold" :class="formatPercentageWithColor(jobCompletionRate).class">
              {{ formatPercentageWithColor(jobCompletionRate).text }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-1000 ease-out"
              :class="jobCompletionRate >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 
                     jobCompletionRate >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                     'bg-gradient-to-r from-red-400 to-red-500'"
              :style="`width: ${Math.min(100, Math.max(0, jobCompletionRate))}%`"
            ></div>
          </div>
        </div>
        
        <!-- Revenue Growth Trend -->
        <div class="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm" v-if="revenueGrowthTrend !== null">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue Trend</span>
            <span class="text-lg font-bold" :class="formatPercentageWithColor(revenueGrowthTrend, true).class">
              {{ formatPercentageWithColor(revenueGrowthTrend, true).text }}
            </span>
          </div>
          <div class="flex items-center">
            <FontAwesomeIcon 
              :icon="revenueGrowthTrend > 0 ? 'arrow-up' : 'arrow-down'" 
              :class="revenueGrowthTrend > 0 ? 'text-green-500' : 'text-red-500'"
              class="mr-2"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">vs. previous period</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Expanded Details Section -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-screen"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 max-h-screen"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="isExpanded" class="border-t border-gray-200/50 dark:border-gray-700/50 p-6 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
        <!-- Additional Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div class="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Expenses</h5>
            <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ formatCurrency(totalExpenses) }}</p>
          </div>
          
          <div class="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Potential Profit</h5>
            <p class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ formatCurrency(potentialProfit) }}</p>
          </div>
          
          <div class="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lifetime Value (Est.)</h5>
            <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ formatCurrency(customerLifetimeValue) }}</p>
          </div>
        </div>
        
        <!-- LLM Profitability Analysis with enhanced styling -->
        <div class="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-200/50 dark:border-indigo-700/50">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon="brain" class="text-white text-sm" />
              </div>
              <h4 class="text-lg font-semibold text-indigo-800 dark:text-indigo-200">AI Profitability Analysis</h4>
            </div>
            <div class="flex items-center space-x-3">
              <span v-if="latestProfitabilityAnalysis?.generatedAt" class="text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full">
                {{ formatRelativeTime(latestProfitabilityAnalysis.generatedAt) }}
              </span>
              <button 
                @click="emit('fetch-profitability-analysis')" 
                class="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-800/50 hover:bg-indigo-200 dark:hover:bg-indigo-700/50 rounded-lg border border-indigo-200 dark:border-indigo-600 transition-all duration-200" 
                :disabled="isFetchingProfitabilityAnalysis"
                title="Refresh AI analysis"
              >
                <FontAwesomeIcon 
                  icon="sync" 
                  :class="{ 'fa-spin': isFetchingProfitabilityAnalysis }"
                  class="text-indigo-600 dark:text-indigo-400 text-xs"
                />
              </button>
            </div>
          </div>
          
          <div v-if="isFetchingProfitabilityAnalysis" class="flex items-center justify-center py-8">
            <div class="flex items-center space-x-3">
              <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-indigo-600 dark:text-indigo-400">Analyzing customer profitability...</span>
            </div>
          </div>
          
          <div v-else-if="profitabilityAnalysisError" class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg">
            <div class="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <FontAwesomeIcon icon="exclamation-circle" />
              <span class="text-sm font-medium">Analysis Error</span>
            </div>
            <p class="text-sm text-red-500 dark:text-red-400 mt-1">{{ profitabilityAnalysisError }}</p>
          </div>
          
          <div v-else-if="latestProfitabilityAnalysis?.analysis" class="prose prose-sm dark:prose-invert max-w-none">
            <div class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{{ latestProfitabilityAnalysis.analysis }}</div>
            </div>
          </div>
          
          <div v-else class="text-center py-6">
            <FontAwesomeIcon icon="chart-bar" class="text-4xl text-indigo-300 dark:text-indigo-600 mb-3" />
            <p class="text-indigo-600 dark:text-indigo-400 mb-3">No AI analysis available</p>
            <button 
              @click="emit('fetch-profitability-analysis')" 
              class="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200"
            >
              <FontAwesomeIcon icon="brain" class="mr-2" />
              Generate Analysis
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Bottom Status Bar -->
    <div class="relative z-10 px-6 py-3 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-200/60 dark:border-gray-700/60 rounded-b-2xl backdrop-blur-sm">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center space-x-4">
          <span>Last updated: {{ formatRelativeTime(Date.now()) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.loading-spinner {
  @apply w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin;
}

/* Custom animations for metrics */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
  }
}

.metric-card {
  animation: slideInUp 0.6s ease-out;
}

.metric-card:hover {
  animation: pulseGlow 2s infinite;
}

/* Progress bar animations */
@keyframes progressGrow {
  from {
    width: 0%;
  }
}

.progress-bar {
  animation: progressGrow 1s ease-out;
}

/* Custom scrollbar for expanded content */
.expanded-content::-webkit-scrollbar {
  width: 6px;
}

.expanded-content::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded-full;
}

.expanded-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500;
}

/* Responsive text sizing */
@media (max-width: 640px) {
  .metric-value {
    @apply text-base;
  }
  
  .metric-label {
    @apply text-xs;
  }
}

/* Dark mode improvements */
@media (prefers-color-scheme: dark) {
  .glass-effect {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles for better accessibility */
button:focus-visible,
.metric-card:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800;
}

/* Enhanced hover effects */
.metric-card:hover {
  transform: translateY(-2px);
  transition: all 0.2s ease-out;
}

/* Gradient text effects */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Loading skeleton styles */
.skeleton {
  @apply animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>