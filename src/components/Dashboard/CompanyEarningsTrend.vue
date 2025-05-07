<!-- wibiclick-frontend-vue/src/components/Dashboard/CompanyEarningsTrend.vue -->
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import moment from 'moment'
import axios from 'axios'

const props = defineProps({
  websiteId: {
    type: String,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  },
  year: {
    type: Number,
    default: () => moment().year()
  }
})

const loading = ref(true)
const activeView = ref('area') // 'area', 'line', or 'bar'
const earningsData = ref([])
const kpiData = ref({
  growth: 0,
  best: { month: '', value: 0 },
  forecast: 0
})

// Fetch monthly earnings data for the last 12 months
// In CompanyEarningsTrend.vue
const fetchMonthlyEarnings = async () => {
  if (!props.websiteId || props.websiteId === 'default') return
  
  loading.value = true
  try {
    const response = await axios.get('/company-earnings-history', {
      params: { id: props.websiteId }
    })
    
    // Transform API data to the format needed by the component
    earningsData.value = response.data.map(item => {
      const date = new Date(item.year, item.month - 1)
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
      
      return {
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        companyEarnings: item.companyEarnings,
        formattedMonth: `${monthNames[date.getMonth()].substring(0, 3)} ${date.getFullYear()}`,
        shortMonth: monthNames[date.getMonth()].substring(0, 3)
      }
    })

		// Add month-over-month percentage changes
		let previousValue = null;
		earningsData.value = earningsData.value.map((item, index) => {
			let changePercentage = null;
			if (index > 0 && previousValue !== null) {
				changePercentage = ((item.companyEarnings - previousValue) / previousValue) * 100;
			}
			previousValue = item.companyEarnings;
			return { ...item, changePercentage };
		});

		// Calculate KPI data from real data
		// 1. Find best month
		const bestMonth = earningsData.value.reduce((best, current) => {
			return (current.companyEarnings > best.value) 
				? { month: `${current.month} ${current.year}`, value: current.companyEarnings } 
				: best;
		}, { month: '', value: 0 });

		// 2. Calculate 6-month growth rate
		const lastSixMonths = earningsData.value.slice(-6);
		const firstSixMonths = earningsData.value.slice(0, 6);
		const lastSixTotal = lastSixMonths.reduce((sum, item) => sum + item.companyEarnings, 0);
		const firstSixTotal = firstSixMonths.reduce((sum, item) => sum + item.companyEarnings, 0);
		const growthRate = ((lastSixTotal - firstSixTotal) / firstSixTotal) * 100;

		// 3. Create next month forecast (average of last 3 months with 2% growth trend)
		const lastThreeMonths = earningsData.value.slice(-3);
		const avgLastThree = lastThreeMonths.reduce((sum, item) => sum + item.companyEarnings, 0) / 3;
		const forecastValue = Math.round(avgLastThree * 1.02); // 2% projected growth

		// Update KPI data
		kpiData.value = {
			growth: growthRate.toFixed(1),
			best: bestMonth,
			forecast: forecastValue
		};
    
  } catch (error) {
    console.error('Error fetching monthly earnings:', error)
  } finally {
    loading.value = false
  }
}

// Format currency (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

// Calculate statistics
const stats = computed(() => {
  if (!earningsData.value || earningsData.value.length === 0) {
    return { total: 0, average: 0, max: 0, min: 0 }
  }
  
  const total = earningsData.value.reduce((sum, item) => sum + item.companyEarnings, 0)
  const average = total / earningsData.value.length
  const max = Math.max(...earningsData.value.map(item => item.companyEarnings))
  const min = Math.min(...earningsData.value.map(item => item.companyEarnings))
  
  return { total, average, max, min }
})

// Helper to get color based on value sign
const getValueColor = (value) => {
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

// Area chart options and series
const areaChartOptions = computed(() => ({
  chart: {
    height: 350,
    type: 'area',
    toolbar: { show: false },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937'
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  xaxis: {
    categories: earningsData.value.map(d => d.shortMonth),
    labels: {
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' }
    },
    axisBorder: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
    axisTicks: { color: props.isDarkMode ? '#374151' : '#e5e7eb' }
  },
  yaxis: {
    labels: {
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' },
      formatter: (val) => `R${(val / 1000).toFixed(0)}k`
    }
  },
  tooltip: {
    theme: props.isDarkMode ? 'dark' : 'light',
    y: {
      formatter: (val) => formatCurrency(val),
      title: {
        formatter: (seriesName) => 'Company Earnings'
      }
    },
    x: {
      formatter: (idx) => {
        const item = earningsData.value[idx - 1]
        return item ? `${item.month} ${item.year}` : ''
      }
    }
  },
  grid: {
    borderColor: props.isDarkMode ? '#374151' : '#e5e7eb',
    strokeDashArray: 3
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.2,
      stops: [0, 90, 100],
      colorStops: [
        {
          offset: 0,
          color: props.isDarkMode ? '#4f46e5' : '#6366f1',
          opacity: 0.8
        },
        {
          offset: 100,
          color: props.isDarkMode ? '#4f46e5' : '#6366f1',
          opacity: 0
        }
      ]
    }
  },
  colors: [props.isDarkMode ? '#4f46e5' : '#6366f1'],
}))

const areaChartSeries = computed(() => [{
  name: 'Company Earnings',
  data: earningsData.value.map(d => d.companyEarnings)
}])

// Line chart options and series
const lineChartOptions = computed(() => ({
  chart: {
    height: 350,
    type: 'line',
    toolbar: { show: false },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937'
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'straight',
    width: 3
  },
  markers: {
    size: 5,
    colors: [props.isDarkMode ? '#4f46e5' : '#6366f1'],
    strokeColors: props.isDarkMode ? '#1f2937' : '#ffffff',
    strokeWidth: 2
  },
  xaxis: {
    categories: earningsData.value.map(d => d.shortMonth),
    labels: {
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' }
    },
    axisBorder: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
    axisTicks: { color: props.isDarkMode ? '#374151' : '#e5e7eb' }
  },
  yaxis: {
    labels: {
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' },
      formatter: (val) => `R${(val / 1000).toFixed(0)}k`
    }
  },
  tooltip: {
    theme: props.isDarkMode ? 'dark' : 'light',
    y: {
      formatter: (val) => formatCurrency(val),
      title: {
        formatter: (seriesName) => 'Company Earnings'
      }
    },
    x: {
      formatter: (idx) => {
        const item = earningsData.value[idx - 1]
        return item ? `${item.month} ${item.year}` : ''
      }
    }
  },
  grid: {
    borderColor: props.isDarkMode ? '#374151' : '#e5e7eb',
    strokeDashArray: 3
  },
  colors: [props.isDarkMode ? '#4f46e5' : '#6366f1'],
}))

const lineChartSeries = computed(() => [{
  name: 'Company Earnings',
  data: earningsData.value.map(d => d.companyEarnings)
}])

// Bar chart options and series
const barChartOptions = computed(() => ({
  chart: {
    height: 350,
    type: 'bar',
    toolbar: { show: false },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937'
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%',
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: earningsData.value.map(d => d.shortMonth),
    labels: {
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' }
    },
    axisBorder: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
    axisTicks: { color: props.isDarkMode ? '#374151' : '#e5e7eb' }
  },
  yaxis: {
    labels: {
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' },
      formatter: (val) => `R${(val / 1000).toFixed(0)}k`
    }
  },
  tooltip: {
    theme: props.isDarkMode ? 'dark' : 'light',
    y: {
      formatter: (val) => formatCurrency(val),
      title: {
        formatter: (seriesName) => 'Company Earnings'
      }
    },
    x: {
      formatter: (idx) => {
        const item = earningsData.value[idx - 1]
        return item ? `${item.month} ${item.year}` : ''
      }
    }
  },
  grid: {
    borderColor: props.isDarkMode ? '#374151' : '#e5e7eb',
    strokeDashArray: 3
  },
  colors: [props.isDarkMode ? '#818cf8' : '#818cf8'],
}))

const barChartSeries = computed(() => [{
  name: 'Company Earnings',
  data: earningsData.value.map(d => d.companyEarnings)
}])

// Update data when props change
watch(() => props.websiteId, fetchMonthlyEarnings)
watch(() => props.year, fetchMonthlyEarnings)

// Initial data fetch
onMounted(() => {
  fetchMonthlyEarnings()
})
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Company Earnings - 12 Month Trend
      </h2>
      
      <!-- Chart type toggles -->
      <div class="flex items-center space-x-1 mt-2 sm:mt-0 bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
        <button 
          @click="activeView = 'area'"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            activeView === 'area' 
              ? 'bg-indigo-500 text-white' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
          ]"
        >
          Area
        </button>
        <button 
          @click="activeView = 'line'"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            activeView === 'line' 
              ? 'bg-indigo-500 text-white' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
          ]"
        >
          Line
        </button>
        <button 
          @click="activeView = 'bar'"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            activeView === 'bar' 
              ? 'bg-indigo-500 text-white' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
          ]"
        >
          Bar
        </button>
      </div>
    </div>
    
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="p-4 rounded-lg border" :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'">
        <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">12 Month Total</h3>
        <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-white' : 'text-gray-900'">{{ formatCurrency(stats.total) }}</p>
      </div>
      
      <div class="p-4 rounded-lg border" :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'">
        <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">6 Month Growth</h3>
        <p class="text-2xl font-bold mt-1" :class="getValueColor(kpiData.growth)">
          {{ kpiData.growth > 0 ? '+' : '' }}{{ kpiData.growth }}%
        </p>
      </div>
      
      <div class="p-4 rounded-lg border" :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'">
        <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">Best Month</h3>
        <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-white' : 'text-gray-900'">{{ formatCurrency(kpiData.best.value) }}</p>
        <p class="text-xs mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">{{ kpiData.best.month }}</p>
      </div>
      
      <div class="p-4 rounded-lg border" :class="isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'">
        <h3 class="text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">Next Month Forecast</h3>
        <p class="text-2xl font-bold mt-1" :class="isDarkMode ? 'text-indigo-400' : 'text-indigo-600'">{{ formatCurrency(kpiData.forecast) }}</p>
        <div class="flex items-center mt-1">
          <div class="h-1 flex-grow bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-1 bg-indigo-500" 
              :style="{ width: `${Math.min(100, (kpiData.forecast / stats.max) * 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
    </div>
    
    <!-- Charts -->
    <div v-else class="h-80">
      <!-- Area Chart -->
      <apexchart
        v-if="activeView === 'area'" 
        type="area"
        height="100%"
        :options="areaChartOptions"
        :series="areaChartSeries"
      ></apexchart>
      
      <!-- Line Chart -->
      <apexchart
        v-else-if="activeView === 'line'" 
        type="line"
        height="100%"
        :options="lineChartOptions"
        :series="lineChartSeries"
      ></apexchart>
      
      <!-- Bar Chart -->
      <apexchart
        v-else-if="activeView === 'bar'" 
        type="bar"
        height="100%"
        :options="barChartOptions"
        :series="barChartSeries"
      ></apexchart>
    </div>
    
    <!-- Data Table -->
    <div v-if="!loading" class="mt-6 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
        <thead :class="isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'">
          <tr>
            <th class="th-modern">Month</th>
            <th class="th-modern text-right">Company Earnings</th>
            <th class="th-modern text-right">Change (MoM)</th>
          </tr>
        </thead>
        <tbody class="divide-y" :class="isDarkMode ? 'divide-gray-700/50' : 'divide-gray-100'">
          <tr 
            v-for="(item, index) in earningsData" 
            :key="index" 
            class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <td class="td-modern">{{ item.month }} {{ item.year }}</td>
            <td class="td-modern text-right">{{ formatCurrency(item.companyEarnings) }}</td>
            <td 
              class="td-modern text-right"
              :class="item.changePercentage === null 
                ? 'text-gray-400 dark:text-gray-500' 
                : item.changePercentage >= 0 
                  ? 'text-green-500 dark:text-green-400' 
                  : 'text-red-500 dark:text-red-400'"
            >
              {{ item.changePercentage === null 
                ? '—' 
                : `${item.changePercentage >= 0 ? '+' : ''}${item.changePercentage.toFixed(1)}%` }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>