<script setup>
import axios from "axios";
import notifications from "./notification/notifications.vue";
import { useUserStore } from "@/stores/UserStore"
import { useUIStore } from '@/stores/UIStore';
import { useThemeStore } from '@/stores/theme'; // Import the theme store
import { useRouter } from 'vue-router'; // Added for search navigation
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // Added for search icons
import { faSearch, faSpinner, faTimes, faSun, faMoon } from '@fortawesome/free-solid-svg-icons'; // Added search, sun, moon icons
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu, MenuButton, 
  MenuItem, 
  MenuItems,
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue"; // Added onBeforeUnmount
import { storeToRefs } from 'pinia'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { useToast } from 'vue-toast-notification';
// import Ably from "ably"; // Ably seems unused, commented out

library.add(faSearch, faSpinner, faTimes, faSun, faMoon); // Add search, sun, moon icons to library

const toast = useToast();
const userStore = useUserStore()
const { currentWebsite, websites } = storeToRefs(userStore)
const router = useRouter(); // Added for search navigation
const uiStore = useUIStore();
const themeStore = useThemeStore(); // Instantiate the theme store

const addModal = ref(false)
const submitted = ref(false)
const loading = ref(false)
const analytics = ref({})
const dropdownContacts = ref(false)
const dropdownMarketing = ref(false)
const dropdownSales = ref(false)
const unreadNotifications = ref([]);
//const ably = new Ably.Realtime(userStore.ableyk);

// --- Universal Search State & Logic ---
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const showResultsDropdown = ref(false);
const debounceTimer = ref(null);
const searchInputRef = ref(null); // Ref for the input element
const searchResultsRef = ref(null); // Ref for the results dropdown

// Debounced Search Function
const performSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    showResultsDropdown.value = false;
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  try {
    // Use await here
    const response = await axios.get('/universal-search', {
      params: {
        id: userStore.currentWebsite,
        q: searchQuery.value,
        limit: 10 // Adjust limit as needed
      }
    });
    searchResults.value = response.data.results || [];
    showResultsDropdown.value = searchResults.value.length > 0;
  } catch (error) {
    // Removed console.error
    searchResults.value = [];
    showResultsDropdown.value = false;
    toast.error("Search failed. Please try again."); // Added user feedback
  } finally {
    isSearching.value = false;
  }
};

// Watch search query with debounce
watch(searchQuery, (newValue) => {
  clearTimeout(debounceTimer.value);
  if (newValue.length >= 2) {
    debounceTimer.value = setTimeout(() => {
      performSearch();
    }, 500); // 500ms debounce
  } else {
    searchResults.value = [];
    showResultsDropdown.value = false;
  }
});

// Navigate to selected result
const navigateToResult = (result) => {
  // Removed console.log
  let routeName = '';
  let queryParams = {};

  switch (result.type) {
    case 'Customer':
      routeName = 'contact'; // Corrected route name based on user feedback
      queryParams = { customer_id: result.id };
      break;
    case 'Invoice':
      routeName = 'view-invoice';
      queryParams = { invoice_id: result.id };
      break;
    case 'Estimate':
      routeName = 'view-estimate';
      queryParams = { estimate_id: result.id };
      break;
    case 'Job':
      // routeName = 'view-job'; // Remove routing
      // queryParams = { job_id: result.id }; // Remove routing
      uiStore.openGlobalJobModal(result.id); // Call store action instead
      break;
    // Add cases for other types if needed
  }

  // Handle navigation for non-Job types
  if (routeName) {
    router.push({ name: routeName, query: queryParams });
  }

  // Always clear search after handling the result (navigation or modal open)
  searchQuery.value = '';
  searchResults.value = [];
  showResultsDropdown.value = false;
};

// Clear search input
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showResultsDropdown.value = false;
};

// Click away handler
const handleClickOutside = (event) => {
  if (
    searchInputRef.value && !searchInputRef.value.contains(event.target) &&
    searchResultsRef.value && !searchResultsRef.value.contains(event.target)
  ) {
    showResultsDropdown.value = false;
  }
};
// --- End Universal Search ---

const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
})

const opt = computed(() => [
  { label: 'Select Website', value: 'default', attrs: { disabled: true } },
  ...websites.value
])

const people = [
    { id: 1, name: 'Durward Reynolds', unavailable: false },
    { id: 2, name: 'Kenton Towne', unavailable: false },
    { id: 3, name: 'Therese Wunsch', unavailable: false },
    { id: 4, name: 'Benedict Kessler', unavailable: true },
    { id: 5, name: 'Katelyn Rohan', unavailable: false },
  ]

const selectedPerson = ref(people[0])

function logout() {
  userStore.$reset()
  localStorage.removeItem('user')
  localStorage.removeItem('UserStore')
  location.reload()
}

async function fetchWebsites() {
  try {
    loading.value = true
    const response = await axios.get(`get-websites-for-user?id=${userStore.user.id}`);
    const formattedWebsites = response.data.map(site => ({
      label: site.label,
      value: site.value
    }));
    userStore.setWebsites(formattedWebsites);
    if (formattedWebsites.length > 0 && userStore.currentWebsite === "default") {
      userStore.updateWebsite(formattedWebsites[0].value);
    }
    loading.value = false
  } catch (error) {
    // Removed console.error
    toast.error("Error getting website data");
    loading.value = false
  }
}

async function fetchWebsiteAnalytics(id) {
  try {
    loading.value = true
    const response = await axios.get('get-website-analytics?id=' + id);
    analytics.value = response.data.analytics[0]
    userStore.updateAnalytics(analytics.value)
    loading.value = false
  } catch (error) {
    // Removed console.log
    toast.error("Error getting website analytics data")
    loading.value = false
  }
}

async function fetchSettings(id) {
  try {
    loading.value = true
    const response = await axios.get('get-website?id=' + id);
    userStore.updateSettings(response.data.setting)
    loading.value = false
  } catch (error) {
    // Removed console.log
    toast.error("Error getting website settings")
    loading.value = false
  }
}

async function addWebsite(credentials) {
  try {
    addModal.value = false
    loading.value = true
    await axios.post('add-website', { url: credentials.newWebsite });
    fetchWebsites();
    toast.success("Website added successfully")
    loading.value = false
  } catch (error) {
    // Removed console.log
    toast.error('Error Adding website')
    loading.value = false
  }
}

function playSound () {
  const audio = new Audio('notification.mp3');
  audio.play();
}

function iniABLY(){
  const channel = ably.channels.get("notifications");
  
  channel.subscribe('wibi', function (message) {
    unreadNotifications.value.push(
      { 
        index    : unreadNotifications.value.length,
        title    : message.data?.name,
        msg      : message.data?.data,
        img      : message.data?.image_url,
        time     : randomDate({sec: 0}),
        website_id : message.data?.website
      }
    )

    toast.success(message.data.data, {
      duration: 2000
    })

    playSound()

    let optns = {
      body: message.data.data,
      icon: message.data.image_url
    }

    if (!("Notification" in window)) {
      // Removed console.log
    } else if (Notification.permission === "granted") {
      const notification = new Notification(message.data.name, optns);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          const notification = new Notification(message.data.name, optns);
        }
      });
    }
    
  });
}

function elapsedTime(startTime) {
  let x        = new Date(startTime)
  let now      = new Date()
  var timeDiff = now - x
  timeDiff    /= 1000

  var seconds = Math.round(timeDiff)
  timeDiff    = Math.floor(timeDiff / 60)

  var minutes = Math.round(timeDiff % 60)
  timeDiff    = Math.floor(timeDiff / 60)

  var hours   = Math.round(timeDiff % 24)
  timeDiff    = Math.floor(timeDiff / 24)

  var days    = Math.round(timeDiff % 365)
  timeDiff    = Math.floor(timeDiff / 365)

  var years   = timeDiff

  if (years > 0) {
    return years + (years > 1 ? ' Years ' : ' Year ') + 'ago'
  } else if (days > 0) {
    return days + (days > 1 ? ' Days ' : ' Day ') + 'ago'
  } else if (hours > 0) {
    return hours + (hours > 1 ? ' Hrs ' : ' Hour ') + 'ago'
  } else if (minutes > 0) {
    return minutes + (minutes > 1 ? ' Mins ' : ' Min ') + 'ago'
  } else if (seconds > 0) {
    return seconds + (seconds > 1 ? ' sec ago' : 'just now')
  }

  return 'Just Now'
}

// Method for creating dummy notification time
function randomDate({ hr, min, sec }) {
  let date = new Date()

  if (hr) date.setHours(date.getHours() - hr)
  if (min) date.setMinutes(date.getMinutes() - min)
  if (sec) date.setSeconds(date.getSeconds() - sec)

  return date
}

onMounted(() => {
  if (!userStore.user) {
    logout()
  } else {
    //iniABLY();
    fetchWebsites();
    document.addEventListener('click', handleClickOutside); // Add click listener for search
  }
})

// Add unmount hook for search click listener cleanup
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  clearTimeout(debounceTimer.value); // Clear timer on unmount
});

watch(selectedWebsite, (newValue) => {
  if (newValue && newValue !== 'default') {
    fetchWebsiteAnalytics(newValue)
    fetchSettings(newValue)
  }
})
</script>

<template>
  <scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <Disclosure as="nav" class="bg-custom-gray custom-css-cal" v-slot="{ open }">
    <div class=" mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">

          <div class="flex-shrink-0">
            <a href="#" aria-label="logo" class="flex space-x-2 items-center">
              <div aria-hidden="true" class="flex space-x-1">
                <div class="h-6 w-2 bg-sky-500"></div>
              </div>
              <span class="text-base font-bold text-white">Wibi Click</span>
            </a>
          </div>

          <div class="hidden md:block">
            <div class="ml-10 flex items-center space-x-4">    
              
              <div class="relative">
                <!-- Dashboard dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='dashboard'></box-icon>
                        Dashboards 
                        <svg :class="dropdownDashboards ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'admin-dashboard'}" v-if="userStore.user.permission === 'owner' || userStore.user.permission === 'admin'" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='chart'></box-icon>
                          <span class="ml-2">Admin Dashboard</span>
                        </router-link>
                        <router-link :to="{name: 'technician-dashboard'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user-detail'></box-icon>
                          <span class="ml-2">Technician Dashboard</span>
                        </router-link>
                        <router-link :to="{name: 'dashboard'}" v-if="userStore.user.permission == 'owner'" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                          <box-icon type='solid' color="black" name='dashboard'></box-icon>
                          <span class="ml-2">Analytics Dashboard</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>

              <div class="relative">
                <!-- Contacts dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='user-circle'></box-icon>
                        Contacts 
                        <svg :class="dropdownContacts ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'contacts'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user-detail'></box-icon>
                          <span class="ml-2">Contacts</span>
                        </router-link>  
                        <router-link :to="{name: 'employees'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user'></box-icon>
                          <span class="ml-2">Employees</span>
                        </router-link>                      
                        <router-link :to="{name: 'users'}" v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type="solid" name='user-account'></box-icon>
                          <span class="ml-2">Users</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>                
              </div>

              <div class="relative" v-if="userStore.user.permission == 'owner'">
                <!-- Marketing dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='store'></box-icon>
                        Marketing 
                        <svg :class="dropdownMarketing ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'visitors'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user-check'></box-icon>
                          <span class="ml-2">Visitors</span>
                        </router-link>
                        <router-link :to="{name: 'pages'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='book-content'></box-icon>
                          <span class="ml-2">Pages</span>
                        </router-link>
                        <router-link :to="{name: 'forms'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='book'></box-icon>
                          <span class="ml-2">Forms</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>

              <div class="relative">
                <!-- Sales dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='cart-download'></box-icon>
                        Sales
                        <svg :class="dropdownSales ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'jobs'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='business'></box-icon>
                          <span class="ml-2">Jobs</span>
                        </router-link>
                        <router-link :to="{name: 'estimates'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" name='receipt'></box-icon>
                          <span class="ml-2">Estimates</span>
                        </router-link>
                        <router-link :to="{name: 'invoices'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='receipt'></box-icon>
                          <span class="ml-2">Invoices</span>
                        </router-link>
                        <router-link :to="{name: 'payments-list'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='credit-card'></box-icon>
                          <span class="ml-2">Payments</span>
                        </router-link>
                        <!-- New Expenses menu item -->
                        <router-link :to="{name: 'expenses-list'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='wallet'></box-icon>
                          <span class="ml-2">Expenses</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>  
              </div>

              <div class="relative" >
                <!-- Service dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='analyse'></box-icon>
                        Service
                        <svg :class="dropdownSales ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'suppliers'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='buildings'></box-icon>
                          <span class="ml-2">Suppliers</span>
                        </router-link>
                        <router-link :to="{name: 'insurance-reports'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='business'></box-icon>
                          <span class="ml-2">Insurance</span>
                        </router-link>                        
                        <router-link :to="{name: 'notes'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='notepad'></box-icon>
                          <span class="ml-2">Notes</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>  
              </div>

              
            </div>
          </div>
        </div>

        <div class="hidden md:block">
          <div class="ml-4 flex items-center md:ml-6">

            <!-- Universal Search Input -->
            <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md mr-4" ref="searchInputRef">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <font-awesome-icon icon="search" class="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search..."
                class="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div v-if="isSearching || searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <font-awesome-icon v-if="isSearching" icon="spinner" class="fa-spin h-5 w-5 text-gray-400" />
                <button v-else-if="searchQuery" @click="clearSearch" class="text-gray-400 hover:text-gray-300 focus:outline-none">
                  <font-awesome-icon icon="times" class="h-5 w-5" />
                </button>
              </div>

              <!-- Search Results Dropdown -->
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showResultsDropdown && searchResults.length > 0"
                  ref="searchResultsRef"
                  class="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto"
                >
                  <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a
                      v-for="result in searchResults"
                      :key="result.type + '-' + result.id"
                      href="#"
                      @click.prevent="navigateToResult(result)"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      role="menuitem"
                    >
                      <div class="font-semibold">{{ result.title }} <span class="text-xs text-gray-500 dark:text-gray-400">({{ result.type }})</span></div>
                      <div class="text-xs text-gray-600 dark:text-gray-300 truncate">{{ result.details }}</div>
                    </a>
                  </div>
                </div>
                <div
                  v-else-if="showResultsDropdown && searchResults.length === 0 && !isSearching"
                  ref="searchResultsRef"
                  class="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                 >
                   <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No results found.</div>
                 </div>
              </transition>
            </div>
            <!-- End Universal Search -->
                    
            <div class="relative w-52 mr-5">
              <Listbox v-model="selectedWebsite">
              <div class="relative mt-1">
                <ListboxButton
                  class="relative w-full cursor-default rounded-lg bg-white py-1 pl-3 pr-3 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate"> {{ opt.filter(a => a.value == selectedWebsite)?.length && selectedWebsite ? opt.filter(a => a.value == selectedWebsite)[0].label : '' }}</span>
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                    </svg>
                  </span>
                </ListboxButton>

                <transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    <ListboxOption
                      v-slot="{ active, selected }"
                      v-for="website in opt"
                      :key="website.label"
                      :value="website.value"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                        ]"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block truncate',
                          ]"
                        >
                          {{ website.label }}</span>
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                        >
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>

                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </div>
            </Listbox>
            </div>
            
            <!-- Dark Mode Toggle Button -->
            <button
              @click="themeStore.toggleDarkMode"
              type="button"
              class="ml-3 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              title="Toggle Dark Mode"
            >
              <span class="sr-only">Toggle Dark Mode</span>
              <font-awesome-icon :icon="themeStore.isDarkMode ? 'sun' : 'moon'" class="h-6 w-6" />
            </button>

            <notifications></notifications>

            <p class="text-white text-sm">Hello, {{ userStore.user.firstName }}.</p>

            <!-- Profile dropdown -->
            <Menu as="div" class="ml-3 relative">
              <div>
                <MenuButton
                  class="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                  <span class="sr-only">Open user menu</span>
                  <div class="overflow-hidden relative w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg class="absolute -left-1 w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clip-rule="evenodd"></path>
                    </svg>
                  </div>
                </MenuButton>
              </div>
              <transition enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95">
                <MenuItems
                  class="origin-top-right absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                    class="origin-top-right absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <router-link :to="{name: 'profile'}" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Your Profile</router-link>
                    <router-link :to="{name: 'billing'}" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Billing & Usage</router-link>
                    <router-link :to="{name: 'snippet'}" v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Snippet</router-link>
                    <router-link :to="{name: 'feedback'}" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Feedback</router-link>
                    <router-link :to="{name: 'settings'}" v-if="userStore.user.permission == 'owner'" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Settings</router-link>
                    <div @click="addModal = true" v-if="userStore.user.permission == 'owner'" class="block px-4 py-2 text-sm text-gray-700 cursor-pointer" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Add Website</div>                    
                    <a href="#" @click="logout" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-22" role="menuitem" tabindex="-1">Sign out</a>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>

        <div class="-mr-2 flex md:hidden">
          <!-- Mobile menu button -->
          <DisclosureButton
            class="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
            <span class="sr-only">Open main menu</span>
            <svg v-if="!open" class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>

            <svg v-else class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <!-- Dashboard links -->
        <router-link :to="{name: 'admin-dashboard'}" v-if="userStore.user.permission === 'owner' || userStore.user.permission === 'admin'" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Overview Dashboard
        </router-link>
        <router-link :to="{name: 'technician-dashboard'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          My Dashboard
        </router-link>

        <!-- Activities -->
        <router-link :to="{name: 'notes'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Client Notes
        </router-link>

        <!-- Contacts -->
        <router-link :to="{name: 'contacts'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Contacts
        </router-link>
        <router-link :to="{name: 'employees'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Employees
        </router-link>
        <router-link :to="{name: 'users'}" v-if="userStore.user.role === 'admin' && userStore.user.permission === 'owner'" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Users
        </router-link>

        <!-- Marketing (for owners only) -->
        <template v-if="userStore.user.permission === 'owner'">
          <router-link :to="{name: 'visitors'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
            Visitors
          </router-link>
          <router-link :to="{name: 'pages'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
            Pages
          </router-link>
          <router-link :to="{name: 'forms'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
            Forms
          </router-link>
        </template>

        <!-- Sales -->
        <router-link :to="{name: 'jobs'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Jobs
        </router-link>
        <router-link :to="{name: 'estimates'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Estimates
        </router-link>
        <router-link :to="{name: 'invoices'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Invoices
        </router-link>
        <router-link :to="{name: 'payments-list'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Payments
        </router-link>
        <router-link :to="{name: 'expenses-list'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Expenses
        </router-link>

        <!-- Service -->
        <router-link :to="{name: 'suppliers'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Suppliers
        </router-link>
        <router-link :to="{name: 'insurance-reports'}" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Insurance
        </router-link>
      </div>

      <div class="pt-4 pb-3 border-t border-gray-700">
        <box-icon @click="addModal = true" type='solid' name='plus-circle'
          class="text-white cursor-pointer mx-2 h-6 w-6 rounded-full bg-white"></box-icon>
        <div class="relative flex items-center px-5 pb-6">
          <FormKit type="select" name="website" placeholder="select website" inner-class="selectClass"
            v-model="selectedWebsite" :options="opt">
          </FormKit>
          <font-awesome-icon icon="far fa-arrow-alt-circle-down" class="downarrow absolute" />
        </div>
        <div class="flex items-center px-5">
          <div class="flex-shrink-0">
            <div class="overflow-hidden relative w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-600">
              <svg class="absolute -left-1 w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd">
                </path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <div class="text-base font-medium leading-none text-white">{{ userStore.user.firstName }}</div>
            <div class="text-sm font-medium leading-none text-gray-400">{{ userStore.user.email }}</div>
          </div>
        </div>
        <div class="mt-3 px-2 space-y-1">
          <div class="mt-3 px-2 space-y-1">
            <router-link :to="{name: 'profile'}" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              Your Profile</router-link>
            <router-link :to="{name: 'billing'}" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">Billing
              & Usage</router-link>
            <router-link :to="{name: 'snippet'}" v-if="userStore.user.permission == 'owner'" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              Snippet</router-link>
            <router-link :to="{name: 'feedback'}" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              Feedback</router-link>
            <a disabled="false" @click="logout" href="#"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">Sign
              out</a>
          </div>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>

  <!-- Add Website modal -->
  <div id="addModal" tabindex="-1" :class="{ flex: addModal, hidden: !addModal }"
    class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Add a new website
          </h3>
          <button ref="closeDefaultModal" type="button"
            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            @click="addModal = false">
            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" id="profile" :form-class="submitted ? 'hide' : 'show'" submit-label="Create"
            @submit="addWebsite" :actions="false" #default="{}">
            <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
              <div class="w-full">
                <div class="">
                  <FormKit type="url" name="newWebsite" label="Website URL" label-class="text-left"
                    validation="required|url" help="Which website do you want to add?"
                    placeholder="https://www.google.com" />
                </div>
              </div>

            </div>
            <div class="text-right">
              <FormKit type="submit" label="Add" />
            </div>
          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="loading || addModal" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>

<style>
.bg-blueGray-800 {
  --tw-bg-opacity: 1;
  background-color: rgba(30, 41, 59, var(--tw-bg-opacity));
}

.custom-css-cal .selectClass select.formkit-input {
  color: white;
  --tw-bg-opacity: 1;
  background-color: rgba(30, 41, 59, var(--tw-bg-opacity));
  max-width: 17vw;
}

.custom-css-cal .formkit-outer {
  margin: 0 15px 0 0;
}

.custom-css-cal svg.downarrow {
  right: 20px;
  top: 14px;
  color: white;
}

.custom-css-cal select.formkit-input option {
  box-sizing: border-box;
  color: white !important;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 450px) {
  .custom-css-cal .formkit-outer {
    margin: 0;
    width: 100%;
  }

  .custom-css-cal svg.downarrow {
    right: 32px;
  }
}
</style>