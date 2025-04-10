<template>
  <!-- Main container -->
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Payment Overview
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Add Payment Button -->
          <button
            @click="router.push({ name: 'add-payment' })"
            class="btn-primary-modern">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" />
            Add Payment
          </button>
          <!-- Dark Mode Toggle -->
          <!-- Removed local dark mode toggle button -->
        </div>
      </header>

      <!-- Filters -->
      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-10 md:mb-14">
        <!-- Website Selector using Headless UI Listbox (similar to Dashboard) -->
        <Listbox v-model="selectedWebsite" as="div" class="relative w-60 z-10">
          <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
            <span class="block truncate">
              {{ websites.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
            </span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <font-awesome-icon icon="chevron-down" class="h-4 w-4 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>
          <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <ListboxOptions class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <ListboxOption v-if="websites.length === 0" :value="'default'" disabled>
                 <li class="relative cursor-not-allowed select-none py-2 pl-10 pr-4 text-gray-500">No websites found</li>
              </ListboxOption>
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

        <!-- Month Selector -->
        <select v-model="month" class="input-modern input-modern--select w-40 text-sm">
          <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
        </select>

        <!-- Year Selector -->
        <select v-model="year" class="input-modern input-modern--select w-32 text-sm">
          <option v-for="y in 5" :key="y" :value="currentYear - y + 1">
            {{ currentYear - y + 1 }}
          </option>
        </select>
      </div>

      <!-- Payment Summary -->
      <!-- Payment Summary Section -->
      <section v-if="paymentSummary" class="mb-10 md:mb-14">
        <h2 class="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Payment Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> <!-- Adjusted grid for better spacing -->
          <!-- Total Payments Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <font-awesome-icon icon="dollar-sign" class="text-purple-500 text-xl" /> <!-- Example icon -->
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Payments</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(paymentSummary.totalPayments.current) }}
              </dd>
              <dd class="text-xs mt-1" :class="getComparisonClass(paymentSummary.totalPayments)">
                <font-awesome-icon :icon="getComparisonIcon(paymentSummary.totalPayments)" class="mr-1" />
                {{ getPercentageChange(paymentSummary.totalPayments.current, paymentSummary.totalPayments.previous) }}% vs last month
              </dd>
            </div>
          </div>
          <!-- Deposit Payments Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <font-awesome-icon icon="piggy-bank" class="text-blue-500 text-xl" /> <!-- Example icon -->
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Deposit Payments</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(paymentSummary.depositPayments.current) }}
              </dd>
               <dd class="text-xs mt-1" :class="getComparisonClass(paymentSummary.depositPayments)">
                <font-awesome-icon :icon="getComparisonIcon(paymentSummary.depositPayments)" class="mr-1" />
                {{ getPercentageChange(paymentSummary.depositPayments.current, paymentSummary.depositPayments.previous) }}% vs last month
              </dd>
            </div>
          </div>
          <!-- Invoice Payments Card -->
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <font-awesome-icon icon="file-invoice-dollar" class="text-green-500 text-xl" /> <!-- Example icon -->
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Invoice Payments</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ formatCurrency(paymentSummary.invoicePayments.current) }}
              </dd>
               <dd class="text-xs mt-1" :class="getComparisonClass(paymentSummary.invoicePayments)">
                <font-awesome-icon :icon="getComparisonIcon(paymentSummary.invoicePayments)" class="mr-1" />
                {{ getPercentageChange(paymentSummary.invoicePayments.current, paymentSummary.invoicePayments.previous) }}% vs last month
              </dd>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 md:mb-14">
        <!-- Payment Trends Over Time -->
        <div class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Payment Trends Over Time</h2>
          <apexchart
            :key="chartKey"
            type="area"
            height="300"
            :options="paymentTrendChartOptions"
            :series="paymentTrendChartSeries"
          ></apexchart>
        </div>

        <!-- Payments by Type Chart -->
        <div class="card-modern p-5 sm:p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Payments by Type (Current vs Previous Month)</h2>
          <apexchart
            :key="chartKey"
            type="bar"
            height="300"
            :options="paymentTypeChartOptions"
            :series="paymentTypeChartSeries"
          ></apexchart>
        </div>
      </section>

      <!-- Payment Details -->
      <!-- Payment Details Table Section -->
      <section class="mb-10 md:mb-14">
        <h2 class="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Payment Details</h2>
        <div class="card-modern overflow-hidden"> <!-- Apply card style and overflow hidden -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th v-for="header in columnDefs" :key="header.field" scope="col" class="th-modern">
                    {{ header.headerName }}
                  </th>
                  <th scope="col" class="th-modern text-right">Actions</th> <!-- Align actions right -->
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedPayments.length === 0">
                    <td :colspan="columnDefs.length + 1" class="td-modern text-center text-gray-500 dark:text-gray-400 py-6">
                        No payment details found for the selected criteria.
                    </td>
                </tr>
                <tr v-for="payment in paginatedPayments" :key="payment.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150">
                  <td v-for="col in columnDefs" :key="col.field" class="td-modern">
                    <template v-if="col.field === 'type'">
                      <span :class="getTypeClass(payment.type)" class="badge-modern">{{ payment.type }}</span>
                    </template>
                    <template v-else-if="col.field === 'technician'">
                      {{ `${payment.employee.firstName} ${payment.employee.lastName}` }}
                    </template>
                    <template v-else-if="col.field === 'description'">
                      <span class="text-sm text-gray-600 dark:text-gray-300">{{ truncateText(payment.job?.issue, 60) }}</span> <!-- Added optional chaining -->
                    </template>
                    <template v-else-if="col.field === 'amountInCents'">
                      <span class="font-medium">{{ formatCurrency(payment.amountInCents / 100) }}</span>
                    </template>
                    <template v-else-if="col.field === 'createdAt'">
                      <span class="text-gray-600 dark:text-gray-300">{{ formatDate(payment.createdAt) }}</span>
                    </template>
                    <template v-else-if="col.field === 'customer.name'">
                      <router-link 
                        v-if="payment.job"
                        :to="{
                          name: 'contact',
                          query: { customer_id: payment.job.customerId }
                        }"
                        class="link-modern"
                      >
                        <span>{{ payment.job?.name }}</span> <!-- Added optional chaining -->
                      </router-link>
                      <span v-else>N/A</span>
                    </template>
                    <template v-else-if="col.field === 'status'">
                      <span :class="getStatusClass(payment.status)" class="badge-modern">{{ payment.status }}</span>
                    </template>
                    <template v-else>
                      <span class="text-sm text-gray-600 dark:text-gray-300">{{ truncateText(payment[col.field], 40) }}</span>
                    </template>
                  </td>
                  <td class="td-modern text-right"> <!-- Align actions right -->
                    <div class="flex justify-end space-x-2">
                      <button @click="router.push({ name: 'edit-payment', query: { payment_id: payment.id } })" class="btn-icon-modern-sm" title="Edit Payment">
                        <font-awesome-icon icon="pencil-alt" />
                      </button>
                      <button @click="router.push({ name: 'view-payment', query: { payment_id: payment.id } })" class="btn-icon-modern-sm" title="View Payment">
                        <font-awesome-icon icon="eye" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
             <span class="text-sm text-gray-600 dark:text-gray-400">
               Page {{ currentPage }} of {{ totalPages }}
             </span>
             <div class="flex space-x-1">
               <button @click="prevPage" :disabled="currentPage === 1" class="btn-icon-modern-sm" title="Previous Page">
                 <font-awesome-icon icon="chevron-left" />
               </button>
               <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-icon-modern-sm" title="Next Page">
                 <font-awesome-icon icon="chevron-right" />
               </button>
             </div>
           </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader :color="isDarkMode ? '#ffffff' : '#4f46e5'" /> <!-- Use theme color -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useUserStore } from '@/stores/UserStore';
import { storeToRefs } from 'pinia'; // Import storeToRefs
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import VueApexCharts from 'vue3-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowUp, faArrowDown, faMinus, faSun, faMoon, faPlus, faChevronDown, faCheck,
  faDollarSign, faPiggyBank, faFileInvoiceDollar, faPencilAlt, faEye, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'; // Import Headless UI components

library.add(
  faArrowUp, faArrowDown, faMinus, faSun, faMoon, faPlus, faChevronDown, faCheck,
  faDollarSign, faPiggyBank, faFileInvoiceDollar, faPencilAlt, faEye, faChevronLeft, faChevronRight
);

const userStore = useUserStore();
// Use storeToRefs to make Pinia store properties reactive
const { currentWebsite, websites } = storeToRefs(userStore);
const toast = useToast();
const router = useRouter();

// Use computed to access the selected website from the Pinia store
const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
});

// State
const loading = ref(false);
// Removed local isDarkMode state - using global theme store now
const year = ref(moment().year());
const month = ref(moment().month() + 1);
const currentYear = moment().year();

const paymentSummary = ref(null);
const payments = ref([]);

// Data for payment trends
const paymentTrends = ref([]); // Data for payment trends line chart
const chartKey = ref(0); // Key to force chart re-render on theme change

const columnDefs = ref([
  { field: 'customer.name', headerName: 'Customer' },
  { field: 'type', headerName: 'Type' },
  { field: 'technician', headerName: 'Technician' },
  { field: 'description', headerName: 'Description' },
  { field: 'createdAt', headerName: 'Date' },
  { field: 'amountInCents', headerName: 'Amount' },
  { field: 'status', headerName: 'Status' },
]);

// Helper function to truncate text
const truncateText = (text, maxLength) => {
  if (text && text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

// Pagination
const itemsPerPage = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(payments.value.length / itemsPerPage));
const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return payments.value.slice(start, end);
});

// Methods
// Removed local toggleDarkMode function - using global theme store now

const monthName = (monthNumber) => moment().month(monthNumber - 1).format('MMMM');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatTitle = (key) => key.split(/(?=[A-Z])/).join(' ');

const formatDate = (dateString) => moment(dateString).format('ddd, DD MMM YYYY');

const getTypeClass = (type) => {
  // Use modern badge styles
  const classes = {
    DEPOSIT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    INVOICE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return classes[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getStatusClass = (status) => {
  // Use modern badge styles
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    successful: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getPercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? '0.00' : '100.00';
  } else {
    return (((current - previous) / previous) * 100).toFixed(2);
  }
};

const getComparisonClass = (data) => {
  if (data.current > data.previous) {
    return 'text-green-600 dark:text-green-400'; // Increased
  } else if (data.current < data.previous) {
    return 'text-red-600 dark:text-red-400'; // Decreased
  } else {
    return 'text-gray-500 dark:text-gray-400'; // No change
  }
};

const getComparisonIcon = (data) => {
  if (data.current > data.previous) {
    return 'arrow-up';
  } else if (data.current < data.previous) {
    return 'arrow-down';
  } else {
    return 'minus';
  }
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

// --- Base Chart Options (Adapted from Dashboard.vue) ---
const getBaseChartOptions = (chartType = 'area') => ({
  chart: {
    height: 300,
    type: chartType,
    toolbar: { show: true, autoSelected: 'zoom' },
    zoom: { enabled: true },
    foreColor: '#1f2937' // Default to light, theme store will handle dark via CSS
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: {
    type: 'datetime', // Assuming time series for trends
    labels: {
      style: { colors: '#6b7280' }, // Default to light
      datetimeUTC: false,
      formatter: function(value) {
        return moment(value).format('MMM YY'); // Format for month/year
      }
    },
    axisBorder: { color: '#e5e7eb' }, // Default to light
    axisTicks: { color: '#e5e7eb' } // Default to light
  },
  yaxis: {
    labels: {
      style: { colors: '#6b7280' }, // Default to light
      formatter: (value) => formatCurrency(value) // Use existing formatter
    },
    title: {
      text: 'Amount (ZAR)',
      style: { color: '#6b7280' } // Default to light
    }
  },
  tooltip: {
    theme: 'light', // Default to light
    x: { format: 'MMMM yyyy' }, // Format tooltip date
    y: {
      formatter: (value) => formatCurrency(value) // Use existing formatter
    }
  },
  grid: {
    borderColor: '#e5e7eb', // Default to light
    strokeDashArray: 4
  },
  fill: { // Gradient fill for area charts
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 90, 100]
    }
  },
  markers: { size: 0 }, // Hide markers
  noData: {
    text: 'Loading or No Data Available...',
    align: 'center',
    verticalAlign: 'middle',
    style: { color: '#6b7280', fontSize: '14px' } // Default to light
  }
});

// --- Payment Type Bar Chart Options ---
const paymentTypeChartOptions = computed(() => {
  const baseOptions = getBaseChartOptions('bar'); // Specify 'bar' type
  return {
    ...baseOptions,
    colors: ['#4f46e5', '#6366f1'], // Example colors (Indigo shades)
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%', // Adjust width
        endingShape: 'rounded',
      },
    },
    xaxis: { // Override xaxis for categories
      type: 'category', // Use category type
      categories: ['Deposit', 'Invoice'],
      labels: {
        style: { colors: '#6b7280' }, // Default to light
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { // Keep yaxis from base for currency formatting
      ...baseOptions.yaxis,
    },
    tooltip: { // Keep tooltip from base
      ...baseOptions.tooltip,
      x: { show: false } // Hide x-axis label in tooltip for category chart
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#1f2937' } // Default to light
    },
    fill: { // Solid fill for bar charts
      opacity: 1,
    },
    grid: { // Adjust grid for bar chart
      ...baseOptions.grid,
      xaxis: { lines: { show: false } } // Hide vertical grid lines
    }
  };
});

// --- Payment Type Bar Chart Series ---
const paymentTypeChartSeries = computed(() => {
  if (!paymentSummary.value) return [];
  return [
    {
      name: 'Current Month',
      data: [
        paymentSummary.value.depositPayments.current,
        paymentSummary.value.invoicePayments.current,
      ],
    },
    {
      name: 'Previous Month',
      data: [
        paymentSummary.value.depositPayments.previous,
        paymentSummary.value.invoicePayments.previous,
      ],
    },
  ];
});

// Payment Trend Chart Options
// --- Payment Trend Area Chart Options ---
const paymentTrendChartOptions = computed(() => {
  const baseOptions = getBaseChartOptions('area'); // Specify 'area' type
  return {
    ...baseOptions,
    colors: ['#10b981'], // Example color (Emerald)
    xaxis: { // Override xaxis for datetime and formatting
      ...baseOptions.xaxis,
      // Categories are derived from series data, no need to set here explicitly
    },
    // Y-axis and Tooltip are inherited correctly from baseOptions
  };
});

const paymentTrendChartSeries = computed(() => [
  {
    name: 'Payments',
    data: paymentTrends.value.map((item) => ({ x: item.monthTimestamp, y: item.total })), // Use timestamp for x
  },
]);

// API calls
// No need to fetch websites since we're using the Pinia store

const fetchPayments = async () => {
  // Add check for valid website selection
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return;
  
  try {
    loading.value = true;
    const response = await axios.get('/payments', {
      params: {
        id: selectedWebsite.value,
        year: year.value,
        month: month.value,
        limit: 1500,
        offset: 0,
      },
    });
    payments.value = response.data.payments;
    calculatePaymentSummary();
  } catch (error) {
    console.error('Error fetching payments:', error);
    toast.error('Error fetching payments');
  } finally {
    loading.value = false;
  }
};

const calculatePaymentSummary = () => {
  const summary = {
    totalPayments: { current: 0, previous: 0 },
    depositPayments: { current: 0, previous: 0 },
    invoicePayments: { current: 0, previous: 0 },
  };

  const currentMonthStart = moment(`${year.value}-${month.value}-01`);
  const previousMonthStart = currentMonthStart.clone().subtract(1, 'month');

  payments.value.forEach((payment) => {
    const paymentDate = moment(payment.createdAt);
    const amount = parseFloat(payment.amountInCents) / 100;
    const key = paymentDate.isSameOrAfter(currentMonthStart) ? 'current' : 'previous';

    summary.totalPayments[key] += amount;

    switch (payment.type) {
      case 'DEPOSIT':
        summary.depositPayments[key] += amount;
        break;
      case 'INVOICE':
        summary.invoicePayments[key] += amount;
        break;
      default:
        break;
    }
  });

  paymentSummary.value = summary;
};

// Fetch payment trends
const fetchPaymentTrends = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') return;
  
  try {
    loading.value = true;

    // Group payments by month
    const trends = {};
    payments.value.forEach((payment) => {
      const month = moment(payment.createdAt).format('YYYY-MM');
      const amount = parseFloat(payment.amountInCents) / 100;
      trends[month] = (trends[month] || 0) + amount;
    });

    // Prepare data for the chart
    paymentTrends.value = Object.keys(trends)
      .sort()
      .map((month) => ({
        month: moment(month).format('MMM YYYY'), // Formatted month name
        monthTimestamp: moment(month).valueOf(), // Timestamp for chart x-axis
        total: trends[month]
      }));
  } catch (error) {
    console.error('Error fetching payment trends:', error);
    toast.error('Error fetching payment trends');
  } finally {
    loading.value = false;
  }
};

// Watchers - monitor for changes to selectedWebsite, month, or year
watch([selectedWebsite, month, year], () => {
  if (selectedWebsite.value && selectedWebsite.value !== 'default') {
    fetchPayments();
  }
}, { immediate: true }); // Add immediate: true to fetch data on component mount

watch(payments, fetchPaymentTrends);

// Removed watcher for local isDarkMode

// Lifecycle hooks - no need to fetch websites anymore
onMounted(() => {
  // Check if user is logged in
  if (!userStore.user) {
    router.push({ name: 'login' });
  }
  // No need to call fetchWebsites() since we're using the Pinia store
});
</script>

<style scoped>
/* Import modern styles directly or define them here */

/* Modern Input Styles (Adapted from Dashboard.vue) */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Modern Button Styles (Adapted from Dashboard.vue) */
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-icon-modern-sm { /* Smaller version for table actions/pagination */
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary-modern { /* Example primary button style */
    @apply inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm;
    @apply hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800;
    @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}


/* Card Style (Copied from Dashboard.vue) */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Table Styles (Copied from Dashboard.vue) */
.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
  @apply px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200; /* Added whitespace-nowrap */
}

/* Badge Style */
.badge-modern {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize; /* Base badge style */
}

/* Link Style */
.link-modern {
    @apply text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition duration-150 ease-in-out;
}

/* Ensure transitions apply broadly */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>