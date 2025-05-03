<script setup>
  import VisitorTrendChart from "@/components/Visitors/VisitorTrendChart.vue";
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed, watch } from "vue";
  import moment from 'moment'
  import axios from "axios";
  import _ from 'lodash';
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { library } from '@fortawesome/fontawesome-svg-core'
  import {
    faSun, faMoon, faSync, faUsers, faSearch, faFilter,
    faChevronLeft, faChevronRight, faExternalLinkAlt, faUserCheck,
    faChartLine, faPercentage, faUserClock, faMapMarkerAlt, faGlobe,
    faExclamationTriangle, faTimes, faClock
  } from '@fortawesome/free-solid-svg-icons'

  const userStore = useUserStore()
  const paginationPageSize = ref(15)
  const toast = useToast();
  const loading = ref(false);
  const options = ref();
  const series = ref();
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
  const currentPage = ref(1);
  const visitors = ref([]);
  const detailedVisitorData = ref([]); // Store detailed visitor data for accurate stats

  library.add(
    faSun, faMoon, faSync, faUsers, faSearch, faFilter,
    faChevronLeft, faChevronRight, faExternalLinkAlt, faUserCheck,
    faChartLine, faPercentage, faUserClock, faMapMarkerAlt, faGlobe,
    faExclamationTriangle, faTimes, faClock
  )

  // Add filters reactive object
  const filters = reactive({
    search: '',
    hasCustomer: 'all', // 'all', 'yes', 'no'
    deviceType: 'all', // 'all', 'desktop', 'mobile', 'tablet'
    timeRange: '7d', // '24h', '7d', '30d', 'all'
  });

  // Enhanced date formatter
  const dateFormatter = (dateString) => {
    if (!dateString) return '-';
    const dt = moment(dateString);
    if (moment().isSame(dt, 'day')) {
      return `Today, ${dt.format('h:mm A')}`;
    }
    if (moment().subtract(1, 'day').isSame(dt, 'day')) {
      return `Yesterday, ${dt.format('h:mm A')}`;
    }
    return dt.format('MMM DD, YYYY, h:mm A');
  }

  // Apply time range filter
  const timeFilteredVisitors = computed(() => {
    if (filters.timeRange === 'all') return visitors.value;
    
    const now = moment();
    let cutoffDate;
    
    switch (filters.timeRange) {
      case '24h':
        cutoffDate = now.subtract(24, 'hours');
        break;
      case '7d':
        cutoffDate = now.subtract(7, 'days');
        break;
      case '30d':
        cutoffDate = now.subtract(30, 'days');
        break;
      default:
        cutoffDate = now.subtract(7, 'days');
    }
    
    return visitors.value.filter(visitor => 
      moment(visitor.createdAt).isAfter(cutoffDate)
    );
  });

  // Enhanced computed properties for filtering and pagination
  const filteredVisitors = computed(() => {
    return timeFilteredVisitors.value.filter(visitor => {
      const searchLower = filters.search.toLowerCase();
      
      // Search filter - check all possible location fields
      const matchesSearch = !searchLower || 
        visitor.id?.toLowerCase().includes(searchLower) ||
        visitor.page?.url?.toLowerCase().includes(searchLower) ||
        visitor.customer?.name?.toLowerCase().includes(searchLower) ||
        visitor.country?.toLowerCase().includes(searchLower) ||
        visitor.city?.toLowerCase().includes(searchLower) ||
        visitor.region?.toLowerCase().includes(searchLower) ||
        visitor.location?.toLowerCase().includes(searchLower);
      
      // Customer filter
      const matchesCustomer = filters.hasCustomer === 'all' ||
        (filters.hasCustomer === 'yes' && visitor.customer) ||
        (filters.hasCustomer === 'no' && !visitor.customer);
      
      // Device type filter (if available in data)
      const matchesDevice = filters.deviceType === 'all' ||
        visitor.deviceType === filters.deviceType;
      
      return matchesSearch && matchesCustomer && matchesDevice;
    });
  });

  const totalVisitors = computed(() => filteredVisitors.value.length);
  const totalPages = computed(() => Math.ceil(totalVisitors.value / paginationPageSize.value));
  const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
  const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalVisitors.value));

  // Accurate statistics calculation
  const visitorStats = computed(() => {
    const filtered = filteredVisitors.value;
    const converted = filtered.filter(v => v.customer).length;
    const total = filtered.length;
    
    // Count returning visitors (those who appear in multiple sessions)
    const visitorsByUTK = {};
    filtered.forEach(v => {
      if (v.utk) {
        visitorsByUTK[v.utk] = (visitorsByUTK[v.utk] || 0) + 1;
      }
    });
    
    const returning = Object.values(visitorsByUTK).filter(count => count > 1).length;
    
    // Count unique locations - check multiple possible fields for country/city data
    const countries = new Set();
    const cities = new Set();
    
    filtered.forEach(v => {
      // Check for country in various possible locations
      const country = v.country || v.location?.country || null;
      const city = v.city || v.location?.city || null;
      
      if (country) countries.add(country);
      if (city) cities.add(city);
    });
    
    return {
      total,
      converted,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0",
      returning,
      returningRate: total > 0 ? ((returning / total) * 100).toFixed(1) : "0.0",
      uniqueCountries: countries.size,
      uniqueCities: cities.size
    };
  });

  // Enhanced visitors with computed fields
  const enhancedVisitors = computed(() =>
    paginatedVisitors.value.map(v => ({
      ...v,
      isConverted: !!v.customer,
      associatedCustomer: v.customer?.name || null,
      lastSeen: v.updatedAt ? dateFormatter(v.updatedAt) : "-",
      location: [
        v.city || v.location?.city,
        v.region || v.location?.region, 
        v.country || v.location?.country
      ].filter(Boolean).join(', ') || 'Unknown',
      deviceInfo: v.deviceType || 'Unknown',
      hasMergeSuggestions: v.possibleContactSuggestions?.length > 0
    }))
  );

  const paginatedVisitors = computed(() => {
    return filteredVisitors.value.slice(startIndex.value, endIndex.value);
  });

  // Pagination functions
  const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
  }
  
  const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
  }

  // Clear filters function
  const clearFilters = () => {
    filters.search = '';
    filters.hasCustomer = 'all';
    filters.deviceType = 'all';
    filters.timeRange = '7d';
    currentPage.value = 1;
  }

  async function fetchVisitors() {
    try {
      loading.value = true;
      const response = await axios.get(
        `visitors?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      visitors.value = response.data.visitors;
      
      // Prepare chart data
      let visitorss = [];
      for (const c of response.data.visitors) {
        visitorss.push({
          x: c.updatedAt,
          y: 1,
        });
      }

      const data = _.sortBy(visitorss, 'x')
      const byDay = (item) => moment(item.x).format('MMM DD YYYY');
      const grouped = _.groupBy(data, byDay);
      const seriesData = Object.values(grouped).map(a => a.length)
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

  // Dark mode toggle function
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value);
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    updateChartTheme();
  };

  // Update chart theme based on dark mode
  const updateChartTheme = () => {
    if (options.value) {
      const textColor = isDarkMode.value ? '#FFFFFF' : '#374151';
      const gridColor = isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      options.value = {
        ...options.value,
        chart: {
          ...options.value.chart,
          foreColor: textColor
        },
        xaxis: {
          ...options.value.xaxis,
          labels: {
            ...options.value.xaxis.labels,
            style: { colors: [textColor] }
          },
          title: {
             style: { color: textColor }
          }
        },
        yaxis: {
          ...options.value.yaxis,
          labels: {
            ...options.value.yaxis.labels,
            style: { colors: [textColor] }
          },
           title: {
             style: { color: textColor }
          }
        },
        grid: {
          ...options.value.grid,
          borderColor: gridColor
        },
        tooltip: {
          ...options.value.tooltip,
          theme: isDarkMode.value ? 'dark' : 'light'
        },
        legend: {
          ...options.value.legend,
          labels: { colors: textColor }
        }
      };
    }
  };

  onMounted(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    if(userStore.currentWebsite){
      fetchVisitors();
    }
  });

  watchEffect(() => {
    if(userStore.currentWebsite){
      currentPage.value = 1;
      fetchVisitors();
    }
  });

  // Watch dark mode to update chart theme
  watch(isDarkMode, () => {
    updateChartTheme();
  });

  // Watch filters to reset pagination
  watch(filters, () => {
    currentPage.value = 1;
  });
</script>

<template>
 <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
   <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
     
     <!-- Header Section -->
     <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
       <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
         <font-awesome-icon icon="users" class="mr-3 text-indigo-500 dark:text-indigo-400" />
         Website Visitors
       </h1>
       <div class="flex items-center space-x-2 sm:space-x-3">
         <button @click="fetchVisitors" class="btn-icon-modern" title="Reload Visitors">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
         </button>
         <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
         </button>
       </div>
     </header>

     <!-- Enhanced Statistics Cards -->
     <section class="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
       <!-- Total Visitors -->
       <div class="card-modern p-4 hover:shadow-lg transition-shadow">
         <div class="flex items-center justify-between">
           <div>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Visitors</p>
             <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ visitorStats.total }}</p>
           </div>
           <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
             <font-awesome-icon icon="users" class="text-indigo-600 dark:text-indigo-400" />
           </div>
         </div>
       </div>

       <!-- Converted Visitors -->
       <div class="card-modern p-4 hover:shadow-lg transition-shadow">
         <div class="flex items-center justify-between">
           <div>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Converted</p>
             <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ visitorStats.converted }}</p>
           </div>
           <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
             <font-awesome-icon icon="user-check" class="text-green-600 dark:text-green-400" />
           </div>
         </div>
       </div>

       <!-- Conversion Rate -->
       <div class="card-modern p-4 hover:shadow-lg transition-shadow">
         <div class="flex items-center justify-between">
           <div>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
             <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ visitorStats.conversionRate }}%</p>
           </div>
           <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
             <font-awesome-icon icon="percentage" class="text-blue-600 dark:text-blue-400" />
           </div>
         </div>
       </div>

       <!-- Returning Visitors -->
       <div class="card-modern p-4 hover:shadow-lg transition-shadow">
         <div class="flex items-center justify-between">
           <div>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Returning</p>
             <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ visitorStats.returning }}</p>
           </div>
           <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
             <font-awesome-icon icon="user-clock" class="text-purple-600 dark:text-purple-400" />
           </div>
         </div>
       </div>

       <!-- Countries -->
       <div class="card-modern p-4 hover:shadow-lg transition-shadow">
         <div class="flex items-center justify-between">
           <div>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Countries</p>
             <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ visitorStats.uniqueCountries }}</p>
           </div>
           <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
             <font-awesome-icon icon="globe" class="text-orange-600 dark:text-orange-400" />
           </div>
         </div>
       </div>

       <!-- Cities -->
       <div class="card-modern p-4 hover:shadow-lg transition-shadow">
         <div class="flex items-center justify-between">
           <div>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Cities</p>
             <p class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{{ visitorStats.uniqueCities }}</p>
           </div>
           <div class="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
             <font-awesome-icon icon="map-marker-alt" class="text-cyan-600 dark:text-cyan-400" />
           </div>
         </div>
       </div>
     </section>

     <!-- Enhanced Filter Section -->
     <section class="mb-6 p-5 sm:p-6 card-modern">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
           <!-- Search Input -->
           <div class="lg:col-span-2">
              <label class="label-modern">Search</label>
              <div class="relative">
                <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  v-model="filters.search" 
                  placeholder="Search by URL, ID, customer, location..." 
                  class="input-modern pl-10 pr-3" 
                />
              </div>
           </div>

           <!-- Customer Filter -->
           <div>
              <label class="label-modern">Customer Status</label>
              <select v-model="filters.hasCustomer" class="input-modern input-modern--select">
                <option value="all">All Visitors</option>
                <option value="yes">With Customer</option>
                <option value="no">Without Customer</option>
              </select>
           </div>

           <!-- Time Range Filter -->
           <div>
              <label class="label-modern">Time Range</label>
              <select v-model="filters.timeRange" class="input-modern input-modern--select">
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
           </div>

           <!-- Filter Actions -->
           <div class="flex items-center justify-end space-x-2">
              <button 
                @click="clearFilters" 
                class="btn-secondary-modern w-full md:w-auto"
                :disabled="!filters.search && filters.hasCustomer === 'all' && filters.timeRange === '7d'"
              >
                <font-awesome-icon icon="times" class="mr-2" />
                Clear Filters
              </button>
           </div>
        </div>
     </section>

     <!-- Visitor List Section -->
     <section>
        <!-- Desktop Table -->
        <div v-if="!loading && paginatedVisitors.length > 0" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
               <thead class="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                     <th scope="col" class="th-modern">Status</th>
                     <th scope="col" class="th-modern">Customer</th>
                     <th scope="col" class="th-modern">Location</th>
                     <th scope="col" class="th-modern">Page URL</th>
                     <th scope="col" class="th-modern">Activity</th>
                     <th scope="col" class="th-modern">Last Seen</th>
                     <th scope="col" class="th-modern text-center">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="visitor in enhancedVisitors" :key="visitor.id"
                      class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150"
                  >
                    <td class="td-modern">
                      <span v-if="visitor.isConverted" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <font-awesome-icon icon="user-check" class="mr-1 text-xs" />
                        Converted
                      </span>
                      <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                        Visitor
                      </span>
                    </td>
                    <td class="td-modern">
                      <span v-if="visitor.associatedCustomer" class="text-gray-900 dark:text-white">
                        {{ visitor.associatedCustomer }}
                      </span>
                      <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                    </td>
                    <td class="td-modern text-gray-500 dark:text-gray-400">
                      <div class="flex items-center">
                        <font-awesome-icon icon="map-marker-alt" class="mr-2 text-gray-400" />
                        {{ visitor.location }}
                      </div>
                    </td>
                    <td class="td-modern">
                      <a :href="visitor.page?.url" target="_blank" rel="noopener noreferrer" 
                         class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                         @click.stop>
                        {{ visitor.page?.url || '-' }}
                        <font-awesome-icon icon="external-link-alt" class="ml-1 text-xs" />
                      </a>
                    </td>
                    <td class="td-modern">
                      <div class="flex items-center space-x-4 text-sm">
                        <div class="flex items-center text-gray-500 dark:text-gray-400">
                          <span class="font-medium">{{ visitor.views || 0 }}</span>
                          <span class="ml-1 text-xs">views</span>
                        </div>
                        <div class="flex items-center text-gray-500 dark:text-gray-400">
                          <span class="font-medium">{{ visitor.clicks || 0 }}</span>
                          <span class="ml-1 text-xs">clicks</span>
                        </div>
                      </div>
                    </td>
                    <td class="td-modern text-gray-500 dark:text-gray-400">
                      <div class="flex items-center">
                        <font-awesome-icon icon="clock" class="mr-2 text-gray-400" />
                        {{ visitor.lastSeen }}
                      </div>
                    </td>
                    <td class="td-modern text-center">
                      <button 
                        @click="$router.push({ name: 'VisitorView', params: { visitorId: visitor.id } })"
                        class="btn-primary-modern text-xs inline-flex items-center"
                      >
                        View Details
                        <font-awesome-icon icon="chevron-right" class="ml-1" />
                      </button>
                    </td>
                  </tr>
               </tbody>
            </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4">
           <div v-if="!loading && paginatedVisitors.length > 0" v-for="visitor in enhancedVisitors" :key="visitor.id"
                class="card-modern p-4 hover:shadow-lg transition-all duration-150"
              >
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    <span v-if="visitor.hasMergeSuggestions" class="mr-2 text-yellow-500">
                      <font-awesome-icon icon="exclamation-triangle" class="text-sm" />
                    </span>
                    Visitor
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last seen: {{ visitor.lastSeen }}
                  </p>
                </div>
                <span v-if="visitor.isConverted" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Converted
                </span>
                <span v-else 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                  Visitor
                </span>
              </div>
              
              <div class="space-y-2 mb-3">
                <div class="flex items-center text-sm">
                  <span class="text-gray-500 dark:text-gray-400 w-20">Customer:</span>
                  <span class="text-gray-900 dark:text-white">{{ visitor.associatedCustomer || '-' }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <span class="text-gray-500 dark:text-gray-400 w-20">Location:</span>
                  <span class="text-gray-900 dark:text-white">{{ visitor.location }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <span class="text-gray-500 dark:text-gray-400 w-20">Activity:</span>
                  <span class="text-gray-900 dark:text-white">
                    {{ visitor.views || 0 }} views, {{ visitor.clicks || 0 }} clicks
                  </span>
                </div>
              </div>
              
              <a :href="visitor.page?.url" target="_blank" rel="noopener noreferrer" 
                 class="block text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-3 truncate"
                 @click.stop>
                {{ visitor.page?.url }}
              </a>
              
              <button 
                @click="$router.push({ name: 'VisitorView', params: { visitorId: visitor.id } })"
                class="btn-primary-modern w-full text-sm"
              >
                View Details
              </button>
           </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="animate-pulse">
           <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
              <div class="p-4 space-y-4">
                <div v-for="n in 10" :key="`skel-${n}`" class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
           </div>
           <div class="md:hidden space-y-4">
              <div v-for="n in 5" :key="`skel-mob-${n}`" class="card-modern p-4">
                 <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                 <div class="space-y-2">
                   <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                   <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                 </div>
              </div>
           </div>
        </div>

        <!-- No Results -->
        <div v-if="!loading && filteredVisitors.length === 0" class="text-center py-16">
           <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
             <font-awesome-icon icon="users" class="text-2xl text-gray-400" />
           </div>
           <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No visitors found</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400">
             {{ filters.search || filters.hasCustomer !== 'all' || filters.timeRange !== '7d' 
                ? 'Try adjusting your filters'
                : 'No visitor data recorded yet' }}
           </p>
           <button v-if="filters.search || filters.hasCustomer !== 'all' || filters.timeRange !== '7d'"
                   @click="clearFilters"
                   class="mt-4 btn-primary-modern">
             Clear Filters
           </button>
        </div>

        <!-- Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm space-y-4 sm:space-y-0">
           <p class="text-gray-600 dark:text-gray-400">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalVisitors }}</span> results
           </p>
           <div class="flex space-x-1">
              <button 
                :disabled="currentPage === 1" 
                @click="prevPage" 
                class="btn-pagination-modern"
              >
                 <font-awesome-icon icon="chevron-left" class="h-3 w-3 mr-1" /> Previous
              </button>
              <button 
                :disabled="currentPage === totalPages" 
                @click="nextPage" 
                class="btn-pagination-modern"
              >
                 Next <font-awesome-icon icon="chevron-right" class="h-3 w-3 ml-1" />
              </button>
           </div>
        </nav>
     </section>

     <!-- Chart Section -->
     <section class="mt-12 card-modern p-6">
        <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
          <font-awesome-icon icon="chart-line" class="mr-2 text-indigo-500 dark:text-indigo-400" />
          Visitor Trend Analysis
        </h3>
        <div class="relative w-full min-h-[200px]">
          <VisitorTrendChart
            :rawData="visitors"
            :loading="loading"
            :isDarkMode="isDarkMode"
          />
        </div>
     </section>

   </div>

   <!-- Loading Overlay -->
   <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
   </div>
 </div>
</template>

<style scoped>
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

/* Custom scrollbar styles */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
</style>