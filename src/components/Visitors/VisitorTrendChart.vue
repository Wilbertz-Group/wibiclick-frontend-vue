// wibiclick-frontend-vue/src/components/Visitors/VisitorTrendChart.vue
<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import moment from 'moment';

const props = defineProps({
  rawData: { type: Array, required: true }, // Array of visitor objects with createdAt
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
const chartReady = ref(false);

function setPeriod(period) {
  selectedPeriod.value = period;
  emit('periodChange', period);
}

// Group and aggregate data by selected period
const groupedData = computed(() => {
  if (!props.rawData || props.rawData.length === 0) {
    return [];
  }
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
  props.rawData.forEach(v => {
    const key = moment(v.createdAt).format(groupFormat);
    if (!grouped[key]) grouped[key] = 0;
    grouped[key]++;
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
const series = computed(() => {
  const data = groupedData.value.map(d => d.y);
  return [{
    name: 'New Visitors',
    data: data
  }];
});

// Check if chart has valid data to render
const hasValidData = computed(() => {
  return !props.loading &&
         props.rawData &&
         props.rawData.length > 0 &&
         groupedData.value.length > 0;
});

// Chart options
const options = computed(() => {
  // Gradient fill colors
  const gradientFrom = props.isDarkMode ? '#6366f1' : '#4f46e5';
  const gradientTo = props.isDarkMode ? '#18181b' : '#fff';
  const textColor = props.isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = props.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const legendColor = textColor;

  // Tooltip date format
  let tooltipFormat;
  switch (selectedPeriod.value) {
    case 'weekly':
      tooltipFormat = "'Week of' DD MMM YYYY";
      break;
    case 'monthly':
      tooltipFormat = 'MMMM YYYY';
      break;
    default:
      tooltipFormat = 'DD MMM YYYY';
  }

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
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: { colors: [textColor] }
      }
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      yaxis: { lines: { show: true } }
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
          chart: { height: 250 },
          legend: { fontSize: '12px' }
        }
      }
    ]
  };
});

// Watch for dark mode changes to update chart
watch(() => props.isDarkMode, () => {}, { immediate: true });

onMounted(async () => {
  // Ensure DOM is ready before allowing chart to render
  await nextTick();
  chartReady.value = true;
});

// Watch for loading state changes
watch(() => props.loading, async (newLoading) => {
  if (!newLoading) {
    // Wait for DOM to be ready after loading completes
    await nextTick();
    chartReady.value = true;
  } else {
    chartReady.value = false;
  }
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
        v-if="chartReady && hasValidData"
        type="area"
        height="350"
        width="100%"
        :options="options"
        :series="series"
        key="visitor-trend-chart"
      />
      <div v-else-if="props.loading" class="flex items-center justify-center h-64">
        <span class="text-gray-400 dark:text-gray-500">Loading chart...</span>
      </div>
      <div v-else-if="!hasValidData" class="flex items-center justify-center h-64">
        <span class="text-gray-400 dark:text-gray-500">No data available for chart</span>
      </div>
      <div v-else class="flex items-center justify-center h-64">
        <span class="text-gray-400 dark:text-gray-500">Preparing chart...</span>
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