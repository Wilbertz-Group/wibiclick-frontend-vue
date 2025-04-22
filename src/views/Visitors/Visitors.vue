<script setup>
  import VisitorTrendChart from "@/components/Visitors/VisitorTrendChart.vue";
  import VisitorProfile from "@/components/Visitors/VisitorProfile.vue"; // Import VisitorProfile component
  import UserJourneyGraph from "@/components/Visitors/UserJourneyGraph.vue"; // Import UserJourneyGraph component
  // import Header from "@/components/Header.vue"; // Removed old header
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed, watch } from "vue"; // Added computed, watch
  import moment from 'moment'
  import axios from "axios";
  import _ from 'lodash'; // Keep lodash for chart data processing
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Added ScaleLoader
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import {
    faSun, faMoon, faSync, faUsers, faSearch, // Added icons (using faUsers for visitors)
    faChevronLeft, faChevronRight // Added pagination icons
  } from '@fortawesome/free-solid-svg-icons'


  // Removed AG Grid imports
  // import { AgGridVue } from "ag-grid-vue3";
  // import "ag-grid-community/styles/ag-grid.css";
  // import "ag-grid-community/styles/ag-theme-alpine.css";

  const userStore = useUserStore()
  const paginationPageSize = ref(15) // Adjusted page size

  // const visitorsNode = ref(null) // Removed unused ref
  const toast = useToast();
  const loading = ref(false);
  const options = ref(); // Keep chart options
  const series = ref(); // Keep chart series
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true'); // Added dark mode state
  const currentPage = ref(1); // Added pagination state
  const visitors = ref([]); // Added state for visitor list
  const selectedVisitorId = ref(null); // Added state for selected visitor ID
  const selectedVisitorProfile = ref(null); // Added state for selected visitor profile
  const selectedVisitorJourney = ref(null); // Added state for selected visitor journey
  const showVisitorDetailsModal = ref(false); // Added state for modal visibility
  const combinedUserJourney = ref([]); // Added state for combined user journey

  library.add( // Added FontAwesome library setup
    faSun, faMoon, faSync, faUsers, faSearch,
    faChevronLeft, faChevronRight
  )

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
      name: 'visitors',
      data: []
  }]
 
  // Removed unused groups variable (Confirmed removal)
 
  // Removed AG Grid specific variables and functions
  // const gridApi = ref(null);
  // const onGridReady = (params) => { ... };
  // const rowData = reactive({});
 
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
    // Add other filters if needed (e.g., date range)
  });

   // Add computed properties for filtering and pagination
   const filteredVisitors = computed(() => {
     return visitors.value.filter(visitor => {
       const searchLower = filters.search.toLowerCase();
       const matchesSearch = !searchLower ||
                            (visitor.page?.url?.toLowerCase().includes(searchLower)); // Search by page URL
       // Add other filter conditions here
       return matchesSearch;
     });
   });

   const totalVisitors = computed(() => filteredVisitors.value.length);
   const totalPages = computed(() => Math.ceil(totalVisitors.value / paginationPageSize.value));
   const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
   const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalVisitors.value));

   const paginatedVisitors = computed(() => {
     return filteredVisitors.value.slice(startIndex.value, endIndex.value);
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
 
   // Function to fetch detailed visitor data
   async function fetchVisitorDetails(visitorId) {
     try {
       loading.value = true;
       const response = await axios.get(`/api/analytics/visitors/${visitorId}/history`);
       const data = response.data;

       // Calculate derived fields
       let firstSeen = null;
       let lastSeen = null;
       let totalEvents = 0;

       if (data.sessions && data.sessions.length > 0) {
         // Find the earliest startedAt for First Seen
         firstSeen = data.sessions.reduce((earliest, session) => {
           const sessionStartedAt = new Date(session.startedAt);
           return earliest === null || sessionStartedAt < earliest ? sessionStartedAt : earliest;
         }, null);

         // Find the latest lastActivityAt for Last Seen
         lastSeen = data.sessions.reduce((latest, session) => {
           const sessionLastActivityAt = new Date(session.lastActivityAt);
           return latest === null || sessionLastActivityAt > latest ? sessionLastActivityAt : latest;
         }, null);

         // Calculate total events
         totalEvents = data.sessions.reduce((sum, session) => sum + (session.events ? session.events.length : 0), 0);
       }

       selectedVisitorProfile.value = {
         visitorId: visitorId,
         firstSeen: firstSeen ? dateFormatter(firstSeen) : '-',
         lastSeen: lastSeen ? dateFormatter(lastSeen) : '-',
         totalSessions: data.sessions ? data.sessions.length : 0,
         totalEvents: totalEvents,
         sessions: data.sessions || [] // Store sessions for detailed display
       };

       // Extract and combine all events from all sessions
       let allEvents = [];
       if (data.sessions) {
         data.sessions.forEach(session => {
           if (session.events) {
             allEvents = allEvents.concat(session.events);
           }
         });
       }

       // Sort all events chronologically by timestamp
       combinedUserJourney.value = _.sortBy(allEvents, 'timestamp');

       selectedVisitorJourney.value = null; // No longer need a separate journey object here

       showVisitorDetailsModal.value = true; // Open the modal
       loading.value = false;
     } catch (error) {
       console.error("Error fetching visitor details:", error);
       loading.value = false;
       toast.error("Error fetching visitor details");
     }
   }

   // Function to close the visitor details modal
   const closeVisitorDetailsModal = () => {
     showVisitorDetailsModal.value = false;
     selectedVisitorId.value = null;
     selectedVisitorProfile.value = null;
     combinedUserJourney.value = []; // Clear combined journey on modal close
     // selectedVisitorJourney.value = null; // No longer needed
   };

   async function fetchVisitors() {
     try {
       loading.value = true;
       const response = await axios.get(
         `visitors?id=${userStore.currentWebsite}&limit=1500&offset=0` // Keep existing visitor list fetch
       );

      visitors.value = response.data.visitors; // Assign to the new ref

      let visitorss = [];

      for (const c of response.data.visitors) {
        visitorss.push({
          x: c.updatedAt,
          y: 1,
        });
      }

      const data = _.sortBy(visitorss, 'x')

      const currentGroup = 'byDay';
      // Grouping logic - ensure 'byDay' function is available or define inline
      const byDay = (item) => moment(item.x).format('MMM DD YYYY');
      const grouped = _.groupBy(data, byDay);
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
        name: 'visitors',
        data: seriesData
      }]

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting visitors data")
    }
  }

  // onMounted(() => {
  //   if(userStore.currentWebsite && userStore.user){
  //     fetchVisitors()  
  //   }
  // })

  // Add dark mode toggle function
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value);
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    // Update chart theme if needed
    updateChartTheme();
  };

  // Function to update chart theme based on dark mode (copied from Customers.vue)
  const updateChartTheme = () => {
    if (options.value) {
      const textColor = isDarkMode.value ? '#FFFFFF' : '#374151'; // Example colors
      const gridColor = isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      options.value = {
        ...options.value,
        chart: {
          ...options.value.chart,
          foreColor: textColor // Update base text color
        },
        xaxis: {
          ...options.value.xaxis,
          labels: {
            ...options.value.xaxis.labels,
            style: { colors: [textColor] } // Update x-axis label color
          },
          title: {
             style: { color: textColor } // Update x-axis title color if present
          }
        },
        yaxis: {
          ...options.value.yaxis,
          labels: {
            ...options.value.yaxis.labels,
            style: { colors: [textColor] } // Update y-axis label color
          },
           title: {
             style: { color: textColor } // Update y-axis title color if present
          }
        },
        grid: {
          ...options.value.grid,
          borderColor: gridColor // Update grid line color
        },
        tooltip: {
          ...options.value.tooltip,
          theme: isDarkMode.value ? 'dark' : 'light' // Update tooltip theme
        },
        // Update legend colors if needed
        legend: {
          ...options.value.legend,
          labels: { colors: textColor }
        }
      };
    }
  };

  onMounted(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value); // Apply on initial load
    if(userStore.currentWebsite){
      fetchVisitors();
    }
  });

  watchEffect(() => {
    if(userStore.currentWebsite){
      currentPage.value = 1; // Reset page on website change
      fetchVisitors();
    }
  });

  // Watch dark mode to update chart theme
  watch(isDarkMode, () => {
    updateChartTheme();
  });
</script>

<template>
 <!-- Main container with background and padding -->
 <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
   <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
     <!-- Header Section -->
     <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
       <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
         <font-awesome-icon icon="users" class="mr-3 text-indigo-500 dark:text-indigo-400" /> Website Visitors
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <!-- Add Website Selector if needed -->
         <button @click="fetchVisitors" class="btn-icon-modern" title="Reload Visitors">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
         </button>
         <!-- No "Add Visitor" button needed -->
       </div>
     </header>

     <!-- Filter Section -->
     <section class="mb-10 p-5 sm:p-6 card-modern">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4 items-end">
           <!-- Search Input -->
           <div class="relative sm:col-span-2 lg:col-span-1">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input v-model="filters.search" placeholder="Search page URL..." class="input-modern pl-10 pr-3" /> <!-- Adjusted padding -->
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

     <!-- Visitor List Section -->
     <section>
        <!-- Loading Skeleton -->
        <div v-if="loading" class="animate-pulse">
           <!-- Desktop Skeleton -->
           <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
              <table class="min-w-full">
                <thead class="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div></th>
                    <th class="th-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in 10" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></td>
                    <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></td>
                  </tr>
                </tbody>
              </table>
           </div>
           <!-- Mobile Skeleton -->
           <div class="md:hidden space-y-4">
              <div v-for="n in 5" :key="`skel-mob-${n}`" class="card-modern p-4 animate-pulse">
                 <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-3"></div>
                 <div class="space-y-2">
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                   <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 pt-2"></div>
                 </div>
              </div>
           </div>
        </div>

        <!-- Visitor Table (Desktop) -->
        <div v-if="!loading && paginatedVisitors.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                     <th scope="col" class="th-modern">Page URL</th>
                     <th scope="col" class="th-modern">Views</th>
                     <th scope="col" class="th-modern">Clicks</th>
                     <th scope="col" class="th-modern">Last Visit</th>
                  </tr>

               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="visitor in paginatedVisitors" :key="visitor.id"
                      class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                      @click="fetchVisitorDetails(visitor.id)"> <!-- Use visitor.id as ID -->
                     <td class="td-modern text-gray-600 dark:text-gray-400 max-w-xl truncate" :title="visitor.page?.url">
                       <!-- Keep the link for page URL if needed, or remove if clicking row shows profile -->
                        <a :href="visitor.page?.url" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400" @click.stop>
                          {{ visitor.page?.url }}
                        </a>
                     </td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 text-center">{{ visitor.views }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 text-center">{{ visitor.clicks }}</td>
                     <td class="td-modern text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ dateFormatter(visitor.updatedAt) }}</td>
                  </tr>
               </tbody>
            </table>
        </div>


        <!-- Visitor Cards (Mobile) -->
        <div class="md:hidden space-y-4">
           <div v-if="!loading && paginatedVisitors.length > 0" v-for="visitor in paginatedVisitors" :key="visitor.id"
                class="card-modern p-4 cursor-pointer"
                @click="fetchVisitorDetails(visitor.id)"> <!-- Use visitor.id as ID -->
              <a :href="visitor.page?.url" target="_blank" rel="noopener noreferrer" class="block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate mb-2" :title="visitor.page?.url" @click.stop>
                {{ visitor.page?.url }}
              </a>
              <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Views: <span class="font-medium text-gray-700 dark:text-gray-300">{{ visitor.views }}</span></p>
                <p>Clicks: <span class="font-medium text-gray-700 dark:text-gray-300">{{ visitor.clicks }}</span></p>
                <p>Last Visit: {{ dateFormatter(visitor.updatedAt) }}</p>
              </div>
           </div>
        </div>

        <!-- Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
           <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalVisitors }}</span> results
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
        <div v-if="!loading && paginatedVisitors.length === 0" class="text-center py-16 text-gray-500">
           <font-awesome-icon icon="users" class="mx-auto h-12 w-12 text-gray-400" /> <!-- Using users icon as placeholder -->
           <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No visitors found</h3>
           <p class="mt-1 text-sm text-gray-500">No visitor data recorded for the selected website yet.</p>
        </div>

     </section>

     <!-- Chart Section -->
      <section class="mt-12 card-modern p-6">
         <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Visitor Trend</h3>
         <div class="relative w-full min-h-[200px]">
           <VisitorTrendChart
             :rawData="visitors"
             :loading="loading"
             :isDarkMode="isDarkMode"
           />
         </div>
      </section>

   </div> <!-- End container -->

   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>


   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>

   <!-- Visitor Details Modal -->
   <transition name="modal-fade">
     <div v-if="showVisitorDetailsModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
       <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
         <!-- Background overlay -->
         <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeVisitorDetailsModal"></div>

         <!-- Modal content -->
         <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
         <div class="modal-content-modern">
           <div class="flex justify-between items-center mb-4">
             <h3 class="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">Visitor Details</h3>
             <button @click="closeVisitorDetailsModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
               <span class="sr-only">Close</span>
               <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           <div class="mt-2 space-y-6">
             <!-- Visitor Details Content -->
             <div v-if="selectedVisitorProfile" class="space-y-6">
               <!-- Visitor Profile -->
               <div>
                 <h4 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Visitor Profile</h4>
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                   <div>
                     <p class="font-medium text-gray-600 dark:text-gray-400">Visitor ID:</p>
                     <p class="break-all">{{ selectedVisitorProfile.visitorId }}</p>
                   </div>
                   <div>
                     <p class="font-medium text-gray-600 dark:text-gray-400">First Seen:</p>
                     <p>{{ selectedVisitorProfile.firstSeen }}</p>
                   </div>
                   <div>
                     <p class="font-medium text-gray-600 dark:text-gray-400">Last Seen:</p>
                     <p>{{ selectedVisitorProfile.lastSeen }}</p>
                   </div>
                   <div>
                     <p class="font-medium text-gray-600 dark:text-gray-400">Total Sessions:</p>
                     <p>{{ selectedVisitorProfile.totalSessions }}</p>
                   </div>
                   <div>
                     <p class="font-medium text-gray-600 dark:text-gray-400">Total Events:</p>
                     <p>{{ selectedVisitorProfile.totalEvents }}</p>
                   </div>
                 </div>
               </div>

               <!-- Recent Sessions -->
               <div v-if="selectedVisitorProfile.sessions && selectedVisitorProfile.sessions.length > 0">
                 <h4 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Recent Sessions</h4>
                 <div class="space-y-4">
                   <div v-for="session in selectedVisitorProfile.sessions" :key="session.id" class="card-modern p-4">
                     <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Session ID: <span class="break-all font-normal">{{ session.id }}</span></p>
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                       <p>Started At: <span class="font-medium">{{ dateFormatter(session.startedAt) }}</span></p>
                       <p>Last Activity At: <span class="font-medium">{{ dateFormatter(session.lastActivityAt) }}</span></p>
                       <p class="sm:col-span-2">Website: <a :href="session.website?.url" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ session.website?.url || 'N/A' }}</a></p>
                     </div>
                     <!-- Per-Session User Journey -->
                     <div v-if="session.events && session.events.length > 0">
                        <h5 class="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Session Journey</h5>
                        <div class="space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                          <div v-for="event in session.events" :key="event.id" class="relative">
                            <div class="absolute -left-3.5 top-1.5 w-3 h-3 bg-indigo-500 rounded-full ring-4 ring-white dark:ring-gray-800"></div>
                            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ event.eventType }}</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">{{ dateFormatter(event.timestamp) }}</p>
                            <p v-if="event.eventDetails?.pageUrl" class="text-xs text-gray-600 dark:text-gray-400 break-all">Page: <a :href="event.eventDetails.pageUrl" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ event.eventDetails.pageUrl }}</a></p>
                          </div>
                        </div>
                     </div>
                      <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No events recorded for this session.</div>
                   </div>
                 </div>
               </div>

               <!-- Combined User Journey -->
               <div v-if="combinedUserJourney && combinedUserJourney.length > 0">
                 <h4 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Combined User Journey</h4>
                  <div class="space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div v-for="event in combinedUserJourney" :key="event.id" class="relative">
                      <div class="absolute -left-3.5 top-1.5 w-3 h-3 bg-green-500 rounded-full ring-4 ring-white dark:ring-gray-800"></div> <!-- Using a different color for combined journey -->
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ event.eventType }}</p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">{{ dateFormatter(event.timestamp) }}</p>
                      <p v-if="event.eventDetails?.pageUrl" class="text-xs text-gray-600 dark:text-gray-400 break-all">Page: <a :href="event.eventDetails.pageUrl" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ event.eventDetails.pageUrl }}</a></p>
                    </div>
                  </div>
               </div>
                <div v-else class="text-center py-8 text-gray-500">
                   <p>No combined journey data available for this visitor.</p>
                </div>
             </div>
             <div v-else class="text-center py-8 text-gray-500">
                <p>No detailed information available for this visitor.</p>
             </div>
           </div>
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

/* Modal Styles (Keep for consistency if modals are added later) */
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
