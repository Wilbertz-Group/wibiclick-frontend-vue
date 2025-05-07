// wibiclick-frontend-vue/src/views/Transactions/OverviewDashboard.vue
<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Transactions Dashboard
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Website Selector -->
          <Listbox v-model="selectedWebsite" as="div" class="relative w-60">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">
                {{ websites.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
              </span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
          <Listbox v-model="month" as="div" class="relative w-36">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">{{ moment().month(month - 1).format('MMMM') }}</span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-for="m in 12" :key="m" :value="m" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ moment().month(m - 1).format('MMMM') }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <!-- Year Selector -->
          <Listbox v-model="year" as="div" class="relative w-28">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">{{ year }}</span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-for="y in 5" :key="y" :value="currentYear - y + 1" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ currentYear - y + 1 }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
             <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <ScaleLoader color="#4f46e5" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading dashboard data...</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-8">

        <ExecutiveSummary
          v-if="!loading" 
          :financialOverview="financialOverview"
          :accountsReceivable="accountsReceivable"
          :technicianPerformance="technicianPerformance"
          :jobAnalytics="jobAnalytics"
          :websitePerformance="websitePerformance"
          :isDarkMode="isDarkMode"
        />

        <!-- Financial Overview Section -->
        <EnhancedFinancialOverview
          v-if="financialOverview"
          :financialOverview="financialOverview"
          :websiteId="selectedWebsite"
          :isDarkMode="isDarkMode"
          :year="year"
          :month="month"
          :loadingData="loading"
          @refresh-data="fetchFinancialOverview"
        />

        <CompanyEarningsTrend 
          v-if="selectedWebsite && selectedWebsite !== 'default'"
          :websiteId="selectedWebsite"
          :isDarkMode="isDarkMode"
          :year="year"
        />

        <!-- Accounts Receivable Section -->
        <EnhancedAccountsReceivable
          v-if="accountsReceivable"
          :accountsReceivable="accountsReceivable"
          :isDarkMode="isDarkMode"
          @view-invoice="handleViewInvoice"
          @send-reminder="handleSendReminder"
        />

        <!-- Technician Performance section -->
        <TechnicianPerformance
          v-if="technicianPerformance && technicianPerformance.length > 0"
          :technicianPerformance="technicianPerformance"
          :isDarkMode="isDarkMode"
          @view-technician="handleViewTechnician"
          @view-jobs="handleViewJobs"
        />

        <!-- Job Analytics & Customer Metrics Grid -->
        <AnalyticsGrid
          v-if="jobAnalytics || customerMetrics"
          :jobAnalytics="jobAnalytics"
          :customerMetrics="customerMetrics"
          :isDarkMode="isDarkMode"
        />

        <!-- Website Performance section -->
        <WebsitePerformance
          v-if="websitePerformance"
          :websitePerformance="websitePerformance"
          :isDarkMode="isDarkMode"
        />

        <!-- WhatsApp Interactions section -->
        <WhatsappInteractions
          v-if="whatsappInteractions && whatsappInteractions.length > 0"
          :interactions="whatsappInteractions"
          :isDarkMode="isDarkMode"
          @view-chat="handleViewChat"
          @send-message="handleSendMessage"
        />        

      </div> <!-- End Dashboard Content v-else -->
    </div> <!-- End container -->

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ScaleLoader color="#ffffff" />
    </div>
  </div> <!-- End root div -->
</template>

<script setup>
import { ref, onMounted, watch, computed, watchEffect } from 'vue'
import axios from 'axios'
import moment from 'moment'
import { useUserStore } from '@/stores/UserStore'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toast-notification'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import VueApexCharts from 'vue3-apexcharts'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser, faSun, faMoon, faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { useRouter } from 'vue-router'
import CompanyEarningsTrend from '@/components/Dashboard/CompanyEarningsTrend.vue'
import EnhancedFinancialOverview from '@/components/Dashboard/EnhancedFinancialOverview.vue'
import ExecutiveSummary from '@/components/Dashboard/ExecutiveSummary.vue'
import EnhancedAccountsReceivable from '@/components/Dashboard/EnhancedAccountsReceivable.vue'
import TechnicianPerformance from '@/components/Dashboard/TechnicianPerformance.vue'
import AnalyticsGrid from '@/components/Dashboard/AnalyticsGrid.vue'
import WebsitePerformance from '@/components/Dashboard/WebsitePerformance.vue'
import WhatsappInteractions from '@/components/Dashboard/WhatsappInteractions.vue'

library.add(faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser, faSun, faMoon, faChevronDown, faCheck)

const apexchart = VueApexCharts // Assign to a variable usable in the template

const userStore = useUserStore()
const { currentWebsite, websites } = storeToRefs(userStore)
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const year = ref(moment().year())
const month = ref(moment().month() + 1)
const currentYear = moment().year()
const financialOverview = ref(null)
const technicianPerformance = ref([])
const jobAnalytics = ref(null)
const customerMetrics = ref(null)
const websitePerformance = ref(null)
const accountsReceivable = ref(null)
const whatsappInteractions = ref(null)

const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
}

// Watch dark mode changes and apply to HTML element
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value)
})

const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
})

// Chart options and series (Make them computed to react to dark mode)
const earningsDistributionOptions = computed(() => ({
  chart: { type: 'pie', foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937' },
  labels: ['Company Earnings', 'Technician Earnings'],
  theme: { mode: isDarkMode.value ? 'dark' : 'light' },
  legend: { position: 'bottom', labels: { colors: isDarkMode.value ? '#f3f4f6' : '#1f2937' } },
  dataLabels: { enabled: true, formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex].toFixed(0) }, // Show values
  tooltip: {
      theme: isDarkMode.value ? 'dark' : 'light',
      y: { formatter: (val) => formatCurrency(val) }
  },
  colors: ['#4f46e5', '#10b981'], // Indigo, Emerald
  stroke: { show: false }
}))

const earningsDistributionSeries = computed(() => {
  if (!financialOverview.value?.companyEarnings?.current || !financialOverview.value?.technicianEarnings?.current) return []
  return [
    financialOverview.value.companyEarnings.current,
    financialOverview.value.technicianEarnings.current
  ]
})

const technicianPerformanceChartOptions = computed(() => ({
  chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937' },
  plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: technicianPerformance.value.map(tech => tech.name),
    labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' } },
    axisBorder: { color: isDarkMode.value ? '#374151' : '#e5e7eb' },
    axisTicks: { color: isDarkMode.value ? '#374151' : '#e5e7eb' },
  },
  yaxis: {
    title: { text: 'Total Earnings (ZAR)', style: { color: isDarkMode.value ? '#9ca3af' : '#6b7280' } },
    labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' }, formatter: (val) => formatCurrency(val) }
  },
  fill: { opacity: 1 },
  tooltip: {
    theme: isDarkMode.value ? 'dark' : 'light',
    y: { formatter: (val) => formatCurrency(val) }
  },
  grid: { borderColor: isDarkMode.value ? '#374151' : '#e5e7eb' },
  colors: ['#4f46e5'] // Indigo
}))

const technicianPerformanceChartSeries = computed(() => [{
  name: 'Total Earnings',
  data: technicianPerformance.value.map(tech => parseFloat(tech.totalEarnings || 0)) // Ensure data is numeric
}])

// Fetch functions
const fetchFinancialOverview = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true // Handled by fetchAllData
    const response = await axios.get('/financial-overview', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    const data = response.data

    const netProfit = data.netProfit?.current || 0; // Add null checks
    const totalEarnings = data.totalEarnings?.current || 0;
    const prevNetProfit = data.netProfit?.previous || 0;
    const prevTotalEarnings = data.totalEarnings?.previous || 0;

    const technicianEarnings = netProfit * 0.2
    const companyEarnings = netProfit * 0.8

    financialOverview.value = {
      totalEarnings: data.totalEarnings || { current: 0, previous: 0 },
      totalExpenses: data.totalExpenses || { current: 0, previous: 0 },
      netProfit: data.netProfit || { current: 0, previous: 0 },
      technicianEarnings: {
        current: technicianEarnings,
        previous: prevNetProfit * 0.2
      },
      companyEarnings: {
        current: companyEarnings,
        previous: prevNetProfit * 0.8
      },
      profitMargin: {
        current: totalEarnings === 0 ? 0 : (netProfit / totalEarnings) * 100,
        previous: prevTotalEarnings === 0 ? 0 : (prevNetProfit / prevTotalEarnings) * 100
      }
    }
  } catch (error) {
    console.error('Error fetching financial overview:', error)
    toast.error('Error fetching financial overview')
    financialOverview.value = null // Reset on error
  } finally {
    // loading.value = false // Keep loading until all data fetched
  }
}

const fetchTechnicianPerformance = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true // Handled by fetchAllData
    const response = await axios.get('/technician-performance', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    technicianPerformance.value = response.data || []
  } catch (error) {
    console.error('Error fetching technician performance:', error)
    toast.error('Error fetching technician performance')
    technicianPerformance.value = [] // Reset on error
  } finally {
    // loading.value = false
  }
}

const fetchJobAnalytics = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true
    const response = await axios.get('/job-analytics', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    jobAnalytics.value = response.data
  } catch (error) {
    console.error('Error fetching job analytics:', error)
    toast.error('Error fetching job analytics')
    jobAnalytics.value = null // Reset on error
  } finally {
    // loading.value = false
  }
}

const fetchCustomerMetrics = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true
    const response = await axios.get('/customer-metrics', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    customerMetrics.value = response.data
  } catch (error) {
    console.error('Error fetching customer metrics:', error)
    toast.error('Error fetching customer metrics')
    customerMetrics.value = null // Reset on error
  } finally {
    // loading.value = false
  }
}

const fetchWebsitePerformance = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true
    const response = await axios.get('/website-performance', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    websitePerformance.value = response.data
  } catch (error) {
    console.error('Error fetching website performance:', error)
    toast.error('Error fetching website performance')
    websitePerformance.value = null // Reset on error
  } finally {
    // loading.value = false
  }
}

const fetchAccountsReceivable = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true
    const response = await axios.get('/outstanding-invoices', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    // Ensure outstandingInvoices is always an array
    accountsReceivable.value = response.data || { totalOutstanding: 0, count: 0, outstandingInvoices: [] };
    if (!Array.isArray(accountsReceivable.value.outstandingInvoices)) {
        accountsReceivable.value.outstandingInvoices = [];
    }
  } catch (error) {
    console.error('Error fetching accounts receivable:', error)
    toast.error('Error fetching accounts receivable')
    accountsReceivable.value = { totalOutstanding: 0, count: 0, outstandingInvoices: [] }; // Reset on error
  } finally {
    // loading.value = false
  }
}

const fetchWhatsappInteractions = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return
  try {
    // loading.value = true
    const response = await axios.get('/recent-whatsapp-interactions', {
      params: { id: selectedWebsite.value, limit: 10 }
    })
    whatsappInteractions.value = response.data || []
  } catch (error) {
    console.error('Error fetching Whatsapp interactions:', error)
    toast.error('Error fetching Whatsapp interactions')
    whatsappInteractions.value = [] // Reset on error
  } finally {
    // loading.value = false
  }
}

// Helper functions
const formatCurrency = amount => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00'; // Default to R0.00
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

const formatTitle = (key) => {
  // Improved formatting for keys like 'profitMargin'
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const getPercentageChange = (current, previous) => {
  if (previous === null || previous === undefined || current === null || current === undefined) return 'N/A';
  if (previous === 0) return current === 0 ? '0.00' : '∞'; // Handle division by zero
  const change = (((current - previous) / Math.abs(previous)) * 100);
  return change.toFixed(1); // Use one decimal place
}

const getProgressWidth = (current, previous) => {
  if (current === null || current === undefined || previous === null || previous === undefined) return 0;
  const maxVal = Math.max(Math.abs(current), Math.abs(previous), 1); // Use absolute values and ensure max is at least 1
  return Math.min(100, Math.max(0, (current / maxVal) * 100)); // Clamp between 0 and 100
}


const formatMetricName = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const formatMetricValue = (key, value) => {
  if (value === null || value === undefined) return 'N/A';
  if (key === 'conversionRate') return value.toFixed(1) + '%' // One decimal place
  return value.toLocaleString()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return moment(dateString).format('YYYY-MM-DD'); // Consistent date format
}

const calculateDaysOverdue = (dueDate) => {
  if (!dueDate) return 0;
  const today = moment();
  const due = moment(dueDate);
  const days = today.diff(due, 'days');
  return days > 0 ? days : 0; // Only show positive overdue days
}

const formatDateDist = (timestamp) => {
  if (!timestamp) return 'N/A';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

const getExpenseComparisonClass = (current, previous) => {
  if (current === null || current === undefined || previous === null || previous === undefined) return 'text-gray-500 dark:text-gray-400';
  if (current < previous) return 'text-green-600 dark:text-green-400' // Less expense is good
  if (current > previous) return 'text-red-600 dark:text-red-400' // More expense is bad
  return 'text-gray-500 dark:text-gray-400'
}

const getExpenseComparisonIcon = (current, previous) => {
  if (current === null || current === undefined || previous === null || previous === undefined) return 'minus';
  if (current < previous) return 'arrow-down' // Down arrow for decrease (good)
  if (current > previous) return 'arrow-up' // Up arrow for increase (bad)
  return 'minus'
}

const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  return value.toFixed(1) + '%' // One decimal place
}

const getComparisonClass = (data, key) => {
  const current = data?.current;
  const previous = data?.previous;
  if (current === null || current === undefined || previous === null || previous === undefined) return 'text-gray-500 dark:text-gray-400';

  if (key === 'totalExpenses') {
    return getExpenseComparisonClass(current, previous)
  }
  // For other metrics, higher is generally better
  return current > previous ? 'text-green-600 dark:text-green-400' : current < previous ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
}

const getComparisonIcon = (data, key) => {
   const current = data?.current;
   const previous = data?.previous;
   if (current === null || current === undefined || previous === null || previous === undefined) return 'minus';

  if (key === 'totalExpenses') {
    return getExpenseComparisonIcon(current, previous)
  }
  // For other metrics, higher is generally better
  return current > previous ? 'arrow-up' : current < previous ? 'arrow-down' : 'minus'
}

const handleViewInvoice = (invoice) => {
  // Navigate to invoice details page or open modal
  router.push({ 
    name: 'invoice', 
    params: { id: invoice.id } 
  });
}

const handleSendReminder = (invoice) => {
  // Show toast to indicate this feature
  toast.info(`Sending payment reminder for invoice #${invoice.number}`);
  // In a real implementation, you would call an API endpoint
  // to send the reminder email or message
}

const handleViewTechnician = (technician) => {
  // Navigate to technician profile page
  router.push({ 
    name: 'employee', 
    params: { id: technician.technicianId } 
  })
}

const handleViewJobs = (technician) => {
  // Navigate to jobs with filter for technician
  router.push({ 
    name: 'jobs',
    query: { technician_id: technician.technicianId }
  })
}

// WhatsApp handlers
const handleViewChat = (customerOrJid) => {
  // Navigate to customer chat page
  if (customerOrJid.id) {
    router.push({
      name: 'customer-chat',
      params: { id: customerOrJid.id }
    })
  } else {
    toast.info(`View chat for ${customerOrJid.remoteJid}`)
  }
}

const handleSendMessage = (customerOrJid) => {
  // Could open a modal or navigate to messaging page
  toast.info(`Compose message for ${customerOrJid.name || customerOrJid.remoteJid}`)
}

// Fetch all data
const fetchAllData = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') {
    // Reset data if no website is selected
    financialOverview.value = null;
    technicianPerformance.value = [];
    jobAnalytics.value = null;
    customerMetrics.value = null;
    websitePerformance.value = null;
    accountsReceivable.value = { totalOutstanding: 0, count: 0, outstandingInvoices: [] };
    whatsappInteractions.value = [];
    return;
  }
  loading.value = true;
  try {
    await Promise.all([
      fetchFinancialOverview(),
      fetchTechnicianPerformance(),
      fetchJobAnalytics(),
      fetchCustomerMetrics(),
      fetchWebsitePerformance(),
      fetchAccountsReceivable(),
      fetchWhatsappInteractions()
    ]);
  } catch (error) {
      // Errors are handled within individual fetch functions
      console.error("Error fetching dashboard data:", error);
  } finally {
      loading.value = false;
  }
}

// Watchers
watch([selectedWebsite, month, year], fetchAllData)

onMounted(() => {
  // Apply initial dark mode
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) {
    isDarkMode.value = JSON.parse(savedDarkMode)
  } else {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.classList.toggle('dark', isDarkMode.value)

  // Fetch initial data if a website is selected
  fetchAllData()
})
</script>

<style>
/* Modern Input Styles */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat bg-right;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Modern Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Table Styles */
.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
  @apply px-4 py-3 text-sm text-gray-800 dark:text-white;
}

/* Custom scrollbar styles */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* Ensure date/time inputs are stylable */
input[type="date"],
input[type="datetime-local"] {
  @apply appearance-none;
}
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  @apply filter dark:invert opacity-50 cursor-pointer;
}
</style>