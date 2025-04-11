<script setup>
  import CustomerTrendChart from "@/components/Customers/CustomerTrendChart.vue";
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed, watch } from "vue"; // Added watch
  import moment from 'moment'
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Keep for loading state
  import axios from "axios";
  import _ from 'lodash'; // Keep lodash for chart data processing
  import { useRouter } from "vue-router";
  import { useToast } from 'vue-toast-notification';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import {
    faSun, faMoon, faSync, faPlus, faEdit, faUsers, faSearch, faExternalLinkAlt, // Added icons
    faChevronLeft, faChevronRight // Added pagination icons
  } from '@fortawesome/free-solid-svg-icons'

  // Removed AG Grid imports
  // import { AgGridVue } from "ag-grid-vue3";
  // import "ag-grid-community/styles/ag-grid.css";
  // import "ag-grid-community/styles/ag-theme-alpine.css";
  // import Edit from "@/components/Edit.vue";
  // import Hubspot from "@/components/Customers/Hubspot.vue";

  library.add(
    faSun, faMoon, faSync, faPlus, faEdit, faUsers, faSearch, faExternalLinkAlt,
    faChevronLeft, faChevronRight
  )

  const userStore = useUserStore()
  const selectedContact = ref(null)
  const toast = useToast();
  const loading = ref(false);
  const paginationPageSize = ref(10);
  const editModalOpen = ref(false); // Renamed modal state
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true'); // Added dark mode state
  const currentPage = ref(1); // Added pagination state
  const customers = ref([]); // Added state for customer list
  const router = useRouter()


  // const onGridReady = (params) => { ... };
  // const rowData = reactive({});

  // Keep dateFormatter, but adapt if needed for new display format
  const dateFormatter = (dateString) => {
    if (!dateString) return '-';
    const dt = moment(dateString); // Assuming dateString is ISO or parsable by moment
    return moment().isSame(dt, 'day') ? dt.format('h:mm A') : dt.format('MMM DD, YYYY h:mm A');
  }


  // Add filters reactive object
  const filters = reactive({
    search: '',
    // Add other filters if needed (e.g., channel, date range)
  });

  // Add computed properties for filtering and pagination
  const filteredCustomers = computed(() => {
    return customers.value.filter(customer => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !searchLower ||
                           (customer.name?.toLowerCase().includes(searchLower)) ||
                           (customer.phone?.toLowerCase().includes(searchLower)) ||
                           (customer.email?.toLowerCase().includes(searchLower)) ||
                           (customer.address?.toLowerCase().includes(searchLower)) ||
                           (customer.message?.toLowerCase().includes(searchLower));
      // Add other filter conditions here
      return matchesSearch;
    });
  });

  const totalCustomers = computed(() => filteredCustomers.value.length);
  const totalPages = computed(() => Math.ceil(totalCustomers.value / paginationPageSize.value));
  const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
  const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalCustomers.value));

  const paginatedCustomers = computed(() => {
    return filteredCustomers.value.slice(startIndex.value, endIndex.value);
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
    // Reset other filters
  }

  async function fetchContacts() {
    try {
      loading.value = true;
      const response = await axios.get(
        `customers?id=${userStore.currentWebsite}&limit=10000&offset=0`
      );

      customers.value = response.data.customers; // Assign to the new ref

      // Chart data processing moved to CustomerTrendChart
      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting jobs data")
    }
  }

  async function update(credentials) {
    try {
      loading.value = true
      const { data } = await axios.post('add-customer?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success(data.message)
      editModalOpen.value = false; // Use renamed state
      fetchContacts()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  // --- Modal Control Functions ---
  const openEditModal = (customer) => {
    selectedContact.value = { ...customer }; // Clone customer data for editing
    editModalOpen.value = true;
  };

  const closeEditModal = () => {
    editModalOpen.value = false;
    selectedContact.value = null; // Clear selected customer
  };

  // Add dark mode toggle function
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value);
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    // Update chart theme if needed
    // Chart theme update logic removed; handled by CustomerTrendChart  
  }

  onMounted(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value); // Apply on initial load
    if(userStore.currentWebsite){
      fetchContacts();
    }
  });

  watchEffect(() => {
    if(userStore.currentWebsite){
      currentPage.value = 1; // Reset page on website change
      fetchContacts();
    }
  });

</script>

<template>
 <!-- Main container with background and padding -->
 <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
   <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

     <!-- Header Section -->
     <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
       <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
         <font-awesome-icon icon="users" class="mr-3 text-indigo-500 dark:text-indigo-400" /> Manage Customers
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <!-- Add Website Selector if needed -->
         <button @click="fetchContacts" class="btn-icon-modern" title="Reload Customers">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
         </button>
         <router-link :to="{name: 'add-customer'}" class="btn-primary-modern">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Customer
         </router-link>
       </div>
     </header>

     <!-- Filter Section -->
     <section class="mb-10 p-5 sm:p-6 card-modern">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4 items-end">
           <!-- Search Input -->
           <div class="relative sm:col-span-2 lg:col-span-1">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input v-model="filters.search" placeholder="Search name, phone, email, address..." class="input-modern pl-11 pr-3" /> <!-- Increased left padding -->
           </div>
           <!-- Add other filters if needed -->

           <!-- Filter Actions -->
           <div class="flex items-center justify-end space-x-2 mt-2 sm:mt-0 lg:col-start-3">
              <button @click="clearFilters" class="btn-secondary-modern text-xs sm:text-sm whitespace-nowrap">
                 Clear Filters
              </button>
           </div>
        </div>
     </section>

     <!-- Customer List Section -->
     <section>
        <!-- Loading Skeleton -->
        <div v-if="loading" class="animate-pulse">
           <!-- Desktop Skeleton -->
           <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
              <table class="min-w-full">
                <thead class="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in 5" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></td>
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
           <!-- Mobile Skeleton -->
           <div class="md:hidden space-y-4">
              <div v-for="n in 5" :key="`skel-mob-${n}`" class="card-modern p-4 animate-pulse">
                 <div class="flex justify-between items-start mb-3">
                   <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/5"></div>
                 </div>
                 <div class="space-y-2">
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 pt-2"></div>
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                 </div>
                 <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                   <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                 </div>
              </div>
           </div>
        </div>

        <!-- Customer Table (Desktop) -->
        <div v-if="!loading && paginatedCustomers.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                     <th scope="col" class="th-modern">Name</th>
                     <th scope="col" class="th-modern">Phone</th>
                     <th scope="col" class="th-modern">Lead Source / Details</th>
                     <th scope="col" class="th-modern">Address</th>
                     <th scope="col" class="th-modern">Channel</th>
                     <th scope="col" class="th-modern">Created At</th>
                     <th scope="col" class="th-modern text-right">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="customer in paginatedCustomers" :key="customer.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                     <td class="td-modern">
                        <router-link :to="{ path: '/contact', query: { customer_id: customer.id } }" class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                           {{ customer.name }}
                        </router-link>
                     </td>
                     <td class="td-modern text-gray-600 dark:text-gray-400">{{ customer.phone }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="customer.message">{{ customer.message }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="customer.address">{{ customer.address }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400">{{ customer.channel }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ dateFormatter(customer.createdAt) }}</td>
                     <td class="td-modern text-right space-x-2 whitespace-nowrap">
                        <button @click="openEditModal(customer)" class="btn-ghost-modern" title="Edit Customer">
                          <font-awesome-icon icon="edit" /> Edit
                        </button>
                        <a v-if="customer.portal && customer.foreignID" :href="'https://app.hubspot.com/contacts/'+customer.portal+'/contact/'+customer.foreignID" target="_blank" class="btn-ghost-modern" title="View on HubSpot">
                          <font-awesome-icon icon="external-link-alt" /> HubSpot
                        </a>
                     </td>
                  </tr>
               </tbody>
            </table>
        </div>

        <!-- Customer Cards (Mobile) -->
        <div class="md:hidden space-y-4">
           <div v-if="!loading && paginatedCustomers.length > 0" v-for="customer in paginatedCustomers" :key="customer.id" class="card-modern p-4">
              <div class="flex justify-between items-start mb-3 gap-2">
                 <router-link :to="{ path: '/contact', query: { customer_id: customer.id } }" class="text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:underline leading-tight">
                    {{ customer.name }}
                 </router-link>
                 <a v-if="customer.portal && customer.foreignID" :href="'https://app.hubspot.com/contacts/'+customer.portal+'/contact/'+customer.foreignID" target="_blank" class="btn-icon-modern !w-6 !h-6" title="View on HubSpot">
                    <font-awesome-icon icon="external-link-alt" class="h-3 w-3" />
                 </a>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ customer.phone }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate" :title="customer.address">Address: {{ customer.address || 'N/A' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate" :title="customer.message">Details: {{ customer.message || 'N/A' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Created: {{ dateFormatter(customer.createdAt) }}</p>
              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-2">
                 <button @click="openEditModal(customer)" class="btn-ghost-modern">Edit</button>
              </div>
           </div>
        </div>

        <!-- Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
           <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalCustomers }}</span> results
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
        <div v-if="!loading && paginatedCustomers.length === 0" class="text-center py-16 text-gray-500">
           <font-awesome-icon icon="users" class="mx-auto h-12 w-12 text-gray-400" />
           <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No customers found</h3>
           <p class="mt-1 text-sm text-gray-500">Try adjusting your search criteria or add a new customer.</p>
        </div>

     </section>

     <!-- Chart Section -->
      <section class="mt-12 card-modern p-6">
         <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white">New Customer Trend</h3>
         <CustomerTrendChart
           :rawData="customers"
           :loading="loading"
           :isDarkMode="isDarkMode"
         />
      </section>

   </div> <!-- End container -->

   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>

   <!-- Edit Customer Modal -->
   <transition name="modal-fade">
      <div v-if="editModalOpen" class="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
         <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
           <!-- Backdrop -->
           <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeEditModal"></div>
           <!-- Modal positioning -->
           <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
           <!-- Modal panel -->
           <div class="modal-content-modern">
              <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
                 Update Customer Details
              </h3>
              <!-- Standard HTML form replacing FormKit -->
              <form v-if="selectedContact" @submit.prevent="update(selectedContact)" class="space-y-4">
                 <!-- Pass the whole object, backend expects { data: {...} } -->
                 <input type="hidden" name="id" :value="selectedContact.id"> <!-- Keep ID for update logic -->
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label for="modal-edit-name" class="label-modern">Full Name</label>
                     <input type="text" id="modal-edit-name" v-model="selectedContact.name" name="name" placeholder="Jane Doe" class="input-modern" />
                   </div>
                   <div>
                     <label for="modal-edit-channel" class="label-modern">Reply Preference</label>
                     <select id="modal-edit-channel" v-model="selectedContact.channel" name="Reply" class="input-modern input-modern--select">
                       <option>Reply me by Email</option>
                       <option>Send me a message on Whatsapp</option>
                       <option>Use any of the above</option>
                     </select>
                   </div>
                   <div>
                     <label for="modal-edit-email" class="label-modern">Email</label>
                     <input type="email" id="modal-edit-email" v-model="selectedContact.email" name="Email" placeholder="jane@company.com" class="input-modern" />
                   </div>
                   <div>
                     <label for="modal-edit-phone" class="label-modern">Phone</label>
                     <input type="tel" id="modal-edit-phone" v-model="selectedContact.phone" name="Phone" placeholder="0210002314" class="input-modern" />
                   </div>
                    <div>
                      <label for="modal-edit-address" class="label-modern">Address</label>
                      <input type="text" id="modal-edit-address" v-model="selectedContact.address" name="address" placeholder="123 Main St" class="input-modern" />
                    </div>
                   <div>
                     <label for="modal-edit-portal" class="label-modern">Portal ID</label>
                     <input type="text" id="modal-edit-portal" v-model="selectedContact.portal" name="portal" placeholder="HubSpot Portal ID" class="input-modern" />
                   </div>
                   <div class="sm:col-span-2"> <!-- Make foreignID span full width -->
                     <label for="modal-edit-foreignID" class="label-modern">HubSpot Contact ID</label>
                     <input type="text" id="modal-edit-foreignID" v-model="selectedContact.foreignID" name="foreignID" placeholder="HubSpot Contact ID" class="input-modern" />
                   </div>
                 </div>
                  <div class="sm:col-span-2"> <!-- Make message span full width -->
                    <label for="modal-edit-message" class="label-modern">Lead Source / Details</label>
                    <textarea id="modal-edit-message" v-model="selectedContact.message" name="Message" rows="3" placeholder="Details about the customer or lead source..." class="input-modern"></textarea>
                  </div>

                 <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                       {{ loading ? 'Updating...' : 'Update Customer' }}
                    </button>
                    <button @click="closeEditModal" type="button" class="btn-secondary-modern w-full sm:w-auto">
                       Cancel
                    </button>
                 </div>
              </form>
           </div>
         </div>
      </div>
   </transition>

 </div> <!-- End main div -->
</template>

<style scoped>
/* Import modern styles - Assuming these are globally available or defined in a main CSS file */

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
.btn-pagination-modern {
 @apply inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md;
 @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
 @apply transition-colors duration-150 ease-in-out;
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
 @apply px-4 py-3 text-sm;
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

/* Custom scrollbar styles (optional) */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

</style>
