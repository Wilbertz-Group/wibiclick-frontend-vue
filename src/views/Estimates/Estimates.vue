// wibiclick-frontend-vue/src/views/Estimates/Estimates.vue
<script setup>
  import axios from "axios";
  import EstimatesTrendChart from "@/components/estimates/EstimatesTrendChart.vue";
  import { useThemeStore } from "@/stores/theme";
  // import Header from "@/components/Header.vue"; // Removed old header
  import  useUserStore  from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed } from "vue"; // Added computed
  import moment from 'moment'
  // import _ from 'lodash'; // Removed lodash, not needed for basic filtering
  import { useRouter } from "vue-router";
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Keep for loading state
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import {
    faSun, faMoon, faSync, faPlus, faEdit, faEye, faFileInvoiceDollar, faSearch, // Added icons
    faChevronLeft, faChevronRight // Added pagination icons
  } from '@fortawesome/free-solid-svg-icons'

  // Removed AG Grid imports
  // import { AgGridVue } from "ag-grid-vue3";
  // import "ag-grid-community/styles/ag-grid.css";
  // import "ag-grid-community/styles/ag-theme-alpine.css";
  // import Edit from "@/components/estimates/Edit.vue"; // Will replace with modal logic
  // import View from "@/components/estimates/View.vue"; // Will replace with router link or modal
  // import Status from "@/components/estimates/Status.vue"; // Will replace with styled span
  // import Draggable from "vue3-draggable"; // Removed draggable

  // Removed ApexCharts imports
  import EstimateFormModal from '@/components/estimates/EstimateFormModal.vue'; // Import estimate modal

  library.add(
    faSun, faMoon, faSync, faPlus, faEdit, faEye, faFileInvoiceDollar, faSearch,
    faChevronLeft, faChevronRight
  )

  const userStore = useUserStore()
  const themeStore = useThemeStore();
  const toast = useToast();
  const loading = ref(false);
  // Removed local isDarkMode state - using global theme store now
  // Removed ApexCharts options and series refs
  // const options = ref();
  // const series = ref();
  const router = useRouter();
  const estimates = ref([]); // Renamed from estimatesApi
  const currentPage = ref(1); // Added pagination state

  const selectedEstimate = ref({})
  const paginationPageSize = ref(10); // Standardized page size
  const technicians = ref([]); // Added technicians ref
  const editModalOpen = ref(false);
  const modalCustomerJobs = ref([]); // Added state for modal-specific jobs
  const isFetchingModalData = ref(false); // Added loading state for modal data
  const availableStatuses = ref([]); // New ref for actual statuses found in data
  // Removed estimatesApi, estimatesStatusesApi, colors refs (will handle status styling differently)
  // const estimatesApi = ref([])
  // const estimatesStatusesApi = ref([])
  // const colors = ref({...})

  // Add filters reactive object
  const filters = reactive({
    search: '',
    status: '', // Add status filter
    // Add other filters if needed (e.g., date range)
  });

  // Removed ApexCharts default options/series setup

  // Removed unused groups variable

  async function fetchEstimates() {
    try {
      loading.value = true;
      const response = await axios.get(
        `estimates?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      estimates.value = response.data.estimates; // Assign to the new ref

      // Extract unique statuses from the fetched estimates
      const uniqueStatuses = [...new Set(response.data.estimates.map(est => est.reason).filter(Boolean))];
      availableStatuses.value = uniqueStatuses.sort();

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting estimates data");
    }
  }

  // Add computed properties for filtering and pagination
  const filteredEstimates = computed(() => {
    return estimates.value.filter(est => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !searchLower ||
                           (est.number?.toLowerCase().includes(searchLower)) ||
                           (est.customer?.name?.toLowerCase().includes(searchLower)) ||
                           (est.employee?.firstName?.toLowerCase().includes(searchLower)) ||
                           (est.employee?.lastName?.toLowerCase().includes(searchLower));
      const matchesStatus = !filters.status || est.reason === filters.status; // Filter by 'reason' field

      return matchesSearch && matchesStatus;
    });
  });

  const totalEstimates = computed(() => filteredEstimates.value.length);
  const totalPages = computed(() => Math.ceil(totalEstimates.value / paginationPageSize.value));
  const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
  const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalEstimates.value));

  const paginatedEstimates = computed(() => {
    return filteredEstimates.value.slice(startIndex.value, endIndex.value);
  });

  // Add pagination functions
  const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
  }
  const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
  }

  // Add clearFilters function
  const clearFilters = () => {
    filters.search = '';
    filters.status = '';
    // Reset other filters
    // Removed duplicated catch block
  }

  // Removed AG Grid specific variables
  // const gridApi = ref(null);
  // const onGridReady = (params) => { ... };
  // const rowData = reactive({});

  // Updated dateFormatter to accept date string directly
  const dateFormatter = (dateString) => {
    if (!dateString) return '-';
    const dt = moment(dateString); // Assuming dateString is ISO or parsable by moment
    return moment().isSame(dt, 'day') ? dt.format('h:mm A') : dt.format('MMM DD, YYYY h:mm A');
  }

  // Removed unused AG Grid formatters
  // const nameFormatter = (params) => { ... }
  // const universalDateFormatter = (dat) => { ... }
  // const amountFormatter = (params) => { ... }

  // Removed AG Grid columnDefs and defaultColDef

  // --- Fetch Technicians ---
  async function fetchTechnicians() {
    // Assuming endpoint is similar to Jobs/Users view
    try {
      const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
      technicians.value = response.data.employees || [];
    } catch (error) {
      console.error('Error fetching technicians:', error);
      // Optional: toast.error('Could not load technicians');
    }
  }

  async function update(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-estimate?id='+ userStore.currentWebsite, credentials);
      loading.value = false;
      editModalOpen.value = false;
      fetchEstimates(); // Refetch data after update
      toast.success("Successfully updated estimate details");
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error(`Error updating estimate: ${error.response?.data?.message || error.message}`);
    } finally {
      // Ensure loading is always turned off
      loading.value = false;
    }
  }

  // --- Modal Control Functions ---

  // Separate async function to fetch jobs for the modal
  async function fetchJobsForModal(customerId) {
    if (!customerId) {
      modalCustomerJobs.value = [];
      return;
    }
    isFetchingModalData.value = true;
    modalCustomerJobs.value = []; // Clear previous jobs
    try {
      const response = await axios.get(`customer?id=${userStore.currentWebsite}&custId=${customerId}`);
      const customerData = response.data.customer;
      const jobs = customerData?.jobs || [];

      // Sort jobs by createdAt descending (most recent first)
      const sortedJobs = [...jobs].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : 0;
          const dateB = b.createdAt ? new Date(b.createdAt) : 0;
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          return dateB - dateA;
      });

      modalCustomerJobs.value = sortedJobs; // Store fetched & sorted jobs

      // Set default jobId if estimate doesn't have one and jobs exist
      // Ensure selectedEstimate is accessed safely as it might change
      if (selectedEstimate.value && !selectedEstimate.value.jobId && sortedJobs.length > 0) {
        selectedEstimate.value.jobId = sortedJobs[0].id; // Default to most recent job
      }

    } catch (error) {
      console.error("Error fetching customer jobs for modal:", error);
      toast.error("Could not load associated jobs for the modal.");
      modalCustomerJobs.value = []; // Ensure it's empty on error
    } finally {
      isFetchingModalData.value = false;
    }
  }

  const openEditModal = (estimate) => {
    // 1. Format and set the selected estimate
    const formattedEstimate = {
      ...estimate,
      issuedAt: estimate.issuedAt ? moment(estimate.issuedAt).format('YYYY-MM-DDTHH:mm') : '',
      customer: estimate.customer || {} // Ensure customer object exists
    };
    selectedEstimate.value = formattedEstimate;

    // 2. Open the modal immediately
    editModalOpen.value = true;

    // 3. Trigger async job fetching (don't await here)
    fetchJobsForModal(selectedEstimate.value.customer?.id);
  };

  const closeEditModal = () => {
    editModalOpen.value = false;
    selectedEstimate.value = {};
    modalCustomerJobs.value = []; // Clear jobs when closing
  };

  // Handle modal save event
  const handleEstimateSaved = () => {
    // Modal closing is handled by v-model
    fetchEstimates(); // Refresh the list
  };

  // --- Helper function for status badge styling ---
  const getEstimateStatusClass = (status) => {
    const baseClasses = 'status-badge-modern '; // Keep space at the end
    const lowerStatus = status?.toLowerCase() || 'default';

    // Map estimate statuses (reason field) to style classes
    // Adjust these cases based on the actual values in estimate.reason
    switch (lowerStatus) {
      case 'sent':
      case 'pending': // Example: Grouping similar statuses
        return baseClasses + 'status-badge--active'; // Blueish
      case 'accepted':
        return baseClasses + 'status-badge--positive'; // Greenish
      case 'rejected':
      case 'cancelled': // Example: Grouping
        return baseClasses + 'status-badge--negative'; // Reddish
      case 'draft':
        return baseClasses + 'status-badge--default'; // Greyish
      // Add more cases as needed for other statuses like 'viewed', 'expired', etc.
      default:
        return baseClasses + 'status-badge--default'; // Default grey
    }
  };

  // Removed local toggleDarkMode function - using global theme store now

  onMounted(() => {
    // document.documentElement.classList.toggle('dark', isDarkMode.value); // Removed local dark mode application
    if(userStore.currentWebsite){
      fetchEstimates();
      fetchTechnicians(); // Fetch technicians on mount
    }
  });

  watchEffect(() => {
    if(userStore.currentWebsite){
      // Refetch when website changes (optional, depends on desired behavior)
      // fetchEstimates();
    }
    // Add other watchers if needed (e.g., for chart updates if re-added)
  });

</script>

<template>
 <!-- Main container with background and padding -->
 <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
   <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

     <!-- Header Section -->
     <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
       <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
         <font-awesome-icon icon="file-invoice-dollar" class="mr-3 text-indigo-500 dark:text-indigo-400" /> Manage Estimates
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <!-- Add Website Selector if needed -->
         <button @click="fetchEstimates" class="btn-icon-modern" title="Reload Estimates">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <!-- Removed local dark mode toggle button -->
         <router-link :to="{name: 'add-estimate'}" class="btn-primary-modern">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Estimate
         </router-link>
       </div>
     </header>

     <!-- Filter Section -->
     <section class="mb-10 p-5 sm:p-6 card-modern">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4 items-end">
           <!-- Search Input -->
           <div class="relative sm:col-span-2 lg:col-span-1">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input v-model="filters.search" placeholder="Search #, customer, tech..." class="input-modern pl-10 pr-3" />
           </div>
           <!-- Status Select -->
           <select v-model="filters.status" class="input-modern input-modern--select">
             <option value="">All Statuses</option>
             <!-- Assuming estimateStatuses holds the possible status values -->
             <option v-for="status in availableStatuses" :key="status" :value="status">{{ status }}</option>
           </select>

           <!-- Filter Actions -->
           <div class="flex items-center justify-end space-x-2 mt-2 sm:mt-0 lg:col-start-3">
              <button @click="clearFilters" class="btn-secondary-modern text-xs sm:text-sm whitespace-nowrap">
                 Clear Filters
              </button>
           </div>
        </div>
     </section>

     <!-- Estimate List Section -->
     <section>
        <!-- Loading Skeleton -->
        <div v-if="loading" class="animate-pulse">
           <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
              <table class="min-w-full">
                <thead class="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in 5" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    <td class="td-modern"><div class="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div></td>
                    <td class="td-modern text-right">
                      <div class="flex justify-end space-x-2">
                        <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-10"></div>
                        <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-10"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
           </div>
           <!-- Add Mobile Skeleton if needed -->
        </div>

        <!-- Estimate Table (Desktop) -->
        <div v-if="!loading && paginatedEstimates.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                     <th scope="col" class="th-modern">Estimate #</th>
                     <th scope="col" class="th-modern">Client</th>
                     <th scope="col" class="th-modern">Created At</th>
                     <th scope="col" class="th-modern">Amount</th>
                     <th scope="col" class="th-modern">Status</th>
                     <th scope="col" class="th-modern text-right">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="estimate in paginatedEstimates" :key="estimate.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                     <td class="td-modern font-medium text-gray-900 dark:text-white">#{{ estimate.number }}</td>
                     <td class="td-modern">
                        <router-link :to="{ path: '/contact', query: { customer_id: estimate.customer?.id } }" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                          {{ estimate.customer?.name || 'N/A' }}
                        </router-link>
                     </td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ dateFormatter(estimate.createdAt) }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400">R{{ estimate.sales }}</td>
                     <td class="td-modern">
                        <!-- Add styled status span here -->
                        <span :class="getEstimateStatusClass(estimate.reason)" class="status-badge-modern">
                          {{ estimate.reason }}
                        </span>
                     </td>
                     <td class="td-modern text-right space-x-2 whitespace-nowrap">
                        <button @click="openEditModal(estimate)" class="btn-ghost-modern" title="Edit Estimate">
                          <font-awesome-icon icon="edit" /> Edit
                        </button>
                        <button @click="openEditModal(estimate)" class="btn-ghost-modern" title="View Estimate">
                          <font-awesome-icon icon="eye" /> View
                        </button>
                     </td>
                  </tr>
               </tbody>
            </table>
        </div>

        <!-- Estimate Cards (Mobile) - Placeholder -->
        <div class="md:hidden space-y-4">
           <div v-if="!loading && paginatedEstimates.length > 0" v-for="estimate in paginatedEstimates" :key="estimate.id" class="card-modern p-4">
              <div class="flex justify-between items-start mb-3 gap-2">
                 <span class="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                    Estimate #{{ estimate.number }}
                 </span>
                 <span :class="getEstimateStatusClass(estimate.reason)" class="status-badge-modern flex-shrink-0">
                    {{ estimate.reason }}
                 </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Client:
                <router-link :to="{ path: '/contact', query: { customer_id: estimate.customer?.id } }" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {{ estimate.customer?.name || 'N/A' }}
                </router-link>
              </p>
              <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Amount: R{{ estimate.sales }}</p>
                <p>Created: {{ dateFormatter(estimate.createdAt) }}</p>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-2">
                 <button @click="openEditModal(estimate)" class="btn-ghost-modern">Edit/View</button>
                 <!-- Removed separate view link -->
              </div>
           </div>
        </div>

        <!-- Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
           <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalEstimates }}</span> results
           </p>
           <div class="flex space-x-1">
              <button :disabled="currentPage === 1" @click="prevPage" class="btn-pagination-modern">
                 <font-awesome-icon icon="chevron-left" class="h-3 w-3 mr-1" /> Previous
              </button>
              <button :disabled="currentPage === totalPages" @click="nextPage" class="btn-pagination-modern">
                 Next <font-awesome-icon icon="chevron-right" class="h-3 w-3 ml-1" />
              </button>
           </div>
        </nav>

        <!-- No Results Message -->
        <div v-if="!loading && paginatedEstimates.length === 0" class="text-center py-16 text-gray-500">
           <font-awesome-icon icon="file-invoice-dollar" class="mx-auto h-12 w-12 text-gray-400" />
           <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No estimates found</h3>
           <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria, or add a new estimate.</p>
        </div>

     </section>

     <!-- Estimates Trend Chart -->
     <section class="my-10">
       <EstimatesTrendChart
         :rawData="estimates"
         :loading="loading"
         :isDarkMode="themeStore.isDarkMode"
       />
     </section>

   </div> <!-- End container -->

   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>

   <!-- Add/Edit Estimate Modal -->
   <!-- Pass customer data if available on estimate -->
   <!-- Pass fetched technicians -->
   <!-- Pass customer jobs if available -->
   <!-- Pass actual statuses -->
   <EstimateFormModal
     v-model="editModalOpen"
     :customer-data="selectedEstimate?.customer"
     :estimate-data="selectedEstimate"
     @estimate-saved="handleEstimateSaved"
     :technicians="technicians"
     :customer-jobs="modalCustomerJobs"
     :available-statuses="availableStatuses"
   ></EstimateFormModal>

 </div> <!-- End main div -->
</template>

<style scoped>
/* Add modern styles */
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
.btn-pagination-modern {
 @apply inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md;
 @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
 @apply transition-colors duration-150 ease-in-out;
}

.card-modern {
 @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

.th-modern {
 @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
 @apply px-4 py-3 text-sm;
}

/* Status Badge Styles */
.status-badge-modern {
 @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap;
}
/* Add specific status colors based on estimate.reason */
/* Example - adjust based on actual statuses */
.status-badge--sent { @apply bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300; }
.status-badge--accepted { @apply bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300; }
.status-badge--rejected { @apply bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300; }
.status-badge--draft { @apply bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300; }
.status-badge--default { @apply bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300; }


.modal-content-modern {
 @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full p-6 sm:p-8;
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

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* Ensure date/time inputs are stylable */
input[type="datetime-local"] {
 @apply appearance-none;
}
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
 @apply filter dark:invert opacity-50 cursor-pointer;
}

</style>
