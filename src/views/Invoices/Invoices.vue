<script setup>
  import axios from "axios";
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed } from "vue"; // Added computed
  import moment from 'moment'
  // import _ from 'lodash'; // Removed lodash, not needed for basic filtering
  import { useRouter } from "vue-router"; // Keep useRouter if needed elsewhere, but not for modal nav
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Keep for loading state
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import {
    faSun, faMoon, faSync, faPlus, faEdit, faEye, faFileInvoice, faSearch, // Changed icon to faFileInvoice
    faChevronLeft, faChevronRight // Added pagination icons
  } from '@fortawesome/free-solid-svg-icons'

  // Import the Invoice Form Modal
  import InvoiceFormModal from '@/components/invoices/InvoiceFormModal.vue';
  import InvoicesTrendChart from '@/components/invoices/InvoicesTrendChart.vue';
  import { useThemeStore } from '@/stores/theme';

  library.add(
    faSun, faMoon, faSync, faPlus, faEdit, faEye, faFileInvoice, faSearch,
    faChevronLeft, faChevronRight
  )

  const userStore = useUserStore()
  const toast = useToast();
  const loading = ref(false);
  // Removed local isDarkMode state - using global theme store now
  const themeStore = useThemeStore();
  const router = useRouter(); // Keep for potential other uses (e.g., customer link)
  const invoices = ref([]); // Renamed from rowData/invoicesApi
  const currentPage = ref(1); // Added pagination state
  const paginationPageSize = ref(10); // Standardized page size
  const technicians = ref([]); // Added technicians ref (assuming needed by modal)
  const availableStatuses = ref([]); // New ref for actual statuses found in data
  const allCustomers = ref([]); // Added state to hold customers for modal dropdown

  // --- Modal State ---
  const showInvoiceModal = ref(false);
  const selectedInvoice = ref(null); // Holds data for editing/viewing
  const modalCustomerJobs = ref([]); // State for jobs specific to the customer in the modal
  const isFetchingModalData = ref(false); // Loading state for modal-specific data (like jobs)

  // Add filters reactive object
  const filters = reactive({
    search: '',
    status: '', // Add status filter
    // Add other filters if needed (e.g., date range, technician)
  });

  async function fetchInvoices() {
    if (!userStore.currentWebsite) return; // Prevent fetch without website ID
    try {
      loading.value = true;
      const response = await axios.get(
        `invoices?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      invoices.value = response.data.invoices || []; // Assign to the new ref, ensure it's an array

      // Extract unique statuses from the fetched invoices (using 'reason' field based on original code)
      const uniqueStatuses = [...new Set(invoices.value.map(inv => inv.reason).filter(Boolean))];
      availableStatuses.value = uniqueStatuses.sort();

      loading.value = false;
    } catch (error) {
      console.error("Error getting invoices data:", error); // Use console.error
      loading.value = false;
      toast.error("Error getting invoices data");
    }
  }

  // --- Fetch Technicians (Needed for Modal) ---
  async function fetchTechnicians() {
    if (!userStore.currentWebsite) return;
    try {
      const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
      technicians.value = response.data.employees || [];
    } catch (error) {
      console.error('Error fetching technicians:', error);
      // Optional: toast.error('Could not load technicians');
    }
  }

  // --- Fetch Customers (Needed for Modal 'Add' context) ---
  async function fetchCustomers() {
      if (!userStore.currentWebsite) return;
      try {
          const response = await axios.get(`customers?id=${userStore.currentWebsite}`);
          allCustomers.value = response.data.customers || [];
      } catch (error) {
          console.error('Error fetching customers:', error);
          toast.error('Could not load customer list for modal.');
      }
  }

  // --- Fetch Customer Jobs for Modal ---
  async function fetchJobsForModal(customerId) {
    if (!customerId) {
      modalCustomerJobs.value = [];
      return;
    }
    isFetchingModalData.value = true;
    modalCustomerJobs.value = []; // Clear previous jobs
    try {
      // Use the customer endpoint which includes jobs
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

      // Set default jobId if invoice doesn't have one and jobs exist
      // Ensure selectedInvoice is accessed safely as it might change
      if (selectedInvoice.value && !selectedInvoice.value.jobId && sortedJobs.length > 0) {
        selectedInvoice.value.jobId = sortedJobs[0].id; // Default to most recent job
      }

    } catch (error) {
      console.error("Error fetching customer jobs for modal:", error);
      toast.error("Could not load associated jobs for the modal.");
      modalCustomerJobs.value = []; // Ensure it's empty on error
    } finally {
      isFetchingModalData.value = false;
    }
  }


  // Add computed properties for filtering and pagination
  const filteredInvoices = computed(() => {
    // Ensure invoices.value is an array before filtering
    if (!Array.isArray(invoices.value)) {
        return [];
    }
    return invoices.value.filter(inv => {
      const searchLower = filters.search.toLowerCase();
      // Basic search matching number, customer name, or employee name
      const matchesSearch = !searchLower ||
                           (inv.number?.toLowerCase().includes(searchLower)) ||
                           (inv.customer?.name?.toLowerCase().includes(searchLower)) ||
                           (inv.employee?.firstName?.toLowerCase().includes(searchLower)) ||
                           (inv.employee?.lastName?.toLowerCase().includes(searchLower));

      const matchesStatus = !filters.status || inv.reason === filters.status; // Filter by 'reason' field

      return matchesSearch && matchesStatus;
    });
  });

  const totalInvoices = computed(() => filteredInvoices.value.length);
  const totalPages = computed(() => Math.ceil(totalInvoices.value / paginationPageSize.value));
  const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
  const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalInvoices.value));

  const paginatedInvoices = computed(() => {
    return filteredInvoices.value.slice(startIndex.value, endIndex.value);
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
    // Reset other filters if added
    currentPage.value = 1; // Reset to first page on clear
  }

  // Updated dateFormatter (simplified from Estimates.vue)
  const dateFormatter = (dateString) => {
    if (!dateString) return '-';
    const dt = moment(dateString); // Assuming dateString is ISO or parsable by moment
    // Use local time for display formatting
    const localDt = dt.local();
    const now = moment(); // Local 'now'

    if (localDt.isSame(now, 'day')) {
        return localDt.format('h:mm A');
    } else if (localDt.isSame(now, 'year')) {
        return localDt.format('MMM DD, h:mm A');
    } else {
        return localDt.format('MMM DD YYYY, h:mm A');
    }
  }

  // --- Helper function for status badge styling ---
  const getInvoiceStatusClass = (status) => {
    const baseClasses = 'status-badge-modern '; // Keep space at the end
    const lowerStatus = status?.toLowerCase() || 'default';

    // Map invoice statuses (reason field) to style classes
    // Adjust these cases based on the actual values in invoice.reason
    switch (lowerStatus) {
      case 'sent':
        return baseClasses + 'status-badge--active'; // Blueish
      case 'paid':
        return baseClasses + 'status-badge--positive'; // Greenish
      case 'pending':
        return baseClasses + 'status-badge--attention'; // Yellowish
      case 'draft':
        return baseClasses + 'status-badge--default'; // Greyish
      case 'overdue': // Example
      case 'cancelled': // Example
        return baseClasses + 'status-badge--negative'; // Reddish
      // Add more cases as needed
      default:
        return baseClasses + 'status-badge--default'; // Default grey
    }
  };

  // Removed local toggleDarkMode function - using global theme store now

  // --- Modal Control Functions ---
  const openAddInvoiceModal = () => {
    selectedInvoice.value = null; // Clear selection for adding
    modalCustomerJobs.value = []; // Clear jobs for add mode initially
    showInvoiceModal.value = true;
  };

  const openEditViewInvoiceModal = (invoice) => {
    // 1. Format and set the selected invoice
    const formattedInvoice = {
      ...invoice,
      // Format dates if the modal expects specific formats (e.g., YYYY-MM-DDTHH:mm for datetime-local)
      issuedAt: invoice.issuedAt ? moment(invoice.issuedAt).format('YYYY-MM-DDTHH:mm') : '',
      dueDate: invoice.dueDate ? moment(invoice.dueDate).format('YYYY-MM-DD') : '', // Example for date input
      customer: invoice.customer || {} // Ensure customer object exists
    };
    selectedInvoice.value = formattedInvoice;

    // 2. Open the modal immediately
    showInvoiceModal.value = true;

    // 3. Trigger async job fetching for the customer (don't await here)
    fetchJobsForModal(selectedInvoice.value.customer?.id);
  };

  // Handle modal save event
  const handleInvoiceSaved = () => {
    // Modal closing is handled by v-model
    fetchInvoices(); // Refresh the list
  };


  // --- Lifecycle Hooks ---
  onMounted(() => {
    // document.documentElement.classList.toggle('dark', isDarkMode.value); // Removed local dark mode application
    if(userStore.currentWebsite){
      fetchInvoices();
      fetchTechnicians(); // Fetch technicians on mount
      fetchCustomers(); // Fetch customers for modal context
    }
  });

  watchEffect(() => {
    // Reset page and fetch data when website changes
    if(userStore.currentWebsite){
        currentPage.value = 1; // Reset pagination
        fetchInvoices();
        fetchTechnicians();
        fetchCustomers();
    } else {
        // Clear data if no website is selected
        invoices.value = [];
        technicians.value = [];
        availableStatuses.value = [];
        allCustomers.value = [];
    }
  });

</script>

<template>
 <!-- Main container with background and padding -->
 <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
   <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

     <!-- Header Section -->
     <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
       <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
         <font-awesome-icon icon="file-invoice" class="mr-3 text-indigo-500 dark:text-indigo-400" /> Manage Invoices
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <!-- Add Website Selector if needed (copy from Jobs.vue if required) -->
         <button @click="fetchInvoices" class="btn-icon-modern" title="Reload Invoices">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <!-- Removed local dark mode toggle button -->
         <!-- Changed router-link to button to trigger modal -->
         <button @click="openAddInvoiceModal" class="btn-primary-modern">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Invoice
         </button>
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

     <!-- Invoice List Section -->
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
           <div class="md:hidden space-y-4 mt-4">
             <div v-for="n in 3" :key="`skel-mob-${n}`" class="card-modern p-4 animate-pulse">
                <div class="flex justify-between items-start mb-3">
                  <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-2/5"></div>
                  <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-1/4"></div>
                </div>
                <div class="space-y-2 mb-3">
                  <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
                  <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                  <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-2">
                  <div class="h-7 bg-gray-300 dark:bg-gray-700 rounded w-14"></div>
                  <div class="h-7 bg-gray-300 dark:bg-gray-700 rounded w-14"></div>
                </div>
             </div>
           </div>
        </div>

        <!-- Invoice Table (Desktop) -->
        <div v-if="!loading && paginatedInvoices.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                     <th scope="col" class="th-modern">Invoice #</th>
                     <th scope="col" class="th-modern">Client</th>
                     <th scope="col" class="th-modern">Created At</th>
                     <th scope="col" class="th-modern">Amount</th>
                     <th scope="col" class="th-modern">Status</th>
                     <th scope="col" class="th-modern text-right">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="invoice in paginatedInvoices" :key="invoice.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                     <td class="td-modern font-medium text-gray-900 dark:text-white">#{{ invoice.number }}</td>
                     <td class="td-modern">
                        <router-link :to="{ path: '/contact', query: { customer_id: invoice.customer?.id } }" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                          {{ invoice.customer?.name || 'N/A' }}
                        </router-link>
                     </td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ dateFormatter(invoice.createdAt) }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400">R{{ invoice.sales }}</td> <!-- Assuming 'sales' holds the amount -->
                     <td class="td-modern">
                        <span :class="getInvoiceStatusClass(invoice.reason)" class="status-badge-modern">
                          {{ invoice.reason }}
                        </span>
                     </td>
                     <td class="td-modern text-right space-x-2 whitespace-nowrap">
                        <!-- Updated buttons to trigger modal -->
                        <button @click="openEditViewInvoiceModal(invoice)" class="btn-ghost-modern" title="Edit Invoice">
                          <font-awesome-icon icon="edit" /> Edit
                        </button>
                        <button @click="openEditViewInvoiceModal(invoice)" class="btn-ghost-modern" title="View Invoice">
                          <font-awesome-icon icon="eye" /> View
                        </button>
                     </td>
                  </tr>
               </tbody>
            </table>
        </div>

        <!-- Invoice Cards (Mobile) -->
        <div class="md:hidden space-y-4">
           <div v-if="!loading && paginatedInvoices.length > 0" v-for="invoice in paginatedInvoices" :key="invoice.id" class="card-modern p-4">
              <div class="flex justify-between items-start mb-3 gap-2">
                 <span class="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                    Invoice #{{ invoice.number }}
                 </span>
                 <span :class="getInvoiceStatusClass(invoice.reason)" class="status-badge-modern flex-shrink-0">
                    {{ invoice.reason }}
                 </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Client:
                <router-link :to="{ path: '/contact', query: { customer_id: invoice.customer?.id } }" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {{ invoice.customer?.name || 'N/A' }}
                </router-link>
              </p>
              <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Amount: R{{ invoice.sales }}</p>
                <p>Created: {{ dateFormatter(invoice.createdAt) }}</p>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-2">
                 <!-- Updated buttons to trigger modal -->
                 <button @click="openEditViewInvoiceModal(invoice)" class="btn-ghost-modern">Edit/View</button>
              </div>
           </div>
        </div>

        <!-- Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
           <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalInvoices }}</span> results
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
        <div v-if="!loading && paginatedInvoices.length === 0" class="text-center py-16 text-gray-500">
           <font-awesome-icon icon="file-invoice" class="mx-auto h-12 w-12 text-gray-400" />
           <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No invoices found</h3>
           <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria, or add a new invoice.</p>
        </div>

     </section>

    <section class="my-10">
      <InvoicesTrendChart
        :rawData="invoices"
        :loading="loading"
        :isDarkMode="themeStore.isDarkMode"
      />
    </section>

    </div> <!-- End container -->

    <!-- Loading Overlay (Optional, reuse from Estimates if desired) -->
   <div v-if="loading || isFetchingModalData" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>

   <!-- Add/Edit Invoice Modal -->
   <InvoiceFormModal
     v-model="showInvoiceModal"
     :invoice-data="selectedInvoice"
     :customer-data="selectedInvoice?.customer" 
     :all-customers="allCustomers" 
     @invoice-saved="handleInvoiceSaved"
     :technicians="technicians"
     :customer-jobs="modalCustomerJobs"
     :available-statuses="availableStatuses"
     :is-fetching-jobs="isFetchingModalData" 
     @fetch-jobs="fetchJobsForModal" 
   />

 </div> <!-- End main div -->
</template>

<style scoped>
/* Modern styles copied from Estimates.vue */
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

/* Status Badge Styles - Adapted for Invoices */
.status-badge-modern {
 @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap;
}
/* Define specific status colors based on invoice.reason */
.status-badge--positive { @apply bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300; } /* e.g., Paid */
.status-badge--active { @apply bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300; } /* e.g., Sent */
.status-badge--attention { @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300; } /* e.g., Pending */
.status-badge--negative { @apply bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300; } /* e.g., Overdue, Cancelled */
.status-badge--default { @apply bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300; } /* e.g., Draft */


/* Modal Styles (Keep for potential future modal) */
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

/* Scrollbar styles */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* Ensure date/time inputs are stylable */
input[type="datetime-local"],
input[type="date"] { /* Added date type */
 @apply appearance-none;
}
input[type="datetime-local"]::-webkit-calendar-picker-indicator,
input[type="date"]::-webkit-calendar-picker-indicator { /* Added date type */
 @apply filter dark:invert opacity-50 cursor-pointer;
}

</style>