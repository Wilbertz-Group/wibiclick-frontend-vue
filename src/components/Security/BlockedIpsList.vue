<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import securityService from '@/services/securityService';
import BlockIpModal from './BlockIpModal.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Enhanced props to support filtering
const props = defineProps({
  websiteId: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  },
  dateFilter: {
    type: String,
    default: '24h'
  },
  categoryFilter: {
    type: String,
    default: 'all'
  }
});

// Emit events for parent component
const emit = defineEmits(['blocked-ips-loaded']);

// State management
const blockedIps = ref([]);
const loading = ref(false);
const error = ref('');
const showAddModal = ref(false);

// Enhanced pagination with server-side support
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const metadata = ref({});

// Attack logs state
const logsByIp = ref({});
const logsLoading = ref({});
const logsError = ref({});
const expandedIps = ref(new Set());

// Sort and view options
const sortBy = ref('createdAt');
const sortOrder = ref('desc');
const viewMode = ref('table'); // 'table' or 'card'

// Enhanced computed properties
const paginatedIps = computed(() => {
  return blockedIps.value || [];
});

const hasFilters = computed(() => {
  return props.searchQuery || props.dateFilter !== '24h' || props.categoryFilter !== 'all';
});

const sortedIps = computed(() => {
  if (!blockedIps.value?.length) return [];
  
  return [...blockedIps.value].sort((a, b) => {
    const aValue = a[sortBy.value] || '';
    const bValue = b[sortBy.value] || '';
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
});

// Expose fetchBlockedIps for parent component
defineExpose({
  fetchBlockedIps
});

// Enhanced fetch function with filtering
async function fetchBlockedIps() {
  loading.value = true;
  error.value = '';
  
  try {
    const options = {
      page: page.value,
      limit: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    };
    
    // Add filters from props
    if (props.searchQuery) {
      options.search = props.searchQuery;
    }
    
    const response = await securityService.getBlockedIps(props.websiteId, options);
    
    blockedIps.value = response.blockedIps || [];
    total.value = response.total || 0;
    metadata.value = response.metadata || {};
    
    // Emit count for parent dashboard
    emit('blocked-ips-loaded', total.value);
    
  } catch (e) {
    console.error('Failed to fetch blocked IPs:', e);
    error.value = 'Failed to load blocked IPs.';
    blockedIps.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// Enhanced attack logs fetching
async function fetchLogsForIp(ip) {
  if (logsLoading.value[ip]) return; // Prevent duplicate requests
  
  logsLoading.value[ip] = true;
  logsError.value[ip] = '';
  
  try {
    const logs = await securityService.getAttackLogsForIp(ip, props.websiteId, 5);
    logsByIp.value[ip] = logs;
  } catch (e) {
    console.error('Failed to fetch logs for IP:', ip, e);
    logsError.value[ip] = 'Failed to load attack logs.';
    logsByIp.value[ip] = [];
  } finally {
    logsLoading.value[ip] = false;
  }
}

// Toggle IP details expansion
function toggleIpDetails(ip) {
  if (expandedIps.value.has(ip)) {
    expandedIps.value.delete(ip);
  } else {
    expandedIps.value.add(ip);
    // Fetch logs when expanding
    if (!logsByIp.value[ip]) {
      fetchLogsForIp(ip);
    }
  }
}

// Enhanced remove function with confirmation
async function removeIp(ipData) {
  const ip = typeof ipData === 'string' ? ipData : ipData.ip;
  
  if (!confirm(`Unblock IP ${ip}?`)) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    await securityService.removeBlockedIp(props.websiteId, ip);
    await fetchBlockedIps();
    
    // Clean up expanded state and logs
    expandedIps.value.delete(ip);
    delete logsByIp.value[ip];
    delete logsLoading.value[ip];
    delete logsError.value[ip];
    
  } catch (e) {
    console.error('Failed to remove IP:', e);
    error.value = 'Failed to remove IP.';
  } finally {
    loading.value = false;
  }
}

// Handle new IP added
function handleIpAdded() {
  showAddModal.value = false;
  fetchBlockedIps();
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleString();
}

function formatDuration(expiresAt) {
  if (!expiresAt) return 'Permanent';
  
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

function getStatusColor(ipData) {
  if (ipData.isExpired) return 'text-gray-500';
  if (ipData.attackCount > 10) return 'text-red-600';
  if (ipData.attackCount > 5) return 'text-orange-600';
  return 'text-green-600';
}

function getLocationText(location) {
  if (!location) return 'Unknown';
  
  const parts = [];
  if (location.city && location.city !== 'Unknown') parts.push(location.city);
  if (location.region && location.region !== 'Unknown') parts.push(location.region);
  if (location.country && location.country !== 'Unknown') parts.push(location.country);
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

// Watchers
watch(() => props.websiteId, fetchBlockedIps);
watch(() => [props.searchQuery, props.dateFilter, props.categoryFilter], () => {
  page.value = 1; // Reset to first page when filters change
  fetchBlockedIps();
});

watch([page, pageSize, sortBy, sortOrder], fetchBlockedIps);

// Initialize
onMounted(fetchBlockedIps);
</script>

<template>
  <div class="bg-white dark:bg-gray-800/60 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/50">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <font-awesome-icon icon="ban" class="mr-2 text-red-500" />
          Blocked IP Addresses
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ total }} IP{{ total !== 1 ? 's' : '' }} currently blocked
          <span v-if="hasFilters" class="text-indigo-600 dark:text-indigo-400">
            (filtered)
          </span>
        </p>
      </div>
      
      <div class="flex items-center space-x-2 mt-4 sm:mt-0">
        <!-- View Mode Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            @click="viewMode = 'table'"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              viewMode === 'table' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
          >
            Table
          </button>
          <button
            @click="viewMode = 'card'"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              viewMode === 'card' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
          >
            Cards
          </button>
        </div>
        
        <!-- Add IP Button -->
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
        >
          <font-awesome-icon icon="ban" class="text-xs" />
          <span>Block IP</span>
        </button>
      </div>
    </div>

    <!-- Block IP Modal -->
    <BlockIpModal
      v-if="showAddModal"
      :website-id="websiteId"
      @close="showAddModal = false"
      @ip-added="handleIpAdded"
    />

    <!-- Content -->
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <font-awesome-icon icon="sync" class="text-indigo-500 text-2xl animate-spin mb-3" />
        <p class="text-gray-600 dark:text-gray-400">Loading blocked IPs...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
        <div class="flex items-center">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-500 mr-2" />
          <span class="text-red-700 dark:text-red-300">{{ error }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="blockedIps.length === 0" class="text-center py-12">
        <font-awesome-icon icon="shield-alt" class="text-gray-400 text-4xl mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Blocked IPs</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ hasFilters ? 'No IPs match your current filters.' : 'No IP addresses are currently blocked.' }}
        </p>
        <button
          v-if="!hasFilters"
          @click="showAddModal = true"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Block Your First IP
        </button>
      </div>

      <!-- Table View -->
      <div v-else-if="viewMode === 'table'" class="overflow-hidden">
        <!-- Sort Controls -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
            <select 
              v-model="sortBy" 
              class="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="createdAt">Date Added</option>
              <option value="ip">IP Address</option>
              <option value="attackCount">Attack Count</option>
              <option value="reason">Reason</option>
            </select>
            <button
              @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }} {{ sortOrder.toUpperCase() }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address & Location
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <template v-for="ipData in sortedIps" :key="ipData.ip || ipData">
                <!-- Main IP Row -->
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <button
                        @click="toggleIpDetails(ipData.ip || ipData)"
                        class="flex items-center text-left"
                      >
                        <font-awesome-icon 
                          :icon="expandedIps.has(ipData.ip || ipData) ? 'chevron-down' : 'chevron-right'" 
                          class="text-gray-400 mr-2 text-xs"
                        />
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ ipData.ip || ipData }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            {{ getLocationText(ipData.location) }}
                          </div>
                        </div>
                      </button>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 dark:text-white">
                      {{ ipData.reason || 'Manual block' }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      Blocked: {{ formatDate(ipData.createdAt) }}
                    </div>
                    <div v-if="ipData.attackCount > 0" class="text-xs text-orange-600 dark:text-orange-400">
                      {{ ipData.attackCount }} attack{{ ipData.attackCount !== 1 ? 's' : '' }} detected
                    </div>
                  </td>
                  
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div 
                        :class="[
                          'w-2 h-2 rounded-full mr-2',
                          ipData.isExpired ? 'bg-gray-400' : 'bg-red-500'
                        ]"
                      ></div>
                      <span :class="getStatusColor(ipData)" class="text-xs font-medium">
                        {{ ipData.isExpired ? 'Expired' : 'Active' }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Expires: {{ formatDuration(ipData.expiresAt) }}
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 text-right text-sm font-medium">
                    <button
                      @click="removeIp(ipData)"
                      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      Unblock
                    </button>
                  </td>
                </tr>

                <!-- Expanded Details Row -->
                <tr v-if="expandedIps.has(ipData.ip || ipData)" class="bg-gray-50 dark:bg-gray-900/50">
                  <td colspan="4" class="px-6 py-4">
                    <!-- Attack Logs -->
                    <div class="border-l-4 border-indigo-500 pl-4">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <font-awesome-icon icon="exclamation-triangle" class="mr-2 text-orange-500" />
                        Recent Attack Logs
                      </h4>
                      
                      <div v-if="logsLoading[ipData.ip || ipData]" class="text-sm text-gray-500 dark:text-gray-400">
                        <font-awesome-icon icon="sync" class="animate-spin mr-2" />
                        Loading attack logs...
                      </div>
                      
                      <div v-else-if="logsError[ipData.ip || ipData]" class="text-sm text-red-500">
                        {{ logsError[ipData.ip || ipData] }}
                      </div>
                      
                      <div v-else-if="logsByIp[ipData.ip || ipData]?.length > 0" class="space-y-2">
                        <div 
                          v-for="log in logsByIp[ipData.ip || ipData].slice(0, 3)" 
                          :key="log.id"
                          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-medium text-gray-900 dark:text-white">
                              {{ log.category || 'Unknown' }}
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                              {{ formatDate(log.timestamp || log.createdAt) }}
                            </span>
                          </div>
                          <div class="text-xs text-gray-600 dark:text-gray-300">
                            {{ log.method || 'GET' }} {{ log.url || 'Unknown URL' }}
                          </div>
                          <div v-if="log.userAgent" class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {{ log.userAgent }}
                          </div>
                        </div>
                        
                        <div v-if="logsByIp[ipData.ip || ipData].length > 3" class="text-xs text-center text-gray-500 dark:text-gray-400">
                          ... and {{ logsByIp[ipData.ip || ipData].length - 3 }} more attacks
                        </div>
                      </div>
                      
                      <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                        No recent attack logs found for this IP.
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Card View -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="ipData in sortedIps" 
          :key="ipData.ip || ipData"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ ipData.ip || ipData }}
            </h3>
            <div class="flex items-center">
              <div 
                :class="[
                  'w-2 h-2 rounded-full mr-2',
                  ipData.isExpired ? 'bg-gray-400' : 'bg-red-500'
                ]"
              ></div>
              <span :class="getStatusColor(ipData)" class="text-xs font-medium">
                {{ ipData.isExpired ? 'Expired' : 'Active' }}
              </span>
            </div>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Location:</span>
              <span class="text-gray-900 dark:text-white">{{ getLocationText(ipData.location) }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Blocked:</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(ipData.createdAt) }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Expires:</span>
              <span class="text-gray-900 dark:text-white">{{ formatDuration(ipData.expiresAt) }}</span>
            </div>
            
            <div v-if="ipData.attackCount > 0" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Attacks:</span>
              <span class="text-orange-600 dark:text-orange-400 font-medium">
                {{ ipData.attackCount }}
              </span>
            </div>
          </div>
          
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <button
                @click="toggleIpDetails(ipData.ip || ipData)"
                class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
              >
                {{ expandedIps.has(ipData.ip || ipData) ? 'Hide' : 'Show' }} Details
              </button>
              <button
                @click="removeIp(ipData)"
                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div 
        v-if="total > pageSize" 
        class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 mt-6"
      >
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Showing {{ ((page - 1) * pageSize) + 1 }} to {{ Math.min(page * pageSize, total) }} of {{ total }} results
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="page--"
            :disabled="page === 1"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-md border transition-colors',
              page === 1 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
            ]"
          >
            Previous
          </button>
          
          <span class="text-sm text-gray-700 dark:text-gray-300 px-2">
            Page {{ page }} of {{ Math.ceil(total / pageSize) }}
          </span>
          
          <button
            @click="page++"
            :disabled="page >= Math.ceil(total / pageSize)"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-md border transition-colors',
              page >= Math.ceil(total / pageSize)
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
            ]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom table hover effects */
.table-row-hover:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.dark .table-row-hover:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

/* Smooth transitions for expand/collapse */
.expand-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom scrollbar for attack logs */
.attack-logs-container::-webkit-scrollbar {
  width: 4px;
}

.attack-logs-container::-webkit-scrollbar-track {
  background: transparent;
}

.attack-logs-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.dark .attack-logs-container::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>