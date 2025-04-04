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
              <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <font-awesome-icon icon="chevron-down" class="h-4 w-4 text-gray-400" aria-hidden="true" />
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
              <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <font-awesome-icon icon="chevron-down" class="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
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
              <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <font-awesome-icon icon="chevron-down" class="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
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

        <!-- Financial Overview Section -->
        <section v-if="financialOverview" class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Financial Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Key Metrics -->
            <div class="grid grid-cols-2 gap-6">
              <div v-for="(data, key) in financialOverview" :key="key" class="text-center border-r dark:border-gray-700 last:border-r-0 pr-4 last:pr-0">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{{ formatTitle(key) }}</h3>
                <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {{ key === 'profitMargin' ? formatPercentage(data.current) : formatCurrency(data.current) }}
                </p>
                <p class="text-xs mt-1" :class="getComparisonClass(data, key)">
                  <font-awesome-icon :icon="getComparisonIcon(data, key)" class="mr-0.5"/>
                  {{ getPercentageChange(data.current, data.previous) }}% vs last month
                </p>
              </div>
            </div>
            <!-- Earnings Distribution Chart -->
            <div>
              <h3 class="text-lg font-medium mb-3 text-center text-gray-700 dark:text-gray-300">Earnings Distribution</h3>
              <apexchart
                type="pie"
                height="250"
                :options="earningsDistributionOptions"
                :series="earningsDistributionSeries"
              ></apexchart>
            </div>
          </div>
        </section>

        <!-- Accounts Receivable Section -->
        <section v-if="accountsReceivable" class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Accounts Receivable</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-center">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Outstanding</h3>
              <p class="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">{{ formatCurrency(accountsReceivable.totalOutstanding) }}</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Invoices</h3>
              <p class="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{{ accountsReceivable.count }}</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead class="bg-gray-50 dark:bg-gray-900/30">
                <tr>
                  <th class="th-modern">Invoice #</th>
                  <th class="th-modern">Customer</th>
                  <th class="th-modern">Issue Date</th>
                  <th class="th-modern">Due Date</th>
                  <th class="th-modern text-right">Amount</th>
                  <th class="th-modern text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-if="!accountsReceivable.outstandingInvoices || accountsReceivable.outstandingInvoices.length === 0">
                  <td colspan="6" class="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No outstanding invoices.</td>
                </tr>
                <tr v-for="invoice in accountsReceivable.outstandingInvoices" :key="invoice.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td class="td-modern">{{ invoice.number }}</td>
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
                  <td class="td-modern text-right whitespace-nowrap">{{ formatCurrency(invoice.sales) }}</td>
                  <td class="td-modern text-right whitespace-nowrap font-medium" :class="calculateDaysOverdue(invoice.dueAt) > 30 ? 'text-red-600 dark:text-red-400' : calculateDaysOverdue(invoice.dueAt) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'">
                    {{ calculateDaysOverdue(invoice.dueAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Technician Performance Section -->
        <section v-if="technicianPerformance.length > 0" class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Technician Performance</h2>
          <apexchart
            type="bar"
            height="350"
            :options="technicianPerformanceChartOptions"
            :series="technicianPerformanceChartSeries"
          ></apexchart>
           <div class="overflow-x-auto mt-6">
             <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                 <tr>
                   <th class="th-modern">Technician</th>
                   <th class="th-modern text-right">Total Earnings</th>
                   <th class="th-modern text-right">Jobs Completed</th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                 <tr v-for="tech in technicianPerformance" :key="tech.technicianId" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                   <td class="td-modern">{{ tech.name }}</td>
                   <td class="td-modern text-right">{{ formatCurrency(tech.totalEarnings) }}</td>
                   <td class="td-modern text-right">{{ tech.jobsCompleted }}</td>
                 </tr>
               </tbody>
             </table>
           </div>
        </section>

        <!-- Job Analytics & Customer Metrics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Job Analytics Section -->
          <section v-if="jobAnalytics" class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Job Analytics</h2>
            <div class="space-y-6">
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Jobs</h3>
                <p class="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{{ jobAnalytics.totalJobs.current }}</p>
                <p class="text-xs mt-1" :class="getComparisonClass(jobAnalytics.totalJobs, 'totalJobs')">
                  <font-awesome-icon :icon="getComparisonIcon(jobAnalytics.totalJobs, 'totalJobs')" class="mr-0.5"/>
                  {{ getPercentageChange(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous) }}% vs last month
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Job Completion Rate</h3>
                <p class="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{{ jobAnalytics.jobCompletionRate.current.toFixed(1) }}%</p>
                <p class="text-xs mt-1" :class="getComparisonClass(jobAnalytics.jobCompletionRate, 'jobCompletionRate')">
                  <font-awesome-icon :icon="getComparisonIcon(jobAnalytics.jobCompletionRate, 'jobCompletionRate')" class="mr-0.5"/>
                  {{ getPercentageChange(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous) }}% vs last month
                </p>
              </div>
            </div>
          </section>

          <!-- Customer Metrics Section -->
          <section v-if="customerMetrics" class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Customer Metrics</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div v-for="(metric, key) in customerMetrics" :key="key" class="text-center">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{{ formatTitle(key) }}</h3>
                <p class="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                  {{ key === 'repeatCustomerRate' ? metric.current.toFixed(1) + '%' : metric.current }}
                </p>
                <p class="text-xs mt-1" :class="getComparisonClass(metric, key)">
                  <font-awesome-icon :icon="getComparisonIcon(metric, key)" class="mr-0.5"/>
                  {{ getPercentageChange(metric.current, metric.previous) }}% vs last month
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- Website Performance Section -->
        <section v-if="websitePerformance" class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Website Performance</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 text-center">
            <div v-for="(metric, key) in websitePerformance" :key="key">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{{ formatMetricName(key) }}</h3>
              <p class="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {{ formatMetricValue(key, metric) }}
              </p>
            </div>
          </div>
          <!-- Chart removed for brevity, can be added back if needed -->
          <!-- <apexchart type="line" height="300" :options="websitePerformanceChartOptions" :series="websitePerformanceChartSeries"></apexchart> -->
        </section>

        <!-- Whatsapp Interactions Section -->
        <section v-if="whatsappInteractions && whatsappInteractions.length > 0" class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Recent Whatsapp Interactions</h2>
          <div class="space-y-4 max-h-96 overflow-y-auto pr-2">
            <div v-for="interaction in whatsappInteractions" :key="interaction.id"
                 class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div :class="['w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center',
                            interaction.fromMe ? 'bg-indigo-500' : 'bg-green-500']">
                <font-awesome-icon :icon="interaction.fromMe ? 'paper-plane' : 'user'" class="text-white text-xs" />
              </div>
              <div class="flex-grow overflow-hidden">
                <div class="flex justify-between items-baseline mb-1">
                  <span class="text-sm font-medium text-gray-800 dark:text-white truncate">{{ interaction.customer?.name || interaction.remoteJid }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">{{ formatDateDist(interaction.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300">{{ interaction.text }}</p>
              </div>
            </div>
          </div>
        </section>

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