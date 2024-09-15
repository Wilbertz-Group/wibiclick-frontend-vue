<template>
  <scale-loader
    :loading="loading"
    color="#23293b"
    height="50px"
    class="vld-overlay is-active is-full-page"
    width="6px"
  >
  </scale-loader>
  <div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50">
    <div
      class="w-full min-h-screen relative bg-white px-6 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:rounded-lg sm:px-10"
    >
      <h1 class="text-3xl font-bold mt-6 mb-6">Dashboard</h1>

      <div class="flex space-x-4 mb-6">
        <select v-model="selectedWebsite" class="form-select">
          <option value="">Select Website</option>
          <option v-for="site in websites" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>

        <select v-model="month" class="form-select">
          <option v-for="m in 12" :key="m" :value="m">
            {{ moment().month(m - 1).format('MMMM') }}
          </option>
        </select>

        <select v-model="year" class="form-select">
          <option v-for="y in 5" :key="y" :value="currentYear - y + 1">
            {{ currentYear - y + 1 }}
          </option>
        </select>
      </div>

      <!-- Financial Overview Section -->
      <div v-if="financialOverview" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-lg border border-gray-200 shadow-md p-4">
          <h2 class="text-xl font-semibold mb-4">Financial Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold">Total Earnings</h3>
              <p>
                Current Month: {{ formatCurrency(financialOverview.totalEarnings.current) }}
              </p>
              <p>
                Previous Month: {{ formatCurrency(financialOverview.totalEarnings.previous) }}
              </p>
            </div>
            <div>
              <h3 class="font-semibold">Total Expenses</h3>
              <p>
                Current Month: {{ formatCurrency(financialOverview.totalExpenses.current) }}
              </p>
              <p>
                Previous Month: {{ formatCurrency(financialOverview.totalExpenses.previous) }}
              </p>
            </div>
            <div>
              <h3 class="font-semibold">Net Profit</h3>
              <p>
                Current Month: {{ formatCurrency(financialOverview.netProfit.current) }}
              </p>
              <p>
                Previous Month: {{ formatCurrency(financialOverview.netProfit.previous) }}
              </p>
            </div>
          </div>
        </div>

        <!-- You can add charts here to visualize the data -->
        <!-- Example: Earnings Chart -->
        <div class="rounded-lg border border-gray-200 shadow-md">
          <h2 class="text-xl font-semibold p-4">Earnings Comparison</h2>
          <apexchart
            :options="earningsComparisonOptions"
            :series="earningsComparisonSeries"
            type="bar"
            height="350"
          ></apexchart>
        </div>
      </div>

      <!-- Technician Performance Section -->
      <div v-if="technicianPerformance.length > 0" class="rounded-lg border border-gray-200 shadow-md p-4 mt-6">
        <h2 class="text-xl font-semibold mb-4">Technician Performance</h2>

        <!-- Add the chart here -->
        <apexchart
          type="bar"
          height="350"
          :options="technicianPerformanceChartOptions"
          :series="technicianPerformanceChartSeries"
        ></apexchart>

        <!-- Existing table (optional, you can keep or remove it) -->
        <div class="overflow-x-auto mt-6">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="text-left px-4 py-2">Technician</th>
                <th class="text-left px-4 py-2">Total Earnings</th>
                <th class="text-left px-4 py-2">Jobs Completed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tech in technicianPerformance" :key="tech.technicianId" class="border-b">
                <td class="px-4 py-2">{{ tech.name }}</td>
                <td class="px-4 py-2">{{ formatCurrency(tech.totalEarnings) }}</td>
                <td class="px-4 py-2">{{ tech.jobsCompleted }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Accounts Receivable Section -->
      <div v-if="accountsReceivable" class="rounded-lg border border-gray-200 shadow-md p-4 mt-6">
        <h2 class="text-xl font-semibold mb-4">Accounts Receivable</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="font-semibold">Total Outstanding</h3>
            <p class="text-2xl font-bold">{{ formatCurrency(accountsReceivable.totalOutstanding) }}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="font-semibold">Number of Outstanding Invoices</h3>
            <p class="text-2xl font-bold">{{ accountsReceivable.count }}</p>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left">Invoice Number</th>
                <th class="px-4 py-2 text-left">Customer</th>
                <th class="px-4 py-2 text-left">Issue Date</th>
                <th class="px-4 py-2 text-left">Due Date</th>
                <th class="px-4 py-2 text-left">Amount</th>
                <th class="px-4 py-2 text-left">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in accountsReceivable.outstandingInvoices" :key="invoice.id" class="border-b">
                <td class="px-4 py-2">{{ invoice.number }}</td>
                <td class="px-4 py-2">{{ invoice.customer.name }}</td>
                <td class="px-4 py-2">{{ formatDate(invoice.issuedAt) }}</td>
                <td class="px-4 py-2">{{ formatDate(invoice.dueAt) }}</td>
                <td class="px-4 py-2">{{ formatCurrency(invoice.sales) }}</td>
                <td class="px-4 py-2">{{ calculateDaysOverdue(invoice.dueAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Job Analytics Section -->
      <div v-if="jobAnalytics" class="rounded-lg border border-gray-200 shadow-md p-4 mt-6">
        <h2 class="text-xl font-semibold mb-4">Job Analytics</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Total Jobs Card -->
          <div class="bg-white p-4 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold">Total Jobs</h3>
                <p class="text-2xl font-bold">{{ jobAnalytics.totalJobs.current }}</p>
              </div>
              <div class="text-right">
                <!-- Comparison Icon -->
                <i :class="getComparisonClass(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous)">
                  <font-awesome-icon :icon="getComparisonIcon(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous)" />
                </i>
                <p class="text-sm">
                  {{ getPercentageChange(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous) }}% from last month
                </p>
              </div>
            </div>
            <!-- Progress Bar -->
            <div class="progress sm-progress-bar progress-animate mt-4">
              <div role="progressbar"
                  :aria-valuenow="jobAnalytics.totalJobs.current"
                  aria-valuemin="0"
                  :aria-valuemax="Math.max(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous, 1)"
                  class="progress-gradient-primary h-1.5"
                  :style="{ width: getProgressWidth(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous) + '%' }">
                <span class="text-blue-600 absolute -bottom-4">
                  {{ jobAnalytics.totalJobs.current }}
                </span>
                <span class="animate-circle"></span>
              </div>
            </div>
          </div>

          <!-- Job Completion Rate Card -->
          <div class="bg-white p-4 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold">Job Completion Rate</h3>
                <p class="text-2xl font-bold">{{ jobAnalytics.jobCompletionRate.current.toFixed(2) }}%</p>
              </div>
              <div class="text-right">
                <!-- Comparison Icon -->
                <i :class="getComparisonClass(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous)">
                  <font-awesome-icon :icon="getComparisonIcon(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous)" />
                </i>
                <p class="text-sm">
                  {{ getPercentageChange(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous) }}% from last month
                </p>
              </div>
            </div>
            <!-- Progress Bar -->
            <div class="progress sm-progress-bar progress-animate mt-4">
              <div role="progressbar"
                  :aria-valuenow="jobAnalytics.jobCompletionRate.current"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  class="progress-gradient-success h-1.5"
                  :style="{ width: jobAnalytics.jobCompletionRate.current + '%' }">
                <span class="text-green-600 absolute -bottom-4">
                  {{ jobAnalytics.jobCompletionRate.current.toFixed(2) }}%
                </span>
                <span class="animate-circle"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Metrics Section -->
      <div v-if="customerMetrics" class="rounded-lg border border-gray-200 shadow-md p-4 mt-6">
        <h2 class="text-xl font-semibold mb-4">Customer Metrics</h2>

        <div class="grid py-8 md:grid-cols-3 sm:grid-cols-1 gap-3">
          <!-- New Customers Card -->
          <div class="rounded-lg border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <div class="space-y-6 pt-8 pb-16 text-center leading-7 text-black-600 relative">
              <div class="grid px-4 md:grid-cols-2 gap-3 items-center">
                <div class="text-left">
                  <span class="text-sm tracking-tight font-bold">New Customers This Month</span><br>
                  <span class="text-4xl font-bold">
                    {{ customerMetrics.newCustomers.current }}
                  </span>
                </div>
                <div class="text-right">
                  <!-- Comparison Icon -->
                  <i :class="getComparisonClass(customerMetrics.newCustomers.current, customerMetrics.newCustomers.previous)">
                    <font-awesome-icon :icon="getComparisonIcon(customerMetrics.newCustomers.current, customerMetrics.newCustomers.previous)" />
                  </i>
                  <p class="text-sm">
                    {{ getPercentageChange(customerMetrics.newCustomers.current, customerMetrics.newCustomers.previous) }}% from last month
                  </p>
                </div>
              </div>
              <!-- Progress Bar -->
              <div class="progress sm-progress-bar progress-animate px-4">
                <div role="progressbar"
                    :aria-valuenow="customerMetrics.newCustomers.current"
                    aria-valuemin="0"
                    :aria-valuemax="Math.max(customerMetrics.newCustomers.current, customerMetrics.newCustomers.previous)"
                    class="progress-gradient-success h-1.5"
                    :style="{ width: getProgressWidth(customerMetrics.newCustomers.current, customerMetrics.newCustomers.previous) + '%' }">
                  <span class="text-green-600 absolute -bottom-4">
                    {{ customerMetrics.newCustomers.current }}
                  </span>
                  <span class="animate-circle"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Customers Card -->
          <div class="rounded-lg border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <div class="space-y-6 pt-8 pb-16 text-center leading-7 text-black-600 relative">
              <div class="grid px-4 md:grid-cols-2 gap-3 items-center">
                <div class="text-left">
                  <span class="text-sm tracking-tight font-bold">Total Customers</span><br>
                  <span class="text-4xl font-bold">
                    {{ customerMetrics.totalCustomers.current }}
                  </span>
                </div>
                <div class="text-right">
                  <!-- Comparison Icon -->
                  <i :class="getComparisonClass(customerMetrics.totalCustomers.current, customerMetrics.totalCustomers.previous)">
                    <font-awesome-icon :icon="getComparisonIcon(customerMetrics.totalCustomers.current, customerMetrics.totalCustomers.previous)" />
                  </i>
                  <p class="text-sm">
                    {{ getPercentageChange(customerMetrics.totalCustomers.current, customerMetrics.totalCustomers.previous) }}% from last month
                  </p>
                </div>
              </div>
              <!-- Progress Bar -->
              <div class="progress sm-progress-bar progress-animate px-4">
                <div role="progressbar"
                    :aria-valuenow="customerMetrics.totalCustomers.current"
                    aria-valuemin="0"
                    :aria-valuemax="Math.max(customerMetrics.totalCustomers.current, customerMetrics.totalCustomers.previous)"
                    class="progress-gradient-primary h-1.5"
                    :style="{ width: getProgressWidth(customerMetrics.totalCustomers.current, customerMetrics.totalCustomers.previous) + '%' }">
                  <span class="text-blue-600 absolute -bottom-4">
                    {{ customerMetrics.totalCustomers.current }}
                  </span>
                  <span class="animate-circle"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Repeat Customer Rate Card -->
          <div class="rounded-lg border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <div class="space-y-6 pt-8 pb-16 text-center leading-7 text-black-600 relative">
              <div class="grid px-4 md:grid-cols-2 gap-3 items-center">
                <div class="text-left">
                  <span class="text-sm tracking-tight font-bold">Repeat Customer Rate</span><br>
                  <span class="text-4xl font-bold">
                    {{ customerMetrics.repeatCustomerRate.current.toFixed(2) }}%
                  </span>
                </div>
                <div class="text-right">
                  <!-- Comparison Icon -->
                  <i :class="getComparisonClass(customerMetrics.repeatCustomerRate.current, customerMetrics.repeatCustomerRate.previous)">
                    <font-awesome-icon :icon="getComparisonIcon(customerMetrics.repeatCustomerRate.current, customerMetrics.repeatCustomerRate.previous)" />
                  </i>
                  <p class="text-sm">
                    {{ getPercentageChange(customerMetrics.repeatCustomerRate.current, customerMetrics.repeatCustomerRate.previous) }}% from last month
                  </p>
                </div>
              </div>
              <!-- Progress Bar -->
              <div class="progress sm-progress-bar progress-animate px-4">
                <div role="progressbar"
                    :aria-valuenow="customerMetrics.repeatCustomerRate.current"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    class="progress-gradient-secondary h-1.5"
                    :style="{ width: customerMetrics.repeatCustomerRate.current + '%' }">
                  <span class="text-purple-600 absolute -bottom-4">
                    {{ customerMetrics.repeatCustomerRate.current.toFixed(2) }}%
                  </span>
                  <span class="animate-circle"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Website Performance Section -->
      <div v-if="websitePerformance" class="rounded-lg border border-gray-200 shadow-md p-4 mt-6">
        <h2 class="text-xl font-semibold mb-4">Website Performance</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="(metric, key) in websitePerformance" :key="key" class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="font-semibold capitalize">{{ formatMetricName(key) }}</h3>
            <p class="text-2xl font-bold">
              {{ formatMetricValue(key, metric) }}
            </p>
          </div>
        </div>
        
        <!-- Add a chart for visualizing the data -->
        <div class="mt-6">
          <apexchart
            type="line"
            height="350"
            :options="websitePerformanceChartOptions"
            :series="websitePerformanceChartSeries"
          ></apexchart>
        </div>
      </div>

      <!-- Whatsapp Interactions -->
      <div v-if="whatsappInteractions" class="rounded-lg border border-gray-200 shadow-md p-4 mt-6">
        <h2 class="text-xl font-semibold mb-4">Recent Whatsapp Interactions</h2>
        
        <div class="space-y-4 min-w-10 min-h-10">
          <div v-for="interaction in whatsappInteractions" :key="interaction.id" 
              class="bg-white p-4 rounded-lg shadow-md flex items-start">
            <div :class="['w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center mr-4', 
                          interaction.fromMe ? 'bg-blue-500' : 'bg-green-500']">
              <font-awesome-icon :icon="interaction.fromMe ? 'paper-plane' : 'user'" class="text-white" />
            </div>
            <div class="flex-grow">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">{{ interaction.customer?.name || interaction.remoteJid }}</span>
                <span class="text-sm text-gray-500">{{ formatDateDist(interaction.createdAt) }}</span>
              </div>
              <p class="text-gray-700">{{ interaction.text }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import axios from 'axios'
  import moment from 'moment'
  import { useUserStore } from '@/stores/UserStore'
  import { useToast } from 'vue-toast-notification'
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import VueApexCharts from 'vue3-apexcharts'
  import { differenceInDays, formatDistanceToNow } from 'date-fns'

  // Import Font Awesome icons
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser } from '@fortawesome/free-solid-svg-icons'
  import { library } from '@fortawesome/fontawesome-svg-core'

  library.add(faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser)

  // Register FontAwesomeIcon component
  // (If you're using Vue 3 composition API, you can register it locally in the component)
  const components = {
    'font-awesome-icon': FontAwesomeIcon
  }

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

  const earningsComparisonOptions = ref({})
  const earningsComparisonSeries = ref([])

  const technicianPerformanceChartOptions = ref({})
  const technicianPerformanceChartSeries = ref([])

  const websitePerformance = ref(null)
  const websitePerformanceChartOptions = ref({})
  const websitePerformanceChartSeries = ref([])

  const accountsReceivable = ref(null)

  const whatsappInteractions = ref(null)

  const jobAnalytics = ref({
    totalJobs: {
      current: 0,
      previous: 0
    },
    completedJobs: {
      current: 0,
      previous: 0
    },
    jobCompletionRate: {
      current: 0,
      previous: 0
    },
    jobTypes: []
  })


  const customerMetrics = ref({
    newCustomers: {
      current: 0,
      previous: 0
    },
    totalCustomers: {
      current: 0,
      previous: 0
    },
    repeatCustomerRate: {
      current: 0,
      previous: 0
    }
  })

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
        params: {
          year: year.value,
          month: month.value,
          id: selectedWebsite.value
        }
      })
      financialOverview.value = response.data
      updateEarningsComparisonChart()
    } catch (error) {
      console.error('Error fetching financial overview:', error)
      toast.error('Error fetching financial overview')
    } finally {
      loading.value = false
    }
  }

  // Fetch technician performance data
  const fetchTechnicianPerformance = async () => {
    if (!selectedWebsite.value) return

    try {
      loading.value = true
      const response = await axios.get('/technician-performance', {
        params: {
          year: year.value,
          month: month.value,
          id: selectedWebsite.value
        }
      })
      technicianPerformance.value = response.data
      updateTechnicianPerformanceChart()
    } catch (error) {
      console.error('Error fetching technician performance:', error)
      toast.error('Error fetching technician performance')
    } finally {
      loading.value = false
    }
  }

  // Function to update the chart data and options
  const updateTechnicianPerformanceChart = () => {
    if (!technicianPerformance.value) return

    const categories = technicianPerformance.value.map(tech => tech.name)

    technicianPerformanceChartOptions.value = {
      chart: {
        height: 350,
        type: 'line', // Mixed chart
        stacked: false,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          columnWidth: '55%'
        }
      },
      xaxis: {
        categories,
        labels: { style: { colors: '#000' } }
      },
      yaxis: [
        {
          title: {
            text: 'Total Earnings',
          },
          labels: {
            formatter: value => formatCurrency(value),
            style: { colors: '#000' }
          }
        },
        {
          opposite: true,
          title: {
            text: 'Jobs Completed',
          },
          labels: {
            style: { colors: '#000' }
          }
        }
      ],
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'top'
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: [
          {
            formatter: val => formatCurrency(val)
          },
          {
            formatter: val => val + ' jobs'
          }
        ]
      }
    }

    technicianPerformanceChartSeries.value = [
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
  }

  const updateEarningsComparisonChart = () => {
    if (!financialOverview.value) return

    earningsComparisonOptions.value = {
      chart: {
        height: 350,
        type: 'bar',
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%'
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: {
        categories: ['Total Earnings', 'Total Expenses', 'Net Profit'],
        labels: { style: { colors: '#000' } }
      },
      yaxis: {
        labels: { style: { colors: '#000' } }
      },
      fill: { opacity: 1 },
      tooltip: {
        y: {
          formatter: val => formatCurrency(val)
        }
      }
    }

    earningsComparisonSeries.value = [
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
  }

  const fetchJobAnalytics = async () => {
    if (!selectedWebsite.value) return

    try {
      loading.value = true
      const response = await axios.get('/job-analytics', {
        params: {
          year: year.value,
          month: month.value,
          id: selectedWebsite.value
        }
      })
      jobAnalytics.value = response.data
    } catch (error) {
      console.error('Error fetching job analytics:', error)
      toast.error('Error fetching job analytics')
    } finally {
      loading.value = false
    }
  }

  // Methods for percentage change and comparison icons
  const getPercentageChange = (current, previous) => {
    if (previous === 0) {
      return current === 0 ? '0.00' : '100.00'
    }
    return (((current - previous) / previous) * 100).toFixed(2)
  }

  const getComparisonClass = (current, previous) => {
    if (current > previous) {
      return 'text-green-600' // Up arrow color
    } else if (current < previous) {
      return 'text-red-600' // Down arrow color
    } else {
      return 'text-gray-600' // Neutral color
    }
  }

  const getComparisonIcon = (current, previous) => {
    if (current > previous) {
      return 'arrow-up'
    } else if (current < previous) {
      return 'arrow-down'
    } else {
      return 'minus'
    }
  }

  const getProgressWidth = (current, previous) => {
    const max = Math.max(current, previous, 1)
    return ((current / max) * 100).toFixed(2)
  }

  // Fetch customer metrics
  const fetchCustomerMetrics = async () => {
    if (!selectedWebsite.value) return

    try {
      loading.value = true
      const response = await axios.get('/customer-metrics', {
        params: {
          year: year.value,
          month: month.value,
          id: selectedWebsite.value
        }
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
        params: {
          year: year.value,
          month: month.value,
          id: selectedWebsite.value
        }
      })
      websitePerformance.value = response.data
      updateWebsitePerformanceChart()
    } catch (error) {
      console.error('Error fetching website performance:', error)
      toast.error('Error fetching website performance')
    } finally {
      loading.value = false
    }
  }

  const updateWebsitePerformanceChart = () => {
    if (!websitePerformance.value) return

    websitePerformanceChartOptions.value = {
      chart: {
        height: 350,
        type: 'line',
        toolbar: { show: false }
      },
      xaxis: {
        categories: ['Page Views', 'Unique Visitors', 'Conversions'],
        labels: { style: { colors: '#000' } }
      },
      yaxis: {
        labels: { style: { colors: '#000' } }
      },
      tooltip: {
        y: {
          formatter: (val) => val.toFixed(0)
        }
      }
    }

    websitePerformanceChartSeries.value = [
      {
        name: 'Metrics',
        data: [
          websitePerformance.value.pageViews,
          websitePerformance.value.uniqueVisitors,
          websitePerformance.value.conversions
        ]
      }
    ]
  }

  const formatMetricName = (key) => {
    return key.split(/(?=[A-Z])/).join(' ')
  }

  const formatMetricValue = (key, value) => {
    if (key === 'conversionRate') {
      return value.toFixed(2) + '%'
    }
    return value.toLocaleString()
  }

  const fetchAccountsReceivable = async () => {
    if (!selectedWebsite.value) return

    try {
      loading.value = true
      const response = await axios.get('/outstanding-invoices', {
        params: {
          year: year.value,
          month: month.value,
          id: selectedWebsite.value
        }
      })
      accountsReceivable.value = response.data
    } catch (error) {
      console.error('Error fetching accounts receivable:', error)
      toast.error('Error fetching accounts receivable')
    } finally {
      loading.value = false
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateDaysOverdue = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    return differenceInDays(today, due)
  }

  const fetchWhatsappInteractions = async () => {
    if (!selectedWebsite.value) return

    try {
      loading.value = true
      const response = await axios.get('/recent-whatsapp-interactions', {
        params: {
          id: selectedWebsite.value,
          limit: 10
        }
      })
      whatsappInteractions.value = response.data
    } catch (error) {
      console.error('Error fetching Whatsapp interactions:', error)
      toast.error('Error fetching Whatsapp interactions')
    } finally {
      loading.value = false
    }
  }

  const formatDateDist = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

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
      fetchWhatsappInteractions()
    }
  })


  onMounted(() => {
    if (userStore.user) {
      fetchWebsites()
    }
  })

  watch(selectedWebsite, newValue => {
    if (newValue) {
      fetchFinancialOverview()
      fetchTechnicianPerformance()
      fetchJobAnalytics()
      fetchCustomerMetrics()
    }
  })

  watch([month, year], () => {
    if (selectedWebsite.value) {
      fetchFinancialOverview()
      fetchTechnicianPerformance()
      fetchJobAnalytics()
      fetchCustomerMetrics()
    }
  })



  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

</script>

