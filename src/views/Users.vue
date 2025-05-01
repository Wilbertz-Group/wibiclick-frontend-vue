// wibiclick-frontend-vue/src/views/Users.vue
<script setup>
  import axios from "axios";
  // import Header from "@/components/Header.vue"; // Removed old header
  import { onMounted, ref, reactive, watchEffect, computed } from "vue"; // Added computed
  import moment from 'moment'
  import  useUserStore  from "@/stores/UserStore"
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Keep for loading state
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import {
    faSun, faMoon, faSync, faPlus, faEdit, faLink, faUnlink, faUsers, faSearch, // Added icons
    faChevronLeft, faChevronRight // Added pagination icons
  } from '@fortawesome/free-solid-svg-icons'

  // Removed AG Grid imports
  // import { AgGridVue } from "ag-grid-vue3";
  // import "ag-grid-community/styles/ag-grid.css";
  // import "ag-grid-community/styles/ag-theme-alpine.css";
  // import Edit from "@/components/Edit.vue"; // Removed old Edit component import

  library.add(
    faSun, faMoon, faSync, faPlus, faEdit, faLink, faUnlink, faUsers, faSearch,
    faChevronLeft, faChevronRight
  )

  const selectedUser = ref(null)
  const paginationPageSize = ref(10) // Adjusted page size
  const editModalOpen = ref(false) // Renamed modal state
  const websitesModalOpen = ref(false)
  const loading = ref(false);
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Added dark mode state
  const currentPage = ref(1) // Added pagination state
  const toast = useToast();
  const allWebsites = ref()
  const allUserWebsites = ref()

  const userStore = useUserStore()

  // Removed unused groups variable

  // Removed AG Grid specific variables and functions
  // const gridApi = ref(null);
  // const onGridReady = (params) => { ... };
  const users = ref([]); // Use a simple ref for user data

  // Keep dateFormatter, but adapt if needed for new display format
  const dateFormatter = (dateString) => {
    if (!dateString) return '-';
    const dt = moment(dateString); // Assuming dateString is ISO or parsable by moment
    return moment().isSame(dt, 'day') ? dt.format('h:mm A') : dt.format('MMM DD, YYYY h:mm A');
  }

  // Removed columnDefs and defaultColDef

  // Add filters reactive object
  const filters = reactive({
    search: '',
    // Add other filters if needed (e.g., role, status)
  });

  // Add computed properties for filtering and pagination
  const filteredUsers = computed(() => {
    return users.value.filter(user => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !searchLower ||
                           (user.firstName?.toLowerCase().includes(searchLower)) ||
                           (user.lastName?.toLowerCase().includes(searchLower)) ||
                           (user.email?.toLowerCase().includes(searchLower));
      // Add other filter conditions here
      return matchesSearch;
    });
  });

  const totalUsers = computed(() => filteredUsers.value.length);
  const totalPages = computed(() => Math.ceil(totalUsers.value / paginationPageSize.value));
  const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
  const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalUsers.value));

  const paginatedUsers = computed(() => {
    return filteredUsers.value.slice(startIndex.value, endIndex.value);
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

  async function update(credentials) {
    try {
      loading.value = true
      const { data } = await axios.post('update-user?id='+ userStore.currentWebsite, credentials);
      loading.value = false;
      toast.success(data);
      editModalOpen.value = false; // Use renamed state
      fetchUsers();
    } catch (error) {
      console.log(error)
      loading.value = false
    }
    loading.value = false;
  }

  // --- Modal Control Functions ---
  const openEditModal = (user) => {
    selectedUser.value = { ...user }; // Clone user data for editing
    editModalOpen.value = true;
  };

  const closeEditModal = () => {
    editModalOpen.value = false;
    selectedUser.value = null; // Clear selected user
  };

  const openWebsitesModal = async (user) => {
    selectedUser.value = { ...user }; // Store user for context
    await fetchUserWebsites(user.id);
    websitesModalOpen.value = true;
  };

  const closeWebsitesModal = () => {
    websitesModalOpen.value = false;
    selectedUser.value = null; // Clear selected user
    allUserWebsites.value = null; // Clear user websites
  };

  async function fetchWebsites() {
    try {
      loading.value = true
      const response = await axios.get('get-websites');
      allWebsites.value = response.data
      loading.value = false      
    } catch (error) {
      console.log(error)
      toast.error("Error getting websites")
      loading.value = false;
    }

    loading.value = false;
  }

  async function fetchUserWebsites(id) {
    try {
      loading.value = true
      const response = await axios.get('get-websites-for-user?id='+ id);
      allUserWebsites.value = response.data
      loading.value = false
    } catch (error) {
      console.log(error)
      toast.error("Error getting user websites")
      loading.value = false;
    }

    loading.value = false;
  }

  async function fetchUsers() {
    try {
      loading.value = true;
      const response = await axios.get(
        `users?id=${userStore.currentWebsite}&limit=100&offset=0`
      );
users.value = response.data.users; // Assign to the new ref
      // Removed assignment to rowData as it's no longer used
      loading.value = false;
      fetchWebsites()
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting jobs data")
    }

    loading.value = false;
  }

  async function connectUserToWebsite(userId, websiteId) {
    try {
      loading.value = true
      const { data } = await axios.post('connect-user-to-website', { userId, websiteId });
      loading.value = false
      toast.success("User connected to the website.")
      websitesModalOpen.value = !websitesModalOpen.value
      fetchUsers()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
    loading.value = false;
  }

  async function disconnectUserFromWebsite(userId, websiteId) {
    try {
      loading.value = true
      const { data } = await axios.post('disconnect-user-from-website', { userId, websiteId });
      loading.value = false
      toast.success("User disconnected from the website.")
      websitesModalOpen.value = !websitesModalOpen.value
      fetchUsers()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
    loading.value = false;
  }

  function objectExistsById(id) {
    return allUserWebsites.value ? allUserWebsites.value.some(obj => obj.value === id) : false;
  }


  // Add dark mode toggle function
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value);
    document.documentElement.classList.toggle('dark', isDarkMode.value);
  };

  onMounted(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value); // Apply on initial load
    fetchUsers();
  });

  // Watch dark mode changes (e.g., for chart updates if added later)
  watchEffect(() => {
    // This effect runs initially and whenever isDarkMode changes
    // Can be used to update chart colors etc. if charts are added
  });

  // Removed old watchEffect

</script>

<template>
 <!-- Main container with background and padding -->
 <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
   <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

     <!-- Header Section -->
     <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
       <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
         <font-awesome-icon icon="users" class="mr-3 text-indigo-500 dark:text-indigo-400" /> Manage Users
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <!-- Add Website Selector if needed, similar to Jobs.vue -->
         <button @click="fetchUsers" class="btn-icon-modern" title="Reload Users">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
         </button>
         <!-- Add User Button (Placeholder - implement functionality if needed) -->
         <!-- <button @click="openAddUserModal" class="btn-primary-modern">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add User
         </button> -->
       </div>
     </header>

     <!-- Filter Section -->
     <section class="mb-10 p-5 sm:p-6 card-modern">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4 items-end">
           <!-- Search Input -->
           <div class="relative sm:col-span-2 lg:col-span-1">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input v-model="filters.search" placeholder="Search name or email..." class="input-modern pl-10 pr-3" /> <!-- Adjusted padding -->
           </div>
           <!-- Add other filters like Role if applicable -->
           <!-- <select v-model="filters.role" class="input-modern input-modern--select">
             <option value="">All Roles</option>
             <option value="admin">Admin</option>
             <option value="user">User</option>
           </select> -->

           <!-- Filter Actions -->
           <div class="flex items-center justify-end space-x-2 mt-2 sm:mt-0 lg:col-start-3">
              <button @click="clearFilters" class="btn-secondary-modern text-xs sm:text-sm whitespace-nowrap">
                 Clear Filters
              </button>
           </div>
        </div>
     </section>

     <!-- User List Section -->
     <section>
        <!-- Loading Skeleton -->
        <div v-if="loading" class="animate-pulse">
           <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
              <table class="min-w-full">
                <thead class="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in 5" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
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
           <!-- Add Mobile Skeleton if needed -->
        </div>

        <!-- User Table (Desktop) -->
        <div v-if="!loading && paginatedUsers.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                     <th scope="col" class="th-modern">Name</th>
                     <th scope="col" class="th-modern">Email</th>
                     <th scope="col" class="th-modern">Websites</th>
                     <th scope="col" class="th-modern">Country</th>
                     <th scope="col" class="th-modern">Created At</th>
                     <th scope="col" class="th-modern text-right">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                     <td class="td-modern font-medium text-gray-900 dark:text-white">{{ user.firstName }} {{ user.lastName }}</td>
                     <td class="td-modern text-gray-600 dark:text-gray-400">{{ user.email }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400">{{ user.websites }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400">{{ user.country }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ dateFormatter(user.createdAt) }}</td>
                     <td class="td-modern text-right space-x-2 whitespace-nowrap">
                        <button @click="openEditModal(user)" class="btn-ghost-modern" title="Edit User">
                          <font-awesome-icon icon="edit" /> Edit
                        </button>
                        <button @click="openWebsitesModal(user)" class="btn-ghost-modern" title="Manage Website Connections">
                          <font-awesome-icon icon="link" /> Connect
                        </button>
                     </td>
                  </tr>
               </tbody>
            </table>
        </div>

        <!-- User Cards (Mobile) - Placeholder -->
        <div class="md:hidden space-y-4">
           <div v-if="!loading && paginatedUsers.length > 0" v-for="user in paginatedUsers" :key="user.id" class="card-modern p-4">
              <div class="flex justify-between items-start mb-3 gap-2">
                 <span class="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                    {{ user.firstName }} {{ user.lastName }}
                 </span>
                 <!-- Add Role or Status Badge if applicable -->
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ user.email }}</p>
              <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Websites: {{ user.websites }}</p>
                <p>Country: {{ user.country }}</p>
                <p>Created: {{ dateFormatter(user.createdAt) }}</p>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-2">
                 <button @click="openEditModal(user)" class="btn-ghost-modern">Edit</button>
                 <button @click="openWebsitesModal(user)" class="btn-ghost-modern">Connect</button>
              </div>
           </div>
        </div>

        <!-- Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
           <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalUsers }}</span> results
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
        <div v-if="!loading && paginatedUsers.length === 0" class="text-center py-16 text-gray-500">
           <font-awesome-icon icon="users" class="mx-auto h-12 w-12 text-gray-400" />
           <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
           <p class="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
        </div>

     </section>

   </div> <!-- End container -->

   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>

   <!-- Edit User Modal -->
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
                 Update User Details
              </h3>
              <!-- Standard HTML form replacing FormKit -->
              <form v-if="selectedUser" @submit.prevent="update(selectedUser)" class="space-y-4">
                 <input type="hidden" name="id" :value="selectedUser.id"> <!-- Include ID for update -->
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label for="edit-firstName" class="label-modern">First Name</label>
                     <input type="text" id="edit-firstName" v-model="selectedUser.firstName" name="firstName" placeholder="Jane" class="input-modern" />
                   </div>
                   <div>
                     <label for="edit-lastName" class="label-modern">Last Name</label>
                     <input type="text" id="edit-lastName" v-model="selectedUser.lastName" name="lastName" placeholder="Doe" class="input-modern" />
                   </div>
                   <div>
                     <label for="edit-email" class="label-modern">Email</label>
                     <input type="email" id="edit-email" v-model="selectedUser.email" name="email" placeholder="jane@company.com" class="input-modern" />
                   </div>
                   <div>
                     <label for="edit-phone" class="label-modern">Phone</label>
                     <input type="tel" id="edit-phone" v-model="selectedUser.phone" name="phone" placeholder="0210002314" class="input-modern" />
                   </div>
                   <div>
                     <label for="edit-country" class="label-modern">Country</label>
                     <input type="text" id="edit-country" v-model="selectedUser.country" name="country" placeholder="Country" class="input-modern" />
                   </div>
                   <div class="flex items-center pt-5"> <!-- Adjusted alignment -->
                     <input type="checkbox" id="edit-lifetime" v-model="selectedUser.lifetime" name="lifetime" class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600">
                     <label for="edit-lifetime" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Lifetime User</label>
                   </div>
                 </div>

                 <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                       {{ loading ? 'Updating...' : 'Update User' }}
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

   <!-- Connect Websites Modal -->
   <transition name="modal-fade">
      <div v-if="websitesModalOpen" class="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="websites-modal-title" role="dialog" aria-modal="true">
         <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
           <!-- Backdrop -->
           <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeWebsitesModal"></div>
           <!-- Modal positioning -->
           <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
           <!-- Modal panel -->
           <div class="modal-content-modern max-w-4xl"> <!-- Adjusted max-width -->
              <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="websites-modal-title">
                 Connect/Disconnect Websites for {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
              </h3>
              <div v-if="loading && !allWebsites" class="text-center p-6"> <!-- Loading state for websites -->
                 <p class="text-gray-500 dark:text-gray-400">Loading websites...</p>
              </div>
              <div v-else class="max-h-[60vh] overflow-y-auto pr-2"> <!-- Scrollable content -->
                <ul class="list-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <li v-for="website in allWebsites" :key="website.value" class="mb-1 p-3 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 flex flex-col justify-between items-center text-center">
                    <span class="text-sm font-medium mb-2 break-words w-full" :title="website.label">
                      {{ website.label.length > 30 ? website.label.slice(0, 30) + '...' : website.label }}
                    </span>
                    <div class="mt-auto"> <!-- Push button to bottom -->
                      <button
                        v-if="objectExistsById(website.value)"
                        @click="disconnectUserFromWebsite(selectedUser.id, website.value)"
                        class="btn-secondary-modern !bg-red-100 !text-red-700 dark:!bg-red-800/50 dark:!text-red-300 hover:!bg-red-200 dark:hover:!bg-red-700/70 text-xs py-1 px-2"
                        :disabled="loading"
                      >
                        <font-awesome-icon icon="unlink" class="mr-1"/> Disconnect
                      </button>
                      <button
                        v-else-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'"
                        @click="connectUserToWebsite(selectedUser.id, website.value)"
                        class="btn-secondary-modern !bg-green-100 !text-green-700 dark:!bg-green-800/50 dark:!text-green-300 hover:!bg-green-200 dark:hover:!bg-green-700/70 text-xs py-1 px-2"
                        :disabled="loading"
                      >
                        <font-awesome-icon icon="link" class="mr-1"/> Connect
                      </button>
                      <!-- Removed permission display -->
                      <!-- <div>{{ userStore.user.role }} {{ userStore.user.permission }}</div> -->
                    </div>
                  </li>
                </ul>
              </div>
              <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3">
                 <button @click="closeWebsitesModal" type="button" class="btn-secondary-modern w-full sm:w-auto">
                    Close
                 </button>
              </div>
           </div>
         </div>
      </div>
   </transition>

 </div> <!-- End main div -->
</template>

<style scoped>
/* Import modern styles used in Jobs.vue - Assuming these are globally available or defined in a main CSS file */
/* If not global, copy the necessary .input-modern, .btn-*, .card-modern, .label-modern etc. styles here or import them */

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
 @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm; /* Added backdrop-blur */
}

/* Table Styles */
.th-modern {
 @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
 @apply px-4 py-3 text-sm; /* Adjust padding as needed */
}

/* Modal Styles */
.modal-content-modern {
 @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full p-6 sm:p-8; /* Base styles */
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
