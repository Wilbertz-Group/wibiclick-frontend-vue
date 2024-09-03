<script setup>
import { ref, onMounted, watch, watchEffect, computed, nextTick } from "vue";
import axios from "axios";
import _ from 'lodash';
import moment from 'moment';
import VueApexCharts from "vue3-apexcharts";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/UserStore";
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

const userStore = useUserStore();
const toast = useToast();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const earningsOptions = ref({});
const earningsSeries = ref([]);
const expensesOptions = ref({});
const expensesSeries = ref([]);
const year = ref(moment().year());
const month = ref(moment().month());
const report = ref(null);
const salary = ref(null);
const chartKey = ref(0);

const fetchReport = async () => {
  try {
    loading.value = true;
    const [reportResponse, salaryResponse] = await Promise.all([
      axios.get(`technician-reports/monthly/${route.query.id}`, {
        params: { 
          year: year.value, 
          month: month.value,
          id: userStore.currentWebsite
        }
      }),
      axios.get(`technician-reports/salary/${route.query.id}`, {
        params: {
          year: year.value,
          month: month.value,
          id: userStore.currentWebsite
        }
      })
    ]);
    report.value = reportResponse.data;
    salary.value = parseFloat(salaryResponse.data.salary) || 0;
    await updateChartData();
  } catch (error) {
    console.error('Error fetching report:', error);
    toast.error("Error fetching your monthly report");
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
    y: payments.reduce((sum, payment) => {
      const amount = parseFloat(payment.total) || 0;
      return sum + amount;
    }, 0)
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
      type: 'datetime'
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

  // Force re-render of the chart
  await nextTick();
  chartKey.value += 1;
};

watch([month, year], () => {
  fetchReport();
});

onMounted(() => {
  if (userStore.currentWebsite && userStore.user) {
    fetchReport();
  }
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const transactions = computed(() => {
  if (!report.value) return [];
  
  const allTransactions = [
    ...report.value.expenses.map(expense => { 
			const job = expense.job || {};
      return {
				date: expense.date, 
				type: 'Expense',
				expenseType: expense.type,
				description: expense.description, 
				amount: -(parseFloat(expense.amount) || 0),
				customerName: job.name || 'N/A',
        jobDescription: job.issue || 'N/A',
        jobLocation: job.location || 'N/A',
        jobAddress: job.address || 'N/A',
        jobStatus: job.jobStatus || 'N/A',
        jobDate: job.slotStart ? moment(job.slotStart).format('YYYY-MM-DD HH:mm') : 'N/A'
			}
    }),
    ...report.value.payments.map(payment => {
      const job = payment.job || {};
      return { 
        date: payment.createdAt, 
        type: 'Payment',
        paymentType: payment.type,
        description: payment.description || `${payment.type}`, 
        amount: parseFloat(payment.total) || 0,
        customerName: job.name || 'N/A',
        jobDescription: job.issue || 'N/A',
        jobLocation: job.location || 'N/A',
        jobAddress: job.address || 'N/A',
        jobStatus: job.jobStatus || 'N/A',
        jobDate: job.slotStart ? moment(job.slotStart).format('YYYY-MM-DD HH:mm') : 'N/A'
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
      <h1 class="text-3xl font-bold mb-6">Your Dashboard</h1>
      
      <div class="flex space-x-4 mb-6">
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
          <h2 class="text-xl font-semibold p-4">Your Earnings</h2>
          <apexchart width="100%" height="350" type="area" :options="earningsOptions" :series="earningsSeries"></apexchart>
        </div>

        <div class="rounded-lg border border-gray-200 shadow-md">
					<h2 class="text-xl font-semibold p-4">Your Expenses</h2>
					<apexchart 
						:key="chartKey" 
						width="100%" 
						height="350" 
						type="pie" 
						:options="expensesOptions" 
						:series="expensesSeries"
					></apexchart>
					<p v-if="report && report.expenses.length === 0" class="text-center text-gray-500 mt-4">
						No expenses recorded for this period.
					</p>
					<p v-else-if="expensesSeries && expensesSeries.filter(v => v > 0.01).length === 1" class="text-center text-gray-500 mt-4">
						All expenses are of type: {{ expensesOptions.labels[expensesSeries.findIndex(v => v > 0.01)] }}
					</p>
				</div>

        <div class="md:col-span-2 rounded-lg border border-gray-200 shadow-md p-4">
          <h2 class="text-xl font-semibold mb-4">Summary</h2>
          <p>Total Earnings: {{ formatCurrency(report.totalEarnings) }}</p>
          <p>Total Expenses: {{ formatCurrency(report.totalExpenses) }}</p>
          <p>Your Salary: {{ formatCurrency(salary) }}</p>
        </div>

        <div class="md:col-span-2 rounded-lg border border-gray-200 shadow-md p-4">
					<h2 class="text-xl font-semibold mb-4">Your Transactions</h2>
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
										<template v-if="transaction.type === 'Payment' || transaction.type === 'Expense'">
											<div><strong>Description:</strong> {{ transaction.jobDescription }}</div>
											<div><strong>Location:</strong> {{ transaction.jobLocation }}</div>
											<div><strong>Address:</strong> {{ transaction.jobAddress }}</div>
											<div><strong>Status:</strong> {{ transaction.jobStatus }}</div>
											<div><strong>Date:</strong> {{ transaction.jobDate }}</div>
										</template>
										<template v-else>N/A</template>
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