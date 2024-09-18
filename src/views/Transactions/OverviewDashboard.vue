<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <div class="container mx-auto px-4 md:px-2 md:py-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-800">Dashboard</h1>
        <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300">
          <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" class="text-yellow-500 dark:text-blue-300" />
        </button>
      </div>

      <div class="flex flex-wrap gap-4 mb-8">
        <select v-model="selectedWebsite" class="form-select bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
          <option value="">Select Website</option>
          <option v-for="site in websites" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>

        <select v-model="month" class="form-select bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
          <option v-for="m in 12" :key="m" :value="m">
            {{ moment().month(m - 1).format('MMMM') }}
          </option>
        </select>

        <select v-model="year" class="form-select bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
          <option v-for="y in 5" :key="y" :value="currentYear - y + 1">
            {{ currentYear - y + 1 }}
          </option>
        </select>
      </div>

      <!-- Financial Overview Section -->
      <section v-if="financialOverview" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Financial Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <div class="grid grid-cols-2 gap-4">
              <div v-for="(data, key) in financialOverview" :key="key" class="text-center">
                <h3 class="font-semibold text-gray-600 dark:text-gray-400 capitalize">{{ formatTitle(key) }}</h3>
                <p class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
                  {{ key === 'profitMargin' ? formatPercentage(data.current) : formatCurrency(data.current) }}
                </p>
                <p class="text-sm mt-1" :class="getComparisonClass(data, key)">
                  <font-awesome-icon :icon="getComparisonIcon(data, key)" />
                  {{ getPercentageChange(data.current, data.previous) }}% from last month
                </p>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Earnings Distribution</h3>
            <apexchart
              type="pie"
              height="300"
              :options="earningsDistributionOptions"
              :series="earningsDistributionSeries"
            ></apexchart>
          </div>
        </div>
      </section>

      <!-- Accounts Receivable Section -->
      <section v-if="accountsReceivable" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Accounts Receivable</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="text-center">
              <h3 class="font-semibold text-gray-600 dark:text-gray-400">Total Outstanding</h3>
              <p class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">{{ formatCurrency(accountsReceivable.totalOutstanding) }}</p>
            </div>
            <div class="text-center">
              <h3 class="font-semibold text-gray-600 dark:text-gray-400">Number of Outstanding Invoices</h3>
              <p class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">{{ accountsReceivable.count }}</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Invoice Number</th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Customer</th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Issue Date</th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Due Date</th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Amount</th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in accountsReceivable.outstandingInvoices" :key="invoice.id" class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ invoice.number }}</td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">
                    <router-link 
                      :to="{
                        name: 'contact',
                        query: { customer_id: invoice.customer?.id }
                      }"
                      class="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition duration-150 ease-in-out"
                    >
                      <span>{{ invoice.customer.name }}</span>
                    </router-link>
                  </td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ formatDate(invoice.issuedAt) }}</td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ formatDate(invoice.dueAt) }}</td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ formatCurrency(invoice.sales) }}</td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ calculateDaysOverdue(invoice.dueAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Technician Performance Section -->
      <section v-if="technicianPerformance.length > 0" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Technician Performance</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <apexchart
            type="bar"
            height="350"
            :options="technicianPerformanceChartOptions"
            :series="technicianPerformanceChartSeries"
          ></apexchart>
          <div class="overflow-x-auto mt-6">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">Technician</th>
                  <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">Total Earnings</th>
                  <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">Jobs Completed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tech in technicianPerformance" :key="tech.technicianId" class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ tech.name }}</td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ formatCurrency(tech.totalEarnings) }}</td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">{{ tech.jobsCompleted }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Job Analytics Section -->
      <section v-if="jobAnalytics" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Job Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <h3 class="font-semibold text-gray-600 dark:text-gray-400 mb-2">Total Jobs</h3>
            <p class="text-3xl font-bold text-gray-800 dark:text-white">{{ jobAnalytics.totalJobs.current }}</p>
            <p class="text-sm mt-2" :class="getComparisonClass(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous)">
              <font-awesome-icon :icon="getComparisonIcon(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous)" />
              {{ getPercentageChange(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous) }}% from last month
            </p>
            <div class="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: getProgressWidth(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous) + '%' }"></div>
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <h3 class="font-semibold text-gray-600 dark:text-gray-400 mb-2">Job Completion Rate</h3>
            <p class="text-3xl font-bold text-gray-800 dark:text-white">{{ jobAnalytics.jobCompletionRate.current.toFixed(2) }}%</p>
            <p class="text-sm mt-2" :class="getComparisonClass(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous)">
              <font-awesome-icon :icon="getComparisonIcon(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous)" />
              {{ getPercentageChange(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous) }}% from last month
            </p>
            <div class="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div class="bg-green-600 h-2.5 rounded-full" :style="{ width: jobAnalytics.jobCompletionRate.current + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Customer Metrics Section -->
      <section v-if="customerMetrics" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Customer Metrics</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(metric, key) in customerMetrics" :key="key" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <h3 class="font-semibold text-gray-600 dark:text-gray-400 mb-2 capitalize">{{ formatTitle(key) }}</h3>
            <p class="text-3xl font-bold text-gray-800 dark:text-white">
              {{ key === 'repeatCustomerRate' ? metric.current.toFixed(2) + '%' : metric.current }}
            </p>
            <p class="text-sm mt-2" :class="getComparisonClass(metric.current, metric.previous)">
              <font-awesome-icon :icon="getComparisonIcon(metric.current, metric.previous)" />
              {{ getPercentageChange(metric.current, metric.previous) }}% from last month
            </p>
            <div class="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div :class="['h-2.5 rounded-full', key === 'newCustomers' ? 'bg-purple-600' : key === 'totalCustomers' ? 'bg-yellow-600' : 'bg-pink-600']"
                   :style="{ width: getProgressWidth(metric.current, metric.previous) + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Website Performance Section -->
      <section v-if="websitePerformance" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Website Performance</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div v-for="(metric, key) in websitePerformance" :key="key" class="text-center">
              <h3 class="font-semibold text-gray-600 dark:text-gray-400 capitalize">{{ formatMetricName(key) }}</h3>
              <p class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
                {{ formatMetricValue(key, metric) }}
              </p>
            </div>
          </div>
          <apexchart
            type="line"
            height="300"
            :options="websitePerformanceChartOptions"
            :series="websitePerformanceChartSeries"
          ></apexchart>
        </div>
      </section>     

      <!-- Whatsapp Interactions Section -->
      <section v-if="whatsappInteractions && whatsappInteractions.length > 0" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Recent Whatsapp Interactions</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <div class="space-y-4">
            <div v-for="interaction in whatsappInteractions" :key="interaction.id" 
                class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div :class="['w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center', 
                            interaction.fromMe ? 'bg-blue-500' : 'bg-green-500']">
                <font-awesome-icon :icon="interaction.fromMe ? 'paper-plane' : 'user'" class="text-white" />
              </div>
              <div class="flex-grow overflow-hidden">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-semibold text-gray-800 dark:text-white">{{ interaction.customer?.name || interaction.remoteJid }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDateDist(interaction.createdAt) }}</span>
                </div>
                <p class="text-gray-600 dark:text-gray-300">{{ interaction.text }}</p>
              </div>
            </div>
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
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import moment from 'moment'
import { useUserStore } from '@/stores/UserStore'
import { useToast } from 'vue-toast-notification'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import VueApexCharts from 'vue3-apexcharts'
import { differenceInDays, formatDistanceToNow } from 'date-fns'

// Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser, faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser, faSun, faMoon)

const userStore = useUserStore()
const toast = useToast()

const loading = ref(false)
const websites = ref([])
const selectedWebsite = ref(null)
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

const isDarkMode = ref(true)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
}

// Chart options and series
const earningsComparisonOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: ['Total Earnings', 'Total Expenses', 'Net Profit'],
    labels: { style: { colors: isDarkMode.value ? '#fff' : '#000' } }
  },
  yaxis: { labels: { style: { colors: isDarkMode.value ? '#fff' : '#000' } } },
  fill: { opacity: 1 },
  tooltip: { y: { formatter: val => formatCurrency(val) } },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
}))

const earningsComparisonSeries = computed(() => {
  if (!financialOverview.value) return []
  return [
    {
      name: 'Current Month',
      data: [
        financialOverview.value.totalEarnings.current,
        financialOverview.value.totalExpenses.current,
        financialOverview.value.netProfit.current
      ]
    },
    {
      name: 'Previous Month',
      data: [
        financialOverview.value.totalEarnings.previous,
        financialOverview.value.totalExpenses.previous,
        financialOverview.value.netProfit.previous
      ]
    }
  ]
})

const technicianPerformanceChartOptions = computed(() => ({
  chart: {
    type: 'line',
    stacked: false,
    toolbar: { show: false },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  plotOptions: { bar: { columnWidth: '55%' } },
  xaxis: {
    categories: technicianPerformance.value.map(tech => tech.name),
    labels: { style: { colors: isDarkMode.value ? '#fff' : '#000' } }
  },
  yaxis: [
    {
      title: { text: 'Total Earnings' },
      labels: {
        formatter: value => formatCurrency(value),
        style: { colors: isDarkMode.value ? '#fff' : '#000' }
      }
    },
    {
      opposite: true,
      title: { text: 'Jobs Completed' },
      labels: { style: { colors: isDarkMode.value ? '#fff' : '#000' } }
    }
  ],
  dataLabels: { enabled: false },
  stroke: { width: [0, 4] },
  legend: { position: 'top' },
  tooltip: {
    shared: true,
    intersect: false,
    y: [
      { formatter: val => formatCurrency(val) },
      { formatter: val => val + ' jobs' }
    ]
  },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
}))

const technicianPerformanceChartSeries = computed(() => {
  if (!technicianPerformance.value) return []
  return [
    {
      name: 'Total Earnings',
      type: 'column',
      data: technicianPerformance.value.map(tech => parseFloat(tech.totalEarnings))
    },
    {
      name: 'Jobs Completed',
      type: 'line',
      data: technicianPerformance.value.map(tech => tech.jobsCompleted)
    }
  ]
})

const websitePerformanceChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  xaxis: {
    categories: ['Page Views', 'Unique Visitors', 'Conversions'],
    labels: { style: { colors: isDarkMode.value ? '#fff' : '#000' } }
  },
  yaxis: { labels: { style: { colors: isDarkMode.value ? '#fff' : '#000' } } },
  tooltip: { y: { formatter: (val) => val.toFixed(0) } },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
}))

const websitePerformanceChartSeries = computed(() => {
  if (!websitePerformance.value) return []
  return [{
    name: 'Metrics',
    data: [
      websitePerformance.value.pageViews,
      websitePerformance.value.uniqueVisitors,
      websitePerformance.value.conversions
    ]
  }]
})

// Fetch functions
const fetchWebsites = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/get-websites-for-user?id=${userStore.user.id}`)
    websites.value = response.data
    if (websites.value.length > 0) {
      selectedWebsite.value = websites.value[0].value
    }
  } catch (error) {
    console.error('Error fetching websites:', error)
    toast.error('Error fetching websites')
  } finally {
    loading.value = false
  }
}

const fetchFinancialOverview = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/financial-overview', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    const data = response.data

    // Calculate technician and company earnings
    const netProfit = data.netProfit.current
    const technicianEarnings = netProfit * 0.2
    const companyEarnings = netProfit * 0.8

    financialOverview.value = {
      ...data,
      technicianEarnings: {
        current: technicianEarnings,
        previous: data.netProfit.previous * 0.2
      },
      companyEarnings: {
        current: companyEarnings,
        previous: data.netProfit.previous * 0.8
      },
      profitMargin: {
        current: (netProfit / data.totalEarnings.current) * 100,
        previous: (data.netProfit.previous / data.totalEarnings.previous) * 100
      }
    }
  } catch (error) {
    console.error('Error fetching financial overview:', error)
    toast.error('Error fetching financial overview')
  } finally {
    loading.value = false
  }
}

const fetchTechnicianPerformance = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/technician-performance', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    technicianPerformance.value = response.data
  } catch (error) {
    console.error('Error fetching technician performance:', error)
    toast.error('Error fetching technician performance')
  } finally {
    loading.value = false
  }
}

const fetchJobAnalytics = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/job-analytics', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    jobAnalytics.value = response.data
  } catch (error) {
    console.error('Error fetching job analytics:', error)
    toast.error('Error fetching job analytics')
  } finally {
    loading.value = false
  }
}

const fetchCustomerMetrics = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/customer-metrics', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    customerMetrics.value = response.data
  } catch (error) {
    console.error('Error fetching customer metrics:', error)
    toast.error('Error fetching customer metrics')
  } finally {
    loading.value = false
  }
}

const fetchWebsitePerformance = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/website-performance', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    websitePerformance.value = response.data
  } catch (error) {
    console.error('Error fetching website performance:', error)
    toast.error('Error fetching website performance')
  } finally {
    loading.value = false
  }
}

const fetchAccountsReceivable = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/outstanding-invoices', {
      params: { year: year.value, month: month.value, id: selectedWebsite.value }
    })
    accountsReceivable.value = response.data
  } catch (error) {
    console.error('Error fetching accounts receivable:', error)
    toast.error('Error fetching accounts receivable')
  } finally {
    loading.value = false
  }
}

const fetchWhatsappInteractions = async () => {
  if (!selectedWebsite.value) return
  try {
    loading.value = true
    const response = await axios.get('/recent-whatsapp-interactions', {
      params: { id: selectedWebsite.value, limit: 10 }
    })
    whatsappInteractions.value = response.data
  } catch (error) {
    console.error('Error fetching Whatsapp interactions:', error)
    toast.error('Error fetching Whatsapp interactions')
  } finally {
    loading.value = false
  }
}

// Helper functions
const formatCurrency = amount => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

const formatTitle = (key) => {
  return key.split(/(?=[A-Z])/).join(' ')
}

const getPercentageChange = (current, previous) => {
  if (previous === 0) return current === 0 ? '0.00' : '100.00'
  return (((current - previous) / previous) * 100).toFixed(2)
}

const getProgressWidth = (current, previous) => {
  const max = Math.max(current, previous, 1)
  return ((current / max) * 100).toFixed(2)
}

const formatMetricName = (key) => {
  return key.split(/(?=[A-Z])/).join(' ')
}

const formatMetricValue = (key, value) => {
  if (key === 'conversionRate') return value.toFixed(2) + '%'
  return value.toLocaleString()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const calculateDaysOverdue = (dueDate) => {
  const today = new Date()
  const due = new Date(dueDate)
  return differenceInDays(today, due)
}

const formatDateDist = (timestamp) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

const getExpenseComparisonClass = (current, previous) => {
  if (current < previous) return 'text-green-500'
  if (current > previous) return 'text-red-500'
  return 'text-gray-500'
}

const getExpenseComparisonIcon = (current, previous) => {
  if (current < previous) return 'arrow-down'
  if (current > previous) return 'arrow-up'
  return 'minus'
}

const formatPercentage = (value) => {
  return value.toFixed(2) + '%'
}

const getComparisonClass = (data, key) => {
  if (key === 'totalExpenses') {
    return getExpenseComparisonClass(data.current, data.previous)
  }
  return data.current > data.previous ? 'text-green-500' : data.current < data.previous ? 'text-red-500' : 'text-gray-500'
}

const getComparisonIcon = (data, key) => {
  if (key === 'totalExpenses') {
    return getExpenseComparisonIcon(data.current, data.previous)
  }
  return data.current > data.previous ? 'arrow-up' : data.current < data.previous ? 'arrow-down' : 'minus'
}

const earningsDistributionOptions = computed(() => ({
  chart: {
    type: 'pie',
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  labels: ['Company Earnings', 'Technician Earnings'],
  theme: { mode: isDarkMode.value ? 'light' : 'light' },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
}))

const earningsDistributionSeries = computed(() => {
  if (!financialOverview.value) return []
  return [
    financialOverview.value.companyEarnings.current,
    financialOverview.value.technicianEarnings.current
  ]
})

// Watchers and lifecycle hooks
watch(selectedWebsite, (newValue) => {
  if (newValue) {
    fetchFinancialOverview()
    fetchTechnicianPerformance()
    fetchJobAnalytics()
    fetchCustomerMetrics()
    fetchWebsitePerformance()
    fetchAccountsReceivable()
    fetchWhatsappInteractions()
  }
})

watch([month, year], () => {
  if (selectedWebsite.value) {
    fetchFinancialOverview()
    fetchTechnicianPerformance()
    fetchJobAnalytics()
    fetchCustomerMetrics()
    fetchWebsitePerformance()
    fetchAccountsReceivable()
  }
})

watch(isDarkMode, () => {
  // This will trigger a re-computation of the chart options
  // when the dark mode changes
})

onMounted(() => {
  if (userStore.user) {
    fetchWebsites()
  }
  
  // Check for saved dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) {
    isDarkMode.value = JSON.parse(savedDarkMode)
  } else {
    // If no preference is saved, use system preference
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
})
</script>

<style>
/* Add any global styles here */
.form-select {
  @apply block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.dark .form-select {
  @apply bg-gray-700 border-gray-600 text-white;
}

/* Progress bar animations */
@keyframes progress {
  0% { width: 0; }
  100% { width: 100%; }
}

.progress-animate > div {
  animation: progress 1s ease-in-out;
}

/* Transition for dark mode */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
