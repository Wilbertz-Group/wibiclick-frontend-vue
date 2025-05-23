<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '@/stores/UserStore';
import BlockedIpsList from '@/components/Security/BlockedIpsList.vue';
import securityService from '@/services/securityService';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faSun, 
  faMoon, 
  faSync, 
  faBan, 
  faShieldAlt, 
  faDownload,
  faFilter,
  faSearch,
  faChartLine,
  faGlobe,
  faClock,
  faExclamationTriangle,
  faPlay,
  faPause,
  faEye,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faSun, faMoon, faSync, faBan, faShieldAlt, faDownload,
  faFilter, faSearch, faChartLine, faGlobe, faClock,
  faExclamationTriangle, faPlay, faPause, faEye, faFileExport
);

const userStore = useUserStore();
const websiteId = computed(() => userStore.currentWebsite);
const isAllowed = computed(() =>
  userStore.user &&
  (userStore.user.permission === 'owner' || userStore.user.permission === 'admin')
);

// Dark mode state
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

// Enhanced statistics
const stats = ref({
  totalBlocked: 0,
  recentBlocks: 0,
  totalAttacks: 0,
  attacksToday: 0,
  topAttackingCountries: [],
  recentAttacks: []
});

// Filters and search
const searchQuery = ref('');
const dateFilter = ref('24h');
const categoryFilter = ref('all');
const showFilters = ref(false);

// Real-time monitoring
const isMonitoring = ref(false);
const monitoringInterval = ref(null);
const notifications = ref([]);

// Loading states
const isLoadingStats = ref(false);
const isExporting = ref(false);

// Date filter options
const dateFilterOptions = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' }
];

// Category filter options
const categoryFilterOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'config', label: 'Config Files' },
  { value: 'api', label: 'API Keys' },
  { value: 'credentials', label: 'Credentials' },
  { value: 'environment', label: 'Environment Files' },
  { value: 'aws', label: 'AWS Related' },
  { value: 'gcp', label: 'GCP Related' },
  { value: 'stripe', label: 'Payment Systems' }
];

// BlockedIpsList reference
const blockedIpsListRef = ref(null);

// Initialize monitoring on mount
onMounted(async () => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  await loadSecurityStats();
  
  // Set up auto-refresh if enabled
  setupAutoRefresh();
  
  // Check if monitoring was previously active and auto-start
  if (websiteId.value) {
    try {
      const status = await securityService.getMonitoringStatus(websiteId.value);
      if (status.isActive) {
        await startRealTimeMonitoring();
      }
    } catch (error) {
      console.error('Failed to check monitoring status:', error);
    }
  }
});

onUnmounted(() => {
  stopRealTimeMonitoring();
  
  // Clean up auto-refresh
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
});

// Watch for website changes
watch(websiteId, async () => {
  if (websiteId.value) {
    await loadSecurityStats();
    reloadBlockedIps();
  }
});

// Load comprehensive security statistics
const loadSecurityStats = async () => {
  if (!websiteId.value) return;
  
  isLoadingStats.value = true;
  try {
    // Simulate API calls - replace with actual service calls
    const [blockedIpsData, attacksData, geoData] = await Promise.all([
      fetchBlockedIpsStats(),
      fetchAttackStats(),
      fetchGeoStats()
    ]);

    stats.value = {
      totalBlocked: blockedIpsData.total,
      recentBlocks: blockedIpsData.recent,
      totalAttacks: attacksData.total,
      attacksToday: attacksData.today,
      topAttackingCountries: geoData.countries,
      recentAttacks: attacksData.recent
    };
  } catch (error) {
    console.error('Failed to load security stats:', error);
    showNotification('Failed to load security statistics', 'error');
  } finally {
    isLoadingStats.value = false;
  }
};

// Load comprehensive security statistics using real API calls
const fetchBlockedIpsStats = async () => {
  try {
    const response = await securityService.getBlockedIps(websiteId.value, { 
      page: 1, 
      limit: 1000 // Get all for total count
    });
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = response.blockedIps?.filter(ip => 
      new Date(ip.createdAt) > oneDayAgo
    ).length || 0;

    return {
      total: response.total || 0,
      recent
    };
  } catch (error) {
    console.error('Failed to fetch blocked IPs stats:', error);
    return { total: 0, recent: 0 };
  }
};

const fetchAttackStats = async () => {
  try {
    const [analytics, recentEvents] = await Promise.all([
      securityService.getSecurityAnalytics(websiteId.value, dateFilter.value),
      securityService.getRecentSecurityEvents(websiteId.value, 10, dateFilter.value)
    ]);

    return {
      total: analytics.totalAttacks || 0,
      today: analytics.attacksToday || 0,
      recent: recentEvents.map(event => ({
        ip: event.ip,
        category: event.category,
        time: new Date(event.time),
        blocked: event.blocked,
        details: event.details
      }))
    };
  } catch (error) {
    console.error('Failed to fetch attack stats:', error);
    return { total: 0, today: 0, recent: [] };
  }
};

const fetchGeoStats = async () => {
  try {
    const geoData = await securityService.getGeographicAttackData(websiteId.value, dateFilter.value);
    return {
      countries: geoData.countries || []
    };
  } catch (error) {
    console.error('Failed to fetch geographic stats:', error);
    return { countries: [] };
  }
};

// Real-time monitoring using actual API calls
const startRealTimeMonitoring = async () => {
  if (isMonitoring.value || !websiteId.value) return;
  
  try {
    // Start monitoring session on backend
    await securityService.startMonitoring(websiteId.value);
    isMonitoring.value = true;
    
    // Poll for updates every 30 seconds
    monitoringInterval.value = setInterval(async () => {
      try {
        // Get monitoring status and recent events
        const [status, updatedStats] = await Promise.all([
          securityService.getMonitoringStatus(websiteId.value),
          loadSecurityStats()
        ]);
        
        // Check for new events
        if (status.recentEvents && status.recentEvents.length > 0) {
          const latestEvent = status.recentEvents[0];
          const eventTime = new Date(latestEvent.time);
          
          // Only show notifications for very recent events (last 60 seconds)
          if (Date.now() - eventTime.getTime() < 60000) {
            showNotification(
              `${latestEvent.blocked ? 'Blocked' : 'Detected'} ${latestEvent.category} attack from ${latestEvent.ip}`,
              latestEvent.blocked ? 'success' : 'warning'
            );
          }
        }
        
        await loadSecurityStats();
        
      } catch (error) {
        console.error('Real-time monitoring error:', error);
        // Don't stop monitoring for temporary errors
      }
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    console.error('Failed to start monitoring:', error);
    showNotification('Failed to start real-time monitoring', 'error');
    isMonitoring.value = false;
  }
};

const stopRealTimeMonitoring = async () => {
  if (monitoringInterval.value) {
    clearInterval(monitoringInterval.value);
    monitoringInterval.value = null;
  }
  
  if (isMonitoring.value && websiteId.value) {
    try {
      await securityService.stopMonitoring(websiteId.value);
    } catch (error) {
      console.error('Failed to stop monitoring on backend:', error);
    }
  }
  
  isMonitoring.value = false;
};

const toggleMonitoring = () => {
  if (isMonitoring.value) {
    stopRealTimeMonitoring();
    showNotification('Real-time monitoring stopped', 'info');
  } else {
    startRealTimeMonitoring();
    showNotification('Real-time monitoring started', 'success');
  }
};

// Auto-refresh preferences
const autoRefreshEnabled = ref(localStorage.getItem('wibi_auto_refresh') === 'true');
const autoRefreshInterval = ref(null);

// Setup auto-refresh
const setupAutoRefresh = () => {
  if (autoRefreshEnabled.value && !autoRefreshInterval.value) {
    autoRefreshInterval.value = setInterval(async () => {
      if (!isMonitoring.value) {
        await loadSecurityStats();
      }
    }, 60000); // Refresh every minute when monitoring is off
  }
};

const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  localStorage.setItem('wibi_auto_refresh', autoRefreshEnabled.value.toString());
  
  if (autoRefreshEnabled.value) {
    setupAutoRefresh();
    showNotification('Auto-refresh enabled', 'success');
  } else {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value);
      autoRefreshInterval.value = null;
    }
    showNotification('Auto-refresh disabled', 'info');
  }
};

// Utility functions
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};

const reloadBlockedIps = async () => {
  if (blockedIpsListRef.value && blockedIpsListRef.value.fetchBlockedIps) {
    await blockedIpsListRef.value.fetchBlockedIps();
  }
  // Also reload stats to keep everything in sync
  await loadSecurityStats();
};

const reloadStats = async () => {
  await loadSecurityStats();
  showNotification('Statistics refreshed', 'success');
};

// Export data using real API
const exportData = async () => {
  if (!websiteId.value) {
    showNotification('No website selected for export', 'error');
    return;
  }

  isExporting.value = true;
  try {
    // Export comprehensive security report
    const exportOptions = {
      format: 'json',
      timeRange: dateFilter.value || '30d',
      includeDetails: true
    };
    
    const blob = await securityService.exportSecurityReport(websiteId.value, exportOptions);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${websiteId.value}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Security report exported successfully', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showNotification('Failed to export security report', 'error');
  } finally {
    isExporting.value = false;
  }
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const resetFilters = () => {
  searchQuery.value = '';
  dateFilter.value = '24h';
  categoryFilter.value = 'all';
};

// Notification system
const showNotification = (message, type = 'info') => {
  const notification = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date()
  };
  
  notifications.value.unshift(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    const index = notifications.value.findIndex(n => n.id === notification.id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }, 5000);
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

// Computed properties
const filteredStats = computed(() => {
  // Apply filters to statistics based on current filter values
  return stats.value;
});

// For statistics card callback
const onBlockedIpsLoaded = (count) => {
  stats.value.totalBlocked = count;
};
</script>

<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <!-- Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 transform',
          {
            'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300': notification.type === 'success',
            'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300': notification.type === 'error',
            'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300': notification.type === 'warning',
            'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300': notification.type === 'info'
          }
        ]"
      >
        <div class="flex justify-between items-start">
          <p class="text-sm font-medium">{{ notification.message }}</p>
          <button @click="removeNotification(notification.id)" class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ×
          </button>
        </div>
        <p class="text-xs mt-1 opacity-75">{{ notification.timestamp.toLocaleTimeString() }}</p>
      </div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Enhanced Header Section -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 md:mb-14 space-y-4 lg:space-y-0">
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center mb-2">
            <font-awesome-icon icon="shield-alt" class="mr-3 text-indigo-500 dark:text-indigo-400" />
            Security Dashboard
          </h1>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl">
            Monitor blocked IPs, track security threats, and protect your website from malicious attacks in real-time.
          </p>
        </div>
        
        <div class="flex flex-wrap items-center gap-2">
          <!-- Real-time monitoring toggle -->
          <button 
            @click="toggleMonitoring" 
            :class="[
              'btn-icon-modern',
              isMonitoring ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''
            ]"
            :title="isMonitoring ? 'Stop monitoring' : 'Start monitoring'"
          >
            <font-awesome-icon :icon="isMonitoring ? 'pause' : 'play'" />
          </button>
          
          <!-- Auto-refresh toggle -->
          <button 
            @click="toggleAutoRefresh" 
            :class="[
              'btn-icon-modern',
              autoRefreshEnabled ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
            ]"
            title="Toggle auto-refresh"
          >
            <font-awesome-icon icon="sync" />
          </button>
          
          <!-- Export button -->
          <button 
            @click="exportData" 
            class="btn-icon-modern" 
            title="Export security report"
            :disabled="isExporting"
          >
            <font-awesome-icon icon="file-export" :class="{ 'animate-spin': isExporting }" />
          </button>
          
          <!-- Filter toggle -->
          <button 
            @click="toggleFilters" 
            :class="[
              'btn-icon-modern',
              showFilters ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''
            ]"
            title="Toggle filters"
          >
            <font-awesome-icon icon="filter" />
          </button>
          
          <!-- Refresh buttons -->
          <button @click="reloadStats" class="btn-icon-modern" title="Refresh statistics" :disabled="isLoadingStats">
            <font-awesome-icon icon="chart-line" :class="{ 'animate-spin': isLoadingStats }" />
          </button>
          
          <button @click="reloadBlockedIps" class="btn-icon-modern" title="Refresh blocked IPs">
            <font-awesome-icon icon="sync" />
          </button>
          
          <!-- Dark mode toggle -->
          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle dark mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <!-- Filters Section -->
      <section v-if="showFilters" class="mb-8 card-modern p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <font-awesome-icon icon="search" class="mr-2" />
              Search IP
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Enter IP address..."
              class="input-modern"
            />
          </div>
          
          <!-- Date Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <font-awesome-icon icon="clock" class="mr-2" />
              Time Range
            </label>
            <select v-model="dateFilter" class="input-modern">
              <option v-for="option in dateFilterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <font-awesome-icon icon="exclamation-triangle" class="mr-2" />
              Attack Category
            </label>
            <select v-model="categoryFilter" class="input-modern">
              <option v-for="option in categoryFilterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
          <!-- Reset Button -->
          <div class="flex items-end">
            <button @click="resetFilters" class="btn-secondary-modern w-full">
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Enhanced Statistics Dashboard -->
      <section class="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Blocked IPs -->
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Total Blocked IPs</p>
              <p class="stat-value">{{ isLoadingStats ? '...' : stats.totalBlocked }}</p>
              <p class="stat-change text-red-600 dark:text-red-400">
                +{{ stats.recentBlocks }} recent
              </p>
            </div>
            <div class="stat-icon bg-red-100 dark:bg-red-900/30">
              <font-awesome-icon icon="ban" class="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <!-- Total Attacks -->
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Total Attacks</p>
              <p class="stat-value">{{ isLoadingStats ? '...' : stats.totalAttacks }}</p>
              <p class="stat-change text-orange-600 dark:text-orange-400">
                {{ stats.attacksToday }} today
              </p>
            </div>
            <div class="stat-icon bg-orange-100 dark:bg-orange-900/30">
              <font-awesome-icon icon="exclamation-triangle" class="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <!-- Monitoring Status -->
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Monitoring</p>
              <p class="stat-value">{{ isMonitoring ? 'Active' : 'Inactive' }}</p>
              <p :class="[
                'stat-change text-xs',
                isMonitoring ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              ]">
                {{ isMonitoring ? 'Real-time protection' : autoRefreshEnabled ? 'Auto-refresh on' : 'Manual mode' }}
              </p>
            </div>
            <div :class="[
              'stat-icon',
              isMonitoring ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-900/30'
            ]">
              <font-awesome-icon 
                icon="eye" 
                :class="[
                  isMonitoring ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                ]" 
              />
            </div>
          </div>
        </div>

        <!-- Geographic Distribution -->
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Top Attack Source</p>
              <p class="stat-value">
                {{ stats.topAttackingCountries[0]?.name || 'N/A' }}
              </p>
              <p class="stat-change text-blue-600 dark:text-blue-400">
                {{ stats.topAttackingCountries[0]?.count || 0 }} attacks
              </p>
            </div>
            <div class="stat-icon bg-blue-100 dark:bg-blue-900/30">
              <font-awesome-icon icon="globe" class="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity Section -->
      <section class="mb-8">
        <div class="card-modern p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <font-awesome-icon icon="clock" class="mr-2 text-indigo-500 dark:text-indigo-400" />
            Recent Security Events
          </h3>
          
          <div class="space-y-3">
            <div 
              v-for="attack in stats.recentAttacks.slice(0, 5)" 
              :key="attack.ip + attack.time"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div :class="[
                  'w-3 h-3 rounded-full',
                  attack.blocked ? 'bg-red-500' : 'bg-yellow-500'
                ]"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ attack.blocked ? 'Blocked' : 'Detected' }} attack from {{ attack.ip }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Category: {{ attack.category }} • {{ attack.time.toLocaleTimeString() }}
                  </p>
                </div>
              </div>
              <span :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                attack.blocked 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              ]">
                {{ attack.blocked ? 'Blocked' : 'Warning' }}
              </span>
            </div>
            
            <div v-if="stats.recentAttacks.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent security events
            </div>
          </div>
        </div>
      </section>

      <!-- Top Attacking Countries -->
      <section class="mb-8">
        <div class="card-modern p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <font-awesome-icon icon="globe" class="mr-2 text-indigo-500 dark:text-indigo-400" />
            Geographic Attack Distribution
          </h3>
          
          <div class="space-y-3">
            <div 
              v-for="country in stats.topAttackingCountries" 
              :key="country.code"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div class="w-8 h-6 bg-gray-300 dark:bg-gray-600 rounded-sm flex items-center justify-center text-xs font-bold">
                  {{ country.code }}
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ country.name }}
                </span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    class="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${(country.count / Math.max(...stats.topAttackingCountries.map(c => c.count))) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                  {{ country.count }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Blocked IPs List -->
      <section>
        <div v-if="!isAllowed" class="card-modern p-6">
          <div class="flex items-center justify-center text-red-600 dark:text-red-400">
            <font-awesome-icon icon="exclamation-triangle" class="mr-2" />
            You do not have permission to view this page.
          </div>
        </div>
        <div v-else>
          <BlockedIpsList
            ref="blockedIpsListRef"
            :website-id="websiteId"
            :search-query="searchQuery"
            :date-filter="dateFilter"
            :category-filter="categoryFilter"
            @blocked-ips-loaded="onBlockedIpsLoaded"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Enhanced Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-icon-modern {
  @apply inline-flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-lg shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Card Styles */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

.stat-card {
  @apply card-modern p-6 hover:shadow-lg transition-all duration-300;
}

.stat-label {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400;
}

.stat-value {
  @apply text-3xl font-bold text-gray-900 dark:text-white mt-1;
}

.stat-change {
  @apply text-sm font-medium mt-1;
}

.stat-icon {
  @apply p-3 rounded-full;
}

/* Input Styles */
.input-modern {
  @apply w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm;
  @apply placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400;
  @apply transition-all duration-200 ease-in-out;
}

/* Animations */
@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 5px rgba(99, 102, 241, 0.5);
  }
  50% { 
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.8);
  }
}

.monitoring-active {
  animation: pulse-glow 2s infinite;
}

/* Responsive Design Improvements */
@media (max-width: 640px) {
  .stat-card {
    @apply p-4;
  }
  
  .stat-value {
    @apply text-2xl;
  }
}
</style>