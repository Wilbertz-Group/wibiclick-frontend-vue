<!-- EarningsChart.vue -->
<script setup>
import { computed } from 'vue';
import moment from 'moment';

const props = defineProps(['data']);

const chartData = computed(() => {
  return props.data.map(job => ({
    date: moment(job.slotStart).format('YYYY-MM-DD'),
    earnings: job.techAmount
  }));
});

const options = computed(() => ({
  chart: {
    height: 350,
    type: 'area'
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'datetime',
    categories: chartData.value.map(item => item.date)
  },
  tooltip: {
    x: {
      format: 'dd MMM yyyy'
    },
  },
}));

const series = computed(() => [{
  name: 'Earnings',
  data: chartData.value.map(item => item.earnings)
}]);
</script>

<template>
  <apexchart type="area" height="350" :options="options" :series="series"></apexchart>
</template>