// wibiclick-frontend-vue/src/views/Transactions/TechnicianDashboard.vue
<script setup>
import { ref, onMounted, watch, computed, nextTick, watchEffect } from "vue"; // Keep watchEffect if already present
import axios from "axios";
import _ from 'lodash';
import moment from 'moment';
import { useUserStore } from "@/stores/UserStore";
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import VueApexCharts from "vue3-apexcharts";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser, faSun, faMoon, faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'; // Added chevron-down, check
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'; // Import Headless UI Listbox
import { library } from '@fortawesome/fontawesome-svg-core';
import { useRouter } from 'vue-router'; // Import useRouter

library.add(faArrowUp, faArrowDown, faMinus, faPaperPlane, faUser, faSun, faMoon, faChevronDown, faCheck); // Added icons

const apexchart = VueApexCharts; // Assign for template usage

const userStore = useUserStore();
const toast = useToast();
const router = useRouter(); // Initialize router

const loading = ref(false);
const earningsOptions = ref({});
const earningsSeries = ref([]);
const expensesOptions = ref({});
const expensesSeries = ref([]);
const technicians = ref([]);
const websites = ref([]); // Will be populated from store or fetch
const selectedTechnician = ref(null);
const selectedWebsite = ref(userStore.currentWebsite); // Initialize from store
const year = ref(moment().year());
const month = ref(moment().month() + 1);
const report = ref(null);
const chartKey = ref(0); // Key to force chart re-render
const currentYear = moment().year(); // Define currentYear

const isDarkMode = ref(localStorage.getItem('darkMode') === 'true'); // Initialize from localStorage

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  // Apply class to html element for broader dark mode styling
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};

// Watch dark mode changes and apply to HTML element
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});

// Fetch Websites (if not already populated by store)
const fetchWebsites = async () => {
  // Assuming websites might be populated by the store, check first
  if (userStore.websites && userStore.websites.length > 0) {
      websites.value = userStore.websites;
       if (!selectedWebsite.value && websites.value.length > 0) {
         selectedWebsite.value = websites.value[0].value; // Default to first if none selected
       }
      return;
  }
  // Fallback fetch if store is empty
  try {
    loading.value = true;
    const response = await axios.get(`/get-websites-for-user?id=${userStore.user?.id}`); // Use optional chaining
    websites.value = response.data || []; // Ensure it's an array
    if (!selectedWebsite.value && websites.value.length > 0) {
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
  if (!selectedWebsite.value) {
      technicians.value = []; // Clear technicians if no website selected
      selectedTechnician.value = null; // Reset selected technician
      report.value = null; // Clear report
      return;
  };

  try {
    loading.value = true;
    const response = await axios.get(`/employees?id=${selectedWebsite.value}`);
    technicians.value = response.data.employees || []; // Ensure it's an array
  } catch (error) {
    console.error('Error fetching technicians:', error);
    toast.error("Error fetching technicians");
    technicians.value = []; // Clear on error
  } finally {
    loading.value = false;
  }
};

const fetchReport = async () => {
  if (!selectedTechnician.value || !selectedWebsite.value) {
      report.value = null; // Clear report if selection is incomplete
      return;
  }

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
    report.value = null; // Clear report on error
  } finally {
    loading.value = false; // Ensure loading stops after report fetch
  }
};

const updateChartData = async () => {
  if (!report.value) {
      // Reset chart data if report is null
      earningsSeries.value = [];
      expensesSeries.value = [];
      earningsOptions.value = { chart: { foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937' }, xaxis: { labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' } } }, yaxis: { labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' } } } }; // Basic reset
      expensesOptions.value = { labels: [], theme: { mode: isDarkMode.value ? 'dark' : 'light' } }; // Basic reset
      chartKey.value += 1;
      return;
  }

  // Earnings chart data
  const paymentsData = _.sortBy(report.value.payments || [], 'createdAt');
  const groupedPayments = _.groupBy(paymentsData, payment => moment(payment.createdAt).format('YYYY-MM-DD'));
  const earningsData = Object.entries(groupedPayments).map(([date, payments]) => ({
    x: new Date(date).getTime(),
    y: payments.reduce((sum, payment) => sum + (parseFloat(payment.total) || 0), 0)
  }));

  earningsOptions.value = {
    chart: { height: 350, type: 'area', toolbar: { show: false }, foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937' },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { type: 'datetime', labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' } }, axisBorder: { color: isDarkMode.value ? '#374151' : '#e5e7eb' }, axisTicks: { color: isDarkMode.value ? '#374151' : '#e5e7eb' } },
    yaxis: { labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' }, formatter: (val) => formatCurrency(val) } },
    tooltip: { theme: isDarkMode.value ? 'dark' : 'light', x: { format: 'dd MMM yyyy' } },
    grid: { borderColor: isDarkMode.value ? '#374151' : '#e5e7eb', strokeDashArray: 4 },
    fill: {
        type: "gradient",
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 90, 100]
        }
    },
    colors: ['#4f46e5'] // Indigo
  };

  earningsSeries.value = [{ name: 'Earnings', data: earningsData }];

  // Expenses chart data
  const expensesData = _.sortBy(report.value.expenses || [], 'date');
  const groupedExpenses = _.groupBy(expensesData, expense => expense.type || 'Uncategorized'); // Default category

  if (Object.keys(groupedExpenses).length === 0 || expensesData.length === 0) {
    expensesOptions.value = {
      chart: { height: 350, type: 'pie', foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937' },
      labels: ['No Expenses Recorded'],
      theme: { mode: isDarkMode.value ? 'dark' : 'light' },
      legend: { position: 'bottom', labels: { colors: isDarkMode.value ? '#f3f4f6' : '#1f2937' } },
      dataLabels: { enabled: false },
      tooltip: { enabled: false },
      colors: ['#6b7280'] // Gray for no data
    };
    expensesSeries.value = [100]; // Show a full circle indicating no data
  } else {
    const expenseTypes = Object.keys(groupedExpenses);
    expensesOptions.value = {
      chart: { height: 350, type: 'pie', foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937' },
      labels: expenseTypes,
      theme: { mode: isDarkMode.value ? 'dark' : 'light' },
      legend: { position: 'bottom', labels: { colors: isDarkMode.value ? '#f3f4f6' : '#1f2937' } },
      dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
      tooltip: {
          theme: isDarkMode.value ? 'dark' : 'light',
          y: { formatter: (val) => formatCurrency(val) }
      },
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899'],
      stroke: { show: false }
    };

    expensesSeries.value = expenseTypes.map(type => {
      const total = groupedExpenses[type].reduce((sum, expense) => {
        return sum + (parseFloat(expense.amount) || 0);
      }, 0);
      return total; // Use actual total for series, ApexCharts calculates percentage
    });
  }

  // Force re-render of the charts
  await nextTick();
  chartKey.value += 1;
};

onMounted(() => {
  if (userStore.user) {
    fetchWebsites(); // Fetch websites first
  } else {
      router.push({ name: 'login' }); // Redirect if not logged in
  }
});

// Fetch technicians when website changes
watch(selectedWebsite, (newValue) => {
  selectedTechnician.value = null; // Reset technician selection
  report.value = null; // Clear report
  technicians.value = []; // Clear technician list
  if (newValue && newValue !== 'default') {
    fetchTechnicians();
  }
});

// Fetch report when technician, website, month, or year changes
watch([selectedTechnician, selectedWebsite, month, year], () => {
  fetchReport();
});

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'R0.00';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const transactions = computed(() => {
  if (!report.value) return [];

  const allTransactions = [
    ...(report.value.expenses || []).map(expense => ({
      date: expense.date,
      type: 'Expense',
      expenseType: expense.type || 'Uncategorized',
      description: expense.description || 'N/A',
      amount: -(parseFloat(expense.amount) || 0),
      customerName: 'N/A',
      jobDescription: 'N/A',
      jobLocation: 'N/A'
    })),
    ...(report.value.payments || []).map(payment => {
      const job = payment.job || {};
      return {
        date: payment.createdAt,
        type: 'Payment',
        paymentType: payment.type || 'N/A',
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

const formatDateDist = (timestamp) => {
  if (!timestamp) return 'N/A';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

</script>

<template>
  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader color="#4f46e5" /> <!-- Use theme color -->
  </div>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Technician Dashboard
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Website Selector -->
          <Listbox v-model="selectedWebsite" as="div" class="relative w-60">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">
                {{ (websites.find(a => a.value === selectedWebsite) || {}).label || 'Select Website' }} <!-- Corrected syntax -->
              </span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-for="website in websites" :key="website.value" :value="website.value" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ website.label }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <!-- Technician Selector -->
          <Listbox v-model="selectedTechnician" as="div" class="relative w-48" :disabled="!selectedWebsite">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="block truncate">{{ technicians.find(t => t.id === selectedTechnician)?.firstName || 'Select Technician' }}</span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-for="tech in technicians" :key="tech.id" :value="tech.id" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ tech.firstName }} {{ tech.lastName }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <!-- Month Selector -->
          <Listbox v-model="month" as="div" class="relative w-36">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">{{ moment().month(month - 1).format('MMMM') }}</span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-for="m in 12" :key="m" :value="m" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ moment().month(m - 1).format('MMMM') }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <!-- Year Selector -->
          <Listbox v-model="year" as="div" class="relative w-28">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">{{ year }}</span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-for="y in 5" :key="y" :value="currentYear - y + 1" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ currentYear - y + 1 }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
             <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <ScaleLoader color="#4f46e5" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading technician data...</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else-if="report" class="space-y-8">
        <!-- Charts Section -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Earnings Overview</h2>
            <apexchart :key="chartKey" type="area" height="350" :options="earningsOptions" :series="earningsSeries"></apexchart>
          </div>

          <div class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Expenses Overview</h2>
            <apexchart :key="chartKey" type="pie" height="350" :options="expensesOptions" :series="expensesSeries"></apexchart>
            <p v-if="!expensesSeries.length || expensesSeries.every(s => s === 0)" class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">No expenses recorded for this period.</p>
          </div>
        </section>

        <!-- Summary Section -->
        <section class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Summary</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="text-center">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</dt>
              <dd class="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(report.totalEarnings) }}</dd>
            </div>
            <div class="text-center">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</dt>
              <dd class="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{{ formatCurrency(report.totalExpenses) }}</dd>
            </div>
            <div class="text-center">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Salary</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(report.salary) }}</dd>
            </div>
          </dl>
        </section>

        <!-- Transactions Table Section -->
        <section class="card-modern p-0 overflow-hidden">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white px-5 pt-5 sm:px-6 sm:pt-6 mb-4">Recent Transactions</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead class="bg-gray-50 dark:bg-gray-900/30">
                <tr>
                  <th class="th-modern">Date</th>
                  <th class="th-modern">Type</th>
                  <th class="th-modern">Description</th>
                  <th class="th-modern">Customer</th>
                  <th class="th-modern">Job Details</th>
                  <th class="th-modern text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-if="transactions.length === 0">
                  <td colspan="6" class="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No transactions found for this period.</td>
                </tr>
                <tr v-for="(transaction, index) in transactions" :key="index" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td class="td-modern whitespace-nowrap">{{ moment(transaction.date).format('YYYY-MM-DD') }}</td>
                  <td class="td-modern">
                    <span :class="transaction.type === 'Payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ transaction.type }}
                    </span>
                    <span v-if="transaction.paymentType || transaction.expenseType" class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ transaction.paymentType || transaction.expenseType }})</span>
                  </td>
                  <td class="td-modern max-w-xs truncate" :title="transaction.description">{{ transaction.description }}</td>
                  <td class="td-modern">{{ transaction.customerName }}</td>
                  <td class="td-modern text-xs max-w-sm">
                    <div class="truncate" :title="transaction.jobDescription"><strong>Desc:</strong> {{ transaction.jobDescription }}</div>
                    <div class="truncate" :title="transaction.jobLocation"><strong>Loc:</strong> {{ transaction.jobLocation }}</div>
                  </td>
                  <td class="td-modern text-right whitespace-nowrap" :class="transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCurrency(transaction.amount) }}
                  </td>
                </tr>
              </tbody> <!-- Correct closing tag -->
            </table> <!-- Correct closing tag -->
          </div>
        </section>

      </div>
      <!-- Placeholder if no report is loaded -->
      <div v-else-if="!loading" class="text-center py-16">
        <p class="text-gray-500 dark:text-gray-400">Please select a website and technician to view the report.</p>
      </div>

    </div> <!-- End container -->
  </div> <!-- End root div -->
</template>


<style>
/* Modern Input Styles */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat bg-right;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Modern Button Styles */
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Table Styles */
.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
  @apply px-4 py-3 text-sm text-gray-800 dark:text-white;
}

/* Custom scrollbar styles */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* Ensure date/time inputs are stylable */
input[type="date"],
input[type="datetime-local"] {
  @apply appearance-none;
}
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  @apply filter dark:invert opacity-50 cursor-pointer;
}
</style>