<!-- wibiclick-frontend-vue/src/components/Dashboard/ExecutiveSummary.vue -->
<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  financialOverview: {
    type: Object,
    default: () => null
  },
  accountsReceivable: {
    type: Object,
    default: () => null
  },
  technicianPerformance: {
    type: Array,
    default: () => []
  },
  jobAnalytics: {
    type: Object,
    default: () => null
  },
  websitePerformance: {
    type: Object,
    default: () => null
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// Format currency (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

// Business health score (0-100)
const businessHealthScore = computed(() => {
  let score = 50 // Start with neutral score
  
  // Add up to 25 points for financial metrics
  if (props.financialOverview) {
    // Profit margin (0-10 points)
    const profitMargin = props.financialOverview.profitMargin?.current || 0
    if (profitMargin > 30) score += 10
    else if (profitMargin > 0) score += profitMargin / 3
    
    // Net profit growth (0-10 points)
    const netProfit = props.financialOverview.netProfit || { current: 0, previous: 0 }
    if (netProfit.previous > 0) {
      const growth = ((netProfit.current - netProfit.previous) / netProfit.previous) * 100
      if (growth > 20) score += 10
      else if (growth > 0) score += growth / 2
      else score -= Math.min(5, Math.abs(growth / 4))
    }
    
    // Revenue (0-5 points)
    const totalEarnings = props.financialOverview.totalEarnings?.current || 0
    if (totalEarnings > 50000) score += 5
    else score += (totalEarnings / 10000)
  }
  
  // Add up to 25 points for receivables health
  if (props.accountsReceivable) {
    const totalOutstanding = props.accountsReceivable.totalOutstanding || 0
    const overdueInvoices = props.accountsReceivable.outstandingInvoices?.filter(inv => {
      const dueDate = new Date(inv.dueAt)
      return dueDate < new Date()
    }) || []
    const severelyOverdueInvoices = props.accountsReceivable.outstandingInvoices?.filter(inv => {
      const dueDate = new Date(inv.dueAt)
      const daysOverdue = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24))
      return daysOverdue > 30
    }) || []
    
    // Fewer outstanding invoices is better (0-10 points)
    if (props.accountsReceivable.count === 0) score += 10
    else if (props.accountsReceivable.count < 5) score += 8
    else if (props.accountsReceivable.count < 10) score += 5
    else if (props.accountsReceivable.count < 20) score += 2
    
    // Lower percentage of overdue invoices is better (0-10 points)
    if (props.accountsReceivable.count > 0) {
      const percentOverdue = (overdueInvoices.length / props.accountsReceivable.count) * 100
      if (percentOverdue < 10) score += 10
      else if (percentOverdue < 30) score += 7
      else if (percentOverdue < 50) score += 4
      else if (percentOverdue < 70) score += 1
      else score -= 2
    }
    
    // Severely overdue invoices are bad (0-5 points)
    if (severelyOverdueInvoices.length === 0) score += 5
    else if (severelyOverdueInvoices.length < 3) score += 2
    else score -= Math.min(5, severelyOverdueInvoices.length)
  }
  
  // Add up to 25 points for operational metrics
  if (props.jobAnalytics) {
    // Job completion rate (0-15 points)
    const completionRate = props.jobAnalytics.jobCompletionRate?.current || 0
    if (completionRate > 95) score += 15
    else if (completionRate > 85) score += 10
    else if (completionRate > 75) score += 5
    else if (completionRate < 60) score -= 5
    
    // Job volume (0-10 points)
    const totalJobs = props.jobAnalytics.totalJobs?.current || 0
    if (totalJobs > 50) score += 10
    else if (totalJobs > 30) score += 7
    else if (totalJobs > 20) score += 5
    else if (totalJobs > 10) score += 3
  }
  
  // Add up to 25 points for technician performance
  if (props.technicianPerformance && props.technicianPerformance.length > 0) {
    // Number of active technicians (0-10 points)
    const activeTechs = props.technicianPerformance.length
    if (activeTechs >= 5) score += 10
    else if (activeTechs >= 3) score += 7
    else if (activeTechs >= 2) score += 5
    else score += 2
    
    // Average jobs per technician (0-15 points)
    const totalJobs = props.technicianPerformance.reduce((sum, tech) => sum + (tech.jobsCompleted || 0), 0)
    const avgJobsPerTech = totalJobs / activeTechs
    if (avgJobsPerTech > 20) score += 15
    else if (avgJobsPerTech > 15) score += 12
    else if (avgJobsPerTech > 10) score += 8
    else if (avgJobsPerTech > 5) score += 4
  }
  
  // Clamp the score between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
})

// Business health status
const businessHealthStatus = computed(() => {
  const score = businessHealthScore.value
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' }
  if (score >= 75) return { label: 'Strong', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' }
  if (score >= 60) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' }
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' }
  if (score >= 25) return { label: 'Concerning', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' }
  return { label: 'Poor', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' }
})

// Top action items (things that need attention)
const actionItems = computed(() => {
  const items = []
  
  // Check for overdue invoices
  if (props.accountsReceivable?.outstandingInvoices?.length > 0) {
    const overdueInvoices = props.accountsReceivable.outstandingInvoices.filter(inv => {
      const dueDate = new Date(inv.dueAt)
      return dueDate < new Date()
    })
    
    if (overdueInvoices.length > 0) {
      items.push({
        type: 'overdue-invoices',
        icon: 'exclamation-circle',
        color: 'text-red-500',
        message: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} need attention`,
        value: formatCurrency(overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.sales) || 0), 0)),
        priority: 1 // Higher priority (lower number)
      })
    }
  }
  
  // Check for low job completion rate
  if (props.jobAnalytics?.jobCompletionRate?.current < 80) {
    items.push({
      type: 'low-completion',
      icon: 'tasks',
      color: 'text-orange-500',
      message: 'Job completion rate is below target',
      value: props.jobAnalytics.jobCompletionRate.current.toFixed(1) + '%',
      priority: 2
    })
  }
  
  // Check for declining profits
  if (props.financialOverview?.netProfit) {
    const { current, previous } = props.financialOverview.netProfit
    if (current < previous) {
      const decline = ((previous - current) / previous) * 100
      items.push({
        type: 'profit-decline',
        icon: 'chart-line',
        color: 'text-red-500',
        message: 'Net profit has decreased compared to last month',
        value: decline.toFixed(1) + '%',
        priority: 3
      })
    }
  }
  
  // Sort by priority
  return items.sort((a, b) => a.priority - b.priority)
})

// Calculate the most active technician
const topTechnician = computed(() => {
  if (!props.technicianPerformance || props.technicianPerformance.length === 0) return null
  
  return props.technicianPerformance.reduce((prev, current) => {
    return (current.jobsCompleted > prev.jobsCompleted) ? current : prev
  })
})

// Calculate receivables aging
const receivablesAging = computed(() => {
  if (!props.accountsReceivable?.outstandingInvoices) return { current: 0, overdue: 0, critical: 0 }
  
  const current = props.accountsReceivable.outstandingInvoices.filter(inv => {
    const dueDate = new Date(inv.dueAt)
    return dueDate >= new Date()
  }).reduce((sum, inv) => sum + (parseFloat(inv.sales) || 0), 0)
  
  const overdue = props.accountsReceivable.outstandingInvoices.filter(inv => {
    const dueDate = new Date(inv.dueAt)
    const daysOverdue = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24))
    return dueDate < new Date() && daysOverdue <= 30
  }).reduce((sum, inv) => sum + (parseFloat(inv.sales) || 0), 0)
  
  const critical = props.accountsReceivable.outstandingInvoices.filter(inv => {
    const dueDate = new Date(inv.dueAt)
    const daysOverdue = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24))
    return daysOverdue > 30
  }).reduce((sum, inv) => sum + (parseFloat(inv.sales) || 0), 0)
  
  return { current, overdue, critical }
})
</script>

<template>
  <section class="card-modern p-5 sm:p-6 mb-10">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Executive Summary</h2>
      
      <!-- Business Health Score -->
      <div class="flex items-center mt-2 md:mt-0">
        <div class="flex items-center">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Business Health:</span>
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="businessHealthStatus.bgColor + ' ' + businessHealthStatus.color"
          >
            {{ businessHealthStatus.label }}
            <span class="ml-1 font-bold">{{ businessHealthScore }}/100</span>
          </span>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Key Metrics Summary -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <font-awesome-icon icon="chart-pie" class="mr-1.5 text-indigo-500" />
          Key Performance Metrics
        </h3>
        
        <div class="space-y-3">
          <!-- Net Profit -->
          <div v-if="financialOverview?.netProfit" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Net Profit:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(financialOverview.netProfit.current) }}
              <span 
                v-if="financialOverview.netProfit.previous" 
                class="text-xs ml-1"
                :class="financialOverview.netProfit.current >= financialOverview.netProfit.previous 
                  ? 'text-green-500' 
                  : 'text-red-500'"
              >
                <font-awesome-icon 
                  :icon="financialOverview.netProfit.current >= financialOverview.netProfit.previous 
                    ? 'arrow-up' 
                    : 'arrow-down'" 
                />
              </span>
            </span>
          </div>
          
          <!-- Profit Margin -->
          <div v-if="financialOverview?.profitMargin" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Profit Margin:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ financialOverview.profitMargin.current.toFixed(1) }}%
              <span 
                v-if="financialOverview.profitMargin.previous" 
                class="text-xs ml-1"
                :class="financialOverview.profitMargin.current >= financialOverview.profitMargin.previous 
                  ? 'text-green-500' 
                  : 'text-red-500'"
              >
                <font-awesome-icon 
                  :icon="financialOverview.profitMargin.current >= financialOverview.profitMargin.previous 
                    ? 'arrow-up' 
                    : 'arrow-down'" 
                />
              </span>
            </span>
          </div>
          
          <!-- Total Jobs -->
          <div v-if="jobAnalytics?.totalJobs" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Total Jobs:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ jobAnalytics.totalJobs.current }}
              <span 
                v-if="jobAnalytics.totalJobs.previous" 
                class="text-xs ml-1"
                :class="jobAnalytics.totalJobs.current >= jobAnalytics.totalJobs.previous 
                  ? 'text-green-500' 
                  : 'text-red-500'"
              >
                <font-awesome-icon 
                  :icon="jobAnalytics.totalJobs.current >= jobAnalytics.totalJobs.previous 
                    ? 'arrow-up' 
                    : 'arrow-down'" 
                />
              </span>
            </span>
          </div>
          
          <!-- Job Completion Rate -->
          <div v-if="jobAnalytics?.jobCompletionRate" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Completion Rate:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ jobAnalytics.jobCompletionRate.current.toFixed(1) }}%
              <span 
                v-if="jobAnalytics.jobCompletionRate.previous" 
                class="text-xs ml-1"
                :class="jobAnalytics.jobCompletionRate.current >= jobAnalytics.jobCompletionRate.previous 
                  ? 'text-green-500' 
                  : 'text-red-500'"
              >
                <font-awesome-icon 
                  :icon="jobAnalytics.jobCompletionRate.current >= jobAnalytics.jobCompletionRate.previous 
                    ? 'arrow-up' 
                    : 'arrow-down'" 
                />
              </span>
            </span>
          </div>
          
          <!-- Top Technician -->
          <div v-if="topTechnician" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Top Technician:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ topTechnician.name }}
              <span class="text-xs ml-1 text-gray-500">({{ topTechnician.jobsCompleted }} jobs)</span>
            </span>
          </div>
        </div>
      </div>
      
      <!-- Accounts Receivable Summary -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <font-awesome-icon icon="money-bill-wave" class="mr-1.5 text-green-500" />
          Accounts Receivable
        </h3>
        
        <div class="space-y-3">
          <!-- Total Outstanding -->
          <div v-if="accountsReceivable" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Total Outstanding:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(accountsReceivable.totalOutstanding) }}
            </span>
          </div>
          
          <!-- Outstanding Invoices -->
          <div v-if="accountsReceivable" class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Outstanding Invoices:</span>
            <span 
              class="text-sm font-medium" 
              :class="accountsReceivable.count > 5 
                ? 'text-orange-600 dark:text-orange-400' 
                : 'text-gray-900 dark:text-white'"
            >
              {{ accountsReceivable.count }}
            </span>
          </div>
          
          <!-- Aging Categories -->
          <div v-if="receivablesAging" class="pt-2">
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-1.5">Aging Breakdown:</div>
            
            <!-- Current -->
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                Current
              </span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(receivablesAging.current) }}
              </span>
            </div>
            
            <!-- Overdue (1-30 days) -->
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
                Overdue (1-30d)
              </span>
              <span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                {{ formatCurrency(receivablesAging.overdue) }}
              </span>
            </div>
            
            <!-- Critical (>30 days) -->
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <span class="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                Critical (>30d)
              </span>
              <span class="text-xs font-medium text-red-600 dark:text-red-400">
                {{ formatCurrency(receivablesAging.critical) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Items -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <font-awesome-icon icon="clipboard-list" class="mr-1.5 text-amber-500" />
          Action Items
        </h3>
        
        <div v-if="actionItems.length > 0" class="space-y-3">
          <div 
            v-for="(item, index) in actionItems" 
            :key="index"
            class="flex items-start p-2 rounded-md"
            :class="item.type === 'overdue-invoices' 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30' 
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30'"
          >
            <font-awesome-icon :icon="item.icon" class="mt-0.5 mr-2" :class="item.color" />
            <div class="flex-1">
              <p class="text-xs text-gray-700 dark:text-gray-300">{{ item.message }}</p>
              <p class="text-xs font-medium mt-0.5" :class="item.color">{{ item.value }}</p>
            </div>
          </div>
        </div>
        
        <div v-else class="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400">
          <font-awesome-icon icon="check-circle" class="mr-2 text-green-500" />
          <span class="text-sm">No urgent action items</span>
        </div>
      </div>
    </div>
  </section>
</template>