// wibiclick-frontend-vue/src/views/Expenses/ExpensesList.vue
<template>
  <!-- Main container -->
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Expense Overview
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Add Expense Button -->
          <button
            @click="router.push({ name: 'add-expense' })"
            class="btn-primary-modern"
          >
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" />
            Add Expense
          </button>
          <!-- Dark Mode Toggle -->
          <!-- Removed local dark mode toggle button -->
        </div>
      </header>

      <!-- Filters -->
      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-10 md:mb-14">
        <!-- Website Selector using Headless UI Listbox -->
        <Listbox v-model="selectedWebsite" as="div" class="relative w-60 z-10">
          <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
            <span class="block truncate">
              {{ websites.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
            </span>
          </ListboxButton>
          <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <ListboxOptions class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <ListboxOption v-if="websites.length === 0" :value="'default'" disabled>
                 <li class="relative cursor-not-allowed select-none py-2 pl-10 pr-4 text-gray-500">No websites found</li>
              </ListboxOption>
              <ListboxOption v-for="website in websites" :key="website.value" :value="website.value" v-slot="{ active, selected }">
                <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                  <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ website.label }}</span>
                  <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                    <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </Listbox>

        <!-- Month Selector -->
        <select v-model="month" class="input-modern input-modern--select w-40 text-sm">
          <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
        </select>

        <!-- Year Selector -->
        <select v-model="year" class="input-modern input-modern--select w-32 text-sm">
          <option v-for="y in 5" :key="y" :value="currentYear - y + 1">
            {{ currentYear - y + 1 }}
          </option>
        </select>
      </div>
      
      <!-- Expense Summary -->
      <!-- Expense Summary Section -->
      <section v-if="expenseSummary" class="mb-10 md:mb-14">
        <h2 class="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Expense Summary</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"> <!-- Adjusted grid -->
          <!-- Total Expenses Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <font-awesome-icon icon="receipt" class="text-red-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Expenses</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(expenseSummary.totalExpenses.current) }}
              </dd>
              <dd class="text-xs mt-1" :class="getComparisonClass(expenseSummary.totalExpenses)">
                <font-awesome-icon :icon="getComparisonIcon(expenseSummary.totalExpenses)" class="mr-1" />
                {{ getPercentageChange(expenseSummary.totalExpenses.current, expenseSummary.totalExpenses.previous) }}% vs last month
              </dd>
            </div>
          </div>
          <!-- Fuel Expenses Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <font-awesome-icon icon="gas-pump" class="text-blue-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Fuel</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(expenseSummary.fuelExpenses.current) }}
              </dd>
               <dd class="text-xs mt-1" :class="getComparisonClass(expenseSummary.fuelExpenses)">
                <font-awesome-icon :icon="getComparisonIcon(expenseSummary.fuelExpenses)" class="mr-1" />
                {{ getPercentageChange(expenseSummary.fuelExpenses.current, expenseSummary.fuelExpenses.previous) }}% vs last month
              </dd>
            </div>
          </div>
          <!-- Parts Expenses Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <font-awesome-icon icon="tools" class="text-green-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Parts</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(expenseSummary.partsExpenses.current) }}
              </dd>
               <dd class="text-xs mt-1" :class="getComparisonClass(expenseSummary.partsExpenses)">
                <font-awesome-icon :icon="getComparisonIcon(expenseSummary.partsExpenses)" class="mr-1" />
                {{ getPercentageChange(expenseSummary.partsExpenses.current, expenseSummary.partsExpenses.previous) }}% vs last month
              </dd>
            </div>
          </div>
          <!-- Bonus Expenses Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <font-awesome-icon icon="gift" class="text-purple-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Bonus</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(expenseSummary.bonusExpenses.current) }}
              </dd>
               <dd class="text-xs mt-1" :class="getComparisonClass(expenseSummary.bonusExpenses)">
                <font-awesome-icon :icon="getComparisonIcon(expenseSummary.bonusExpenses)" class="mr-1" />
                {{ getPercentageChange(expenseSummary.bonusExpenses.current, expenseSummary.bonusExpenses.previous) }}% vs last month
              </dd>
            </div>
          </div>
          <!-- Other Expenses Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <font-awesome-icon icon="ellipsis-h" class="text-yellow-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Other</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(expenseSummary.otherExpenses.current) }}
              </dd>
               <dd class="text-xs mt-1" :class="getComparisonClass(expenseSummary.otherExpenses)">
                <font-awesome-icon :icon="getComparisonIcon(expenseSummary.otherExpenses)" class="mr-1" />
                {{ getPercentageChange(expenseSummary.otherExpenses.current, expenseSummary.otherExpenses.previous) }}% vs last month
              </dd>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 md:mb-14">
        <!-- Expense Trends Over Time -->
        <div class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Expense Trends Over Time</h2>
          <apexchart
            :key="chartKey"
            type="area"
            height="300"
            :options="expenseTrendChartOptions"
            :series="expenseTrendChartSeries"
          ></apexchart>
        </div>
      
        <!-- Expense by Type Chart -->
        <div class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Expenses by Type (Current vs Previous Month)</h2>
          <apexchart
            :key="chartKey"
            type="bar"
            height="300"
            :options="expenseTypeChartOptions"
            :series="expenseTypeChartSeries"
          ></apexchart>
        </div>
      </section>

       <!-- Expense Details -->
      <!-- Expense Details Table Section -->
      <section class="mb-10 md:mb-14">
        <h2 class="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Expense Details</h2>
        <div class="card-modern overflow-hidden"> <!-- Apply card style and overflow hidden -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th v-for="header in columnDefs" :key="header.field" scope="col" class="th-modern">
                    {{ header.headerName }}
                  </th>
                  <th scope="col" class="th-modern text-right">Actions</th> <!-- Align actions right -->
                </tr>
              </thead>
              <tbody>
                 <tr v-if="paginatedExpenses.length === 0">
                    <td :colspan="columnDefs.length + 1" class="td-modern text-center text-gray-500 dark:text-gray-400 py-6">
                        No expense details found for the selected criteria.
                    </td>
                </tr>
                <tr v-for="expense in paginatedExpenses" :key="expense.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150">
                  <td v-for="col in columnDefs" :key="col.field" class="td-modern">
                    <template v-if="col.field === 'type'">
                      <span :class="getTypeClass(expense.type)" class="badge-modern">{{ expense.type }}</span>
                    </template>
                    <template v-else-if="col.field === 'amount'">
                      <span class="font-medium">{{ formatCurrency(expense.amount) }}</span>
                    </template>
                    <template v-else-if="col.field === 'date'">
                      <span class="text-gray-600 dark:text-gray-300">{{ formatDate(expense.date) }}</span>
                    </template>
                    <template v-else-if="col.field === 'customer.name'">
                      <router-link 
                        v-if="expense.job"
                        :to="{
                          name: 'contact',
                          query: { customer_id: expense.job.customerId }
                        }"
                        class="link-modern"
                      >
                        <span>{{ expense.job?.name }}</span> <!-- Optional chaining -->
                      </router-link>
                      <span v-else>N/A</span>
                    </template>
                    <template v-else-if="col.field === 'employee.fullName'">
                      <span class="text-gray-600 dark:text-gray-300">{{ `${expense.employee?.firstName} ${expense.employee?.lastName}` }}</span> <!-- Optional chaining -->
                    </template>
                    <template v-else-if="col.field === 'job.issue'">
                      <span v-if="expense.job" class="text-sm text-gray-600 dark:text-gray-300">{{ truncateText(expense.job.issue, 30) }}</span>
                      <span v-else class="text-gray-400 dark:text-gray-500">N/A</span>
                    </template>
                    <template v-else>
                      <span class="text-sm text-gray-600 dark:text-gray-300">{{ truncateText(expense[col.field], 40) }}</span>
                    </template>
                  </td>
                  <td class="td-modern text-right"> <!-- Align actions right -->
                    <div class="flex justify-end space-x-2">
                      <button @click="router.push({ name: 'edit-expense', query: { expense_id: expense?.id } })" class="btn-icon-modern-sm" title="Edit Expense">
                        <font-awesome-icon icon="pencil-alt" />
                      </button>
                      <button @click="router.push({ name: 'view-expense', query: { expense_id: expense?.id } })" class="btn-icon-modern-sm" title="View Expense">
                        <font-awesome-icon icon="eye" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
             <span class="text-sm text-gray-600 dark:text-gray-400">
               Page {{ currentPage }} of {{ totalPages }}
             </span>
             <div class="flex space-x-1">
               <button @click="prevPage" :disabled="currentPage === 1" class="btn-icon-modern-sm" title="Previous Page">
                 <font-awesome-icon icon="chevron-left" />
               </button>
               <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-icon-modern-sm" title="Next Page">
                 <font-awesome-icon icon="chevron-right" />
               </button>
             </div>
           </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader color="#4f46e5" /> <!-- Default to light theme color -->
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
import {
  faArrowUp, faArrowDown, faMinus, faSun, faMoon, faPlus, faChevronDown, faCheck,
  faReceipt, faGasPump, faTools, faGift, faEllipsisH, faPencilAlt, faEye, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'; // Import Headless UI components

library.add(
  faArrowUp, faArrowDown, faMinus, faSun, faMoon, faPlus, faChevronDown, faCheck,
  faReceipt, faGasPump, faTools, faGift, faEllipsisH, faPencilAlt, faEye, faChevronLeft, faChevronRight
);

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
// Removed local isDarkMode state - using global theme store now
const year = ref(moment().year())
const month = ref(moment().month() + 1)
const currentYear = moment().year()

const expenseSummary = ref(null)
const expenses = ref([])

// Data for expense trends
const expenseTrends = ref([]); // Data for expense trends line chart
const chartKey = ref(0); // Key to force chart re-render on theme change

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
// Removed local toggleDarkMode function - using global theme store now

const monthName = (monthNumber) => moment().month(monthNumber - 1).format('MMMM')

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
}

const formatTitle = (key) => key.split(/(?=[A-Z])/).join(' ')

const formatDate = (dateString) => moment(dateString).format('ddd, DD MMM YYYY')

const getTypeClass = (type) => {
  // Use modern badge styles
  const classes = {
    FUEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PARTS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    BONUS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    OTHER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  };
  return classes[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getPercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? '0.00' : '100.00'
  } else {
    return (((current - previous) / previous) * 100).toFixed(2)
  }
}


const getComparisonClass = (data) => {
  if (data.current < data.previous) {
    return 'text-green-600 dark:text-green-400'; // Decreased (Good)
  } else if (data.current > data.previous) {
    return 'text-red-600 dark:text-red-400'; // Increased (Bad)
  } else {
    return 'text-gray-500 dark:text-gray-400'; // No change
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

// --- Base Chart Options (Adapted from PaymentsList.vue) ---
const getBaseChartOptions = (chartType = 'area') => ({
  chart: {
    height: 300,
    type: chartType,
    toolbar: { show: true, autoSelected: 'zoom' },
    zoom: { enabled: true },
    foreColor: '#1f2937' // Default to light, theme store will handle dark via CSS
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: {
    type: 'datetime', // Assuming time series for trends
    labels: {
      style: { colors: '#6b7280' }, // Default to light
      datetimeUTC: false,
      formatter: function(value) {
        return moment(value).format('MMM YY'); // Format for month/year
      }
    },
    axisBorder: { color: '#e5e7eb' }, // Default to light
    axisTicks: { color: '#e5e7eb' } // Default to light
  },
  yaxis: {
    labels: {
      style: { colors: '#6b7280' }, // Default to light
      formatter: (value) => formatCurrency(value) // Use existing formatter
    },
    title: {
      text: 'Amount (ZAR)',
      style: { color: '#6b7280' } // Default to light
    }
  },
  tooltip: {
    theme: 'light', // Default to light
    x: { format: 'MMMM yyyy' }, // Format tooltip date
    y: {
      formatter: (value) => formatCurrency(value) // Use existing formatter
    }
  },
  grid: {
    borderColor: '#e5e7eb', // Default to light
    strokeDashArray: 4
  },
  fill: { // Gradient fill for area charts
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 90, 100]
    }
  },
  markers: { size: 0 }, // Hide markers
  noData: {
    text: 'Loading or No Data Available...',
    align: 'center',
    verticalAlign: 'middle',
    style: { color: '#6b7280', fontSize: '14px' } // Default to light
  }
});

// --- Expense Type Bar Chart Options ---
const expenseTypeChartOptions = computed(() => {
  const baseOptions = getBaseChartOptions('bar');
  return {
    ...baseOptions,
    colors: ['#ef4444', '#f87171'], // Example colors (Red shades for expenses)
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        endingShape: 'rounded',
      },
    },
    xaxis: {
      type: 'category',
      categories: ['Fuel', 'Parts', 'Bonus', 'Other'],
      labels: {
        style: { colors: '#6b7280' }, // Default to light
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { ...baseOptions.yaxis },
    tooltip: { ...baseOptions.tooltip, x: { show: false } },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#1f2937' } // Default to light
    },
    fill: { opacity: 1 }, // Solid fill for bar
    grid: { ...baseOptions.grid, xaxis: { lines: { show: false } } }
  };
});

// --- Expense Type Bar Chart Series ---
const expenseTypeChartSeries = computed(() => {
  if (!expenseSummary.value) return [];
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
  ];
});

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
        month: moment(month).format('MMM YYYY'), // Formatted month name
        monthTimestamp: moment(month).valueOf(), // Timestamp for chart x-axis
        total: trends[month]
      }))
  } catch (error) {
    console.error('Error fetching expense trends:', error)
    toast.error('Error fetching expense trends')
  } finally {
    loading.value = false
  }
}

// --- Expense Trend Area Chart Options ---
const expenseTrendChartOptions = computed(() => {
  const baseOptions = getBaseChartOptions('area');
  return {
    ...baseOptions,
    colors: ['#ef4444'], // Example color (Red for expenses)
    xaxis: { ...baseOptions.xaxis },
    // Y-axis and Tooltip inherited
  };
});

const expenseTrendChartSeries = computed(() => [
  {
    name: 'Expenses',
    data: expenseTrends.value.map((item) => ({ x: item.monthTimestamp, y: item.total })) // Use timestamp for x
  }
])

watch(expenses, fetchExpenseTrends)

// Watchers - monitor for changes to selectedWebsite, month, or year
watch([selectedWebsite, month, year], () => {
  if (selectedWebsite.value && selectedWebsite.value !== 'default') {
    fetchExpenses()
  }
}, { immediate: true }) // Add immediate: true to fetch data on component mount

// Removed watcher for local isDarkMode

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
/* Import modern styles directly or define them here */

/* Modern Input Styles (Adapted from PaymentsList.vue) */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Modern Button Styles (Adapted from PaymentsList.vue) */
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-icon-modern-sm { /* Smaller version for table actions/pagination */
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary-modern { /* Example primary button style */
    @apply inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm;
    @apply hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800;
    @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}


/* Card Style (Copied from PaymentsList.vue) */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Table Styles (Copied from PaymentsList.vue) */
.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
  @apply px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200; /* Added whitespace-nowrap */
}

/* Badge Style */
.badge-modern {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize; /* Base badge style */
}

/* Link Style */
.link-modern {
    @apply text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition duration-150 ease-in-out;
}

/* Ensure transitions apply broadly */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>