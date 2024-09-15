<script setup>
import { ref, onMounted, watch, computed, nextTick, watchEffect } from "vue";
import axios from "axios";
import _ from 'lodash';
import moment from 'moment';
import { useUserStore } from "@/stores/UserStore";
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import VueApexCharts from "vue3-apexcharts";

const userStore = useUserStore();
const toast = useToast();

const loading = ref(false);
const earningsOptions = ref({});
const earningsSeries = ref([]);
const expensesOptions = ref({});
const expensesSeries = ref([]);
const technicians = ref([]);
const websites = ref([]);
const selectedTechnician = ref(null);
const selectedWebsite = ref(null);
const year = ref(moment().year());
const month = ref(moment().month() + 1);
const report = ref(null);
const chartKey = ref(0);

const fetchWebsites = async () => {
  try {
    loading.value = true;
    const response = await axios.get(`/get-websites-for-user?id=${userStore.user.id}`);
    websites.value = response.data;
    if (websites.value.length > 0) {
      selectedWebsite.value = websites.value[0].value;
    }
  } catch (error) {
    console.error('Error fetching websites:', error);
    toast.error("Error fetching websites");
  } finally {
    loading.value = false;
  }
};

const fetchTechnicians = async () => {
  if (!selectedWebsite.value) return;
  
  try {
    loading.value = true;
    const response = await axios.get(`/employees?id=${selectedWebsite.value}`);
    technicians.value = response.data.employees;
  } catch (error) {
    console.error('Error fetching technicians:', error);
    toast.error("Error fetching technicians");
  } finally {
    loading.value = false;
  }
};

const fetchReport = async () => {
  if (!selectedTechnician.value || !selectedWebsite.value) return;

  try {
    loading.value = true;
    const response = await axios.get(`/technician-reports/monthly/${selectedTechnician.value}`, {
      params: { 
        year: year.value, 
        month: month.value,
        id: selectedWebsite.value
      }
    });
    report.value = response.data;
    await updateChartData();
  } catch (error) {
    console.error('Error fetching report:', error);
    toast.error("Error fetching technician report");
  } finally {
    loading.value = false;
  }
};

const updateChartData = async () => {
  if (!report.value) return;

  // Earnings chart data
  const paymentsData = _.sortBy(report.value.payments, 'createdAt');
  const groupedPayments = _.groupBy(paymentsData, payment => moment(payment.createdAt).format('YYYY-MM-DD'));
  const earningsData = Object.entries(groupedPayments).map(([date, payments]) => ({
    x: new Date(date).getTime(),
    y: payments.reduce((sum, payment) => sum + (parseFloat(payment.total) || 0), 0)
  }));

  earningsOptions.value = {
    chart: {
      height: 350,
      type: 'area',
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#FFFFFF' } }
    },
    yaxis: {
      labels: { style: { colors: '#FFFFFF' } }
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
    },
  };

  earningsSeries.value = [{
    name: 'Earnings',
    data: earningsData
  }];

  // Expenses chart data
  const expensesData = _.sortBy(report.value.expenses, 'date');
  const groupedExpenses = _.groupBy(expensesData, expense => expense.type);

  if (Object.keys(groupedExpenses).length === 0) {
    expensesOptions.value = {
      chart: {
        height: 350,
        type: 'pie',
      },
      labels: ['No Expenses'],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    };
    expensesSeries.value = [1];
  } else {
    const expenseTypes = Object.keys(groupedExpenses);
    expensesOptions.value = {
      chart: {
        height: 350,
        type: 'pie',
      },
      labels: expenseTypes,
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    };

    expensesSeries.value = expenseTypes.map(type => {
      const total = groupedExpenses[type].reduce((sum, expense) => {
        return sum + (parseFloat(expense.amount) || 0);
      }, 0);
      return Math.max(total, 0.01);
    });
  }

  // Force re-render of the charts
  await nextTick();
  chartKey.value += 1;
};

onMounted(() => {
  if (userStore.user) {
    fetchWebsites();
  }
});

watch(selectedWebsite, (newValue) => {
  selectedTechnician.value = null; // Reset technician selection
  if (newValue) {
    fetchTechnicians();
  }
});

watch([selectedTechnician, selectedWebsite, month, year], () => {
  if (selectedTechnician.value && selectedWebsite.value) {
    fetchReport();
  }
});


watchEffect(() => {
  if (selectedTechnician.value && selectedWebsite.value) {
    fetchReport();
  }
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const transactions = computed(() => {
  if (!report.value) return [];
  
  const allTransactions = [
    ...report.value.expenses.map(expense => ({ 
      date: expense.date, 
      type: 'Expense',
      expenseType: expense.type,
      description: expense.description, 
      amount: -(parseFloat(expense.amount) || 0),
      customerName: 'N/A',
      jobDescription: 'N/A',
      jobLocation: 'N/A'
    })),
    ...report.value.payments.map(payment => {
      const job = payment.job || {};
      return { 
        date: payment.createdAt, 
        type: 'Payment',
        paymentType: payment.type,
        description: payment.description || `Payment for Job #${job.id || 'N/A'}`, 
        amount: parseFloat(payment.total) || 0,
        customerName: job.name || 'N/A',
        jobDescription: job.issue || 'N/A',
        jobLocation: job.location || 'N/A'
      };
    })
  ];

  return _.orderBy(allTransactions, ['date'], ['desc']);
});
</script>

<template>
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50">
    <div class="w-full min-h-screen relative bg-white px-6 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:rounded-lg sm:px-10">
      <h1 class="text-3xl font-bold mt-6 mb-6">Technician Dashboard</h1>
      
      <div class="flex space-x-4 mb-6">
        <select v-model="selectedWebsite" class="form-select">
          <option value="">Select Website</option>
          <option v-for="site in websites" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>

        <select v-model="selectedTechnician" class="form-select" :disabled="!selectedWebsite">
          <option value="">Select Technician</option>
          <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
            {{ tech.firstName }} {{ tech.lastName }}
          </option>
        </select>

        <select v-model="month" class="form-select">
          <option v-for="m in 12" :key="m" :value="m">
            {{ moment().month(m-1).format('MMMM') }}
          </option>
        </select>

        <select v-model="year" class="form-select">
          <option v-for="y in 5" :key="y" :value="moment().year() - y + 1">
            {{ moment().year() - y + 1 }}
          </option>
        </select>
      </div>

      <div v-if="report" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-lg border border-gray-200 shadow-md">
          <h2 class="text-xl font-semibold p-4">Earnings Overview</h2>
          <apexchart :key="chartKey" type="area" height="350" :options="earningsOptions" :series="earningsSeries"></apexchart>
        </div>

        <div class="rounded-lg border border-gray-200 shadow-md">
          <h2 class="text-xl font-semibold p-4">Expenses Overview</h2>
          <apexchart :key="chartKey" type="pie" height="350" :options="expensesOptions" :series="expensesSeries"></apexchart>
          <p v-if="report.expenses.length === 0" class="text-center text-gray-500 mt-4">No expenses recorded for this period.</p>
        </div>

        <div class="rounded-lg border border-gray-200 shadow-md p-4">
          <h2 class="text-xl font-semibold mb-4">Summary</h2>
          <p>Total Earnings: {{ formatCurrency(report.totalEarnings) }}</p>
          <p>Total Expenses: {{ formatCurrency(report.totalExpenses) }}</p>
          <p>Salary: {{ formatCurrency(report.salary) }}</p>
        </div>

        <div class="md:col-span-2 rounded-lg border border-gray-200 shadow-md p-4">
          <h2 class="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th class="text-left">Date</th>
                  <th class="text-left">Type</th>
                  <th class="text-left">Description</th>
                  <th class="text-left">Customer</th>
                  <th class="text-left">Job Details</th>
                  <th class="text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(transaction, index) in transactions" :key="index" class="border-b">
                  <td class="py-2">{{ moment(transaction.date).format('YYYY-MM-DD') }}</td>
                  <td>{{ transaction.type }} <span class="text-xs text-gray-500">({{ transaction.paymentType || transaction.expenseType }})</span></td>
                  <td>{{ transaction.description }}</td>
                  <td>{{ transaction.customerName }}</td>
                  <td>
                    <div><strong>Description:</strong> {{ transaction.jobDescription }}</div>
                    <div><strong>Location:</strong> {{ transaction.jobLocation }}</div>
                  </td>
                  <td :class="transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatCurrency(transaction.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>