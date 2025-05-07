// wibiclick-frontend-vue/src/views/Dashboard.vue
<script setup>
import { ref, onMounted, watch, computed, watchEffect, nextTick } from "vue";
import axios from "axios";
import _ from 'lodash';
import moment from 'moment';
import { useUserStore } from "@/stores/UserStore";
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import VueApexCharts from "vue3-apexcharts";
import timeline from "@/components/timeline.vue"; // Assuming this component exists and is styled appropriately or will be updated
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSun, faMoon, faChevronDown, faCheck, faArrowUp, faArrowDown, faMinus, faEye, faMousePointer, faPercentage } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faFacebookMessenger, faTelegram, faViber, faSkype, faHubspot } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faComment, faPhone } from '@fortawesome/free-solid-svg-icons'; // Added missing solid icons
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { useRouter, useRoute } from "vue-router";

// Add all necessary icons to the library
library.add(
  faSun, faMoon, faChevronDown, faCheck, faArrowUp, faArrowDown, faMinus, faEye, faMousePointer, faPercentage,
  faWhatsapp, faFacebookMessenger, faTelegram, faViber, faSkype, faHubspot,
  faEnvelope, faComment, faPhone
);

const apexchart = VueApexCharts; // Assign for template usage

const userStore = useUserStore();
const { currentWebsite, websites: storeWebsites, user, analytics } = storeToRefs(userStore); // Use storeToRefs for reactivity
const toast = useToast();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const clicksOptions = ref({});
const clicksSeries = ref([]);
const viewsOptions = ref({}); // Added for views chart
const viewsSeries = ref([]); // Added for views chart
const recentClicks = ref([]);
const chartKey = ref(0); // Key to force chart re-render

const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

// --- Button Definitions (Moved for clarity) ---
const buttons = {
  whatsapp: { name: "Whatsapp", icon: ['fab', 'whatsapp'], color: "text-green-500", bgColor: "bg-green-500/10", hoverColor: "hover:bg-green-500/20" },
  messenger: { name: "Messenger", icon: ['fab', 'facebook-messenger'], color: "text-blue-500", bgColor: "bg-blue-500/10", hoverColor: "hover:bg-blue-500/20" },
  mail: { name: "Mail", icon: ['fas', 'envelope'], color: "text-red-500", bgColor: "bg-red-500/10", hoverColor: "hover:bg-red-500/20" },
  text: { name: "Text", icon: ['fas', 'comment'], color: "text-amber-500", bgColor: "bg-amber-500/10", hoverColor: "hover:bg-amber-500/20" },
  call: { name: "Calls", icon: ['fas', 'phone'], color: "text-gray-700 dark:text-gray-300", bgColor: "bg-gray-500/10", hoverColor: "hover:bg-gray-500/20" },
  telegram: { name: "Telegram", icon: ['fab', 'telegram'], color: "text-sky-600", bgColor: "bg-sky-600/10", hoverColor: "hover:bg-sky-600/20" },
  viber: { name: "Viber", icon: ['fab', 'viber'], color: "text-purple-500", bgColor: "bg-purple-500/10", hoverColor: "hover:bg-purple-500/20" },
  skype: { name: "Skype", icon: ['fab', 'skype'], color: "text-sky-500", bgColor: "bg-sky-500/10", hoverColor: "hover:bg-sky-500/20" },
  form: { name: "Hubspot", icon: ['fab', 'hubspot'], color: "text-rose-500", bgColor: "bg-rose-500/10", hoverColor: "hover:bg-rose-500/20" }
};

// --- Dark Mode ---
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
};

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});

// --- Website Selection ---
const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value) // Use action to update store
});

const websites = computed(() => storeWebsites.value || []); // Ensure websites is always an array

// --- Data Fetching ---
const fetchWebsites = async () => {
  if (!user.value?.id) return; // Don't fetch if user is not loaded
  // Fetch only if store is empty, assuming store might be populated elsewhere
  if (websites.value.length === 0) {
    try {
      // loading.value = true; // Loading handled by fetchAllData
      await userStore.fetchWebsites(); // Use store action
    } catch (error) {
      console.error('Error fetching websites via store:', error);
      toast.error("Error fetching websites");
    } finally {
      // loading.value = false;
    }
  }
};

const fetchClicksData = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') {
      clicksSeries.value = [];
      clicksOptions.value = getBaseChartOptions(); // Reset options
      return;
  }
  try {
    const response = await axios.get(`get-website-clicks?id=${selectedWebsite.value}`);
    const data = _.sortBy(response.data.clicks || [], 'x');
    // Group data by the start of the month and sum the clicks (length of items)
    const groupedByMonth = _.groupBy(data, item => moment(item.x).startOf('month').toISOString());
    const seriesData = Object.entries(groupedByMonth).map(([monthStartDate, items]) => ({
      x: new Date(monthStartDate).getTime(), // Use the start date of the month for the x-axis
      y: items.length // Sum the clicks (number of items) for the month
    }));

    clicksOptions.value = getAreaChartOptions('Clicks', seriesData);
    clicksSeries.value = [{ name: 'Clicks', data: seriesData }];

  } catch (error) {
    console.error("Error fetching website clicks data:", error);
    toast.error("Error getting website clicks data");
    clicksSeries.value = [];
    clicksOptions.value = getBaseChartOptions();
  }
};

const fetchViewsData = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') {
      viewsSeries.value = [];
      viewsOptions.value = getBaseChartOptions(); // Reset options
      return;
  }
  try {
    const response = await axios.get(`get-website-views?id=${selectedWebsite.value}`);
    const data = _.sortBy(response.data.views || [], 'x');
    // Group data by the start of the month and sum the views (y value)
    const groupedByMonth = _.groupBy(data, item => moment(item.x).startOf('month').toISOString());
    const seriesData = Object.entries(groupedByMonth).map(([monthStartDate, items]) => ({
      x: new Date(monthStartDate).getTime(), // Use the start date of the month for the x-axis
      y: items.reduce((sum, currentItem) => sum + (currentItem.y || 0), 0) // Sum the 'y' values for the month
    }));

    viewsOptions.value = getAreaChartOptions('Views', seriesData);
    viewsSeries.value = [{ name: 'Views', data: seriesData }];

  } catch (error) {
    console.error("Error fetching website views data:", error);
    toast.error("Error getting website views data");
    viewsSeries.value = [];
    viewsOptions.value = getBaseChartOptions();
  }
};

const fetchRecentClicksData = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') {
      recentClicks.value = [];
      return;
  }
  try {
    const response = await axios.get(`get-recent-clicks?id=${selectedWebsite.value}`);
    recentClicks.value = response.data.clicks || [];
  } catch (error) {
    console.error("Error fetching recent clicks data:", error);
    toast.error("Error getting recent clicks data");
    recentClicks.value = [];
  }
};

const fetchAllData = async () => {
  if (!selectedWebsite.value || selectedWebsite.value === 'default') {
    resetData();
    return;
  }
  loading.value = true;
  try {
    // Analytics summary is assumed to be reactive via storeToRefs

    // Fetch detailed data
    await Promise.all([
      fetchClicksData(),
      fetchViewsData(),
      fetchRecentClicksData()
    ]);
    await nextTick(); // Ensure DOM updates before potentially re-rendering charts
    chartKey.value += 1; // Force chart re-render after all data is fetched
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Individual fetch errors are handled within their functions
  } finally {
    loading.value = false;
  }
};

const resetData = () => {
    clicksSeries.value = [];
    clicksOptions.value = getBaseChartOptions();
    viewsSeries.value = [];
    viewsOptions.value = getBaseChartOptions();
    recentClicks.value = [];
    userStore.analytics = null; // Reset analytics in store if needed
    chartKey.value += 1;
};

// --- Chart Options ---
const getBaseChartOptions = () => ({
  chart: {
    height: 300,
    type: 'area',
    toolbar: { show: true, autoSelected: 'zoom' }, // Enable toolbar and default to zoom
    zoom: { enabled: true }, // Enable zooming
    foreColor: isDarkMode.value ? '#f3f4f6' : '#1f2937'
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: {
    type: 'datetime',
    labels: {
      style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' },
      datetimeUTC: false,
      formatter: function(value) {
        // Use Moment.js to format the timestamp value
        return moment(value).format('DD MMM YY');
      }
    },
    axisBorder: { color: isDarkMode.value ? '#374151' : '#e5e7eb' },
    axisTicks: { color: isDarkMode.value ? '#374151' : '#e5e7eb' }
  },
  yaxis: {
    labels: { style: { colors: isDarkMode.value ? '#9ca3af' : '#6b7280' } }
  },
  tooltip: {
    theme: isDarkMode.value ? 'dark' : 'light',
    x: { format: 'dd MMM yyyy' }
  },
  grid: {
    borderColor: isDarkMode.value ? '#374151' : '#e5e7eb',
    strokeDashArray: 4
  },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 90, 100]
    }
  },
  markers: {
      size: 0 // Hide markers for a cleaner look
  },
  noData: {
    text: 'Loading or No Data Available...',
    align: 'center',
    verticalAlign: 'middle',
    offsetX: 0,
    offsetY: 0,
    style: {
      color: isDarkMode.value ? '#9ca3af' : '#6b7280',
      fontSize: '14px',
    }
  }
});

const getAreaChartOptions = (name, data) => {
  const baseOptions = getBaseChartOptions();
  return {
    ...baseOptions,
    colors: name === 'Clicks' ? ['#4f46e5'] : ['#10b981'], // Indigo for Clicks, Emerald for Views
    // Add specific overrides if needed, e.g., different y-axis formatting
  };
};

// --- Computed Properties ---
const totalViews = computed(() => analytics.value?.views || 0);
const totalClicks = computed(() => analytics.value?.clicks || 0);
const clickThroughRate = computed(() => {
  const views = totalViews.value;
  const clicks = totalClicks.value;
  if (!views || views === 0) return 0;
  return parseFloat(((clicks / views) * 100).toFixed(1)); // Use parseFloat and toFixed(1)
});

const clickButtonsData = computed(() => {
    if (!analytics.value) return [];
    // Filter buttons based on whether they have a count in analytics > 0
    return Object.entries(buttons)
        .map(([key, config]) => ({
            key,
            ...config,
            count: analytics.value[key] || 0
        }))
        .filter(button => button.count > 0); // Only show buttons with clicks
});


// --- Lifecycle Hooks ---
onMounted(async () => {
  // Apply initial dark mode
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    isDarkMode.value = JSON.parse(savedDarkMode);
  } else {
    // Optional: Set based on system preference if no setting saved
    // isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  document.documentElement.classList.toggle('dark', isDarkMode.value);

  // Check for login status message
  if (route.query.state === "succeeded") {
    toast.success("You have successfully registered and automatically logged in.");
    // Clean the URL query parameter
    router.replace({ query: {} });
  }

  // Initial data fetch
  await fetchWebsites(); // Fetch websites first
  if (selectedWebsite.value && selectedWebsite.value !== 'default') {
      await fetchAllData();
  } else if (websites.value.length > 0 && !selectedWebsite.value) {
      // If websites loaded but none selected (e.g., first load), select the first one
      userStore.updateWebsite(websites.value[0].value);
      // fetchAllData will be triggered by the watcher
  } else {
      // No websites available or selected, reset data display
      resetData();
  }

  // Basic user check (consider moving to a route guard)
  if (!user.value) {
    toast.error("User data not found. Redirecting to login.");
    // Optional: Clear local storage and redirect
    // userStore.$reset();
    // localStorage.removeItem('user');
    // localStorage.removeItem('UserStore');
    // router.push({ name: 'login' }); // Assuming you have a login route
  }
});

// Watch for changes in selected website to refetch data
watch(selectedWebsite, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        fetchAllData();
    }
});

// Watch for dark mode changes to update chart options
watch(isDarkMode, () => {
    clicksOptions.value = getAreaChartOptions('Clicks', clicksSeries.value[0]?.data || []);
    viewsOptions.value = getAreaChartOptions('Views', viewsSeries.value[0]?.data || []);
    chartKey.value += 1; // Force re-render
});

</script>

<template>
  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader :color="isDarkMode ? '#ffffff' : '#4f46e5'" />
  </div>

  <!-- Main container -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Website Selector -->
          <Listbox v-model="selectedWebsite" as="div" class="relative w-60">
            <ListboxButton class="input-modern input-modern--select pr-8 text-sm">
              <span class="block truncate">
                {{ websites.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
              </span>
            </ListboxButton>
            <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
              <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption v-if="websites.length === 0" :value="'default'" disabled>
                   <li class="relative cursor-not-allowed select-none py-2 pl-10 pr-4 text-gray-500">No websites found</li>
                </ListboxOption>
                <ListboxOption v-for="website in websites" :key="website.value" :value="website.value" v-slot="{ active, selected }">
                  <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ website.label }}</span>
                    <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </Listbox>

          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
             <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div v-if="!selectedWebsite || selectedWebsite === 'default'" class="text-center py-16 card-modern">
          <p class="text-gray-500 dark:text-gray-400">Please select a website to view the dashboard.</p>
      </div>
      <div v-else class="space-y-8">

        <!-- Stats Overview Section -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <font-awesome-icon icon="eye" class="text-blue-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Views</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ totalViews.toLocaleString() }}</dd>
            </div>
          </div>
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <font-awesome-icon icon="mouse-pointer" class="text-indigo-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Clicks</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ totalClicks.toLocaleString() }}</dd>
            </div>
          </div>
          <div class="card-modern p-5 sm:p-6 flex items-center space-x-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <font-awesome-icon icon="percentage" class="text-emerald-500 text-xl" />
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Click-Through Rate (CTR)</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ clickThroughRate }}%</dd>
            </div>
          </div>
        </section>

        <!-- Charts Section -->
        <section class="grid grid-cols-1 gap-8"> <!-- Removed md:grid-cols-2 to stack charts -->
          <div class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Clicks Over Time</h2>
            <apexchart :key="chartKey" type="area" height="300" :options="clicksOptions" :series="clicksSeries"></apexchart>
          </div>
          <div class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Views Over Time</h2>
            <apexchart :key="chartKey" type="area" height="300" :options="viewsOptions" :series="viewsSeries"></apexchart>
          </div>
        </section>

        <!-- Click Sources & Recent Activity Grid -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Click Sources</h2>
             <div v-if="clickButtonsData.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div v-for="button in clickButtonsData" :key="button.key"
                     :class="[button.bgColor, button.hoverColor]"
                     class="rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors duration-150">
                    <font-awesome-icon :icon="button.icon" :class="button.color" class="text-3xl mb-2" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ button.name }}</span>
                    <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ button.count }}</span>
                </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                No click source data available for this period.
            </div>
          </div>

          <div class="card-modern p-5 sm:p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Click Activity</h2>
            <div class="h-96 overflow-y-auto pr-2 custom-scrollbar">
              <timeline v-if="recentClicks.length > 0" :items="recentClicks" :buttons="buttons"></timeline>
              <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent click activity recorded.
              </div>
            </div>
          </div>
        </section>

      </div> <!-- End v-else -->
    </div> <!-- End container -->
  </div> <!-- End root div -->
</template>

<style>
/* Modern Input Styles (Copied from reference) */
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

/* Modern Button Styles (Copied from reference) */
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm; /* Increased size slightly */
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Card Style (Copied from reference) */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Table Styles (Copied from reference - if needed for timeline or future tables) */
.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
  @apply px-4 py-3 text-sm text-gray-800 dark:text-white;
}

/* Custom scrollbar styles (Copied from reference) */
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50 rounded-full; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded-full; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
/* For Firefox */
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db #f3f4f6; } /* Light mode */
.dark .custom-scrollbar { scrollbar-color: #4b5563 #1f2937; } /* Dark mode */

</style>