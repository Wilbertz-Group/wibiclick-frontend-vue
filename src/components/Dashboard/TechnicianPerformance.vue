<!-- wibiclick-frontend-vue/src/components/Dashboard/TechnicianPerformance.vue -->
<script setup>
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  technicianPerformance: {
    type: Array,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view-technician', 'view-jobs'])

// Sorting state
const sortBy = ref('totalEarnings') // 'name', 'totalEarnings', 'jobsCompleted'
const sortOrder = ref('desc') // 'asc', 'desc'

// View mode
const viewMode = ref('bar') // 'bar', 'horizontal', 'table'

// Format currency (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount)
}

// Sorted technicians data
const sortedTechnicians = computed(() => {
  if (!props.technicianPerformance || props.technicianPerformance.length === 0) return []
  
  return [...props.technicianPerformance].sort((a, b) => {
    // Default comparison
    let comparison = 0
    
    // Sort by selected column
    if (sortBy.value === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '')
    } else if (sortBy.value === 'totalEarnings') {
      comparison = (parseFloat(a.totalEarnings) || 0) - (parseFloat(b.totalEarnings) || 0)
    } else if (sortBy.value === 'jobsCompleted') {
      comparison = (a.jobsCompleted || 0) - (b.jobsCompleted || 0)
    }
    
    // Reverse if sort order is descending
    return sortOrder.value === 'desc' ? -comparison : comparison
  })
})

// Performance metrics
const performanceMetrics = computed(() => {
  if (!props.technicianPerformance || props.technicianPerformance.length === 0) {
    return { total: 0, average: 0, best: null, totalJobs: 0 }
  }
  
  const totalEarnings = props.technicianPerformance.reduce((sum, tech) => 
    sum + (parseFloat(tech.totalEarnings) || 0), 0)
  
  const totalJobs = props.technicianPerformance.reduce((sum, tech) => 
    sum + (tech.jobsCompleted || 0), 0)
  
  const bestPerformer = [...props.technicianPerformance].sort((a, b) => 
    (parseFloat(b.totalEarnings) || 0) - (parseFloat(a.totalEarnings) || 0))[0]
  
  return {
    total: totalEarnings,
    average: props.technicianPerformance.length > 0 ? totalEarnings / props.technicianPerformance.length : 0,
    best: bestPerformer,
    totalJobs: totalJobs,
    avgJobValue: totalJobs > 0 ? totalEarnings / totalJobs : 0
  }
})

// Chart options for bar chart
const barChartOptions = computed(() => ({
  chart: { 
    type: 'bar', 
    height: 350, 
    toolbar: { show: false },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937' 
  },
  plotOptions: { 
    bar: { 
      horizontal: false, 
      columnWidth: '55%', 
      endingShape: 'rounded',
      borderRadius: 4,
      distributed: true
    } 
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: sortedTechnicians.value.map(tech => tech.name),
    labels: { 
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' },
      rotate: -45,
      rotateAlways: false,
      trim: false,
      maxHeight: 120
    },
    axisBorder: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
    axisTicks: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
  },
  yaxis: {
    title: { 
      text: 'Total Earnings (ZAR)', 
      style: { color: props.isDarkMode ? '#9ca3af' : '#6b7280' } 
    },
    labels: { 
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' }, 
      formatter: (val) => formatCurrency(val) 
    }
  },
  fill: { opacity: 1 },
  tooltip: {
    theme: props.isDarkMode ? 'dark' : 'light',
    y: { formatter: (val) => formatCurrency(val) }
  },
  grid: { borderColor: props.isDarkMode ? '#374151' : '#e5e7eb' },
  colors: ['#4f46e5', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].slice(0, sortedTechnicians.value.length),
  legend: {
    show: false
  }
}))

// Bar chart series
const barChartSeries = computed(() => [{
  name: 'Total Earnings',
  data: sortedTechnicians.value.map(tech => parseFloat(tech.totalEarnings || 0))
}])

// Chart options for horizontal bar chart
const horizontalBarChartOptions = computed(() => ({
  chart: { 
    type: 'bar', 
    height: 350, 
    toolbar: { show: false },
    foreColor: props.isDarkMode ? '#f3f4f6' : '#1f2937' 
  },
  plotOptions: { 
    bar: { 
      horizontal: true, 
      barHeight: '70%',
      borderRadius: 4,
      distributed: true
    } 
  },
  dataLabels: { 
    enabled: true,
    textAnchor: 'start',
    style: {
      colors: ['#fff']
    },
    formatter: function(val, opt) {
      return formatCurrency(val)
    },
    offsetX: 0
  },
  stroke: { width: 1, colors: ['transparent'] },
  xaxis: {
    categories: sortedTechnicians.value.map(tech => tech.name),
    labels: { 
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' },
    },
    axisBorder: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
    axisTicks: { color: props.isDarkMode ? '#374151' : '#e5e7eb' },
  },
  yaxis: {
    labels: { 
      style: { colors: props.isDarkMode ? '#9ca3af' : '#6b7280' }
    }
  },
  fill: { opacity: 1 },
  tooltip: {
    theme: props.isDarkMode ? 'dark' : 'light',
    y: { 
      formatter: (val) => formatCurrency(val),
      title: {
        formatter: (seriesName) => ''
      }
    }
  },
  grid: { 
    borderColor: props.isDarkMode ? '#374151' : '#e5e7eb',
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    } 
  },
  colors: ['#4f46e5', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].slice(0, sortedTechnicians.value.length),
  legend: {
    show: false
  }
}))

// Horizontal bar chart series
const horizontalBarChartSeries = computed(() => [{
  name: 'Total Earnings',
  data: sortedTechnicians.value.map(tech => parseFloat(tech.totalEarnings || 0))
}])

// Toggle sorting
const toggleSort = (column) => {
  if (sortBy.value === column) {
    // Toggle sort order if same column is clicked
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new sort column and default to descending
    sortBy.value = column
    sortOrder.value = 'desc'
  }
}

// Navigate to technician details
const viewTechnician = (technician) => {
  emit('view-technician', technician)
}

// View technician's jobs
const viewJobs = (technician) => {
  emit('view-jobs', technician)
}
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Technician Performance</h2>
      
      <!-- View mode toggle -->
      <div class="flex items-center mt-2 sm:mt-0 space-x-2">
        <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
          <button 
            @click="viewMode = 'bar'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              viewMode === 'bar' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
            title="Bar Chart"
          >
            <font-awesome-icon icon="chart-bar" />
          </button>
          <button 
            @click="viewMode = 'horizontal'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              viewMode === 'horizontal' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
            title="Horizontal Chart"
          >
            <font-awesome-icon icon="chart-bar" class="rotate-90" />
          </button>
          <button 
            @click="viewMode = 'table'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              viewMode === 'table' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
            title="Table View"
          >
            <font-awesome-icon icon="table" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Performance metrics cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <!-- Total Earnings -->
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Earnings</h3>
        <p class="text-xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
          {{ formatCurrency(performanceMetrics.total) }}
        </p>
      </div>
      
      <!-- Total Jobs -->
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Jobs</h3>
        <p class="text-xl font-bold mt-1 text-gray-900 dark:text-white">
          {{ performanceMetrics.totalJobs }}
        </p>
      </div>
      
      <!-- Average Per Technician -->
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Per Technician</h3>
        <p class="text-xl font-bold mt-1 text-gray-900 dark:text-white">
          {{ formatCurrency(performanceMetrics.average) }}
        </p>
      </div>
      
      <!-- Average Job Value -->
      <div class="bg-white dark:bg-gray-800/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Job Value</h3>
        <p class="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
          {{ formatCurrency(performanceMetrics.avgJobValue) }}
        </p>
      </div>
    </div>
    
    <!-- Bar Chart View -->
    <div v-if="viewMode === 'bar'" class="h-80">
      <apexchart
        type="bar"
        height="100%"
        :options="barChartOptions"
        :series="barChartSeries"
      ></apexchart>
    </div>
    
    <!-- Horizontal Bar Chart View -->
    <div v-else-if="viewMode === 'horizontal'" class="h-80">
      <apexchart
        type="bar"
        height="100%"
        :options="horizontalBarChartOptions"
        :series="horizontalBarChartSeries"
      ></apexchart>
    </div>
    
    <!-- Table View -->
    <div v-else-if="viewMode === 'table'" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
        <thead class="bg-gray-50 dark:bg-gray-900/30">
          <tr>
            <!-- Name header with sort -->
            <th 
              @click="toggleSort('name')" 
              class="th-modern cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/30"
            >
              Technician
              <font-awesome-icon 
                v-if="sortBy === 'name'" 
                :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'"
                class="ml-1 text-indigo-500"
              />
            </th>
            
            <!-- Earnings header with sort -->
            <th 
              @click="toggleSort('totalEarnings')" 
              class="th-modern text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/30"
            >
              Total Earnings
              <font-awesome-icon 
                v-if="sortBy === 'totalEarnings'" 
                :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'"
                class="ml-1 text-indigo-500"
              />
            </th>
            
            <!-- Jobs header with sort -->
            <th 
              @click="toggleSort('jobsCompleted')" 
              class="th-modern text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/30"
            >
              Jobs Completed
              <font-awesome-icon 
                v-if="sortBy === 'jobsCompleted'" 
                :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'"
                class="ml-1 text-indigo-500"
              />
            </th>
            
            <!-- Average per job -->
            <th class="th-modern text-right">Avg Per Job</th>
            
            <!-- Actions -->
            <th class="th-modern text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <tr v-for="tech in sortedTechnicians" :key="tech.technicianId" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <td class="td-modern font-medium">{{ tech.name }}</td>
            <td class="td-modern text-right font-medium">{{ formatCurrency(tech.totalEarnings) }}</td>
            <td class="td-modern text-right">{{ tech.jobsCompleted }}</td>
            <td class="td-modern text-right">
              {{ formatCurrency(tech.jobsCompleted > 0 ? tech.totalEarnings / tech.jobsCompleted : 0) }}
            </td>
            <td class="td-modern text-right space-x-2 whitespace-nowrap">
              <button 
                @click="viewTechnician(tech)" 
                class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                title="View technician details"
              >
                <font-awesome-icon icon="user" />
              </button>
              <button 
                @click="viewJobs(tech)" 
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                title="View technician's jobs"
              >
                <font-awesome-icon icon="tasks" />
              </button>
            </td>
          </tr>
          
          <!-- Empty state -->
          <tr v-if="sortedTechnicians.length === 0">
            <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No technician data available.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Table view below chart for all views except table -->
    <div v-if="viewMode !== 'table'" class="overflow-x-auto mt-6">
      <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
        <thead class="bg-gray-50 dark:bg-gray-900/30">
          <tr>
            <th class="th-modern">Technician</th>
            <th class="th-modern text-right">Total Earnings</th>
            <th class="th-modern text-right">Jobs Completed</th>
            <th class="th-modern text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <tr v-for="tech in sortedTechnicians" :key="tech.technicianId" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <td class="td-modern">{{ tech.name }}</td>
            <td class="td-modern text-right">{{ formatCurrency(tech.totalEarnings) }}</td>
            <td class="td-modern text-right">{{ tech.jobsCompleted }}</td>
            <td class="td-modern text-right space-x-2 whitespace-nowrap">
              <button 
                @click="viewTechnician(tech)" 
                class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                title="View technician details"
              >
                <font-awesome-icon icon="user" />
              </button>
              <button 
                @click="viewJobs(tech)" 
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                title="View technician's jobs"
              >
                <font-awesome-icon icon="tasks" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>