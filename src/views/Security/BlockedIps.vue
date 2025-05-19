<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/UserStore';
import BlockedIpsList from '@/components/Security/BlockedIpsList.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSun, faMoon, faSync, faBan, faShieldAlt } from '@fortawesome/free-solid-svg-icons'

library.add(faSun, faMoon, faSync, faBan, faShieldAlt);

const userStore = useUserStore();
const websiteId = computed(() => userStore.currentWebsite);
const isAllowed = computed(() =>
  userStore.user &&
  (userStore.user.permission === 'owner' || userStore.user.permission === 'admin')
);

// Dark mode state
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});

// Toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};

// BlockedIpsList reload logic
const blockedIpsListRef = ref(null);
const reloadBlockedIps = () => {
  if (blockedIpsListRef.value && blockedIpsListRef.value.fetchBlockedIps) {
    blockedIpsListRef.value.fetchBlockedIps();
  }
};

// For statistics card
const totalBlocked = ref(0);
const onBlockedIpsLoaded = (count) => {
  totalBlocked.value = count;
};
</script>

<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
          <font-awesome-icon icon="shield-alt" class="mr-3 text-indigo-500 dark:text-indigo-400" />
          Blocked IPs Management
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <button @click="reloadBlockedIps" class="btn-icon-modern" title="Reload Blocked IPs">
            <font-awesome-icon icon="sync" />
          </button>
          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <!-- Statistics Card -->
      <section class="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-modern p-4 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Blocked IPs</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalBlocked }}</p>
            </div>
            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <font-awesome-icon icon="ban" class="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </section>

      <!-- Permission/Error Handling and List -->
      <section>
        <div v-if="!isAllowed" class="bg-red-100 text-red-700 p-4 rounded card-modern">
          You do not have permission to view this page.
        </div>
        <div v-else>
          <BlockedIpsList
            ref="blockedIpsListRef"
            :website-id="websiteId"
            @blocked-ips-loaded="onBlockedIpsLoaded"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Modern Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}
</style>