<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import moment from 'moment';

const props = defineProps({
  rawData: { type: Array, required: true }, // Array of estimate objects with createdAt or date
  loading: { type: Boolean, default: false },
  isDarkMode: { type: Boolean, default: false }
});

const emit = defineEmits(['periodChange']);

const periodOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
];
const selectedPeriod = ref('monthly');

function setPeriod(period) {
  selectedPeriod.value = period;
  emit('periodChange', period);
}

// Group and aggregate data by selected period
const groupedData = computed(() => {
  if (!props.rawData) return [];
  let groupFormat;
  switch (selectedPeriod.value) {
    case 'weekly':
      groupFormat = 'GGGG-[W]WW'; // ISO week
      break;
    case 'monthly':
      groupFormat = 'YYYY-MM';
      break;
    default:
      groupFormat = 'YYYY-MM-DD';
  }
  
  const grouped = {};
  const currentDate = moment();
  const startDate = moment().subtract(11, 'months').startOf('month'); // Start from 12 months ago
  
  // Initialize all months with zero
  let tempDate = startDate.clone();
  while (tempDate.isSameOrBefore(currentDate)) {
    const key = tempDate.format(groupFormat);
    grouped[key] = 0;
    tempDate.add(1, 'month');
  }
  
  // Filter and group data
  props.rawData.forEach(e => {
    const dateVal = e.createdAt || e.date;
    const momentDate = moment(dateVal);
    
    // Only include data within the last 12 months
    if (momentDate.isSameOrBefore(currentDate) && momentDate.isSameOrAfter(startDate)) {
      const key = momentDate.format(groupFormat);
      grouped[key]++;
    }
  });

  // Sort keys chronologically
  const sortedKeys = Object.keys(grouped).sort((a, b) => moment(a, groupFormat) - moment(b, groupFormat));

  return sortedKeys.map(key => ({
    x: key,
    y: grouped[key]
  }));
});

// Chart categories and series
const categories = computed(() => groupedData.value.map(d => d.x));
const series = computed(() => [{
  name: 'Estimates',
  data: groupedData.value.map(d => d.y)
}]);

const options = computed(() => {
  // Gradient fill colors
  const gradientFrom = props.isDarkMode ? '#6366f1' : '#4f46e5';
  const gradientTo = props.isDarkMode ? '#18181b' : '#fff';
  const textColor = props.isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = props.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const legendColor = textColor;

  // Tooltip date format
  // Tooltip date format handling
  const tooltipFormat = selectedPeriod.value === 'weekly'
    ? "'Week of' DD MMM YYYY"
    : selectedPeriod.value === 'monthly'
      ? 'MMMM YYYY'
      : 'DD MMM YYYY';

  return {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        autoSelected: 'zoom'
      },
      parentHeightOffset: 0,
      sparkline: {
        enabled: false
      },
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 }
      },
      foreColor: textColor
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: [props.isDarkMode ? '#18181b' : '#fff']
      },
      background: {
        enabled: true,
        borderRadius: 4,
        borderWidth: 0,
        opacity: 0.85,
        color: props.isDarkMode ? '#fff' : '#18181b',
        foreColor: props.isDarkMode ? '#18181b' : '#fff',
        padding: 2
      },
      formatter: function (val) {
        return val;
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: props.isDarkMode ? 'dark' : 'light',
        type: "vertical",
        shadeIntensity: 0.4,
        gradientToColors: [gradientTo],
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    xaxis: {
      categories: categories.value,
      type: 'category',
      labels: {
        style: { colors: [textColor] },
        rotate: -25,
        offsetY: 0,
        formatter: function(val) {
          if (selectedPeriod.value === 'weekly') {
            const m = moment(val, 'GGGG-[W]WW', true);
            return m.isValid() ? m.startOf('isoWeek').format('DD MMM') : val;
          }
          if (selectedPeriod.value === 'monthly') {
            const m = moment(val, 'YYYY-MM', true);
            return m.isValid() ? m.format('MMM YYYY') : val;
          }
          const m = moment(val, 'YYYY-MM-DD', true);
          return m.isValid() ? m.format('DD MMM') : val;
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickPlacement: 'on',
      tickAmount: 12, // Show all 12 months
      max: undefined
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: { colors: [textColor] },
        formatter: function(val) {
          return Math.round(val);
        },
        offsetX: -10
      },
      tickAmount: 5
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      padding: {
        top: 5,
        right: 20,
        bottom: 5,
        left: 20
      },
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    legend: {
      show: true,
      labels: { colors: legendColor },
      position: 'top',
      fontSize: '14px'
    },
    tooltip: {
      theme: props.isDarkMode ? 'dark' : 'light',
      x: {
        formatter: function(val) {
          if (selectedPeriod.value === 'weekly') {
            const m = moment(val, 'GGGG-[W]WW', true);
            return m.isValid() ? m.startOf('isoWeek').format('Week of DD MMM YYYY') : val;
          }
          if (selectedPeriod.value === 'monthly') {
            const m = moment(val, 'YYYY-MM', true);
            return m.isValid() ? m.format('MMMM YYYY') : val;
          }
          const m = moment(val, 'YYYY-MM-DD', true);
          return m.isValid() ? m.format('DD MMM YYYY') : val;
        }
      }
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 250,
            padding: {
              top: 10,
              right: 10,
              bottom: 10,
              left: 10
            }
          },
          legend: { fontSize: '12px' },
          xaxis: {
            labels: {
              rotate: -35,
              offsetY: 5
            }
          }
        }
      }
    ]
  };
});

// Watch for dark mode changes to update chart
watch(() => props.isDarkMode, () => {}, { immediate: true });

onMounted(() => {
  // No-op, but could be used for further chart setup
});
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="opt in periodOptions"
        :key="opt.value"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition',
          selectedPeriod === opt.value
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700'
        ]"
        @click="setPeriod(opt.value)"
        :aria-pressed="selectedPeriod === opt.value"
      >
        {{ opt.label }}
      </button>
    </div>
    <div class="relative w-full min-h-[200px]">
      <apexchart
        v-if="!loading"
        type="area"
        height="350"
        width="100%"
        :options="options"
        :series="series"
      />
      <div v-else class="flex items-center justify-center h-64">
        <span class="text-gray-400 dark:text-gray-500">Loading chart...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Responsive tweaks for chart container */
@media (max-width: 640px) {
  .apexcharts-canvas {
    min-height: 200px !important;
    height: 250px !important;
  }
}
</style>