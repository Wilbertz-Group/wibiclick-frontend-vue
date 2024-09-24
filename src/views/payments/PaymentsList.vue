<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-black">Payment Overview</h1>
        <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300">
          <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" class="text-yellow-500 dark:text-blue-300" />
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-8">
        <select v-model="selectedWebsite" class="form-select">
          <option value="">Select Website</option>
          <option v-for="site in websites" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>
        <select v-model="month" class="form-select">
          <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
        </select>
        <select v-model="year" class="form-select">
          <option v-for="y in 5" :key="y" :value="currentYear - y + 1">
            {{ currentYear - y + 1 }}
          </option>
        </select>
      </div>

      <!-- Payment Summary -->
      <section v-if="paymentSummary" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-800">Payment Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div v-for="(data, key) in paymentSummary" :key="key" 
              class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <h3 class="font-semibold text-gray-600 dark:text-gray-400 capitalize">{{ formatTitle(key) }}</h3>
            <p class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
              {{ formatCurrency(data.current) }}
            </p>
            <p class="text-sm mt-1" :class="getComparisonClass(data)">
              <font-awesome-icon :icon="getComparisonIcon(data)" />
              {{ getPercentageChange(data.current, data.previous) }}% from last month
            </p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-6">
        <!-- Payment Trends Over Time -->
        <section class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Payment Trends Over Time</h2>
          <div class="section-content">
            <apexchart
              type="line"
              height="350"
              :options="paymentTrendChartOptions"
              :series="paymentTrendChartSeries"
            ></apexchart>
          </div>
        </section>

        <!-- Payments by Type Chart -->
        <section class="mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Payments by Type</h2>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
            <apexchart
              type="bar"
              height="350"
              :options="paymentChartOptions"
              :series="paymentChartSeries"
            ></apexchart>
          </div>
        </section>
      </div>

      <!-- Payment Details -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Payment Details</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th v-for="header in columnDefs" :key="header.field" 
                      class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {{ header.headerName }}
                  </th>
                  <th class="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in paginatedPayments" :key="payment.id" 
                    class="border-b border-gray-200 dark:border-gray-700">
                  <td v-for="col in columnDefs" :key="col.field" 
                      class="px-4 py-2 text-gray-800 dark:text-white">
                    <template v-if="col.field === 'type'">
                      <span :class="getTypeClass(payment.type)">{{ payment.type }}</span>
                    </template>
                    <template v-else-if="col.field === 'technician'">
                      {{ `${payment.employee.firstName} ${payment.employee.lastName}` }}
                    </template>
                    <template v-else-if="col.field === 'description'">
                      <span class="text-sm">{{ truncateText(payment.job.issue, 60) }}</span>
                    </template>
                    <template v-else-if="col.field === 'amountInCents'">
                      {{ formatCurrency(payment.amountInCents / 100) }}
                    </template>
                    <template v-else-if="col.field === 'createdAt'">
                      {{ formatDate(payment.createdAt) }}
                    </template>
                    <template v-else-if="col.field === 'customer.name'">
                      <router-link 
                        v-if="payment.job"
                        :to="{
                          name: 'contact',
                          query: { customer_id: payment.job.customerId }
                        }"
                        class="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition duration-150 ease-in-out"
                      >
                        <span>{{ payment.job.name }}</span>
                      </router-link>
                      <span v-else>N/A</span>
                    </template>
                    <template v-else-if="col.field === 'status'">
                      <span :class="getStatusClass(payment.status)">{{ payment.status }}</span>
                    </template>
                    <template v-else>
                      <span class="text-sm">{{ truncateText(payment[col.field], 40) }}</span>
                    </template>
                  </td>
                  <td class="px-4 py-2 text-gray-800 dark:text-white">
                    <button @click="router.push({ name: 'edit-payment', query: { payment_id: payment.id } })" class="text-blue-500 hover:text-blue-700 mr-2">
                      Edit
                    </button>
                    <button @click="router.push({ name: 'view-payment', query: { payment_id: payment.id } })" class="text-green-500 hover:text-green-700">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="mt-4 flex justify-between items-center">
            <button @click="prevPage" :disabled="currentPage === 1" 
                    class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
              Previous
            </button>
            <span class="text-gray-800 dark:text-white">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages" 
                    class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader color="#ffffff" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useUserStore } from '@/stores/UserStore';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import VueApexCharts from 'vue3-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faArrowUp, faArrowDown, faMinus, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';

library.add(faArrowUp, faArrowDown, faMinus, faSun, faMoon);

const userStore = useUserStore();
const toast = useToast();
const router = useRouter();

// State
const loading = ref(false);
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const websites = ref([]);
const selectedWebsite = ref(null);
const year = ref(moment().year());
const month = ref(moment().month() + 1);
const currentYear = moment().year();

const paymentSummary = ref(null);
const payments = ref([]);

// Data for payment trends
const paymentTrends = ref([]);

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
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
};

const monthName = (monthNumber) => moment().month(monthNumber - 1).format('MMMM');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatTitle = (key) => key.split(/(?=[A-Z])/).join(' ');

const formatDate = (dateString) => moment(dateString).format('ddd, DD MMM YYYY');

const getTypeClass = (type) => {
  const classes = {
    DEPOSIT: 'bg-blue-400 text-blue-800',
    INVOICE: 'bg-green-400 text-green-800',
  };
  return `px-2 py-1 rounded-full text-xs font-medium ${classes[type] || 'bg-gray-400 text-gray-800'}`;
};

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    successful: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  };
  return `px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-800'}`;
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
    // Payments have increased
    return 'text-green-500';
  } else if (data.current < data.previous) {
    // Payments have decreased
    return 'text-red-500';
  } else {
    // No change
    return 'text-gray-500';
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

// Chart options
const paymentChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: false,
    toolbar: {
      show: false,
    },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      endingShape: 'rounded',
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent'],
  },
  xaxis: {
    categories: ['Deposit', 'Invoice'],
    labels: {
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    title: {
      text: 'Amount (ZAR)',
      style: {
        color: isDarkMode.value ? '#fff' : '#000',
      },
    },
    labels: {
      formatter: function (value) {
        return formatCurrency(value).replace('ZAR', 'R');
      },
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      },
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    y: {
      formatter: function (value) {
        return formatCurrency(value);
      },
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    offsetX: 40,
  },
  theme: {
    mode: isDarkMode.value ? 'light' : 'light',
  },
}));

const paymentChartSeries = computed(() => {
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
const paymentTrendChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: {
      show: false,
    },
    foreColor: isDarkMode.value ? '#fff' : '#000',
  },
  xaxis: {
    categories: paymentTrends.value.map((item) => item.month),
    labels: {
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    title: {
      text: 'Total Payments (ZAR)',
      style: {
        color: isDarkMode.value ? '#fff' : '#000',
      },
    },
    labels: {
      formatter: (value) => formatCurrency(value),
      style: {
        colors: isDarkMode.value ? '#fff' : '#000',
      },
    },
  },
  tooltip: {
    y: {
      formatter: (value) => formatCurrency(value),
    },
  },
  theme: {
    mode: isDarkMode.value ? 'light' : 'light',
  },
}));

const paymentTrendChartSeries = computed(() => [
  {
    name: 'Payments',
    data: paymentTrends.value.map((item) => item.total),
  },
]);

// API calls
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
    toast.error('Error fetching websites');
  } finally {
    loading.value = false;
  }
};

const fetchPayments = async () => {
  if (!selectedWebsite.value) return;
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
  if (!selectedWebsite.value) return;
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
        month,
        total: trends[month],
      }));
  } catch (error) {
    console.error('Error fetching payment trends:', error);
    toast.error('Error fetching payment trends');
  } finally {
    loading.value = false;
  }
};

// Watchers
watch([selectedWebsite, month, year], () => {
  if (selectedWebsite.value) {
    fetchPayments();
  }
});

watch(payments, fetchPaymentTrends);

watch(isDarkMode, () => {
  // Trigger chart options recomputation when dark mode changes
});

// Lifecycle hooks
onMounted(() => {
  if (userStore.user) {
    fetchWebsites();
  }
});
</script>

<style scoped>
/* Styles are similar to your Expenses View, adjusted for Payments View */

.form-select {
  @apply block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.dark .form-select {
  @apply bg-gray-700 border-gray-600 text-white;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Enhance button styles */
button {
  @apply transition-colors duration-200 ease-in-out;
}

button:hover:not(:disabled) {
  @apply opacity-80;
}

button:disabled {
  @apply cursor-not-allowed;
}

/* Enhance table readability */
table {
  @apply w-full border-collapse;
}

th {
  @apply font-semibold text-left p-2;
}

td {
  @apply p-2;
}

tr:hover {
  @apply bg-gray-50 dark:bg-gray-700;
}

/* Pagination buttons */
.pagination-button {
  @apply px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 transition-colors duration-200;
}

.pagination-button:hover:not(:disabled) {
  @apply bg-blue-600;
}

/* Form select appearance */
.form-select {
  @apply appearance-none bg-no-repeat bg-right;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-size: 1.5em 1.5em;
}

.dark .form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Enhance type badges */
.getTypeClass {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

/* Loading overlay */
.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

/* Section titles */
.section-title {
  @apply text-2xl font-semibold mb-4 text-gray-800 dark:text-white;
}

/* Section content */
.section-content {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300;
}
</style>
