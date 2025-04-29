<script setup>
import { computed, onMounted, watch } from 'vue';
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

// --- IMPROVED FINANCIAL CALCULATIONS ---

// Total invoiced amount (expected revenue)
const totalInvoiced = computed(() => {
  let total = 0;
  
  if (Array.isArray(props.customer?.invoice)) {
    total = props.customer.invoice.reduce((sum, invoice) => {
      // Include all invoice amounts regardless of payment status
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
      // Only include successful payments
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
      // Include parts and parts expense
      const partsCost = (Number(job.parts) || 0) + (Number(job.partsExpense) || 0);
      // Also include fuel expenses if present
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

// Trigger financials fetch when component mounts
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
  <section class="card-modern p-5 sm:p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Client Value Snapshot</h2>
      <button 
        @click="emit('fetch-financials')" 
        class="btn-ghost-modern text-xs p-1" 
        aria-label="Refresh financial data"
        title="Refresh financial data"
      >
        <font-awesome-icon icon="sync" />
      </button>
    </div>
    
    <!-- Primary Financial Metrics -->
    <div class="grid grid-cols-2 gap-4 mb-5">
      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Invoiced</p>
        <p class="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-1">{{ formatCurrency(totalInvoiced) }}</p>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Received</p>
        <p class="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">{{ formatCurrency(totalPaid) }}</p>
      </div>
    </div>
    
    <!-- Secondary Financial Metrics - Now in a better layout -->
    <div class="grid grid-cols-3 gap-4 mb-5">
      <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outstanding</p>
        <p class="text-lg font-semibold text-orange-600 dark:text-orange-400 mt-1">{{ formatCurrency(outstandingBalance) }}</p>
      </div>
      <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expenses</p>
        <p class="text-lg font-semibold text-red-600 dark:text-red-400 mt-1">{{ formatCurrency(totalExpenses) }}</p>
      </div>
      <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Profit</p>
        <p class="text-lg font-semibold mt-1" :class="getProfitClass(actualProfit)">{{ formatCurrency(actualProfit) }}</p>
      </div>
    </div>
    
    <!-- Performance Metrics - Now with potential profit in the same row as rates -->
    <div class="grid grid-cols-3 gap-4 mb-5">
      <!-- Potential Profit -->
      <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Potential Profit</p>
        <p class="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">{{ formatCurrency(potentialProfit) }}</p>
      </div>
      
      <!-- Job Completion Rate -->
      <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3" v-if="jobCompletionRate !== null">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Completion</p>
        <div class="flex items-center mt-2">
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full flex-grow mr-2">
            <div 
              class="h-2 bg-teal-500 dark:bg-teal-400 rounded-full" 
              :style="`width: ${Math.min(100, Math.max(0, jobCompletionRate))}%`"
            ></div>
          </div>
          <span class="text-sm font-semibold text-teal-600 dark:text-teal-400">{{ Math.round(jobCompletionRate) }}%</span>
        </div>
      </div>
      
      <!-- Invoice Payment Rate -->
      <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3" v-if="invoicePaymentRate !== null">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Rate</p>
        <div class="flex items-center mt-2">
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full flex-grow mr-2">
            <div 
              class="h-2 bg-green-500 dark:bg-green-400 rounded-full" 
              :style="`width: ${Math.min(100, Math.max(0, invoicePaymentRate))}%`"
            ></div>
          </div>
          <span class="text-sm font-semibold text-green-600 dark:text-green-400">{{ Math.round(invoicePaymentRate) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- LLM Profitability Analysis -->
    <div class="pt-3 border-t border-gray-200 dark:border-gray-700/50">
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