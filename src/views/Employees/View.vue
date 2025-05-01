// wibiclick-frontend-vue/src/views/Employees/View.vue
<script setup>
import { ref, reactive, computed, onMounted, watch, watchEffect } from 'vue'; // Added watchEffect
import axios from "axios";
import moment from 'moment-timezone';
import { useRoute, useRouter } from "vue-router";
import  useUserStore  from "@/stores/UserStore";
import { useUIStore } from '@/stores/UIStore'; // For opening job modal
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faUser, faCalendarAlt, faBriefcase, faMoneyBillWave, faReceipt, faArrowLeft, faFilter, faEye, faDollarSign, faExclamationTriangle, faCheckCircle, faSun, faMoon // Added faSun, faMoon
} from '@fortawesome/free-solid-svg-icons';
import { universalDateFormatter } from '../../helpers'; // Assuming this helper exists

library.add(faUser, faCalendarAlt, faBriefcase, faMoneyBillWave, faReceipt, faArrowLeft, faFilter, faEye, faDollarSign, faExclamationTriangle, faCheckCircle, faSun, faMoon); // Added faSun, faMoon

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const uiStore = useUIStore();
const toast = useToast();

// --- Dark Mode State ---
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

// --- State ---
const isLoading = ref(false);
const isLoadingMonthlyData = ref(false);
const employeeId = ref(route.query.employeeID);
const employeeName = ref(route.query.employeeName || 'Employee'); // Get name from query or default

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed

const selectedYear = ref(currentYear);
const selectedMonth = ref(currentMonth);

const employeeData = ref(null); // Basic employee details
const monthlyJobs = ref([]);
const monthlySummary = ref({
  totalPayments: 0,
  totalExpenses: 0,
  netRevenue: 0,
  jobCount: 0,
});

// --- Options for Selectors ---
const yearOptions = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) { // Last 5 years + current
    years.push({ value: y, label: y.toString() });
  }
  return years;
});

const monthOptions = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: moment().month(i).format('MMMM') // Full month name
  }));
});

// --- Methods ---
const fetchMonthlyData = async (year, month) => {
  if (!employeeId.value || !userStore.currentWebsite) return;

  isLoadingMonthlyData.value = true;
  console.log(`Fetching summary for ${employeeId.value}, ${year}-${month}`);
  try {
    const response = await axios.get(`/employees/${employeeId.value}/monthly-summary`, {
      params: {
        id: userStore.currentWebsite, // Pass websiteId as 'id' query param
        year: year,
        month: month,
      }
    });
    employeeData.value = response.data.employeeDetails;
    monthlyJobs.value = response.data.jobsForMonth || [];
    monthlySummary.value = response.data.monthlySummary || { totalPayments: 0, totalExpenses: 0, netRevenue: 0, jobCount: 0 };

    // Update header title if needed (might already be set from query)
    if (employeeData.value && !route.query.employeeName) {
       employeeName.value = `${employeeData.value.firstName || ''} ${employeeData.value.lastName || ''}`.trim();
    }

  } catch (error) {
    console.error("Error fetching monthly employee summary:", error);
    toast.error(`Failed to load monthly data: ${error.response?.data?.error || error.message}`);
    // Reset data on error?
    monthlyJobs.value = [];
    monthlySummary.value = { totalPayments: 0, totalExpenses: 0, netRevenue: 0, jobCount: 0 };
  } finally {
    isLoadingMonthlyData.value = false;
  }
};

const handleNavigateBack = () => {
  router.back(); // Or router.push({ name: 'employees' });
};

const viewJobDetails = (jobId) => {
  uiStore.openGlobalJobModal(jobId);
};

// Format currency helper
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return 'R0.00';
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(value));
  } catch (error) {
    return `R ${Number(value).toFixed(2)}`;
  }
}

// --- Dark Mode Toggle ---
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  // document.documentElement.classList.toggle('dark', isDarkMode.value); // Handled by watchEffect
};

// Get CSS class based on job status
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid': return 'status-paid';
    case 'pending': return 'status-pending';
    case 'invoiced': return 'status-invoiced';
    case 'quoted': return 'status-quoted';
    case 'done': return 'status-done';
    // Add more cases as needed
    default: return 'status-default';
  }
};

// Helper function to format dates (or import from helpers)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Use a more robust date formatting method if available
  try {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString; // Fallback to original string if formatting fails
  }
}

// Removed duplicate getStatusClass definition
// Stray lines removed

// --- Watchers ---
watch([selectedYear, selectedMonth], ([newYear, newMonth]) => {
  fetchMonthlyData(newYear, newMonth);
}, { immediate: false }); // Don't run immediately, let onMounted handle initial load

// Watch dark mode changes to apply class to HTML element
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});

// --- Lifecycle ---
onMounted(() => {
  if (!employeeId.value) {
    toast.error("Employee ID not found in route query.");
    router.push({ name: 'employees' }); // Redirect if no ID
    return;
  }
  fetchMonthlyData(selectedYear.value, selectedMonth.value);
});

</script>


<template>
  <!-- Use Header component -->
  <!-- <Header :title="employeeName" /> -->
  <!-- Or integrate header directly if AppNav handles title -->
  <!-- Added dark class binding -->
  <div :class="{ 'dark': userStore.isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <div class="flex items-center space-x-3">
          <button @click="handleNavigateBack" class="btn-icon-modern" title="Go Back">
            <font-awesome-icon icon="arrow-left" />
          </button>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {{ employeeName }}
            </h1>
            <p v-if="employeeData?.email" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ employeeData.email }}
            </p>
          </div>
        </div>
        <!-- Header Actions -->
        <div class="flex items-center space-x-2 sm:space-x-3">
           <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
              <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
           </button>
           <!-- Add other header buttons here if needed -->
        </div>
        <!-- Extra div removed -->
      </header>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <!-- Left Column: Employee Info & Monthly Summary -->
        <div class="lg:col-span-4 space-y-6 lg:space-y-8">

          <!-- Employee Details Card -->
          <section v-if="employeeData" class="card-modern p-5 sm:p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee Details</h2>
            <div class="space-y-3 text-sm">
              <div class="flex items-center">
                <font-awesome-icon icon="user" class="w-4 h-4 mr-2.5 text-gray-400" />
                <span class="text-gray-700 dark:text-gray-300">{{ employeeData.firstName }} {{ employeeData.lastName }}</span>
              </div>
              <div v-if="employeeData.phone" class="flex items-center">
                <font-awesome-icon icon="phone" class="w-4 h-4 mr-2.5 text-gray-400" />
                <span class="text-gray-700 dark:text-gray-300">{{ employeeData.phone }}</span>
              </div>
              <div v-if="employeeData.location" class="flex items-center">
                 <font-awesome-icon icon="map-marker-alt" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">{{ employeeData.location }}</span>
              </div>
               <div v-if="employeeData.description" class="flex items-start">
                 <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
                 <span class="text-gray-700 dark:text-gray-300">{{ employeeData.description }}</span>
               </div>
               <div class="flex items-center">
                 <font-awesome-icon icon="calendar-alt" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Member Since: {{ formatDate(employeeData.createdAt) }}</span>
               </div>
            </div>
          </section>
          <section v-else class="card-modern p-5 sm:p-6 text-center text-gray-500">
             Loading employee details...
          </section>

          <!-- Monthly Summary Card -->
          <section class="card-modern p-5 sm:p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Summary ({{ moment().month(selectedMonth - 1).format('MMMM') }} {{ selectedYear }})
            </h2>
             <div v-if="isLoadingMonthlyData" class="flex justify-center items-center h-20">
                <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
             </div>
             <div v-else class="space-y-3 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center"><font-awesome-icon icon="briefcase" class="mr-2"/> Jobs Completed:</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ monthlySummary.jobCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center"><font-awesome-icon icon="dollar-sign" class="mr-2 text-green-500"/> Revenue (Payments this month):</span>
                  <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(monthlySummary.totalPayments) }}</span>
                 </div>
                  <div class="flex justify-between items-center">
                   <span class="text-gray-600 dark:text-gray-400 flex items-center"><font-awesome-icon icon="receipt" class="mr-2 text-red-500"/> Expenses (This Month):</span>
                   <span class="font-semibold text-red-600 dark:text-red-400">{{ formatCurrency(monthlySummary.totalExpenses) }}</span>
                 </div>
                 <!-- Removed separate Job/Non-Job expense lines -->
                  <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700/50">
                   <span class="font-bold text-gray-700 dark:text-gray-300">Net (Payments - All Expenses):</span>
                   <span class="font-bold text-lg" :class="monthlySummary.netRevenue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCurrency(monthlySummary.netRevenue) }}
                  </span>
                </div>
             </div>
          </section>

        </div>

        <!-- Right Column: Month Selector & Jobs List -->
        <div class="lg:col-span-8">
          <section class="card-modern p-5 sm:p-6">
            <!-- Month/Year Selector -->
            <div class="flex flex-col sm:flex-row gap-4 mb-6 items-center">
               <font-awesome-icon icon="filter" class="text-gray-500 mr-2"/>
               <h3 class="text-md font-semibold text-gray-800 dark:text-gray-200 flex-shrink-0">View Data For:</h3>
               <div class="flex-grow sm:flex-grow-0">
                 <label for="month-select" class="sr-only">Month</label>
                 <select id="month-select" v-model="selectedMonth" class="input-modern input-modern--select w-full sm:w-auto">
                   <option v-for="month in monthOptions" :key="month.value" :value="month.value">
                     {{ month.label }}
                   </option>
                 </select>
               </div>
               <div class="flex-grow sm:flex-grow-0">
                 <label for="year-select" class="sr-only">Year</label>
                 <select id="year-select" v-model="selectedYear" class="input-modern input-modern--select w-full sm:w-auto">
                   <option v-for="year in yearOptions" :key="year.value" :value="year.value">
                     {{ year.label }}
                   </option>
                 </select>
               </div>
            </div>

            <!-- Jobs List -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Jobs in {{ moment().month(selectedMonth - 1).format('MMMM') }} {{ selectedYear }} ({{ monthlySummary.jobCount }})
            </h3>
            <div v-if="isLoadingMonthlyData" class="flex justify-center items-center h-40">
               <ScaleLoader :loading="true" color="#4f46e5" height="30px" width="4px" />
            </div>
            <div v-else-if="monthlyJobs.length > 0" class="space-y-4">
              <!-- Job Summary Card (Inline Template) -->
              <div v-for="job in monthlyJobs" :key="job.id" class="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                  <h4 class="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-0">{{ job.issue || 'Job #' + job.id }}</h4>
                  <span :class="['text-xs font-medium px-2.5 py-0.5 rounded-full', getStatusClass(job.jobStatus)]">
                    {{ job.jobStatus || 'N/A' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Customer: {{ job.customer?.name || 'N/A' }} | Created: {{ formatDate(job.createdAt) }}
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-t dark:border-gray-700 pt-3">
                  <div>
                    <p class="font-medium text-green-600 dark:text-green-400">Payments (This Month):</p>
                    <p>{{ formatCurrency(job.jobMonthlyPaymentSum) }}</p>
                    <!-- Optionally list individual payments -->
                    <!-- <ul v-if="job.monthlyPayments.length > 0" class="list-disc list-inside text-gray-500">
                      <li v-for="p in job.monthlyPayments" :key="p.id">{{ formatCurrency(p.amountInCents / 100) }} on {{ formatDate(p.paymentDate || p.createdAt) }}</li>
                    </ul> -->
                  </div>
                  <div>
                    <p class="font-medium text-red-600 dark:text-red-400">Expenses (This Month for Job):</p> <!-- Corrected Label -->
                    <p>{{ formatCurrency(job.jobMonthlyExpenseSum) }}</p> <!-- Corrected Value Binding -->
                     <!-- Optionally list individual expenses -->
                     <!-- <ul v-if="job.expenses.length > 0" class="list-disc list-inside text-gray-500">
                      <li v-for="e in job.expenses" :key="e.id">{{ formatCurrency(e.amount) }} - {{ e.description }}</li>
                    </ul> -->
                  </div>
                  <div class="flex items-end justify-end">
                     <button @click="viewJobDetails(job.id)" class="btn-ghost-modern text-xs">
                       <font-awesome-icon icon="eye" class="mr-1"/> View Details
                     </button>
                  </div>
                </div>
              </div>
              <!-- End Job Summary Card -->
            </div>
            <div v-else class="text-center text-gray-500 dark:text-gray-400 py-10">
              No jobs found for this employee in the selected month.
            </div>
          </section>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* Re-use styles from View.vue or global styles if available */
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
.label-modern {
  @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-ghost-modern {
  @apply inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 rounded;
  @apply hover:bg-indigo-100 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Add specific status badge styles if needed, or import from a shared location */
.status-paid { @apply bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300; }
.status-pending { @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300; }
.status-invoiced { @apply bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300; }
.status-quoted { @apply bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300; }
.status-done { @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300; }
/* Add other statuses as needed */
.status-default { @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300; }

</style>
