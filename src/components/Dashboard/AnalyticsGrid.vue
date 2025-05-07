<!-- wibiclick-frontend-vue/src/components/Dashboard/AnalyticsGrid.vue -->
<script setup>
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  jobAnalytics: {
    type: Object,
    default: () => null
  },
  customerMetrics: {
    type: Object,
    default: () => null
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// Format title
const formatTitle = (key) => {
  if (!key) return ''
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

// Get comparison class for trend indicators
const getComparisonClass = (data, key) => {
  const current = data?.current
  const previous = data?.previous
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return 'text-gray-500 dark:text-gray-400'
  }

  // For all these metrics, higher is generally better
  return current > previous 
    ? 'text-green-600 dark:text-green-400' 
    : current < previous 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-gray-500 dark:text-gray-400'
}

// Get comparison icon
const getComparisonIcon = (data, key) => {
  const current = data?.current
  const previous = data?.previous
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return 'minus'
  }
  
  // For all these metrics, higher is better (up arrow is good)
  return current > previous 
    ? 'arrow-up' 
    : current < previous 
      ? 'arrow-down' 
      : 'minus'
}

// Get percentage change
const getPercentageChange = (current, previous) => {
  if (previous === null || previous === undefined || current === null || current === undefined) return 'N/A'
  if (previous === 0) return current === 0 ? '0.00' : '∞' // Handle division by zero
  const change = (((current - previous) / Math.abs(previous)) * 100)
  return change.toFixed(1) // Use one decimal place
}

// Jobs completion trend chart options
const jobCompletionOptions = computed(() => ({
  chart: {
    type: 'radialBar',
    height: 220,
    sparkline: {
      enabled: true
    },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937'
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      track: {
        background: props.isDarkMode ? '#374151' : '#e5e7eb',
        strokeWidth: '97%',
        margin: 5,
        dropShadow: {
          enabled: false
        }
      },
      dataLabels: {
        name: {
          show: false
        },
        value: {
          offsetY: -2,
          fontSize: '22px',
          fontWeight: 600,
          color: props.isDarkMode ? '#f3f4f6' : '#1f2937',
          formatter: function (val) {
            return val + '%'
          }
        }
      },
      hollow: {
        margin: 0,
        size: '50%'
      }
    }
  },
  colors: ['#4f46e5'],
  stroke: {
    lineCap: 'round'
  },
  grid: {
    padding: {
      top: -10
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      shadeIntensity: 0.4,
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 53, 91]
    }
  },
  labels: ['Job Completion Rate'],
  tooltip: {
    enabled: true,
    theme: props.isDarkMode ? 'dark' : 'light'
  }
}))

// Jobs completion chart series
const jobCompletionSeries = computed(() => {
	const value = props.jobAnalytics?.jobCompletionRate?.current
	return [Number.isFinite(value) ? Math.round(value) : 0]
})

// Customer trends chart options
const customerTrendsOptions = computed(() => ({
  chart: {
    type: 'line',
    height: 120,
    sparkline: {
      enabled: true
    },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937',
    toolbar: {
      show: false
    }
  },
  colors: ['#10b981'], // Emerald color
  stroke: {
    curve: 'smooth',
    width: 3
  },
  tooltip: {
    fixed: {
      enabled: false
    },
    x: {
      show: false
    },
    y: {
      title: {
        formatter: function (seriesName) {
          return ''
        }
      }
    },
    marker: {
      show: false
    },
    theme: props.isDarkMode ? 'dark' : 'light'
  },
  markers: {
    size: 0
  }
}))

// Generate mock data for customer trend visualization
// In a real app, you would fetch this from an API
const generateMockTrend = (current, previous, monthsBack = 6) => {
  // Start with previous, end with current
  const result = [previous]
  
  // Generate points in between with some randomness
  const diff = current - previous
  const step = diff / (monthsBack - 1)
  
  for (let i = 1; i < monthsBack - 1; i++) {
    // Add some randomness to the trend
    const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
    const point = previous + (step * i * randomFactor)
    result.push(Math.max(0, Math.round(point))) // Ensure no negative values
  }
  
  // Add current value as last point
  result.push(current)
  
  return result
}

// Customer trends chart series
const newCustomersSeries = computed(() => {
  if (!props.customerMetrics?.newCustomers) return [{ data: [] }]
  
  return [{
    name: 'New Customers',
    data: generateMockTrend(
      props.customerMetrics.newCustomers.current,
      props.customerMetrics.newCustomers.previous
    )
  }]
})

const repeatCustomersSeries = computed(() => {
  if (!props.customerMetrics?.repeatCustomerRate) return [{ data: [] }]
  
  return [{
    name: 'Repeat Customer Rate',
    data: generateMockTrend(
      props.customerMetrics.repeatCustomerRate.current,
      props.customerMetrics.repeatCustomerRate.previous
    )
  }]
})

const customerSatisfactionSeries = computed(() => {
  if (!props.customerMetrics?.customerSatisfaction) return [{ data: [] }]
  
  return [{
    name: 'Customer Satisfaction',
    data: generateMockTrend(
      props.customerMetrics.customerSatisfaction.current,
      props.customerMetrics.customerSatisfaction.previous
    )
  }]
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Job Analytics Section -->
    <section v-if="jobAnalytics" class="card-modern p-5 sm:p-6">
      <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Job Analytics</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Radial Gauge for Job Completion Rate -->
        <div class="flex flex-col items-center justify-center">
          <apexchart
            type="radialBar"
            height="220"
            :options="jobCompletionOptions"
            :series="jobCompletionSeries"
          ></apexchart>
          
          <div class="text-center -mt-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Job Completion Rate</p>
            <p 
              class="text-xs mt-1"
              :class="getComparisonClass(jobAnalytics.jobCompletionRate, 'jobCompletionRate')"
            >
              <font-awesome-icon 
                :icon="getComparisonIcon(jobAnalytics.jobCompletionRate, 'jobCompletionRate')" 
                class="mr-0.5"
              />
              {{ getPercentageChange(jobAnalytics.jobCompletionRate.current, jobAnalytics.jobCompletionRate.previous) }}% vs last month
            </p>
          </div>
        </div>
        
        <!-- Job metrics card -->
        <div class="space-y-6">
          <!-- Total Jobs -->
          <div class="bg-white dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Jobs</h3>
                <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {{ jobAnalytics.totalJobs.current }}
                </p>
              </div>
              <div class="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <font-awesome-icon icon="briefcase" class="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p 
              class="text-xs mt-2" 
              :class="getComparisonClass(jobAnalytics.totalJobs, 'totalJobs')"
            >
              <font-awesome-icon 
                :icon="getComparisonIcon(jobAnalytics.totalJobs, 'totalJobs')" 
                class="mr-0.5"
              />
              {{ getPercentageChange(jobAnalytics.totalJobs.current, jobAnalytics.totalJobs.previous) }}% vs last month
            </p>
            
            <!-- Job metrics visualization -->
            <div v-if="jobAnalytics.totalJobs.previous" class="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-2 bg-indigo-500 rounded-full"
                :style="{
                  width: jobAnalytics.totalJobs.previous > 0 ? 
                    `${Math.min(100, (jobAnalytics.totalJobs.current / jobAnalytics.totalJobs.previous) * 100)}%` : 
                    '100%'
                }"
              ></div>
            </div>
          </div>
          
          <!-- Additional metrics could be added here -->
        </div>
      </div>
      
      <!-- Job Types Breakdown - Example of additional content that could be added -->
      <!--
      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Job Types Breakdown</h3>
        <div class="space-y-2">
          <div v-for="(value, key) in { repair: 45, installation: 30, maintenance: 15, inspection: 10 }" :key="key">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 capitalize">{{ key }}</span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ value }}%</span>
            </div>
            <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-1.5 bg-indigo-500 rounded-full" :style="{ width: `${value}%` }"></div>
            </div>
          </div>
        </div>
      </div>
      -->
    </section>

    <!-- Customer Metrics Section -->
    <section v-if="customerMetrics" class="card-modern p-5 sm:p-6">
      <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Customer Metrics</h2>
      
      <div class="grid grid-cols-1 gap-4">
        <!-- New Customers Card -->
        <div class="bg-white dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">New Customers</h3>
              <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {{ customerMetrics.newCustomers.current }}
              </p>
            </div>
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <font-awesome-icon icon="user-plus" class="text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <p 
            class="text-xs mt-1" 
            :class="getComparisonClass(customerMetrics.newCustomers, 'newCustomers')"
          >
            <font-awesome-icon 
              :icon="getComparisonIcon(customerMetrics.newCustomers, 'newCustomers')" 
              class="mr-0.5"
            />
            {{ getPercentageChange(customerMetrics.newCustomers.current, customerMetrics.newCustomers.previous) }}% vs last month
          </p>
          
          <!-- Mini trend line -->
          <div class="mt-2 h-16">
            <apexchart
              type="line"
              height="100%"
              :options="customerTrendsOptions"
              :series="newCustomersSeries"
            ></apexchart>
          </div>
        </div>
        
        <!-- Repeat Customer Rate Card -->
        <div class="bg-white dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Repeat Customer Rate</h3>
              <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {{ customerMetrics.repeatCustomerRate.current.toFixed(1) }}%
              </p>
            </div>
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <font-awesome-icon icon="sync" class="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <p 
            class="text-xs mt-1" 
            :class="getComparisonClass(customerMetrics.repeatCustomerRate, 'repeatCustomerRate')"
          >
            <font-awesome-icon 
              :icon="getComparisonIcon(customerMetrics.repeatCustomerRate, 'repeatCustomerRate')" 
              class="mr-0.5"
            />
            {{ getPercentageChange(customerMetrics.repeatCustomerRate.current, customerMetrics.repeatCustomerRate.previous) }}% vs last month
          </p>
          
          <!-- Mini trend line -->
          <div class="mt-2 h-16">
            <apexchart
              type="line"
              height="100%"
              :options="customerTrendsOptions"
              :series="repeatCustomersSeries"
            ></apexchart>
          </div>
        </div>
        
        <!-- Customer Satisfaction Card (if available) -->
        <div 
          v-if="customerMetrics.customerSatisfaction" 
          class="bg-white dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50"
        >
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Satisfaction</h3>
              <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {{ customerMetrics.customerSatisfaction.current.toFixed(1) }}%
              </p>
            </div>
            <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <font-awesome-icon icon="smile" class="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <p 
            class="text-xs mt-1" 
            :class="getComparisonClass(customerMetrics.customerSatisfaction, 'customerSatisfaction')"
          >
            <font-awesome-icon 
              :icon="getComparisonIcon(customerMetrics.customerSatisfaction, 'customerSatisfaction')" 
              class="mr-0.5"
            />
            {{ getPercentageChange(customerMetrics.customerSatisfaction.current, customerMetrics.customerSatisfaction.previous) }}% vs last month
          </p>
          
          <!-- Mini trend line -->
          <div class="mt-2 h-16">
            <apexchart
              type="line"
              height="100%"
              :options="customerTrendsOptions"
              :series="customerSatisfactionSeries"
            ></apexchart>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>