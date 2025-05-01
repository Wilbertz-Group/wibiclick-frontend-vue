// wibiclick-frontend-vue/src/views/Pages/Pages.vue
<script setup>
  // import Header from "@/components/Header.vue"; // Removed old header
  import PageInteractionsTrendChart from "@/components/Pages/PageInteractionsTrendChart.vue";
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed } from "vue"; // Added computed
  import moment from 'moment'
  import axios from "axios";
  import _ from 'lodash';
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Added loader
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import {
    faSun, faMoon, faSync, faFileAlt, faSearch, // Added icons
    faChevronLeft, faChevronRight // Added pagination icons
  } from '@fortawesome/free-solid-svg-icons'

  // Removed AG Grid imports
  // import { AgGridVue } from "ag-grid-vue3";
  // import "ag-grid-community/styles/ag-grid.css";
  // import "ag-grid-community/styles/ag-theme-alpine.css";

  library.add(
    faSun, faMoon, faSync, faFileAlt, faSearch,
    faChevronLeft, faChevronRight
  )

  const userStore = useUserStore()
  const paginationPageSize = ref(10) // Adjusted page size
  const toast = useToast();
  const loading = ref(false)
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Added dark mode state
  const currentPage = ref(1) // Added pagination state
  const options = ref() // Keep chart options
  const series = ref()

  options.value = {
    chart: {
      height: 350,
      type: 'bar'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      labels: {
      datetimeUTC: false
    },
      categories: []
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      },
    },
  },

  series.value = [{
      name: 'pages',
      data: []
  }]

  // Removed unused groups variable

  // Removed AG Grid specific variables and functions
  // const gridApi = ref(null);
  // const onGridReady = (params) => { ... };
  const pages = ref([]); // Use a simple ref for page data

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
    // Add other filters if needed
  });

  // Add computed properties for filtering and pagination
  const filteredPages = computed(() => {
    return pages.value.filter(page => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !searchLower ||
                           (page.url?.toLowerCase().includes(searchLower));
      // Add other filter conditions here
      return matchesSearch;
    });
  });

  const totalPagesCount = computed(() => filteredPages.value.length); // Renamed to avoid conflict
  const totalPaginationPages = computed(() => Math.ceil(totalPagesCount.value / paginationPageSize.value)); // Renamed
  const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
  const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalPagesCount.value));

  const paginatedPages = computed(() => {
    return filteredPages.value.slice(startIndex.value, endIndex.value);
  });

  // Add pagination functions
  const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
  }
  const nextPage = () => {
    if (currentPage.value < totalPaginationPages.value) currentPage.value++;
  }

  // Add clearFilters function
  const clearFilters = () => {
    filters.search = '';
    // Reset other filters
  }

  async function fetchPages() {
      try {
        loading.value = true;
        const websiteId = userStore.currentWebsite;
        const response = await axios.get(`/api/pages?websiteId=${encodeURIComponent(websiteId)}`);
  
        // Support both array and { pages: array } response
        let pageList = Array.isArray(response.data)
          ? response.data
          : response.data.pages || [];
  
        pages.value = pageList; // Assign to the new ref
  
        let pagess = [];
  
        for (const c of pageList) {
          pagess.push({
            x: c.updatedAt,
            y: 1,
          });
        }
  
        const data = _.sortBy(pagess, 'x')
  
        // Define grouping function directly here
        const byDay = (item) => moment(item.x).format('MMM DD YYYY');
        const grouped = _.groupBy(data, byDay); // Use the locally defined function
        const seriesData = Object.values(grouped).map( a => a.length )
        const optionsData = Object.keys(grouped)
            
        options.value = {
            chart: {
              height: 350,
              type: 'bar',
              toolbar: {
                autoSelected: "pan",
                show: false
              }
            },
            dataLabels: {
              enabled: false
            },
            stroke: {
              curve: 'smooth'
            },
            xaxis: {
              type: 'datetime',
              labels: {
                datetimeUTC: false
              },
              categories: optionsData,
              labels: {
                style: {
                  colors: '#FFFFFF'
                }
              }
            },
            yaxis: {
              min: 0,
              tickAmount: 4,
              labels: {
                style: {
                  colors: '#FFFFFF'
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
              borderColor: "#fff",
              strokeDashArray: 2,
              clipMarkers: false,
              yaxis: {
                lines: {
                  show: true
                }
              }
            },
            markers: {
              size: 5,
              colors: ["#ffffff"],
              strokeColor: "#00BAEC",
              strokeWidth: 3
            },
            tooltip: {
              theme: "dark",
              x: {
                format: 'dd MMM yyyy'
              },
            },
        }
        series.value = [{
          name: 'pages',
          data: seriesData
        }]
  
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        toast.error("Error getting pages data")
      }
    }

  // Add dark mode toggle function
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value);
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    // Update chart theme - trigger refetch which rebuilds options
    if (userStore.currentWebsite) {
       fetchPages(); // Re-fetch data to apply new theme options to chart
    }
  };

  onMounted(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value); // Apply on initial load
    if(userStore.currentWebsite){
      fetchPages(); // Fetch initial data if website is selected
    }
  });

  watchEffect(() => {
    // This effect now primarily handles fetching data when the website changes
    // Dark mode updates trigger fetchPages via toggleDarkMode function
    if(userStore.currentWebsite){
      fetchPages(); // Refetch when website changes
    } else {
      pages.value = []; // Clear data if no website selected
      // Clear chart data too
      series.value = [{ name: 'Page Interactions', data: [] }];
      // Reset options but keep basic structure
      options.value = {
          chart: { height: 350, type: 'bar', toolbar: { show: false } },
          theme: { mode: isDarkMode.value ? 'dark' : 'light' },
          xaxis: { categories: [] },
          // Add other necessary base options if needed
      };
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
         <font-awesome-icon icon="file-alt" class="mr-3 text-indigo-500 dark:text-indigo-400" /> Website Pages
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <!-- Add Website Selector if needed -->
         <button @click="fetchPages" class="btn-icon-modern" title="Reload Pages" :disabled="!userStore.currentWebsite || loading">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
         </button>
         <!-- Add Page Button (Placeholder) -->
         <!-- <button @click="openAddPageModal" class="btn-primary-modern">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Page
         </button> -->
       </div>
     </header>

     <!-- Filter Section -->
     <section v-if="userStore.currentWebsite" class="mb-10 p-5 sm:p-6 card-modern">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4 items-end">
           <!-- Search Input -->
           <div class="relative sm:col-span-2 lg:col-span-1">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input v-model="filters.search" placeholder="Search URL..." class="input-modern pl-10 pr-3" /> <!-- Adjusted padding -->
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

     <!-- Main Content Area -->
     <div v-if="!userStore.currentWebsite" class="card-modern p-10 text-center text-gray-500 dark:text-gray-400">
       Please select a website from the main navigation first.
     </div>
     <div v-else class="grid grid-cols-1 gap-10">

       <!-- Page List Section -->
       <section>
          <!-- Loading Skeleton -->
          <div v-if="loading" class="animate-pulse">
             <!-- Desktop Skeleton -->
             <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                <table class="min-w-full">
                  <thead class="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></th>
                      <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                      <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                      <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                      <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="n in 5" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    </tr>
                  </tbody>
                </table>
             </div>
             <!-- Mobile Skeleton -->
             <div class="md:hidden space-y-4">
                <div v-for="n in 5" :key="`skel-mob-${n}`" class="card-modern p-4 animate-pulse">
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-3"></div>
                   <div class="flex justify-between text-xs mb-2">
                     <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                     <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                     <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                   </div>
                   <div class="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
             </div>
          </div>

          <!-- Page Table (Desktop) -->
          <div v-if="!loading && paginatedPages.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
              <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
                 <thead class="bg-gray-50 dark:bg-gray-900/30">
                    <tr>
                       <th scope="col" class="th-modern">URL</th>
                       <th scope="col" class="th-modern text-center">Visitors</th>
                       <th scope="col" class="th-modern text-center">Views</th>
                       <th scope="col" class="th-modern text-center">Clicks</th>
                       <th scope="col" class="th-modern">Last Updated</th>
                    </tr>
                 </thead>
                 <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                    <tr v-for="page in paginatedPages" :key="page.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                       <td class="td-modern font-medium text-gray-900 dark:text-white truncate max-w-lg">
                         <a :href="page.url" target="_blank" rel="noopener noreferrer" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline" :title="page.url">
                           {{ page.url }}
                         </a>
                       </td>
                       <td class="td-modern text-gray-500 dark:text-gray-400 text-center">{{ page.visitors ?? 0 }}</td>
                       <td class="td-modern text-gray-500 dark:text-gray-400 text-center">{{ page.views ?? 0 }}</td>
                       <td class="td-modern text-gray-500 dark:text-gray-400 text-center">{{ page.clicks ?? 0 }}</td>
                       <td class="td-modern text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ dateFormatter(page.updatedAt) }}</td>
                    </tr>
                 </tbody>
              </table>
          </div>

          <!-- Page Cards (Mobile) -->
          <div class="md:hidden space-y-4">
             <div v-if="!loading && paginatedPages.length > 0" v-for="page in paginatedPages" :key="page.id" class="card-modern p-4">
                <a :href="page.url" target="_blank" rel="noopener noreferrer" class="block text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline" :title="page.url">
                  {{ page.url }}
                </a>
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Visitors: <span class="font-medium text-gray-700 dark:text-gray-300">{{ page.visitors ?? 0 }}</span></span>
                  <span>Views: <span class="font-medium text-gray-700 dark:text-gray-300">{{ page.views ?? 0 }}</span></span>
                  <span>Clicks: <span class="font-medium text-gray-700 dark:text-gray-300">{{ page.clicks ?? 0 }}</span></span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Last Updated: {{ dateFormatter(page.updatedAt) }}</p>
             </div>
          </div>

          <!-- Pagination -->
          <nav v-if="!loading && totalPaginationPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
             <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalPagesCount }}</span> results
             </p>
             <div class="flex space-x-1">
                <button :disabled="currentPage === 1" @click="prevPage" class="btn-pagination-modern">
                   <font-awesome-icon icon="chevron-left" class="h-3 w-3 mr-1" /> Previous
                </button>
                <button :disabled="currentPage === totalPaginationPages" @click="nextPage" class="btn-pagination-modern">
                   Next <font-awesome-icon icon="chevron-right" class="h-3 w-3 ml-1" />
                </button>
             </div>
          </nav>

          <!-- No Results Message -->
          <div v-if="!loading && paginatedPages.length === 0" class="text-center py-16 text-gray-500">
             <font-awesome-icon icon="file-alt" class="mx-auto h-12 w-12 text-gray-400" />
             <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pages found</h3>
             <p class="mt-1 text-sm text-gray-500">No page data available for the selected website or filters.</p>
          </div>

       </section>

       <!-- Chart Section -->
       <section v-if="!loading && pages.length > 0" class="mt-10 card-modern p-5 sm:p-6">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Page Interactions Trend</h3>
          <PageInteractionsTrendChart
            :rawData="pages"
            :loading="loading"
            :isDarkMode="isDarkMode"
          />
       </section>

     </div> <!-- End grid -->

   </div> <!-- End container -->

   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>

 </div> <!-- End main div -->
</template>

<style scoped>
/* Import or define modern styles */
.input-modern {
 @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
 @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
 @apply transition duration-150 ease-in-out;
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
/* Custom scrollbar styles */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
</style>
