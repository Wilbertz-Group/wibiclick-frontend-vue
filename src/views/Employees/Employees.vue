// wibiclick-frontend-vue/src/views/Employees/Employees.vue
<script setup>
import axios from "axios";
import Header from "@/components/Header.vue"; // Keep if still used, or replace with inline header
import  useUserStore  from "@/stores/UserStore";
import { onMounted, ref, reactive, watchEffect, computed } from "vue"; // Added computed
import moment from 'moment';
import _ from 'lodash';
import { useToast } from 'vue-toast-notification';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';

import { AgGridVue } from "ag-grid-vue3";
import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
import Edit from "@/components/Edit.vue"; // Keep for AgGrid
import View from "@/components/employees/View.vue"; // Keep for AgGrid

// --- FontAwesome ---
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlus, faSync, faSun, faMoon, faUsers } from '@fortawesome/free-solid-svg-icons'; // Added icons

library.add(faPlus, faSync, faSun, faMoon, faUsers);

// --- State ---
const userStore = useUserStore();
const loading = ref(false);
const toast = useToast();
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true'); // Dark mode state
const options = ref({}); // Chart options
const series = ref([]); // Chart series

const selectedEmployee = ref(null);
const paginationPageSize = ref(10);
const modalOpen = ref(false);

const gridApi = ref(null);
const rowData = reactive({ value: [] }); // Initialize as object with value array

// --- AgGrid Config ---
const columnDefs = reactive({
  value: [
    { field: "firstName", filter: true, sortable: true },
    { field: "lastName", filter: true, sortable: true },
    { field: "email", filter: true, sortable: true },
    { field: "phone", filter: true, sortable: true },
    { field: "location", filter: true, sortable: true },
    { field: "_count.jobs", headerName: "Jobs", filter: 'agNumberColumnFilter', sortable: true }, // Corrected field path and added headerName
    {
      field: "Edit",
      headerName: 'Edit',
      maxWidth: 80,
      cellRendererSelector: params => ({ component: Edit, params }),
      sortable: false,
      filter: false,
    },
    {
      field: "id",
      headerName: "View",
      maxWidth: 90,
      cellRendererSelector: params => ({ component: View, params }),
      sortable: false,
      filter: false,
    },
  ],
});

const defaultColDef = {
  sortable: true,
  filter: true,
  flex: 1,
  resizable: true, // Added resizable
};

// --- Computed AgGrid Theme ---
const gridTheme = computed(() => {
  return isDarkMode.value ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
});

// --- Methods ---
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  // Force chart redraw might be needed if options update isn't enough
  // updateChartOptions(); // Call explicit update if watchEffect isn't sufficient
};

const onGridReady = (params) => {
  gridApi.value = params.api;
};

async function fetchEmployees() {
  if (!userStore.currentWebsite) return;
  try {
    loading.value = true;
    const response = await axios.get(
      `employees?id=${userStore.currentWebsite}&limit=100&offset=0`
    );
    // Ensure data is always an array
    const employeesData = response.data.employees || [];
    // Order by the nested job count
    rowData.value = _.orderBy(employeesData, ['_count.jobs'], ['desc']);
  } catch (error) {
    console.error("Error fetching employees:", error);
    toast.error("Error getting employees data");
    rowData.value = []; // Reset data on error
  } finally {
    loading.value = false;
  }
}

async function fetchJobs() {
  if (!userStore.currentWebsite) return;
  try {
    // Don't set loading true here if fetchEmployees does it
    const response = await axios.get(
      `jobs?id=${userStore.currentWebsite}&limit=1500&offset=0`
    );

    let jobs = [];
    const jobsData = response.data.jobs || []; // Ensure jobsData is an array

    for (const job of jobsData) {
      jobs.push({
        x: job.slotStart,
        y: 1, // Assuming y is always 1 for count
      });
    }

    const data = _.sortBy(jobs, 'x');

    // Grouping logic (simplified for example)
    const groups = (() => {
      const byDay = (item) => moment(item.x).format('YYYY-MM-DD'); // Use ISO format for consistency
      return { byDay };
    })();

    const currentGroup = 'byDay';
    const grouped = _.groupBy(data, groups[currentGroup]);
    const seriesData = Object.values(grouped).map(a => a.length);
    const optionsData = Object.keys(grouped); // These are date strings

    // Update chart series
    series.value = [{
      name: 'Jobs per Day', // More descriptive name
      data: seriesData
    }];

    // Update chart options (colors handled by watchEffect)
    options.value = {
      ...options.value, // Keep existing structure but update categories
      xaxis: {
        ...options.value.xaxis,
        type: 'datetime',
        categories: optionsData,
        labels: {
          ...options.value.xaxis?.labels,
          datetimeUTC: false, // Ensure local time display
          style: {
            // Colors updated via watchEffect
          }
        }
      },
      // Ensure other necessary options are present
      chart: {
        height: 350,
        type: 'bar', // Changed to bar as per original code
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' },
      tooltip: {
        // Theme updated via watchEffect
        x: { format: 'dd MMM yyyy' }
      },
      yaxis: {
        min: 0,
        tickAmount: 4,
        labels: {
          style: {
            // Colors updated via watchEffect
          }
        }
      },
      fill: {
        gradient: {
          enabled: true,
          opacityFrom: 0.55,
          opacityTo: 0
        }
      },
      grid: {
        borderColor: "#e0e0e0", // Default light border
        strokeDashArray: 2,
        clipMarkers: false,
        yaxis: { lines: { show: true } }
      },
      markers: { // Keep markers if needed for area chart, maybe remove for bar
        size: 5,
        colors: ["#ffffff"],
        strokeColor: "#00BAEC",
        strokeWidth: 3
      },
    };

  } catch (error) {
    console.error("Error fetching jobs data for chart:", error);
    toast.error("Error getting jobs data for chart");
    // Reset chart data on error
    series.value = [];
    options.value = { ...options.value, xaxis: { ...options.value.xaxis, categories: [] } };
  } finally {
    // Don't set loading false here if fetchEmployees does it
  }
}

async function update(credentials) {
  try {
    loading.value = true;
    // Ensure credentials include the employee ID for update
    const payload = { ...credentials, id: selectedEmployee.value?.id };
    const { data } = await axios.post('add-employee?id=' + userStore.currentWebsite, payload); // Backend handles update via ID
    loading.value = false;
    toast.success(data.message || "Employee updated successfully");
    modalOpen.value = false; // Close modal
    fetchEmployees(); // Refresh list
  } catch (error) {
    console.error("Error updating employee:", error);
    loading.value = false;
    toast.error(`Error updating employee: ${error.response?.data?.message || error.message}`);
  }
}

const toggleEditModal = (event) => {
  // Check if the click was on the 'Edit' cell/component trigger
  // This condition might need adjustment based on how Edit.vue emits events or how cellRendererSelector works
  if (event.colDef.field === 'Edit' && event.data) {
    selectedEmployee.value = { ...event.data }; // Clone data for editing
    modalOpen.value = true;
  }
  // Handle 'View' click if needed, maybe navigate or open a different modal
  else if (event.colDef.field === 'id' && event.data) {
     // Example: Navigate to a detailed view page
     // router.push({ name: 'employee-details', params: { id: event.data.id } });
     toast.info(`Viewing employee: ${event.data.firstName}`); // Placeholder action
  }
};

const reloadData = () => {
  fetchEmployees();
  fetchJobs();
};

// --- Lifecycle Hooks ---
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  if (userStore.currentWebsite) {
    fetchEmployees();
    fetchJobs();
  }
});

watchEffect(() => {
  if (userStore.currentWebsite) {
    fetchEmployees();
    fetchJobs();
  }
});

// Watch for dark mode changes to update chart options
watchEffect(() => {
  const textColor = isDarkMode.value ? '#FFFFFF' : '#374151'; // White for dark, dark gray for light
  const gridBorderColor = isDarkMode.value ? '#4b5563' : '#e5e7eb'; // Gray-600 for dark, Gray-200 for light

  options.value = {
    ...options.value,
    chart: {
      ...options.value.chart,
      foreColor: textColor // Set base text color
    },
    tooltip: {
      ...options.value.tooltip,
      theme: isDarkMode.value ? "dark" : "light",
    },
    xaxis: {
      ...options.value.xaxis,
      labels: {
        ...options.value.xaxis?.labels,
        style: {
          ...options.value.xaxis?.labels?.style,
          colors: textColor,
        },
      },
      title: {
        ...options.value.xaxis?.title,
         style: {
            color: textColor
         }
      }
    },
    yaxis: {
      ...options.value.yaxis,
      labels: {
        ...options.value.yaxis?.labels,
        style: {
          ...options.value.yaxis?.labels?.style,
          colors: textColor,
        },
      },
       title: {
        ...options.value.yaxis?.title,
         style: {
            color: textColor
         }
      }
    },
    grid: {
      ...options.value.grid,
      borderColor: gridBorderColor,
    },
  };

  // Update AgGrid theme (already handled by computed property `gridTheme`)
});

</script>

<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row justify-between items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
          <font-awesome-icon icon="users" class="mr-3 h-6 w-6 text-indigo-500" />
          Employees
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
           <button @click="reloadData" class="btn-icon-modern" title="Reload Data">
             <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
           </button>
           <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
             <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
           </button>
           <router-link :to="{name: 'add-employee'}" class="btn-primary-modern">
             Add Employee <font-awesome-icon icon="plus" class="ml-1.5 h-4 w-4" />
           </router-link>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="space-y-8">

        <!-- Employees List Card -->
        <section class="card-modern p-0 overflow-hidden"> <!-- Remove padding for grid -->
           <div class="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700/50">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Employees List</h2>
           </div>
           <!-- AgGrid Component -->
           <div :class="gridTheme" class="ag-grid-container" style="height: 521px; width: 100%;">
              <ag-grid-vue
                  style="width: 100%; height: 100%;"
                  :columnDefs="columnDefs.value"
                  :rowData="rowData.value"
                  :defaultColDef="defaultColDef"
                  :pagination="true"
                  :paginationPageSize="paginationPageSize"
                  rowSelection="multiple"
                  animateRows="true"
                  @grid-ready="onGridReady"
                  @cell-clicked="toggleEditModal"
                >
              </ag-grid-vue>
           </div>
        </section>

        <!-- Jobs Overview Chart Card -->
        <section class="card-modern p-5 sm:p-6">
           <div class="flex flex-wrap items-center justify-between mb-4">
              <div>
                 <h6 class="uppercase mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                   Overview
                 </h6>
                 <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Jobs per Day</h2>
              </div>
              <!-- Add chart controls here if needed -->
           </div>
           <!-- ApexChart Component -->
           <div v-if="series.length > 0 && options.xaxis?.categories?.length > 0">
              <apexchart type="bar" height="350" :options="options" :series="series"></apexchart>
           </div>
           <div v-else class="text-center py-10 text-gray-500 dark:text-gray-400">
              {{ loading ? 'Loading chart data...' : 'No job data available for chart.' }}
           </div>
        </section>

      </div> <!-- End Main Content Area -->

    </div> <!-- End container -->

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
       <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
    </div>

    <!-- Edit Employee Modal (Restyled) -->
    <transition name="modal-fade">
       <div v-if="modalOpen" class="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
             <!-- Backdrop -->
             <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="modalOpen = false"></div>
             <!-- Modal positioning -->
             <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
             <!-- Modal panel -->
             <div class="modal-content-modern">
                <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
                   Update Employee Details
                </h3>
                <!-- FormKit Form -->
                <FormKit type="form" v-if="selectedEmployee" id="employeeUpdateForm" submit-label="Update Employee" @submit="update" :actions="false">
                   <div class="space-y-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormKit type="text" v-model="selectedEmployee.firstName" name="firstName" label="First Name" placeholder="Jane" outer-class="text-left" validation="required" input-class="input-modern" label-class="label-modern" />
                         <FormKit type="text" v-model="selectedEmployee.lastName" name="lastName" label="Last Name" placeholder="Doe" outer-class="text-left" validation="required" input-class="input-modern" label-class="label-modern" />
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormKit type="email" v-model="selectedEmployee.email" name="email" label="Email" placeholder="jane@company.com" outer-class="text-left" validation="required|email" input-class="input-modern" label-class="label-modern" />
                         <FormKit type="tel" v-model="selectedEmployee.phone" name="phone" label="Phone" placeholder="0210002314" outer-class="text-left" validation="required" input-class="input-modern" label-class="label-modern" /> <!-- Removed |phone validation if not standard FormKit -->
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormKit type="text" v-model="selectedEmployee.location" name="location" label="Location" placeholder="Cape Town" outer-class="text-left" validation="required" input-class="input-modern" label-class="label-modern" />
                         <!-- Add other fields if needed -->
                      </div>
                      <FormKit type="textarea" v-model="selectedEmployee.description" name="description" label="Job Description" placeholder="HVAC & Appliance Technician" outer-class="text-left" validation="required" input-class="input-modern" label-class="label-modern" />
                   </div>
                   <!-- Modal Actions -->
                   <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3">
                      <FormKit type="submit" label="Update Employee" outer-class="w-full sm:w-auto" input-class="btn-primary-modern w-full" />
                      <button @click="modalOpen = false" type="button" class="btn-secondary-modern w-full sm:w-auto">
                         Cancel
                      </button>
                   </div>
                </FormKit>
             </div>
          </div>
       </div>
    </transition>

  </div>
</template>

<style>
/* Import modern styles (ensure these don't conflict with existing global styles) */

/* Minimalist Input Styles */
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

/* Modern Button Styles */
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

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm; /* Added backdrop-blur */
}

/* Modal Styles */
.modal-content-modern {
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:w-full p-6 sm:p-8;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content-modern,
.modal-fade-leave-active .modal-content-modern {
  transition: all 0.3s ease;
}
.modal-fade-enter-from .modal-content-modern,
.modal-fade-leave-to .modal-content-modern {
   transform: translateY(20px) scale(0.98);
   opacity: 0;
}

/* AgGrid Theme Styling */
.ag-theme-alpine {
    /* Light theme overrides */
    --ag-background-color: #ffffff;
    --ag-header-background-color: #f9fafb; /* gray-50 */
    --ag-odd-row-background-color: #ffffff;
    --ag-row-hover-color: #f3f4f6; /* gray-100 */
    --ag-border-color: #e5e7eb; /* gray-200 */
    --ag-font-family: inherit; /* Use font-sans from body */
    --ag-font-size: 14px; /* text-sm */
    --ag-foreground-color: #374151; /* gray-700 */
    --ag-header-foreground-color: #6b7280; /* gray-500 */
    --ag-secondary-foreground-color: #6b7280; /* gray-500 */
    --ag-selected-row-background-color: rgba(99, 102, 241, 0.1); /* indigo-100 with opacity */
    --ag-range-selection-border-color: #6366f1; /* indigo-500 */
    --ag-range-selection-background-color: rgba(99, 102, 241, 0.2); /* indigo-500 with opacity */
}

.ag-theme-alpine-dark {
    /* Dark theme overrides */
    --ag-background-color: rgba(31, 41, 55, 0.6); /* gray-800 with opacity */
    --ag-header-background-color: rgba(17, 24, 39, 0.5); /* gray-900 with opacity */
    --ag-odd-row-background-color: rgba(31, 41, 55, 0.4); /* Slightly lighter than background */
    --ag-row-hover-color: rgba(55, 65, 81, 0.7); /* gray-700 with opacity */
    --ag-border-color: rgba(55, 65, 81, 0.7); /* gray-700 */
    --ag-font-family: inherit;
    --ag-font-size: 14px;
    --ag-foreground-color: #d1d5db; /* gray-300 */
    --ag-header-foreground-color: #9ca3af; /* gray-400 */
    --ag-secondary-foreground-color: #9ca3af; /* gray-400 */
    --ag-selected-row-background-color: rgba(129, 140, 248, 0.2); /* indigo-400 with opacity */
    --ag-range-selection-border-color: #a5b4fc; /* indigo-300 */
    --ag-range-selection-background-color: rgba(129, 140, 248, 0.3); /* indigo-400 with opacity */
}

/* Ensure grid container takes full height */
.ag-grid-container {
  height: 100%;
  width: 100%;
}

/* Custom scrollbar styles (optional) */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* FormKit overrides to use modern styles */
[data-type="text"] .formkit-input,
[data-type="email"] .formkit-input,
[data-type="tel"] .formkit-input,
[data-type="textarea"] .formkit-input {
  @apply input-modern !important; /* Use important to override FormKit defaults if necessary */
}
.formkit-label {
  @apply label-modern !important;
}
.formkit-outer {
  @apply mb-0 !important; /* Adjust spacing if needed */
}
/* Style FormKit submit button */
[data-type="submit"] .formkit-input {
  @apply btn-primary-modern !important;
}

</style>
