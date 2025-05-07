<!-- wibiclick-frontend-vue/src/components/Dashboard/WebsitePerformance.vue -->
<script setup>
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  websitePerformance: {
    type: Object,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// Format metric name
const formatMetricName = (key) => {
  if (!key) return ''
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

// Format metric value
const formatMetricValue = (key, value) => {
  if (value === null || value === undefined) return 'N/A'
  if (key === 'conversionRate') return value.toFixed(1) + '%' // One decimal place
  if (key === 'bounceRate') return value.toFixed(1) + '%' // One decimal place
  return value.toLocaleString()
}

// Generate trend data for performance metrics
// In a real app, you would fetch this data from an API
const generateTrends = () => {
  if (!props.websitePerformance) return {}
  
  const trends = {}
  
  // For each metric in website performance, generate a trend
  for (const [key, value] of Object.entries(props.websitePerformance)) {
    // For demo purposes, create a trend that ends with the current value
    const points = []
    const baseValue = key === 'conversionRate' || key === 'bounceRate' ? value / 2 : value / 1.5
    
    // Generate 7 days of data
    for (let i = 6; i >= 0; i--) {
      // Generate daily progression with some randomness
      // For conversion/bounce rates, keep within reasonable percentages
      const randomFactor = 0.9 + Math.random() * 0.2 // 0.9 to 1.1
      
      // Create a progression that leads to current value
      const factor = 0.7 + ((6 - i) * 0.05) // Progresses from 0.7 to 1.0
      let point
      
      if (i === 0) {
        // Last point is exactly the current value
        point = value
      } else {
        point = baseValue * factor * randomFactor
        // Ensure rates stay within reasonable bounds
        if (key === 'conversionRate') point = Math.min(12, Math.max(1, point))
        if (key === 'bounceRate') point = Math.min(70, Math.max(20, point))
      }
      
      points.push({
        x: i,
        y: Math.round(point * 100) / 100 // Round to 2 decimal places
      })
    }
    
    trends[key] = points
  }
  
  return trends
}

const performanceTrends = ref(generateTrends())

// Metrics to display with their corresponding icons
const displayMetrics = [
  { key: 'pageViews', icon: 'eye', colorClass: 'text-blue-500', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
  { key: 'uniqueVisitors', icon: 'users', colorClass: 'text-green-500', bgClass: 'bg-green-100 dark:bg-green-900/30' },
  { key: 'conversionRate', icon: 'chart-line', colorClass: 'text-indigo-500', bgClass: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { key: 'bounceRate', icon: 'arrow-right', colorClass: 'text-orange-500', bgClass: 'bg-orange-100 dark:bg-orange-900/30' }
]

// Chart options for trend sparklines
const getTrendChartOptions = (key) => ({
  chart: {
    type: 'area',
    height: 60,
    sparkline: {
      enabled: true
    },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937'
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.3,
      stops: [0, 90, 100]
    }
  },
  tooltip: {
    fixed: {
      enabled: false
    },
    x: {
      show: false
    },
    y: {
      formatter: function (value) {
        return key === 'conversionRate' || key === 'bounceRate' 
          ? `${value.toFixed(1)}%` 
          : value.toLocaleString()
      },
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
  colors: getMetricColor(key)
})

// Get color for each metric type
const getMetricColor = (key) => {
  switch (key) {
    case 'pageViews':
      return ['#3b82f6'] // blue-500
    case 'uniqueVisitors':
      return ['#10b981'] // green-500
    case 'conversionRate':
      return ['#6366f1'] // indigo-500
    case 'bounceRate':
      return ['#f97316'] // orange-500
    default:
      return ['#8b5cf6'] // purple-500
  }
}

// Traffic sources chart options
const trafficSourcesOptions = computed(() => ({
  chart: {
    type: 'donut',
    height: 200,
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937'
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '14px'
          },
          value: {
            show: true,
            fontSize: '16px',
            formatter: function (val) {
              return val
            }
          },
          total: {
            show: true,
            label: 'Total',
            formatter: function (w) {
              return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
            }
          }
        }
      }
    }
  },
  colors: ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#ec4899'],
  labels: ['Direct', 'Organic', 'Social', 'Referral', 'Other'],
  theme: {
    mode: props.isDarkMode ? 'dark' : 'light'
  }
}))

// Mock traffic sources data
// In a real app, you would calculate this from your analytics data
const trafficSourcesSeries = computed(() => {
  // Generate mock data that adds up to total visits
  const totalVisits = props.websitePerformance?.uniqueVisitors || 1000
  
  // Fixed approximate percentages for demo
  const direct = Math.round(totalVisits * 0.35)
  const organic = Math.round(totalVisits * 0.25)
  const social = Math.round(totalVisits * 0.20)
  const referral = Math.round(totalVisits * 0.15)
  
  // Calculate 'other' to make sure they all sum to totalVisits
  const other = totalVisits - (direct + organic + social + referral)
  
  return [direct, organic, social, referral, Math.max(0, other)]
})

// Conversion funnel chart options
const conversionFunnelOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 220,
    stacked: true,
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937',
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '60%',
      dataLabels: {
        position: 'top'
      }
    }
  },
  legend: {
    show: false
  },
  dataLabels: {
    enabled: true,
    formatter: function(val, opts) {
      if (opts.seriesIndex === 0) {
        return val
      }
      return '' // Only show values for the first series
    },
    style: {
      colors: [props.isDarkMode ? '#f3f4f6' : '#1f2937']
    },
    dropShadow: {
      enabled: false
    }
  },
  xaxis: {
    categories: ['Purchases', 'Add to Cart', 'Product Views', 'Landing Page'],
    labels: {
      style: {
        colors: props.isDarkMode ? '#9ca3af' : '#6b7280'
      }
    },
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    labels: {
      show: false
    }
  },
  tooltip: {
    shared: false,
    theme: props.isDarkMode ? 'dark' : 'light',
    y: {
      formatter: function (val) {
        return val
      }
    }
  },
  colors: ['#6366f1'],
  grid: {
    borderColor: props.isDarkMode ? '#374151' : '#e5e7eb',
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 20
    }
  }
}))

// Generate mock conversion funnel data
// In a real application, you would calculate this from your analytics data
const conversionFunnelSeries = computed(() => {
  const visitors = props.websitePerformance?.uniqueVisitors || 1000
  const conversionRate = props.websitePerformance?.conversionRate || 2
  
  // Calculate funnel stages with realistic drop-offs at each stage
  const pageViews = visitors
  const productViews = Math.round(pageViews * 0.5) // 50% go to product pages
  const addToCart = Math.round(productViews * 0.3) // 30% add to cart
  const purchases = Math.round(addToCart * 0.25) // 25% complete purchase
  
  return [{
    name: 'Visitors',
    data: [purchases, addToCart, productViews, pageViews]
  }]
})
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Website Performance</h2>
    
    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div 
        v-for="metric in displayMetrics" 
        :key="metric.key"
        class="bg-white dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ formatMetricName(metric.key) }}
            </h3>
            <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
              {{ formatMetricValue(metric.key, websitePerformance[metric.key]) }}
            </p>
          </div>
          <div :class="metric.bgClass" class="p-2 rounded-lg">
            <font-awesome-icon :icon="metric.icon" :class="metric.colorClass" />
          </div>
        </div>
        
        <!-- Sparkline trend -->
        <div class="mt-3 h-16" v-if="performanceTrends && performanceTrends[metric.key]">
          <apexchart
            type="area"
            height="100%"
            :options="getTrendChartOptions(metric.key)"
            :series="[{ name: formatMetricName(metric.key), data: performanceTrends[metric.key] }]"
          ></apexchart>
        </div>
      </div>
    </div>
    
    <!-- Analytics Insight Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Traffic Sources Chart -->
      <div class="bg-white dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
        <h3 class="text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Traffic Sources</h3>
        <apexchart
          type="donut"
          height="200"
          :options="trafficSourcesOptions"
          :series="trafficSourcesSeries"
        ></apexchart>
      </div>
      
      <!-- Conversion Funnel -->
      <div class="bg-white dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
        <h3 class="text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Conversion Funnel</h3>
        <apexchart
          type="bar"
          height="200"
          :options="conversionFunnelOptions"
          :series="conversionFunnelSeries"
        ></apexchart>
      </div>
    </div>
    
    <!-- Device & Browser Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Device Breakdown -->
      <div class="bg-white dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
        <h3 class="text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Device Breakdown</h3>
        <div class="space-y-3">
          <!-- Desktop -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="desktop" class="mr-1.5 text-blue-500" />
                Desktop
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">45%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-blue-500 rounded-full" style="width: 45%"></div>
            </div>
          </div>
          
          <!-- Mobile -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="mobile-alt" class="mr-1.5 text-green-500" />
                Mobile
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">50%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-green-500 rounded-full" style="width: 50%"></div>
            </div>
          </div>
          
          <!-- Tablet -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="tablet-alt" class="mr-1.5 text-purple-500" />
                Tablet
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">5%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-purple-500 rounded-full" style="width: 5%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Browser Breakdown -->
      <div class="bg-white dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
        <h3 class="text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Browser Breakdown</h3>
        <div class="space-y-3">
          <!-- Chrome -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="chrome" class="mr-1.5 text-blue-500" />
                Chrome
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">60%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-blue-500 rounded-full" style="width: 60%"></div>
            </div>
          </div>
          
          <!-- Safari -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="safari" class="mr-1.5 text-green-500" />
                Safari
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">25%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-green-500 rounded-full" style="width: 25%"></div>
            </div>
          </div>
          
          <!-- Firefox -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="firefox" class="mr-1.5 text-orange-500" />
                Firefox
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">10%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-orange-500 rounded-full" style="width: 10%"></div>
            </div>
          </div>
          
          <!-- Other Browsers -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <font-awesome-icon icon="edge" class="mr-1.5 text-purple-500" />
                Other
              </span>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">5%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-2 bg-purple-500 rounded-full" style="width: 5%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>