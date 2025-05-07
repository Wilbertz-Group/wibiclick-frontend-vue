<!-- wibiclick-frontend-vue/src/components/Dashboard/EnhancedAccountsReceivable.vue -->
<script setup>
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import moment from 'moment'

const props = defineProps({
  accountsReceivable: {
    type: Object,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view-invoice', 'send-reminder'])

// Sort options
const sortOption = ref('daysOverdue') // 'dueDate', 'amount', 'daysOverdue'
const sortDirection = ref('desc') // 'asc', 'desc'

// Format currency (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return moment(dateString).format('YYYY-MM-DD')
}

// Calculate days overdue
const calculateDaysOverdue = (dueDate) => {
  if (!dueDate) return 0
  const today = moment()
  const due = moment(dueDate)
  const days = today.diff(due, 'days')
  return days > 0 ? days : 0 // Only show positive overdue days
}

// Get status class based on days overdue
const getStatusClass = (daysOverdue) => {
  if (daysOverdue > 30) return 'text-red-600 dark:text-red-400 font-semibold'
  if (daysOverdue > 0) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

// Get status text based on days overdue
const getStatusText = (daysOverdue) => {
  if (daysOverdue > 30) return 'Critical'
  if (daysOverdue > 14) return 'Urgent'
  if (daysOverdue > 0) return 'Overdue'
  return 'Current'
}

// Get sorted invoices
const sortedInvoices = computed(() => {
  if (!props.accountsReceivable?.outstandingInvoices) return []
  
  return [...props.accountsReceivable.outstandingInvoices].sort((a, b) => {
    if (sortOption.value === 'dueDate') {
      const dateA = new Date(a.dueAt || 0)
      const dateB = new Date(b.dueAt || 0)
      return sortDirection.value === 'asc' ? dateA - dateB : dateB - dateA
    } 
    else if (sortOption.value === 'amount') {
      const amountA = parseFloat(a.sales || 0)
      const amountB = parseFloat(b.sales || 0)
      return sortDirection.value === 'asc' ? amountA - amountB : amountB - amountA
    }
    else if (sortOption.value === 'daysOverdue') {
      const daysA = calculateDaysOverdue(a.dueAt)
      const daysB = calculateDaysOverdue(b.dueAt)
      return sortDirection.value === 'asc' ? daysA - daysB : daysB - daysA
    }
    return 0
  })
})

// Calculate aging categories
const agingCategories = computed(() => {
  if (!props.accountsReceivable?.outstandingInvoices) return []
  
  const categories = [
    { name: 'Current', total: 0, count: 0, color: 'bg-green-500' },
    { name: '1-14 days', total: 0, count: 0, color: 'bg-yellow-400' },
    { name: '15-30 days', total: 0, count: 0, color: 'bg-orange-500' },
    { name: '30+ days', total: 0, count: 0, color: 'bg-red-500' }
  ]
  
  props.accountsReceivable.outstandingInvoices.forEach(invoice => {
    const daysOverdue = calculateDaysOverdue(invoice.dueAt)
    const amount = parseFloat(invoice.sales || 0)
    
    if (daysOverdue === 0) {
      categories[0].total += amount
      categories[0].count++
    } else if (daysOverdue <= 14) {
      categories[1].total += amount
      categories[1].count++
    } else if (daysOverdue <= 30) {
      categories[2].total += amount
      categories[2].count++
    } else {
      categories[3].total += amount
      categories[3].count++
    }
  })
  
  return categories
})

// Calculate percentage of total for aging visualization
const getPercentageOfTotal = (amount) => {
  if (!props.accountsReceivable?.totalOutstanding) return 0
  return (amount / props.accountsReceivable.totalOutstanding) * 100
}

// Handle sending reminder
const sendReminder = (invoice) => {
  emit('send-reminder', invoice)
}

// Handle viewing invoice details
const viewInvoice = (invoice) => {
  emit('view-invoice', invoice)
}

// Toggle sort direction
const toggleSort = (option) => {
  if (sortOption.value === option) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortOption.value = option
    sortDirection.value = 'desc' // Default to descending
  }
}
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Accounts Receivable</h2>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Outstanding</h3>
        <p class="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
          {{ formatCurrency(accountsReceivable.totalOutstanding) }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Invoices</h3>
        <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
          {{ accountsReceivable.count }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Days Overdue</h3>
        <p 
          class="text-2xl font-bold mt-1"
          :class="accountsReceivable.outstandingInvoices && accountsReceivable.outstandingInvoices.length > 0 
            ? (accountsReceivable.outstandingInvoices.reduce((sum, inv) => sum + calculateDaysOverdue(inv.dueAt), 0) / accountsReceivable.outstandingInvoices.length > 14 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-yellow-600 dark:text-yellow-400')
            : 'text-gray-900 dark:text-white'"
        >
          {{ accountsReceivable.outstandingInvoices && accountsReceivable.outstandingInvoices.length > 0 
            ? Math.round(accountsReceivable.outstandingInvoices.reduce((sum, inv) => sum + calculateDaysOverdue(inv.dueAt), 0) / accountsReceivable.outstandingInvoices.length) 
            : 0 }}
        </p>
      </div>
    </div>
    
    <!-- Aging Visualization -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Aging Breakdown</h3>
        <div class="text-xs text-gray-500 dark:text-gray-400">Total: {{ formatCurrency(accountsReceivable.totalOutstanding) }}</div>
      </div>
      
      <!-- Aging bars -->
      <div class="h-8 flex rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-700">
        <div 
          v-for="(category, index) in agingCategories" 
          :key="index"
          :class="category.color"
          :style="{ width: `${getPercentageOfTotal(category.total)}%` }"
          class="h-full transition-all duration-500 ease-in-out"
          :title="`${category.name}: ${formatCurrency(category.total)}`"
        ></div>
      </div>
      
      <!-- Aging legend -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div 
          v-for="(category, index) in agingCategories" 
          :key="index"
          class="flex items-center"
        >
          <span :class="category.color" class="w-3 h-3 rounded-full mr-1.5"></span>
          <span class="text-gray-700 dark:text-gray-300">{{ category.name }}:</span>
          <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ formatCurrency(category.total) }}</span>
          <span class="ml-1 text-gray-500">
            ({{ category.count }})
          </span>
        </div>
      </div>
    </div>
    
    <!-- Invoices Table -->
    <div class="overflow-x-auto">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Outstanding Invoices</h3>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Sort by: 
          <button 
            @click="toggleSort('daysOverdue')" 
            class="ml-1 px-2 py-0.5 rounded"
            :class="sortOption === 'daysOverdue' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : ''"
          >
            Days Overdue 
            <font-awesome-icon 
              v-if="sortOption === 'daysOverdue'" 
              :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
            />
          </button>
          <button 
            @click="toggleSort('amount')" 
            class="ml-1 px-2 py-0.5 rounded"
            :class="sortOption === 'amount' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : ''"
          >
            Amount
            <font-awesome-icon 
              v-if="sortOption === 'amount'" 
              :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
            />
          </button>
          <button 
            @click="toggleSort('dueDate')" 
            class="ml-1 px-2 py-0.5 rounded"
            :class="sortOption === 'dueDate' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : ''"
          >
            Due Date
            <font-awesome-icon 
              v-if="sortOption === 'dueDate'" 
              :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
            />
          </button>
        </div>
      </div>
      
      <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
        <thead class="bg-gray-50 dark:bg-gray-900/30">
          <tr>
            <th class="th-modern">Invoice #</th>
            <th class="th-modern">Customer</th>
            <th class="th-modern">Issue Date</th>
            <th class="th-modern">Due Date</th>
            <th class="th-modern text-right">Amount</th>
            <th class="th-modern text-center">Status</th>
            <th class="th-modern text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <tr v-if="!accountsReceivable.outstandingInvoices || accountsReceivable.outstandingInvoices.length === 0">
            <td colspan="7" class="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No outstanding invoices.</td>
          </tr>
          <tr 
            v-for="invoice in sortedInvoices" 
            :key="invoice.id" 
            class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <td class="td-modern font-medium">{{ invoice.number }}</td>
            <td class="td-modern">
              <router-link
                :to="{ name: 'contact', query: { customer_id: invoice.customer?.id } }"
                class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {{ invoice.customer?.name || 'N/A' }}
              </router-link>
            </td>
            <td class="td-modern whitespace-nowrap">{{ formatDate(invoice.issuedAt) }}</td>
            <td class="td-modern whitespace-nowrap">{{ formatDate(invoice.dueAt) }}</td>
            <td class="td-modern text-right whitespace-nowrap font-medium">{{ formatCurrency(invoice.sales) }}</td>
            <td class="td-modern text-center">
              <span 
                class="inline-flex items-center px-2 py-0.5 rounded text-xs"
                :class="getStatusClass(calculateDaysOverdue(invoice.dueAt))"
              >
                {{ getStatusText(calculateDaysOverdue(invoice.dueAt)) }}
                <span v-if="calculateDaysOverdue(invoice.dueAt) > 0" class="ml-1">({{ calculateDaysOverdue(invoice.dueAt) }}d)</span>
              </span>
            </td>
            <td class="td-modern text-right space-x-2 whitespace-nowrap">
              <button 
                @click="viewInvoice(invoice)" 
                class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                title="View invoice details"
              >
                <font-awesome-icon icon="eye" />
              </button>
              <button 
                @click="sendReminder(invoice)" 
                class="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                title="Send payment reminder"
              >
                <font-awesome-icon icon="bell" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>