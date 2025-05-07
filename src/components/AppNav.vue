<!-- wibiclick-frontend-vue/src/components/AppNav.vue -->
<script setup>
import axios from "axios";
import notifications from "./notification/notifications.vue";
import { useUserStore } from "@/stores/UserStore"
import { useUIStore } from '@/stores/UIStore';
import { useThemeStore } from '@/stores/theme';
import { useRouter, useRoute } from 'vue-router'; // Added useRoute to monitor route changes
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { 
  faSearch, 
  faSpinner, 
  faTimes, 
  faSun, 
  faMoon, 
  faChevronDown,
  faChevronRight,
  faSignOutAlt,
  faUser,
  faCog,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu, 
  MenuButton, 
  MenuItem, 
  MenuItems,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  // Transition is not exported directly from headlessui/vue
  // Use TransitionRoot and TransitionChild instead
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'

// Vue's built-in Transition component
import { Transition } from 'vue'

import { ref, computed, onMounted, watch, watchEffect, onBeforeUnmount, nextTick } from "vue";
import { storeToRefs } from 'pinia'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { useToast } from 'vue-toast-notification';

// Add all icons to library
library.add(
  faSearch, 
  faSpinner, 
  faTimes, 
  faSun, 
  faMoon, 
  faChevronDown, 
  faChevronRight,
  faSignOutAlt,
  faUser,
  faCog,
  faPlus
);

const toast = useToast();
const userStore = useUserStore();
const { currentWebsite, websites } = storeToRefs(userStore);
const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();
const themeStore = useThemeStore();

// State for modals and loading
const addModal = ref(false);
const submitted = ref(false);
const loading = ref(false);
const analytics = ref({});

// New centralized state for dropdown menus
const dropdownState = ref({
  dashboards: false,
  contacts: false,
  marketing: false,
  sales: false,
  service: false,
  pagesMobile: false
});

// Reference for mobile menu to close it programmatically
const mobileMenuOpen = ref(false);
const mobileMenuButtonRef = ref(null);

// State for unread notifications
const unreadNotifications = ref([]);

// --- Universal Search State & Logic ---
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const showResultsDropdown = ref(false);
const debounceTimer = ref(null);
const searchInputRef = ref(null);
const searchResultsRef = ref(null);
const isSearchFocused = ref(false);

// Function to close all dropdowns
const closeAllDropdowns = () => {
  Object.keys(dropdownState.value).forEach(key => {
    dropdownState.value[key] = false;
  });
};

// Close mobile menu
const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  closeAllDropdowns();
};

// Debounced Search Function with better error handling
const performSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    showResultsDropdown.value = false;
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  try {
    const response = await axios.get('/universal-search', {
      params: {
        id: userStore.currentWebsite,
        q: searchQuery.value,
        limit: 10
      }
    });
    searchResults.value = response.data.results || [];
    showResultsDropdown.value = searchResults.value.length > 0;
  } catch (error) {
    searchResults.value = [];
    showResultsDropdown.value = false;
    toast.error("Search failed. Please try again.");
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
    }, 300); // Reduced debounce for better UX
  } else {
    searchResults.value = [];
    showResultsDropdown.value = false;
  }
});

// Navigate to selected result with proper cleanup
const navigateToResult = (result) => {
  let routeName = '';
  let queryParams = {};

  switch (result.type) {
    case 'Customer':
      routeName = 'contact';
      queryParams = { customer_id: result.id };
      break;
    case 'Invoice':
      routeName = 'contact';
      queryParams = { customer_id: result.customer_id };
      break;
    case 'Estimate':
      routeName = 'contact';
      queryParams = { customer_id: result.customer_id };
      break;
    case 'Job':
      uiStore.openGlobalJobModal(result.id);
      break;
  }

  // Clear search and close dropdowns
  searchQuery.value = '';
  searchResults.value = [];
  showResultsDropdown.value = false;
  closeAllDropdowns();
  closeMobileMenu();

  // Handle navigation for non-Job types
  if (routeName) {
    router.push({ name: routeName, query: queryParams });
  }
};

// Clear search input
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showResultsDropdown.value = false;
  isSearchFocused.value = false;
};

// Improved click away handler with focus management
const handleClickOutside = (event) => {
  // Handle search results dropdown
  if (
    searchInputRef.value && 
    !searchInputRef.value.contains(event.target) &&
    searchResultsRef.value && 
    !searchResultsRef.value.contains(event.target)
  ) {
    showResultsDropdown.value = false;
  }
};

// Handle focusing on search input
const handleSearchFocus = () => {
  isSearchFocused.value = true;
  if (searchQuery.value.length >= 2 && searchResults.value.length > 0) {
    showResultsDropdown.value = true;
  }
};

// Handle losing focus on search input
const handleSearchBlur = () => {
  isSearchFocused.value = false;
  // Keep dropdown open if user is interacting with results
  setTimeout(() => {
    if (!searchResultsRef.value?.contains(document.activeElement)) {
      showResultsDropdown.value = false;
    }
  }, 100);
};

// Toggle specific dropdown and close others
const toggleDropdown = (dropdown) => {
  // First close all dropdowns
  const currentState = dropdownState.value[dropdown];
  closeAllDropdowns();
  // Then toggle the target dropdown
  dropdownState.value[dropdown] = !currentState;
};

// Computed props
const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
});

const websiteOptions = computed(() => [
  { label: 'Select Website', value: 'default', attrs: { disabled: true } },
  ...websites.value
]);

// Utility functions
function logout() {
  userStore.$reset();
  localStorage.removeItem('user');
  localStorage.removeItem('UserStore');
  localStorage.removeItem('darkMode');
  closeAllDropdowns();
  closeMobileMenu();
  router.push('/login');
}

// Navigation event handler - used for all nav links
const handleNavigate = (routeName, query = {}) => {
  closeAllDropdowns();
  closeMobileMenu();
  router.push({ name: routeName, query });
};

// API functions
async function fetchWebsites() {
  try {
    loading.value = true;
    const response = await axios.get(`get-websites-for-user?id=${userStore.user.id}`);
    const formattedWebsites = response.data.map(site => ({
      label: site.label,
      value: site.value
    }));
    userStore.setWebsites(formattedWebsites);
    if (formattedWebsites.length > 0 && userStore.currentWebsite === "default") {
      userStore.updateWebsite(formattedWebsites[0].value);
    }
    loading.value = false;
  } catch (error) {
    toast.error("Error getting website data");
    loading.value = false;
  }
}

async function fetchWebsiteAnalytics(id) {
  try {
    loading.value = true;
    const response = await axios.get('get-website-analytics?id=' + id);
    analytics.value = response.data.analytics[0];
    userStore.updateAnalytics(analytics.value);
    loading.value = false;
  } catch (error) {
    toast.error("Error getting website analytics data");
    loading.value = false;
  }
}

async function fetchSettings(id) {
  try {
    loading.value = true;
    const response = await axios.get('get-website?id=' + id);
    userStore.updateSettings(response.data.setting);
    loading.value = false;
  } catch (error) {
    toast.error("Error getting website settings");
    loading.value = false;
  }
}

async function addWebsite(credentials) {
  try {
    addModal.value = false;
    loading.value = true;
    await axios.post('add-website', { url: credentials.newWebsite });
    fetchWebsites();
    toast.success("Website added successfully");
    loading.value = false;
  } catch (error) {
    toast.error('Error Adding website');
    loading.value = false;
  }
}

// Lifecycle hooks
onMounted(() => {
  if (!userStore.user) {
    logout();
  } else {
    fetchWebsites();
    document.addEventListener('click', handleClickOutside);
    
    // Watch for route changes to close menus
    watch(
      () => route.fullPath,
      () => {
        closeAllDropdowns();
        closeMobileMenu();
      }
    );
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  clearTimeout(debounceTimer.value);
});

// Website change watcher
watch(selectedWebsite, (newValue) => {
  if (newValue && newValue !== 'default') {
    fetchWebsiteAnalytics(newValue);
    fetchSettings(newValue);
  }
});
</script>

<template>
  <!-- Loading Overlay -->
  <scale-loader 
    :loading="loading" 
    color="#ffffff" 
    height="50px" 
    class="vld-overlay is-active is-full-page" 
    width="6px"
  />
  
  <Disclosure 
    as="nav" 
    v-slot="{ open }" 
    class="bg-gray-800 shadow-lg"
    @click:outside="mobileMenuOpen = false"
  >
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Desktop Nav -->
        <div class="flex items-center">
          <!-- Logo -->
          <div class="flex-shrink-0">
            <router-link to="/" class="flex space-x-2 items-center" @click="closeMobileMenu">
              <div aria-hidden="true" class="flex space-x-1">
                <div class="h-6 w-2 bg-sky-500 rounded"></div>
                <div class="h-6 w-6 bg-sky-500 rounded-lg opacity-75"></div>
              </div>
              <span class="text-base font-bold text-white">Wibi Click</span>
            </router-link>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:block">
            <div class="ml-6 flex items-center space-x-1">
              
              <!-- Dashboards Dropdown -->
              <Menu as="div" class="relative">
                <MenuButton 
                  class="group flex items-center text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  @click="toggleDropdown('dashboards')"
                >
                  <box-icon color="white" class="mr-2" type="solid" name='dashboard'></box-icon>
                  <span>Dashboards</span>
                  <FontAwesomeIcon 
                    :icon="dropdownState.dashboards ? 'chevron-down' : 'chevron-right'" 
                    class="ml-2 w-3 h-3 transition-transform" 
                    :class="dropdownState.dashboards ? 'transform rotate-180' : ''"
                  />
                </MenuButton>
                
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems 
                    v-if="dropdownState.dashboards"
                    class="origin-top-right absolute left-0 mt-2 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[220px] z-50"
                  >
                    <div class="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-600">
                      Dashboards
                    </div>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'admin-dashboard'}" 
                        v-if="userStore.user.permission === 'owner' || userStore.user.permission === 'admin'" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='chart'></box-icon>
                        <span class="ml-2">Transactions Dashboard</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'technician-dashboard'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='user-detail'></box-icon>
                        <span class="ml-2">Technician Dashboard</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }" v-if="userStore.user.permission == 'owner'">
                      <router-link 
                        :to="{name: 'dashboard'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon type='solid' color="white" name='dashboard'></box-icon>
                        <span class="ml-2">Analytics Dashboard</span>
                      </router-link>
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
              
              <!-- Divider -->
              <div class="h-8 border-l border-gray-600 mx-1"></div>
              
              <!-- Contacts Dropdown -->
              <Menu as="div" class="relative">
                <MenuButton 
                  class="group flex items-center text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  @click="toggleDropdown('contacts')"
                >
                  <box-icon color="white" class="mr-2" type="solid" name='user-circle'></box-icon>
                  <span>Contacts</span>
                  <FontAwesomeIcon 
                    :icon="dropdownState.contacts ? 'chevron-down' : 'chevron-right'" 
                    class="ml-2 w-3 h-3 transition-transform" 
                    :class="dropdownState.contacts ? 'transform rotate-180' : ''"
                  />
                </MenuButton>
                
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems 
                    v-if="dropdownState.contacts"
                    class="origin-top-right absolute left-0 mt-2 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[200px] z-50"
                  >
                    <div class="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-600">
                      Contacts
                    </div>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'contacts'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='user-detail'></box-icon>
                        <span class="ml-2">Contacts</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{ name: 'merge-overview' }" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type="solid" name="user-check"></box-icon>
                        <span class="ml-2">Customer Merges</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'employees'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='user'></box-icon>
                        <span class="ml-2">Employees</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }" v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'">
                      <router-link 
                        :to="{name: 'users'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type="solid" name='user-account'></box-icon>
                        <span class="ml-2">Users</span>
                      </router-link>
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
              
              <!-- Divider -->
              <div class="h-8 border-l border-gray-600 mx-1"></div>
              
              <!-- Marketing Dropdown (owner only) -->
              <Menu v-if="userStore.user.permission == 'owner'" as="div" class="relative">
                <MenuButton 
                  class="group flex items-center text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  @click="toggleDropdown('marketing')"
                >
                  <box-icon color="white" class="mr-2" type="solid" name='store'></box-icon>
                  <span>Marketing</span>
                  <FontAwesomeIcon 
                    :icon="dropdownState.marketing ? 'chevron-down' : 'chevron-right'" 
                    class="ml-2 w-3 h-3 transition-transform" 
                    :class="dropdownState.marketing ? 'transform rotate-180' : ''"
                  />
                </MenuButton>
                
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems 
                    v-if="dropdownState.marketing"
                    class="origin-top-right absolute left-0 mt-2 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[200px] z-50"
                  >
                    <div class="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-600">
                      Marketing
                    </div>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'visitors'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='user-check'></box-icon>
                        <span class="ml-2">Visitors</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'forms'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='book'></box-icon>
                        <span class="ml-2">Forms</span>
                      </router-link>
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
              
              <!-- Divider - only show if marketing is visible -->
              <div v-if="userStore.user.permission == 'owner'" class="h-8 border-l border-gray-600 mx-1"></div>
              
              <!-- Sales Dropdown -->
              <Menu as="div" class="relative">
                <MenuButton 
                  class="group flex items-center text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  @click="toggleDropdown('sales')"
                >
                  <box-icon color="white" class="mr-2" type="solid" name='cart-download'></box-icon>
                  <span>Sales</span>
                  <FontAwesomeIcon 
                    :icon="dropdownState.sales ? 'chevron-down' : 'chevron-right'" 
                    class="ml-2 w-3 h-3 transition-transform" 
                    :class="dropdownState.sales ? 'transform rotate-180' : ''"
                  />
                </MenuButton>
                
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems 
                    v-if="dropdownState.sales"
                    class="origin-top-right absolute left-0 mt-2 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[200px] z-50"
                  >
                    <div class="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-600">
                      Sales
                    </div>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'jobs'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='business'></box-icon>
                        <span class="ml-2">Jobs</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'estimates'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" name='receipt'></box-icon>
                        <span class="ml-2">Estimates</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'invoices'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='receipt'></box-icon>
                        <span class="ml-2">Invoices</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'payments-list'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='credit-card'></box-icon>
                        <span class="ml-2">Payments</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'expenses-list'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='wallet'></box-icon>
                        <span class="ml-2">Expenses</span>
                      </router-link>
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
              
              <!-- Divider -->
              <div class="h-8 border-l border-gray-600 mx-1"></div>
              
              <!-- Service Dropdown -->
              <Menu as="div" class="relative">
                <MenuButton 
                  class="group flex items-center text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  @click="toggleDropdown('service')"
                >
                  <box-icon color="white" class="mr-2" type="solid" name='analyse'></box-icon>
                  <span>Service</span>
                  <FontAwesomeIcon 
                    :icon="dropdownState.service ? 'chevron-down' : 'chevron-right'" 
                    class="ml-2 w-3 h-3 transition-transform" 
                    :class="dropdownState.service ? 'transform rotate-180' : ''"
                  />
                </MenuButton>
                
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems 
                    v-if="dropdownState.service"
                    class="origin-top-right absolute left-0 mt-2 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[200px] z-50"
                  >
                    <div class="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-600">
                      Service
                    </div>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'suppliers'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='buildings'></box-icon>
                        <span class="ml-2">Suppliers</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'insurance-reports'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='business'></box-icon>
                        <span class="ml-2">Insurance</span>
                      </router-link>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <router-link 
                        :to="{name: 'notes'}" 
                        class="flex items-center px-4 py-2 text-sm text-gray-200"
                        :class="active ? 'bg-gray-600' : ''"
                        @click="closeAllDropdowns"
                      >
                        <box-icon color="white" type='solid' name='notepad'></box-icon>
                        <span class="ml-2">Notes</span>
                      </router-link>
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <!-- Right side with search, website selector, and profile dropdown -->
        <div class="hidden md:flex items-center">
          <!-- Universal Search -->
          <div class="relative mr-4" ref="searchInputRef">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon="search" class="h-4 w-4 text-gray-400" />
            </div>
            
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search..."
              class="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              :class="{'w-64': !isSearchFocused, 'w-80': isSearchFocused}"
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
            />
            
            <div v-if="isSearching || searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FontAwesomeIcon 
                v-if="isSearching" 
                icon="spinner" 
                class="fa-spin h-4 w-4 text-gray-400" 
                aria-label="Searching"
              />
              <button 
                v-else-if="searchQuery" 
                @click="clearSearch" 
                class="text-gray-400 hover:text-gray-300 focus:outline-none"
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon="times" class="h-4 w-4" />
              </button>
            </div>

            <!-- Search Results Dropdown -->
            <Transition
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
                class="absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto"
              >
                <div class="py-1" role="menu" aria-orientation="vertical">
                  <a
                    v-for="result in searchResults"
                    :key="result.type + '-' + result.id"
                    href="#"
                    @click.prevent="navigateToResult(result)"
                    class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150"
                    :class="result.type === 'Job' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'"
                    role="menuitem"
                  >
                    <div class="font-semibold">{{ result.title }} <span class="text-xs text-gray-500 dark:text-gray-400">({{ result.type }})</span></div>
                    <div class="text-xs text-gray-600 dark:text-gray-300 truncate">{{ result.details }}</div>
                  </a>
                </div>
              </div>
              <div
                v-else-if="showResultsDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2"
                ref="searchResultsRef"
                class="absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
              >
                <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No results found.</div>
              </div>
            </Transition>
          </div>
          
          <!-- Website Selector -->
          <div class="relative min-w-[13rem] max-w-xs w-auto mr-4">
            <Listbox v-model="selectedWebsite">
              <div class="relative">
                <ListboxButton
                  class="relative w-full cursor-default rounded-md bg-gray-700 text-gray-200 py-2 pl-3 pr-8 text-left shadow-sm flex items-center focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                >
                  <span class="block truncate">
                    {{ websiteOptions.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
                  </span>
                  <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FontAwesomeIcon icon="chevron-down" class="h-4 w-4 text-gray-400" />
                  </span>
                </ListboxButton>

                <Transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-gray-600 ring-opacity-5 focus:outline-none sm:text-sm text-gray-200"
                  >
                    <ListboxOption
                      v-slot="{ active, selected }"
                      v-for="website in websiteOptions"
                      :key="website.label"
                      :value="website.value"
                      :disabled="website.attrs?.disabled"
                    >
                      <li
                        :class="[
                          active ? 'bg-indigo-600 text-white' : 'text-gray-200',
                          website.attrs?.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                          'relative select-none py-2 pl-8 pr-4',
                        ]"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block truncate',
                          ]"
                        >
                          {{ website.label }}
                        </span>
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-2 text-indigo-400"
                        >
                          <FontAwesomeIcon icon="check" class="h-4 w-4" />
                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          </div>
          
          <!-- Theme Toggle -->
          <button
            @click="themeStore.toggleDarkMode"
            type="button"
            class="mr-3 p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors"
            :aria-label="themeStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <FontAwesomeIcon :icon="themeStore.isDarkMode ? 'sun' : 'moon'" class="h-5 w-5" />
          </button>
          
          <!-- Notifications -->
          <notifications class="mr-3"></notifications>
          
          <!-- Welcome Text -->
          <span class="text-white text-sm hidden lg:inline-block">
            Hello, {{ userStore.user.firstName }}.
          </span>
          
          <!-- Profile Dropdown -->
          <Menu as="div" class="ml-3 relative">
            <div>
              <MenuButton
                class="max-w-xs bg-gray-700 rounded-full flex items-center text-sm focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors"
              >
                <span class="sr-only">Open user menu</span>
                <div class="overflow-hidden relative w-9 h-9 bg-gray-100 rounded-full dark:bg-gray-600">
                  <FontAwesomeIcon icon="user" class="absolute -left-1/2 -top-1/2 transform translate-x-1/2 translate-y-1/2 w-12 h-12 text-gray-400" />
                </div>
              </MenuButton>
            </div>
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-600 z-50"
              >
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <router-link 
                      :to="{name: 'profile'}" 
                      class="block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                      @click="closeAllDropdowns"
                    >
                      Your Profile
                    </router-link>
                  </MenuItem>
                  
                  <MenuItem v-slot="{ active }">
                    <router-link 
                      :to="{name: 'billing'}" 
                      class="block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                      @click="closeAllDropdowns"
                    >
                      Billing & Usage
                    </router-link>
                  </MenuItem>
                  
                  <MenuItem v-slot="{ active }" v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'">
                    <router-link 
                      :to="{name: 'snippet'}" 
                      class="block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                      @click="closeAllDropdowns"
                    >
                      Snippet
                    </router-link>
                  </MenuItem>
                  
                  <MenuItem v-slot="{ active }">
                    <router-link 
                      :to="{name: 'feedback'}" 
                      class="block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                      @click="closeAllDropdowns"
                    >
                      Feedback
                    </router-link>
                  </MenuItem>
                </div>
                
                <div class="py-1">
                  <MenuItem v-slot="{ active }" v-if="userStore.user.permission == 'owner'">
                    <router-link 
                      :to="{name: 'settings'}" 
                      class="block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                      @click="closeAllDropdowns"
                    >
                      Widget Settings
                    </router-link>
                  </MenuItem>
                  
                  <MenuItem v-slot="{ active }" v-if="userStore.user.permission == 'owner'">
                    <button 
                      @click="addModal = true; closeAllDropdowns()" 
                      class="w-full text-left block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                    >
                      Add Website
                    </button>
                  </MenuItem>
                </div>
                
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <button 
                      @click="logout" 
                      class="w-full text-left block px-4 py-2 text-sm text-gray-200"
                      :class="{'bg-gray-600': active}"
                    >
                      Sign out
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Transition>
          </Menu>
        </div>

        <!-- Mobile menu button -->
        <div class="flex md:hidden">
          <DisclosureButton
            ref="mobileMenuButtonRef"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white transition-colors"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span class="sr-only">{{ mobileMenuOpen ? 'Close main menu' : 'Open main menu' }}</span>
            <svg 
              v-if="!mobileMenuOpen" 
              class="block h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke-width="1.5" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>

            <svg 
              v-else 
              class="block h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke-width="1.5" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DisclosureButton>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <!-- Use Vue's built-in Transition -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <DisclosurePanel v-if="mobileMenuOpen" class="md:hidden bg-gray-700">
        <!-- Mobile Search -->
        <div class="p-4">
          <div class="relative w-full mb-2">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon="search" class="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search..."
              class="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <div v-if="isSearching || searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FontAwesomeIcon v-if="isSearching" icon="spinner" class="fa-spin h-4 w-4 text-gray-400" />
              <button 
                v-else-if="searchQuery" 
                @click="clearSearch" 
                class="text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <FontAwesomeIcon icon="times" class="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <!-- Mobile Search Results -->
          <Transition
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
              class="mt-2 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto"
            >
              <div class="py-1" role="menu" aria-orientation="vertical">
                <a
                  v-for="result in searchResults"
                  :key="result.type + '-' + result.id"
                  href="#"
                  @click.prevent="navigateToResult(result)"
                  class="block px-4 py-2 text-sm hover:bg-gray-700 transition duration-150"
                  :class="result.type === 'Job' ? 'text-indigo-400' : 'text-gray-200'"
                  role="menuitem"
                >
                  <div class="font-semibold">{{ result.title }} <span class="text-xs text-gray-400">({{ result.type }})</span></div>
                  <div class="text-xs text-gray-400 truncate">{{ result.details }}</div>
                </a>
              </div>
            </div>
            <div
              v-else-if="showResultsDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2"
              ref="searchResultsRef"
              class="mt-2 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            >
              <div class="px-4 py-3 text-sm text-gray-400">No results found.</div>
            </div>
          </Transition>
        </div>
        
        <!-- Mobile Navigation Menu -->
        <div class="px-2 pt-2 pb-4 space-y-1 sm:px-3">
          <!-- Dashboards Dropdown -->
          <div>
            <button
              @click="toggleDropdown('dashboards')"
              class="w-full flex items-center justify-between text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <span class="flex items-center">
                <box-icon color="white" class="mr-2" type="solid" name="dashboard"></box-icon>
                Dashboards
              </span>
              <FontAwesomeIcon
                :icon="dropdownState.dashboards ? 'chevron-down' : 'chevron-right'"
                class="w-3 h-3 transition-transform"
                :class="dropdownState.dashboards ? 'transform rotate-180' : ''"
              />
            </button>
            
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="dropdownState.dashboards" class="pl-6 mt-1 space-y-1">
                <router-link
                  :to="{ name: 'admin-dashboard' }"
                  v-if="userStore.user.permission === 'owner' || userStore.user.permission === 'admin'"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Transactions Dashboard
                </router-link>
                <router-link
                  :to="{ name: 'technician-dashboard' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Technician Dashboard
                </router-link>
                <router-link
                  :to="{ name: 'dashboard' }"
                  v-if="userStore.user.permission == 'owner'"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Analytics Dashboard
                </router-link>
              </div>
            </Transition>
          </div>
          
          <!-- Contacts Dropdown -->
          <div>
            <button
              @click="toggleDropdown('contacts')"
              class="w-full flex items-center justify-between text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <span class="flex items-center">
                <box-icon color="white" class="mr-2" type="solid" name="user-circle"></box-icon>
                Contacts
              </span>
              <FontAwesomeIcon
                :icon="dropdownState.contacts ? 'chevron-down' : 'chevron-right'"
                class="w-3 h-3 transition-transform"
                :class="dropdownState.contacts ? 'transform rotate-180' : ''"
              />
            </button>
            
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="dropdownState.contacts" class="pl-6 mt-1 space-y-1">
                <router-link
                  :to="{ name: 'contacts' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Contacts
                </router-link>
                <router-link
                  :to="{ name: 'merge-overview' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Customer Merges
                </router-link>
                <router-link
                  :to="{ name: 'employees' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Employees
                </router-link>
                <router-link
                  :to="{ name: 'users' }"
                  v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Users
                </router-link>
              </div>
            </Transition>
          </div>
          
          <!-- Marketing Dropdown (owner only) -->
          <div v-if="userStore.user.permission == 'owner'">
            <button
              @click="toggleDropdown('marketing')"
              class="w-full flex items-center justify-between text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <span class="flex items-center">
                <box-icon color="white" class="mr-2" type="solid" name="store"></box-icon>
                Marketing
              </span>
              <FontAwesomeIcon
                :icon="dropdownState.marketing ? 'chevron-down' : 'chevron-right'"
                class="w-3 h-3 transition-transform"
                :class="dropdownState.marketing ? 'transform rotate-180' : ''"
              />
            </button>
            
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="dropdownState.marketing" class="pl-6 mt-1 space-y-1">
                <router-link
                  :to="{ name: 'visitors' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Visitors
                </router-link>
                <router-link
                  :to="{ name: 'forms' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Forms
                </router-link>
              </div>
            </Transition>
          </div>
          
          <!-- Sales Dropdown -->
          <div>
            <button
              @click="toggleDropdown('sales')"
              class="w-full flex items-center justify-between text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <span class="flex items-center">
                <box-icon color="white" class="mr-2" type="solid" name="cart-download"></box-icon>
                Sales
              </span>
              <FontAwesomeIcon
                :icon="dropdownState.sales ? 'chevron-down' : 'chevron-right'"
                class="w-3 h-3 transition-transform"
                :class="dropdownState.sales ? 'transform rotate-180' : ''"
              />
            </button>
            
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="dropdownState.sales" class="pl-6 mt-1 space-y-1">
                <router-link
                  :to="{ name: 'jobs' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Jobs
                </router-link>
                <router-link
                  :to="{ name: 'estimates' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Estimates
                </router-link>
                <router-link
                  :to="{ name: 'invoices' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Invoices
                </router-link>
                <router-link
                  :to="{ name: 'payments-list' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Payments
                </router-link>
                <router-link
                  :to="{ name: 'expenses-list' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Expenses
                </router-link>
              </div>
            </Transition>
          </div>
          
          <!-- Service Dropdown -->
          <div>
            <button
              @click="toggleDropdown('service')"
              class="w-full flex items-center justify-between text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              <span class="flex items-center">
                <box-icon color="white" class="mr-2" type="solid" name="analyse"></box-icon>
                Service
              </span>
              <FontAwesomeIcon
                :icon="dropdownState.service ? 'chevron-down' : 'chevron-right'"
                class="w-3 h-3 transition-transform"
                :class="dropdownState.service ? 'transform rotate-180' : ''"
              />
            </button>
            
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="dropdownState.service" class="pl-6 mt-1 space-y-1">
                <router-link
                  :to="{ name: 'suppliers' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Suppliers
                </router-link>
                <router-link
                  :to="{ name: 'insurance-reports' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Insurance
                </router-link>
                <router-link
                  :to="{ name: 'notes' }"
                  class="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  @click="closeMobileMenu"
                >
                  Notes
                </router-link>
              </div>
            </Transition>
          </div>
        </div>
        
        <!-- Mobile User Menu -->
        <div class="pt-4 pb-3 border-t border-gray-700">
          <!-- Website Selector -->
          <div class="px-4 py-3">
            <Listbox v-model="selectedWebsite">
              <div class="relative">
                <ListboxButton
                  class="relative w-full cursor-default rounded-md bg-gray-800 text-gray-200 py-2 pl-3 pr-10 text-left shadow-sm flex items-center focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                >
                  <span class="block truncate">
                    {{ websiteOptions.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
                  </span>
                  <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FontAwesomeIcon icon="chevron-down" class="h-4 w-4 text-gray-400" />
                  </span>
                </ListboxButton>

                <Transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-gray-600 ring-opacity-5 focus:outline-none sm:text-sm text-gray-200"
                  >
                    <ListboxOption
                      v-slot="{ active, selected }"
                      v-for="website in websiteOptions"
                      :key="website.label"
                      :value="website.value"
                      :disabled="website.attrs?.disabled"
                    >
                      <li
                        :class="[
                          active ? 'bg-indigo-600 text-white' : 'text-gray-200',
                          website.attrs?.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                          'relative select-none py-2 pl-8 pr-4',
                        ]"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block truncate',
                          ]"
                        >
                          {{ website.label }}
                        </span>
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-2 text-indigo-400"
                        >
                          <FontAwesomeIcon icon="check" class="h-4 w-4" />
                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          </div>
          
          <!-- User Info -->
          <div class="flex items-center px-4 py-3">
            <div class="flex-shrink-0">
              <div class="overflow-hidden relative w-10 h-10 bg-gray-600 rounded-full">
                <FontAwesomeIcon icon="user" class="absolute -left-1/2 -top-1/2 transform translate-x-1/2 translate-y-1/2 w-12 h-12 text-gray-400" />
              </div>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-white">{{ userStore.user.firstName }}</div>
              <div class="text-sm font-medium text-gray-400">{{ userStore.user.email }}</div>
            </div>
          </div>
          
          <!-- Mobile User Actions -->
          <div class="mt-3 px-2 space-y-1">
            <router-link 
              :to="{name: 'profile'}" 
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
              @click="closeMobileMenu"
            >
              Your Profile
            </router-link>
            
            <router-link 
              :to="{name: 'billing'}" 
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
              @click="closeMobileMenu"
            >
              Billing & Usage
            </router-link>
            
            <router-link 
              :to="{name: 'snippet'}" 
              v-if="userStore.user.permission == 'owner'" 
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
              @click="closeMobileMenu"
            >
              Snippet
            </router-link>
            
            <router-link 
              :to="{name: 'feedback'}" 
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
              @click="closeMobileMenu"
            >
              Feedback
            </router-link>
            
            <button
              v-if="userStore.user.permission == 'owner'"
              @click="addModal = true; closeMobileMenu()"
              class="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
            >
              Add Website
            </button>
            
            <button
              @click="logout"
              class="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
            >
              <span class="flex items-center">
                <FontAwesomeIcon icon="sign-out-alt" class="mr-2" />
                Sign out
              </span>
            </button>
          </div>
        </div>
      </DisclosurePanel>
    </Transition>
  </Disclosure>

  <!-- Add Website Modal -->
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="addModal" 
      class="fixed inset-0 z-50 overflow-y-auto" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <!-- Center modal properly -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <!-- Modal header -->
          <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Add a new website
            </h3>
            <button 
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              @click="addModal = false"
            >
              <FontAwesomeIcon icon="times" class="w-5 h-5" />
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          
          <!-- Modal body -->
          <div class="p-6 space-y-6">
            <FormKit 
              type="form" 
              id="websiteForm" 
              :form-class="submitted ? 'hide' : 'show'" 
              submit-label="Add Website" 
              @submit="addWebsite" 
              :actions="false" 
              #default="{}"
            >
              <div class="space-y-4">
                <FormKit 
                  type="url" 
                  name="newWebsite" 
                  label="Website URL" 
                  label-class="text-gray-700 dark:text-gray-300 font-medium mb-1 block"
                  input-class="w-full px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  validation="required|url" 
                  validation-visibility="live"
                  validation-label="Website URL"
                  help="Which website do you want to add?"
                  help-class="text-sm text-gray-500 dark:text-gray-400 mt-1"
                  message-class="text-sm text-red-600 dark:text-red-400 mt-1"
                  placeholder="https://www.example.com" 
                />
                
                <div class="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click="addModal = false"
                  >
                    Cancel
                  </button>
                  
                  <FormKit 
                    type="submit"
                    input-class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Website
                  </FormKit>
                </div>
              </div>
            </FormKit>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Loading Overlay -->
  <div v-if="loading || addModal" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>

<style>
/* Modern component styles */
.nav-item {
  @apply flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors;
}

.dropdown-item {
  @apply flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 text-sm transition-colors;
}

/* Fix FormKit styles for dark mode */
.formkit-wrapper {
  color: inherit !important;
}

.formkit-outer {
  margin-bottom: 0.75rem;
}

.formkit-label {
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.formkit-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 150ms ease-in-out;
}

.formkit-help {
  font-size: 0.875rem;
  color: rgb(107, 114, 128);
  margin-top: 0.25rem;
}

.formkit-messages {
  margin-top: 0.25rem;
  color: rgb(220, 38, 38);
  font-size: 0.875rem;
}

/* Add smooth transitions */
.transition-height {
  transition: max-height 0.3s ease-in-out;
  overflow: hidden;
}

/* Ensure dropdowns have proper z-index */
.origin-top-right {
  z-index: 50;
}

/* Improve mobile user experience */
@media (max-width: 767px) {
  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .space-y-1 > * + * {
    margin-top: 0.25rem;
  }
}
</style>