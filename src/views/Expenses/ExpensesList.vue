<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-black">Expense Overview</h1>
        <div class="flex items-center">
          <button 
            @click="router.push({ name: 'add-expense' })" 
            class="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors duration-200"
          >
            <font-awesome-icon icon="plus" class="mr-2" />
            Add Expense
          </button>
          <button @click="toggleDarkMode" class="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" class="text-yellow-500 dark:text-blue-300" />
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-8">
        <!-- Keep dropdown but sync with navigation -->
        <select v-model="selectedWebsite" class="form-select">
          <option value="">Select Website</option>
          <option v-for="site in websites" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>
        
        <select v-model="month" class="form-select">
          <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
        </select>
        
        <select v-model="year" class="form-select">
          <option v-for="y in 5" :key="y" :value="currentYear - y + 1">
            {{ currentYear - y + 1 }}
          </option>
        </select>
        
      </div>
      
      <!-- Expense Summary -->
      <section v-if="expenseSummary" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Expense Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div v-for="(data, key) in expenseSummary" :key="key" 
              class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <h3 class="font-semibold text-gray-600 dark:text-gray-400 capitalize">{{ formatTitle(key) }}</h3>
            <p class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
              {{ formatCurrency(data.current) }}
            </p>
            <p class="text-sm mt-1" :class="getComparisonClass(data)">
              <font-awesome-icon :icon="getComparisonIcon(data)" />
              {{ getPercentageChange(data.current, data.previous) }}% from last month
            </p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Expense Trends Over Time -->
        <section class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800 ">Expense Trends Over Time</h2>
          <div class="section-content">
            <apexchart
              type="line"
              height="350"
              :options="expenseTrendChartOptions"
              :series="expenseTrendChartSeries"
            ></apexchart>
          </div>
        </section>
      
        <!-- Expense by Type Chart -->
        <section class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800 ">Expenses by Type</h2>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <apexchart
              type="bar"
              height="350"
              :options="expenseChartOptions"
              :series="expenseChartSeries"
            ></apexchart>
          </div>
        </section>
      </div>

       <!-- Expense Details -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 ">Expense Details</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th v-for="header in columnDefs" :key="header.field" 
                      class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {{ header.headerName }}
                  </th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="expense in paginatedExpenses" :key="expense.id" 
                    class="border-b border-gray-200 dark:border-gray-700">
                  <td v-for="col in columnDefs" :key="col.field" 
                      class="px-4 py-2 text-gray-800 dark:text-white">
                    <template v-if="col.field === 'type'">
                      <span :class="getTypeClass(expense.type)">{{ expense.type }}</span>
                    </template>
                    <template v-else-if="col.field === 'amount'">
                      {{ formatCurrency(expense.amount) }}
                    </template>
                    <template v-else-if="col.field === 'date'">
                      {{ formatDate(expense.date) }}
                    </template>
                    <template v-else-if="col.field === 'customer.name'">
                      <router-link 
                        v-if="expense.job"
                        :to="{
                          name: 'contact',
                          query: { customer_id: expense.job.customerId }
                        }"
                        class="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition duration-150 ease-in-out"
                      >
                        <span>{{ expense.job.name }}</span>
                      </router-link>
                      <span v-else>N/A</span>
                    </template>
                    <template v-else-if="col.field === 'employee.fullName'">
                      {{ `${expense.employee.firstName} ${expense.employee.lastName}` }}
                    </template>
                    <template v-else-if="col.field === 'job.issue'">
                      <span v-if="expense.job" class="text-sm">{{ truncateText(expense.job.issue, 30) }}</span>
                      <span v-else>N/A</span>
                    </template>
                    <template v-else>
                      <span class="text-sm">{{ truncateText(expense[col.field], 40) }}</span>
                    </template>
                  </td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">
                    <button @click="router.push({ name: 'edit-expense', query: { expense_id: expense?.id } })" class="text-blue-500 hover:text-blue-700 mr-2">
                      Edit
                    </button>
                    <button @click="router.push({ name: 'view-expense', query: { expense_id: expense?.id } })" class="text-green-500 hover:text-green-700">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="mt-4 flex justify-between items-center">
            <button @click="prevPage" :disabled="currentPage === 1" 
                    class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
              Previous
            </button>
            <span class="text-gray-800 dark:text-white">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages" 
                    class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader color="#ffffff" />
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import moment from 'moment'
import { useUserStore } from '@/stores/UserStore'
import { storeToRefs } from 'pinia' // Import storeToRefs
import { useRouter, useRoute } from "vue-router";
import { useToast } from 'vue-toast-notification'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import VueApexCharts from 'vue3-apexcharts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowUp, faArrowDown, faMinus, faSun, faMoon, faPlus } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faArrowUp, faArrowDown, faMinus, faSun, faMoon, faPlus)

const userStore = useUserStore()
// Use storeToRefs to make Pinia store properties reactive
const { currentWebsite, websites } = storeToRefs(userStore)
const toast = useToast()

const route = useRoute()
const router = useRouter()

// Use computed to access the selected website from the Pinia store
const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
})

// State
const loading = ref(false)
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')
const year = ref(moment().year())
const month = ref(moment().month() + 1)
const currentYear = moment().year()

const expenseSummary = ref(null)
const expenses = ref([])

// Data for expense trends
const expenseTrends = ref([])

const columnDefs = ref([
  { field: 'type', headerName: 'Type' },
  { field: 'amount', headerName: 'Amount' },
  { field: 'description', headerName: 'Description' },
  { field: 'date', headerName: 'Date' },
  { field: 'employee.fullName', headerName: 'Technician' },
  { field: 'customer.name', headerName: 'Customer' },
  { field: 'job.issue', headerName: 'Job Issue' },
])

// Add a helper function to truncate text
const truncateText = (text, maxLength) => {
  if (text && text.length > maxLength) {
    return text.slice(0, maxLength) + '...'
  }
  return text
}

// Pagination
const itemsPerPage = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(expenses.value.length / itemsPerPage))
const paginatedExpenses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return expenses.value.slice(start, end)
})

// Methods
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
}

const monthName = (monthNumber) => moment().month(monthNumber - 1).format('MMMM')

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
}

const formatTitle = (key) => key.split(/(?=[A-Z])/).join(' ')

const formatDate = (dateString) => moment(dateString).format('ddd, DD MMM YYYY')

const getTypeClass = (type) => {
  const classes = {
    FUEL: 'bg-blue-400 text-blue-800',
    PARTS: 'bg-green-400 text-green-800',
    BONUS: 'bg-purple-400 text-purple-800',
    OTHER: 'bg-yellow-400 text-yellow-800'
  }
  return `px-2 py-1 rounded-full text-xs font-medium ${classes[type] || 'bg-gray-400 text-gray-800'}`
}

const getPercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? '0.00' : '100.00'
  } else {
    return (((current - previous) / previous) * 100).toFixed(2)
  }
}


const getComparisonClass = (data) => {
  if (data.current < data.previous) {
    // Expenses have decreased
    return 'text-green-500'
  } else if (data.current > data.previous) {
    // Expenses have increased
    return 'text-red-500'
  } else {
    // Expenses are the same
    return 'text-gray-500'
  }
}

const getComparisonIcon = (data) => {
  if (data.current < data.previous) {
    // Expenses have decreased
    return 'arrow-down'
  } else if (data.current > data.previous) {
    // Expenses have increased
    return 'arrow-up'
  } else {
    // No change
    return 'minus'
  }
}


const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

// Chart options
const expenseChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: false,
    toolbar: {
      show: false
    },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      endingShape: 'rounded'
    },
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent']
  },
  xaxis: {
    categories: ['Fuel', 'Parts', 'Bonus', 'Other'],
    labels: {
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      }
    }
  },
  yaxis: {
    title: {
      text: 'Amount (ZAR)',
      style: {
        color: isDarkMode.value ? '#fff' : '#000',
      }
    },
    labels: {
      formatter: function (value) {
        return formatCurrency(value).replace('ZAR', 'R')
      },
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      }
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter: function (value) {
        return formatCurrency(value)
      }
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    offsetX: 40
  },
  theme: {
    mode: isDarkMode.value ? 'light' : 'light',
  }
}))

const expenseChartSeries = computed(() => {
  if (!expenseSummary.value) return []
  return [
    {
      name: 'Current Month',
      data: [
        expenseSummary.value.fuelExpenses.current,
        expenseSummary.value.partsExpenses.current,
        expenseSummary.value.bonusExpenses.current,
        expenseSummary.value.otherExpenses.current
      ]
    },
    {
      name: 'Previous Month',
      data: [
        expenseSummary.value.fuelExpenses.previous,
        expenseSummary.value.partsExpenses.previous,
        expenseSummary.value.bonusExpenses.previous,
        expenseSummary.value.otherExpenses.previous
      ]
    }
  ]
})

// API calls
// Removed fetchWebsites since we're now using the websites from Pinia store

const fetchExpenses = async () => {
  // Add check for valid website selection
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  
  try {
    loading.value = true
    const response = await axios.get('/expenses', {
      params: {
        id: selectedWebsite.value,
        year: year.value,
        month: month.value
      }
    })
    expenses.value = response.data.expenses
    calculateExpenseSummary()
  } catch (error) {
    console.error('Error fetching expenses:', error)
    toast.error('Error fetching expenses')
  } finally {
    loading.value = false
  }
}

const calculateExpenseSummary = () => {
  const summary = {
    totalExpenses: { current: 0, previous: 0 },
    fuelExpenses: { current: 0, previous: 0 },
    partsExpenses: { current: 0, previous: 0 },
    bonusExpenses: { current: 0, previous: 0 },
    otherExpenses: { current: 0, previous: 0 }
  }

  const currentMonthStart = moment(`${year.value}-${month.value}-01`)
  const previousMonthStart = currentMonthStart.clone().subtract(1, 'month')

  expenses.value.forEach(expense => {
    const expenseDate = moment(expense.date)
    const amount = parseFloat(expense.amount)
    const key = expenseDate.isSameOrAfter(currentMonthStart) ? 'current' : 'previous'
    
    summary.totalExpenses[key] += amount
    switch (expense.type) {
      case 'FUEL': summary.fuelExpenses[key] += amount; break
      case 'PARTS': summary.partsExpenses[key] += amount; break
      case 'BONUS': summary.bonusExpenses[key] += amount; break
      default: summary.otherExpenses[key] += amount
    }
  })

  expenseSummary.value = summary
}

// Fetch expense trends
const fetchExpenseTrends = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  
  try {
    loading.value = true

    // Group expenses by month
    const trends = {}
    expenses.value.forEach(expense => {
      const month = moment(expense.date).format('YYYY-MM')
      trends[month] = (trends[month] || 0) + parseFloat(expense.amount)
    })

    // Prepare data for the chart
    expenseTrends.value = Object.keys(trends)
      .sort()
      .map(month => ({
        month,
        total: trends[month]
      }))
  } catch (error) {
    console.error('Error fetching expense trends:', error)
    toast.error('Error fetching expense trends')
  } finally {
    loading.value = false
  }
}

// Expense Trend Chart Options
const expenseTrendChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: {
      show: false
    },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  xaxis: {
    categories: expenseTrends.value.map(item => item.month),
    labels: {
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      }
    }
  },
  yaxis: {
    title: {
      text: 'Total Expenses (ZAR)',
      style: {
        color: isDarkMode.value ? '#fff' : '#000',
      }
    },
    labels: {
      formatter: value => formatCurrency(value),
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      }
    }
  },
  tooltip: {
    y: {
      formatter: value => formatCurrency(value)
    }
  },
  theme: {
    mode: isDarkMode.value ? 'light' : 'light',
  }
}))

const expenseTrendChartSeries = computed(() => [
  {
    name: 'Expenses',
    data: expenseTrends.value.map(item => item.total)
  }
])

watch(expenses, fetchExpenseTrends)

// Watchers - monitor for changes to selectedWebsite, month, or year
watch([selectedWebsite, month, year], () => {
  if (selectedWebsite.value && selectedWebsite.value !== 'default') {
    fetchExpenses()
  }
}, { immediate: true }) // Add immediate: true to fetch data on component mount

watch(isDarkMode, () => {
  // Trigger chart options recomputation when dark mode changes
})

// Lifecycle hooks - no need to fetch websites anymore
onMounted(() => {
  // Check if user is logged in
  if (!userStore.user) {
    router.push({ name: 'login' })
  }
  // No need to call fetchWebsites() since we're using the Pinia store
})
</script>

<style scoped>
.form-select {
  @apply block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.dark .form-select {
  @apply bg-gray-700 border-gray-600 text-white;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

@keyframes progress {
  0% { width: 0; }
  100% { width: 100%; }
}

.progress-animate > div {
  animation: progress 1s ease-in-out;
}

/* Custom scrollbar styles */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

/* Dark mode enhancements */
.dark .bg-white {
  @apply bg-gray-800;
}


.dark .border-gray-200 {
  @apply border-gray-700;
}

/* Chart responsiveness */
.apexcharts-canvas {
  max-width: 100%;
}

/* Improve button styles */
button {
  @apply transition-colors duration-200 ease-in-out;
}

button:hover:not(:disabled) {
  @apply opacity-80;
}

button:disabled {
  @apply cursor-not-allowed;
}

/* Enhance table readability */
table {
  @apply w-full border-collapse;
}

th {
  @apply font-semibold text-left p-2;
}

td {
  @apply p-2;
}

tr:hover {
  @apply bg-gray-50 dark:bg-gray-700;
}

/* Improve form select appearance */
.form-select {
  @apply appearance-none bg-no-repeat bg-right;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-size: 1.5em 1.5em;
}

.dark .form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Enhance summary card styles */
.summary-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300;
}

.summary-card h3 {
  @apply font-semibold text-gray-600 dark:text-gray-400 capitalize mb-2;
}

.summary-card .amount {
  @apply text-2xl font-bold text-gray-800 dark:text-white;
}

.summary-card .comparison {
  @apply text-sm mt-1;
}

/* Improve chart legibility */
.apexcharts-legend-text {
  @apply dark:text-gray-300 !important;
}

.apexcharts-tooltip {
  @apply dark:bg-gray-700 dark:text-white !important;
}

/* Enhance expense type badges */
.expense-type-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.expense-type-badge.fuel {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100;
}

.expense-type-badge.parts {
  @apply bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100;
}

.expense-type-badge.bonus {
  @apply bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100;
}

.expense-type-badge.other {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100;
}

/* Improve loading overlay */
.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

/* Enhance pagination buttons */
.pagination-button {
  @apply px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 transition-colors duration-200;
}

.pagination-button:hover:not(:disabled) {
  @apply bg-blue-600;
}

/* Improve overall spacing and readability */
.section-title {
  @apply text-2xl font-semibold mb-4 text-gray-800 dark:text-white;
}

.section-content {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300;
}
</style>