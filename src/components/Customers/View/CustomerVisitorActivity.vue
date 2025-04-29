<script setup>
import { onMounted, ref, computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import { formatAbsoluteDateTime } from '@/utils/formatters';

const props = defineProps({
  visitorActivity: {
    type: Object,
    default: () => ({ visitors: [] })
  },
  isFetchingVisitorActivity: {
    type: Boolean,
    default: false
  },
  visitorActivityError: {
    type: [String, null],
    default: null
  },
  websiteId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['fetch-visitor-activity']);

// Format date to a more readable version
const formatVisitorDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Format like: Apr 22, 2025, 1:34 PM
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
};

// Get time elapsed since date
const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} year${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} month${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} day${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    }
    
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
  } catch (e) {
    return '';
  }
};

// Truncate long URLs for better display
const truncateUrl = (url, maxLength = 40) => {
  if (!url) return '';
  if (url.length <= maxLength) return url;
  
  // Remove protocol for cleaner display
  let cleanUrl = url.replace(/^https?:\/\//, '');
  
  if (cleanUrl.length <= maxLength) return cleanUrl;
  
  // If still too long, truncate middle
  const start = cleanUrl.substring(0, Math.floor(maxLength/2) - 2);
  const end = cleanUrl.substring(cleanUrl.length - Math.floor(maxLength/2) + 2);
  return `${start}...${end}`;
};

// Extract page title from URL for better display
const getPageTitle = (url) => {
  if (!url) return 'Unknown Page';
  
  // Remove protocols and domains for nicer display
  let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  // Get everything after the domain
  const pathMatch = cleanUrl.match(/[^/]+\/(.+)/);
  if (pathMatch && pathMatch[1]) {
    // Convert kebab-case or snake_case to readable text
    let path = pathMatch[1]
      .replace(/[-_]/g, ' ')
      .replace(/\.html$|\.php$|\.asp$/, '')
      .trim();
    
    // Capitalize first letter of each word
    path = path.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return path || 'Homepage';
  }
  
  // If there's no path, it's the homepage
  if (cleanUrl.endsWith('/') || !cleanUrl.includes('/')) {
    return 'Homepage';
  }
  
  return cleanUrl;
};

// Calculate summary metrics
const totalMetrics = computed(() => {
  if (!props.visitorActivity?.visitors?.length) {
    return { totalViews: 0, totalClicks: 0, lastSeen: null };
  }
  
  let totalViews = 0;
  let totalClicks = 0;
  let lastSeen = null;
  
  props.visitorActivity.visitors.forEach(visitor => {
    totalViews += visitor.totalViews || 0;
    totalClicks += visitor.totalClicks || 0;
    
    // Find the most recent activity
    const visitorDate = new Date(visitor.lastSeen);
    if (!lastSeen || visitorDate > new Date(lastSeen)) {
      lastSeen = visitor.lastSeen;
    }
  });
  
  return { totalViews, totalClicks, lastSeen };
});

// Get all activities from all visitors in one array, sorted by time
const allActivities = computed(() => {
  if (!props.visitorActivity?.visitors?.length) return [];
  
  let activities = [];
  
  props.visitorActivity.visitors.forEach(visitor => {
    if (visitor.recentActivity && visitor.recentActivity.length) {
      activities = [
        ...activities,
        ...visitor.recentActivity.map(activity => ({
          ...activity,
          visitorId: visitor.visitorId
        }))
      ];
    }
  });
  
  // Sort by timestamp, newest first
  return activities.sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
});

// Computed property to check if we have at least one activity
const hasVisitorActivity = computed(() => {
  return allActivities.value.length > 0;
});

// Fetch visitor activity on mount
onMounted(() => {
  if (props.customerId) {
    emit('fetch-visitor-activity');
  }
});
</script>

<template>
  <section class="card-modern overflow-hidden shadow-xl">
    <!-- Premium header with shadow effect and gradient -->
    <div class="bg-gradient-to-r from-blue-800/90 via-indigo-800/90 to-indigo-700/90 p-5 relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute right-0 top-0 w-32 h-32 rounded-full bg-indigo-500/20 blur-xl -mr-10 -mt-10"></div>
      <div class="absolute left-20 bottom-0 w-16 h-16 rounded-full bg-blue-500/20 blur-lg -mb-8"></div>
      
      <!-- Header content -->
      <div class="flex justify-between items-center relative z-10">
        <h2 class="text-lg font-semibold text-white flex items-center">
          <font-awesome-icon icon="chart-line" class="mr-3 text-indigo-300" />
          Website Engagement
        </h2>
        <button 
          @click="emit('fetch-visitor-activity')" 
          class="text-indigo-200 hover:text-white rounded-full p-2 hover:bg-indigo-600/30 transition-all duration-150"
          :disabled="isFetchingVisitorActivity" 
          aria-label="Refresh visitor activity"
        >
          <font-awesome-icon icon="sync" :class="{ 'animate-spin': isFetchingVisitorActivity }" />
        </button>
      </div>
      
      <!-- Key metrics summary -->
      <div class="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-indigo-500/30">
        <div>
          <p class="text-indigo-200 opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Last Activity</p>
          <p v-if="totalMetrics.lastSeen" class="text-white font-medium text-sm flex items-center">
            <font-awesome-icon icon="clock" class="mr-2 text-indigo-300" />
            {{ getTimeAgo(totalMetrics.lastSeen) }}
          </p>
          <p v-else class="text-indigo-200 text-sm">No activity yet</p>
        </div>
        <div>
          <p class="text-indigo-200 opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Page Views</p>
          <p class="text-white text-xl font-semibold flex items-center">
            <font-awesome-icon icon="eye" class="text-sm mr-2 text-indigo-300" />
            {{ totalMetrics.totalViews }}
          </p>
        </div>
        <div>
          <p class="text-indigo-200 opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Interactions</p>
          <p class="text-white text-xl font-semibold flex items-center">
            <font-awesome-icon icon="mouse-pointer" class="text-sm mr-2 text-indigo-300" />
            {{ totalMetrics.totalClicks }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Content area with premium dark gradient -->
    <div class="bg-gradient-to-b from-gray-900 to-gray-800 p-0">
      <!-- Loading state -->
      <div v-if="isFetchingVisitorActivity" class="flex flex-col items-center justify-center py-14">
        <div class="w-12 h-12 rounded-full bg-indigo-800/30 flex items-center justify-center mb-3">
          <ScaleLoader :loading="true" color="#818cf8" height="24px" width="3px" />
        </div>
        <p class="text-sm text-indigo-300 animate-pulse">Analyzing visitor journey...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="visitorActivityError" class="text-sm p-8 text-center">
        <div class="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-2xl" />
        </div>
        <p class="text-red-300 mb-3">Unable to load engagement data</p>
        <button @click="emit('fetch-visitor-activity')" class="px-4 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-200 rounded-md transition-colors text-sm">
          <font-awesome-icon icon="sync" class="mr-2" /> Retry
        </button>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="!hasVisitorActivity" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="w-16 h-16 mx-auto bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="globe" class="text-blue-400 text-xl" />
        </div>
        <p class="text-blue-300 font-medium mb-1">No website activity yet</p>
        <p class="text-gray-400 text-sm max-w-xs">This customer hasn't visited your website or engagement tracking was added recently.</p>
      </div>
      
      <!-- Activity Timeline -->
      <div v-else>
        <h3 class="text-white font-semibold text-sm px-6 pt-6 pb-3 uppercase tracking-wide flex items-center">
          <font-awesome-icon icon="history" class="mr-2 text-indigo-400" />
          Activity Timeline
        </h3>
        
        <div class="pb-4 relative">
          <div 
            v-for="(activity, idx) in allActivities" 
            :key="idx" 
            class="pl-10 pr-5 py-3 relative hover:bg-gray-800/50 transition-colors duration-150"
          >
            <!-- Timeline elements -->
            <div class="absolute left-0 top-0 bottom-0 w-px bg-indigo-700/30"></div>
            <div class="absolute left-0 bottom-0 w-10 h-px bg-indigo-700/20" v-if="idx !== allActivities.length - 1"></div>
            
            <!-- Activity dot -->
            <div 
              class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-gray-800 shadow-inner"
              :class="{
                'bg-teal-500': activity.type === 'click',
                'bg-blue-500': activity.type === 'view'
              }"
            ></div>
            
            <!-- Activity content -->
            <div class="flex flex-col">
              <!-- Activity title -->
              <div class="flex items-center">
                <span 
                  class="text-xs font-semibold py-0.5 px-2 rounded capitalize mr-2"
                  :class="{
                    'bg-teal-500/20 text-teal-300': activity.type === 'click',
                    'bg-blue-500/20 text-blue-300': activity.type === 'view'
                  }"
                >
                  {{ activity.type }}
                </span>
                
                <span class="text-gray-300 text-sm font-medium">
                  <template v-if="activity.type === 'click'">
                    <span class="text-white">{{ activity.button || 'Unknown Element' }}</span>
                  </template>
                  <template v-else-if="activity.type === 'view'">
                    <span class="text-white">{{ getPageTitle(activity.page) }}</span>
                  </template>
                </span>
              </div>
              
              <!-- Activity details -->
              <div class="flex items-center justify-between mt-1.5">
                <div class="flex items-center">
                  <span v-if="activity.page" class="text-xs text-gray-500 max-w-sm truncate">
                    {{ truncateUrl(activity.page) }}
                  </span>
                </div>
                
                <!-- Timestamp -->
                <div class="flex items-center text-xs text-gray-500">
                  <font-awesome-icon icon="clock" class="mr-1.5 text-gray-600" />
                  {{ formatVisitorDate(activity.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>