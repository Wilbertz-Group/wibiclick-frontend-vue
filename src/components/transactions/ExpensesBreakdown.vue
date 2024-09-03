<!-- ExpensesBreakdown.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps(['data']);

const chartData = computed(() => {
  const expensesByType = props.data.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    return acc;
  }, {});

  return Object.entries(expensesByType).map(([type, amount]) => ({
    name: type,
    value: amount
  }));
});

const options = computed(() => ({
  chart: {
    type: 'pie',
  },
  labels: chartData.value.map(item => item.name),
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
}));

const series = computed(() => chartData.value.map(item => item.value));
</script>

<template>
  <apexchart type="pie" height="350" :options="options" :series="series"></apexchart>
</template>