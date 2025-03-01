<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300" id="dashboard-container">
    <Header title="Invoice Analytics" />
    <div class="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Main content area -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <!-- Header, Add Invoice button, Date Range, and Dark Mode toggle -->
        <div class="header-container">
            <h2 class="header-title">Invoice Overview</h2>
            <div class="header-actions">
              <div class="date-picker-wrapper">
                <DatePicker v-model="startDate" class="responsive-element" placeholder="Start Date" />
              </div>
              <div class="date-picker-wrapper">
                <DatePicker v-model="endDate" class="responsive-element" placeholder="End Date" />
              </div>
              <button @click="updateDateRange" class="btn-primary responsive-element">Update</button>
              <router-link :to="{name: 'add-invoice'}" class="btn-primary responsive-element">
                Add Invoice <PlusIcon class="w-5 h-5 inline-block ml-2" />
              </router-link>
              <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 responsive-element">
                <SunIcon v-if="isDarkMode" class="h-5 w-5 text-yellow-500" />
                <MoonIcon v-else class="h-5 w-5 text-gray-500" />
              </button>
              <button @click="exportDashboard" class="btn-primary responsive-element">
                Export Dashboard
              </button>
            </div>
          </div>

        <!-- Key Insights Section -->
        <div class="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-6">
          <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Key Insights</h3>
          <ul class="list-disc list-inside text-gray-700 dark:text-gray-300">
            <li v-for="(insight, index) in keyInsights" :key="index">{{ insight }}</li>
          </ul>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard title="Total Revenue" :value="formatCurrency(totalRevenue)" :icon="CurrencyDollarIcon" :trend="revenueGrowth >= 0 ? 'up' : 'down'" :percentage="revenueGrowth" />
          <KpiCard title="Average Invoice Value" :value="formatCurrency(avgInvoiceValue)" :icon="CalculatorIcon" :trend="avgInvoiceGrowth >= 0 ? 'up' : 'down'" :percentage="avgInvoiceGrowth" />
          <KpiCard title="Invoices This Month" :value="invoicesThisMonth" :icon="DocumentTextIcon" :trend="invoiceCountGrowth >= 0 ? 'up' : 'down'" :percentage="invoiceCountGrowth" />
          <KpiCard title="Overdue Invoices" :value="overdueInvoicesCount" :icon="ExclamationCircleIcon" :trend="overdueGrowth >= 0 ? 'up' : 'down'" :percentage="overdueGrowth" :is-negative="true" />
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Revenue Trend Chart -->
          <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Revenue Trend</h3>
            <apexchart type="line" height="300" :options="revenueChartOptions" :series="revenueChartSeries"></apexchart>
          </div>

          <!-- Invoice Status Distribution -->
          <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Invoice Status Distribution</h3>
            <apexchart type="pie" height="300" :options="statusChartOptions" :series="statusChartSeries"></apexchart>
          </div>

          <!-- Top Customers -->
          <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Top Customers (Current Month)</h3>
            <apexchart type="bar" height="300" :options="customersChartOptions" :series="customersChartSeries"></apexchart>
          </div>

          <!-- Monthly Invoice Count -->
          <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Monthly Invoice Count</h3>
            <apexchart type="bar" height="300" :options="monthlyInvoiceCountOptions" :series="monthlyInvoiceCountSeries"></apexchart>
          </div>

          <!-- Cash Flow Projection -->
          <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Cash Flow Projection</h3>
            <apexchart type="line" height="300" :options="cashFlowOptions" :series="cashFlowSeries"></apexchart>
          </div>
        </div>

        <!-- Recent Invoices -->
        <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Invoices</h3>
        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th v-for="header in columnDefs" :key="header.field" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ header.headerName }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="invoice in paginatedInvoices" :key="invoice.id" class="invoice-row">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ invoice.number }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Invoice #</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ invoice.customerName }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Client</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ invoice.employeeName }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Employee</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ formatCurrency(invoice.amount) }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Amount</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusColor(invoice.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ invoice.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(invoice.issuedAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(invoice.dueAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="editInvoice(invoice)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2">Edit</button>
                  <button @click="viewInvoice(invoice)" class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalInvoices }} entries
            </span>
          </div>
          <div class="flex justify-between sm:justify-end">
            <button @click="prevPage" :disabled="currentPage === 1" class="pagination-button">
              Previous
            </button>
            <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-button ml-2">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader color="#ffffff" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useUserStore } from "@/stores/UserStore";
import { useToast } from 'vue-toast-notification';
import { useRouter } from "vue-router";
import axios from "axios";
import moment from 'moment';
import _ from 'lodash';
import { AgGridVue } from "ag-grid-vue3";
import Header from "@/components/Header.vue";
import KpiCard from "@/components/KpiCard.vue";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import { PlusIcon, SunIcon, MoonIcon, CurrencyDollarIcon, CalculatorIcon, DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const userStore = useUserStore();
const toast = useToast();
const router = useRouter();
const loading = ref(false);
const rowData = ref([]);
const paginationPageSize = ref(10);
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

// Date range
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // Start of current month
const endDate = ref(new Date());

// KPI data
const totalRevenue = ref(0);
const avgInvoiceValue = ref(0);
const invoicesThisMonth = ref(0);
const overdueInvoicesCount = ref(0);
const revenueGrowth = ref(0);
const avgInvoiceGrowth = ref(0);
const invoiceCountGrowth = ref(0);
const overdueGrowth = ref(0);

// AG-Grid setup
const gridApi = ref(null);
const onGridReady = (params) => {
  gridApi.value = params.api;
};

const columnDefs = [
  { field: "number", headerName: 'Invoice #', sort: 'desc', maxWidth: 150 },
  { 
    field: "customerName", 
    headerName: 'Client',
    cellRenderer: (params) => {
      const link = document.createElement("a");
      link.href = '#';
      link.classList.add("text-blue-600", "hover:underline", "dark:text-blue-500");
      link.innerText = params.value;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        router.push({ path: '/contact', query: { customer_id: params.data.id } });
      });
      return link;
    }
  },
  { field: "employeeName", headerName: 'Employee' },
  { 
    field: "amount", 
    headerName: 'Amount', 
    valueFormatter: (params) => formatCurrency(params.value)
  },
  { 
    field: "status", 
    headerName: 'Status',
    cellRenderer: (params) => {
      const span = document.createElement('span');
      span.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(params.value)}`;
      span.innerText = params.value.charAt(0).toUpperCase() + params.value.slice(1);
      return span;
    }
  },
  { 
    field: "issuedAt", 
    headerName: 'Issued Date',
    valueFormatter: (params) => formatDate(params.value)
  },
  { 
    field: "dueAt", 
    headerName: 'Due Date',
    valueFormatter: (params) => formatDate(params.value)
  },
  {
    headerName: 'Actions',
    cellRenderer: (params) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
        <button class="text-green-600 hover:text-green-800">View</button>
      `;
      container.querySelector('button:first-child').addEventListener('click', () => editInvoice(params.data));
      container.querySelector('button:last-child').addEventListener('click', () => viewInvoice(params.data));
      return container;
    }
  }
];

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true
};

// Chart options
const revenueChartOptions = reactive({
  chart: { type: 'line', toolbar: { show: false } },
  xaxis: { type: 'datetime', labels: { formatter: (val) => moment(val).format('MMM YYYY') } },
  yaxis: { title: { text: 'Revenue (ZAR)' } },
  tooltip: { x: { format: 'MMM yyyy' } },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
});

const statusChartOptions = reactive({
  chart: { type: 'pie' },
  labels: ['Paid', 'Sent', 'Pending'],
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
});

const customersChartOptions = reactive({
  chart: { type: 'bar' },
  xaxis: { title: { text: 'Revenue (ZAR)' } },
  yaxis: { title: { text: 'Customers' } },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
});

const monthlyInvoiceCountOptions = reactive({
  chart: { type: 'bar' },
  xaxis: { categories: [] },
  yaxis: { title: { text: 'Invoice Count' } },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
});

const cashFlowOptions = reactive({
  chart: { type: 'line', toolbar: { show: false } },
  xaxis: { type: 'datetime' },
  yaxis: { title: { text: 'Projected Cash (ZAR)' } },
  tooltip: { x: { format: 'dd MMM yyyy' } },
  theme: { mode: isDarkMode.value ? 'light' : 'light' }
});

// Chart series data
const revenueChartSeries = ref([]);
const statusChartSeries = ref([]);
const customersChartSeries = ref([]);
const monthlyInvoiceCountSeries = ref([]);
const cashFlowSeries = ref([]);

// Key Insights
const keyInsights = computed(() => {
  const insights = [];
  if (revenueGrowth.value > 10) {
    insights.push(`Revenue has grown by ${revenueGrowth.value.toFixed(2)}% compared to last month.`);
  } else if (revenueGrowth.value < -10) {
    insights.push(`Revenue has decreased by ${Math.abs(revenueGrowth.value).toFixed(2)}% compared to last month.`);
  }
  if (overdueInvoicesCount.value > 5) {
    insights.push(`There are ${overdueInvoicesCount.value} overdue invoices that need attention.`);
  }
  if (avgInvoiceGrowth.value > 15) {
    insights.push(`Average invoice value has increased by ${avgInvoiceGrowth.value.toFixed(2)}% compared to last month.`);
  }
  return insights;
});

// Fetch invoices data
const fetchInvoices = async () => {
  try {
    loading.value = true;
    const response = await axios.get('invoices', {
      params: {
        id: userStore.currentWebsite,
        start: startDate.value.toISOString(),
        end: endDate.value.toISOString()
      }
    });
    processInvoicesData(response.data.invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    toast.error("Failed to fetch invoices");
  } finally {
    loading.value = false;
  }
};

const processInvoicesData = (invoices) => {
  const currentDate = moment();
  const periodStart = moment(startDate.value);
  const periodEnd = moment(endDate.value);

  const currentPeriodInvoices = invoices.filter(invoice => 
    moment(invoice.issuedAt).isBetween(periodStart, periodEnd, null, '[]')
  );

  const previousPeriodStart = moment(periodStart).subtract(periodEnd.diff(periodStart, 'days') + 1, 'days');
  const previousPeriodInvoices = invoices.filter(invoice => 
    moment(invoice.issuedAt).isBetween(previousPeriodStart, periodStart, null, '[)')
  );

  // KPIs
  totalRevenue.value = _.sumBy(currentPeriodInvoices, invoice => parseFloat(invoice.sales));
  avgInvoiceValue.value = totalRevenue.value / currentPeriodInvoices.length || 0;
  invoicesThisMonth.value = currentPeriodInvoices.length;
  overdueInvoicesCount.value = currentPeriodInvoices.filter(invoice => 
    invoice.reason === 'sent' && moment(invoice.dueAt).isBefore(currentDate)
  ).length;

  // Growth calculations
  const previousPeriodRevenue = _.sumBy(previousPeriodInvoices, invoice => parseFloat(invoice.sales));
  revenueGrowth.value = ((totalRevenue.value - previousPeriodRevenue) / previousPeriodRevenue * 100) || 0;
  const previousAvgInvoiceValue = previousPeriodRevenue / previousPeriodInvoices.length || 0;
  avgInvoiceGrowth.value = ((avgInvoiceValue.value - previousAvgInvoiceValue) / previousAvgInvoiceValue * 100) || 0;
  invoiceCountGrowth.value = ((invoicesThisMonth.value - previousPeriodInvoices.length) / previousPeriodInvoices.length * 100) || 0;
  const previousOverdueCount = previousPeriodInvoices.filter(invoice => 
    invoice.reason === 'sent' && moment(invoice.dueAt).isBefore(periodStart)
  ).length;
  overdueGrowth.value = ((overdueInvoicesCount.value - previousOverdueCount) / previousOverdueCount * 100) || 0;

  // Revenue Trend Chart
  const revenueByMonth = _.groupBy(invoices, invoice => moment(invoice.issuedAt).format('YYYY-MM'));
  const sortedMonths = Object.keys(revenueByMonth).sort();
  revenueChartSeries.value = [{
    name: 'Revenue',
    data: sortedMonths.map(month => ({
      x: new Date(month).getTime(),
      y: _.sumBy(revenueByMonth[month], invoice => parseInt(invoice.sales))
    }))
  }];

  // Status Distribution Chart
  const statusCounts = _.countBy(currentPeriodInvoices, 'reason');
  statusChartSeries.value = [
    statusCounts['paid'] || 0,
    statusCounts['sent'] || 0,
    statusCounts['pending'] || 0
  ];

  // Top Customers Chart (Current Period)
  const customerRevenue = _.groupBy(currentPeriodInvoices, 'customer.name');
  const topCustomers = Object.entries(customerRevenue)
    .map(([name, invoices]) => ({
      name,
      revenue: _.sumBy(invoices, invoice => parseFloat(invoice.sales))
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  customersChartSeries.value = [{
    name: 'Revenue',
    data: topCustomers.map(customer => customer.revenue)
  }];
  customersChartOptions.xaxis.categories = topCustomers.map(customer => customer.name);

  // Monthly Invoice Count Chart
  const invoiceCountByMonth = _.groupBy(invoices, invoice => moment(invoice.issuedAt).format('YYYY-MM'));
  const sortedCountMonths = Object.keys(invoiceCountByMonth).sort();
  monthlyInvoiceCountOptions.xaxis.categories = sortedCountMonths.map(month => moment(month).format('MMM YYYY'));
  monthlyInvoiceCountSeries.value = [{
    name: 'Current Year',
    data: sortedCountMonths.map(month => invoiceCountByMonth[month].length)
  }, {
    name: 'Previous Year',
    data: sortedCountMonths.map(month => {
      const prevYear = moment(month).subtract(1, 'year').format('YYYY-MM');
      return invoiceCountByMonth[prevYear]?.length || 0;
    })
  }];

  // Cash Flow Projection
  const projection = [];
  let cumulativeCash = 0;
  const sortedInvoices = [...currentPeriodInvoices].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  
  sortedInvoices.forEach(invoice => {
    if (invoice.reason !== 'paid') {
      cumulativeCash += parseInt(invoice.sales);
      projection.push({
        x: new Date(invoice.dueAt).getTime(),
        y: cumulativeCash
      });
    }
  });

  cashFlowSeries.value = [{ name: 'Projected Cash', data: projection }];

  // Update rowData for AG-Grid
  rowData.value = currentPeriodInvoices.map(invoice => ({
    id: invoice.id,
    number: invoice.number,
    customerName: invoice.customer.name,
    employeeName: `${invoice.employee.firstName} ${invoice.employee.lastName}`,
    amount: parseFloat(invoice.sales),
    status: invoice.reason,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt
  }));
};

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (date) => {
  return moment(date).format('MMM DD, YYYY');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'sent': return 'bg-blue-100 text-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Invoice actions
const editInvoice = (invoice) => {
  router.push({ name: 'edit-invoice', query: { invoice_id: invoice.id } });
};

const viewInvoice = (invoice) => {
  router.push({ name: 'view-invoice', query: { invoice_id: invoice.id } });
};

// Dark mode toggle
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  updateChartThemes();
};

const updateChartThemes = () => {
  const newTheme = { mode: isDarkMode.value ? 'light' : 'light' };
  [revenueChartOptions, statusChartOptions, customersChartOptions, 
   monthlyInvoiceCountOptions, cashFlowOptions].forEach(option => {
    option.theme = newTheme;
  });
};

// Date range update
const updateDateRange = () => {
  fetchInvoices();
};

// Export dashboard
const exportDashboard = async () => {
  const element = document.getElementById('dashboard-container');
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('l', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('invoice-analytics-dashboard.pdf');
};

const itemsPerPage = ref(10);
const currentPage = ref(1);

const totalInvoices = computed(() => rowData.value.length);
const totalPages = computed(() => Math.ceil(totalInvoices.value / itemsPerPage.value));

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalInvoices.value));

const paginatedInvoices = computed(() => {
  return rowData.value.slice(startIndex.value, endIndex.value);
});

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// Lifecycle hooks
onMounted(() => {
  if (userStore.currentWebsite) {
    fetchInvoices();
  }
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  updateChartThemes();
});

watch(() => userStore.currentWebsite, (newValue) => {
  if (newValue) {
    fetchInvoices();
  }
});

// Dark mode watcher
watch(isDarkMode, () => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  updateChartThemes();
  nextTick(() => {
    if (gridApi.value) {
      gridApi.value.refreshCells({ force: true });
    }
  });
});
</script>

<!-- Add this to your main CSS file or App.vue style section -->
<style scoped>
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-alpine.css';

/* Global Dark Mode Styles */
.dark {
  @apply bg-gray-900 text-white;
}

/* Date Picker Styles */
.mx-input {
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600;
}

.dark .mx-calendar-content {
  @apply bg-gray-800 text-white;
}

.dark .mx-btn:hover {
  @apply bg-gray-700;
}

.dark .mx-datepicker-main {
  @apply bg-gray-800 border-gray-700;
}

/* ApexCharts Dark Mode Styles */
.dark .apexcharts-tooltip {
  @apply bg-gray-800 border-gray-700;
}

.dark .apexcharts-tooltip-title {
  @apply bg-gray-700 border-gray-600;
}

.dark .apexcharts-xaxis-label,
.dark .apexcharts-yaxis-label {
  @apply fill-gray-400;
}

.dark .apexcharts-legend-text {
  @apply text-gray-300 !important;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out;
}

.dark .btn-primary {
  @apply bg-blue-500 hover:bg-blue-600;
}

.card {
  @apply bg-white dark:bg-gray-800 overflow-hidden shadow-xl rounded-lg;
}

.card-header {
  @apply px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6;
}

.card-body {
  @apply px-4 py-5 sm:p-6;
}

.chart-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-4;
}

.chart-title {
  @apply text-lg font-semibold mb-4 text-gray-800 dark:text-white;
}

.grid-cols-1 {
  @apply grid gap-5 sm:grid-cols-2 lg:grid-cols-3;
}

.col-span-full {
  @apply sm:col-span-2 lg:col-span-3;
}

/* KPI Card Styles */
.kpi-card {
  @apply p-5 bg-white dark:bg-gray-800 rounded-lg shadow;
}

.kpi-title {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400 truncate;
}

.kpi-value {
  @apply mt-1 text-3xl font-semibold text-gray-900 dark:text-white;
}

.kpi-change {
  @apply mt-1 flex items-center text-sm font-medium;
}

.kpi-change-positive {
  @apply text-green-600 dark:text-green-400;
}

.kpi-change-negative {
  @apply text-red-600 dark:text-red-400;
}

/* Table Styles */
.table-container {
  @apply mt-8 flex flex-col;
}

.table {
  @apply min-w-full divide-y divide-gray-200 dark:divide-gray-700;
}

.table-header {
  @apply bg-gray-50 dark:bg-gray-700;
}

.table-header th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider;
}

.table-body {
  @apply bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700;
}

.table-row {
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300;
}

/* AG-Grid Custom Styles */
.ag-theme-alpine {
  --ag-background-color: theme('colors.gray.50');
  --ag-header-background-color: theme('colors.gray.100');
  --ag-odd-row-background-color: theme('colors.gray.50');
  --ag-header-foreground-color: theme('colors.gray.800');
  --ag-foreground-color: theme('colors.gray.900');
  --ag-row-hover-color: theme('colors.blue.50');
  @apply rounded-lg overflow-hidden;
}

.dark .ag-theme-alpine {
  --ag-background-color: theme('colors.gray.800');
  --ag-header-background-color: theme('colors.gray.900');
  --ag-odd-row-background-color: theme('colors.gray.700');
  --ag-header-foreground-color: theme('colors.gray.300');
  --ag-foreground-color: theme('colors.gray.100');
  --ag-row-hover-color: theme('colors.gray.600');
}

/* Loading Overlay */
.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Flex Container */
.flex-container {
  @apply flex flex-wrap items-center gap-4;
}

/* Responsive Button and Input Styles */
.responsive-element {
  @apply flex-grow sm:flex-grow-0;
}

/* Date Picker Wrapper */
.date-picker-wrapper {
  @apply w-full sm:w-auto mb-2 sm:mb-0;
}

/* Media Query for small screens */
@media (max-width: 640px) {
  .flex-container {
    @apply flex-col items-stretch;
  }

  .responsive-element {
    @apply w-full mb-2;
  }

  .date-picker-wrapper {
    @apply w-full;
  }
}

.header-container {
  @apply flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4;
}

.header-title {
  @apply text-2xl font-semibold text-gray-800 dark:text-white mb-4 sm:mb-0;
}

.header-actions {
  @apply flex flex-wrap items-center gap-2 w-full sm:w-auto;
}

/* Media Query for small screens */
@media (max-width: 640px) {
  .header-actions {
    @apply justify-start;
  }
}

@media (max-width: 768px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  .invoice-row {
    @apply border rounded-lg shadow-sm mb-4 bg-white dark:bg-gray-800;
  }

  .invoice-row td {
    @apply border-none relative pl-[50%] text-right;
  }

  .invoice-row td:before {
    @apply absolute top-2 left-2 w-[45%] pl-2 whitespace-nowrap font-bold text-left text-gray-700 dark:text-gray-300;
    content: attr(data-label);
  }

  .invoice-row td:nth-of-type(1):before { content: "Invoice #"; }
  .invoice-row td:nth-of-type(2):before { content: "Client"; }
  .invoice-row td:nth-of-type(3):before { content: "Employee"; }
  .invoice-row td:nth-of-type(4):before { content: "Amount"; }
  .invoice-row td:nth-of-type(5):before { content: "Status"; }
  .invoice-row td:nth-of-type(6):before { content: "Issued Date"; }
  .invoice-row td:nth-of-type(7):before { content: "Due Date"; }
  .invoice-row td:nth-of-type(8):before { content: "Actions"; }

  .invoice-row td:last-child {
    @apply text-right;
  }

  .invoice-row td > div:last-child {
    @apply hidden;
  }
}

.pagination-button {
  @apply px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
}

.pagination-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

@media (max-width: 640px) {
  .pagination-button {
    @apply px-3 py-1 text-xs;
  }
}
</style>