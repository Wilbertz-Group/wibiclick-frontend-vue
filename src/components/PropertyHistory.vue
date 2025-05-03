<template>
  <section class="card-modern overflow-hidden shadow-xl">
    <!-- Gradient header with icon and refresh -->
    <div class="bg-gradient-to-r from-emerald-800/90 via-teal-800/90 to-cyan-700/90 p-5 relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute right-0 top-0 w-32 h-32 rounded-full bg-cyan-500/20 blur-xl -mr-10 -mt-10"></div>
      <div class="absolute left-20 bottom-0 w-16 h-16 rounded-full bg-emerald-500/20 blur-lg -mb-8"></div>
      <!-- Header content -->
      <div class="flex justify-between items-center relative z-10">
        <h2 class="text-lg font-semibold text-white flex items-center">
          <font-awesome-icon icon="history" class="mr-3 text-cyan-200" />
          Property History
        </h2>
        <button
          @click="fetchHistory"
          class="text-cyan-200 hover:text-white rounded-full p-2 hover:bg-cyan-600/30 transition-all duration-150"
          :disabled="loading"
          aria-label="Refresh property history"
        >
          <font-awesome-icon icon="sync" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Content area with subtle gradient -->
    <div class="bg-gradient-to-b from-gray-900 to-gray-800 p-0">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-14">
        <div class="w-12 h-12 rounded-full bg-cyan-800/30 flex items-center justify-center mb-3">
          <span class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
        </div>
        <p class="text-sm text-cyan-300 animate-pulse">Loading property history...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-sm p-8 text-center">
        <div class="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-2xl" />
        </div>
        <p class="text-red-300 mb-3">{{ error }}</p>
        <button @click="fetchHistory" class="px-4 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-200 rounded-md transition-colors text-sm">
          <font-awesome-icon icon="sync" class="mr-2" /> Retry
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="history.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="w-16 h-16 mx-auto bg-cyan-900/20 rounded-full flex items-center justify-center mb-4">
          <font-awesome-icon icon="file-alt" class="text-cyan-400 text-xl" />
        </div>
        <p class="text-cyan-300 font-medium mb-1">No property history yet</p>
        <p class="text-gray-400 text-sm max-w-xs">There are no changes recorded for this property.</p>
      </div>

      <!-- Timeline with filters -->
      <div v-else class="relative px-6 py-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 class="text-white font-semibold text-sm uppercase tracking-wide flex items-center">
            <font-awesome-icon icon="stream" class="mr-2 text-cyan-400" />
            Change Timeline
          </h3>
          
          <!-- Filters -->
          <div class="flex flex-wrap gap-3">
            <select
              v-model="propertyFilter"
              class="bg-gray-800 border border-cyan-700/30 text-cyan-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">All Properties</option>
              <option v-for="prop in uniqueProperties" :key="prop" :value="prop">
                {{ formatPropertyName(prop) }}
              </option>
            </select>
            
            <select
              v-model="sourceTypeFilter"
              class="bg-gray-800 border border-cyan-700/30 text-cyan-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All Sources</option>
              <option v-for="source in uniqueSourceTypes" :key="source" :value="source">
                {{ source }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Result count -->
        <div class="text-xs text-gray-400 mb-2">
          Showing {{ filteredHistory.length }} of {{ sortedHistory.length }} changes
        </div>
        
        <!-- Scrollable timeline container -->
        <div class="relative max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <!-- Vertical line -->
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-cyan-700/30"></div>
          
          <!-- Timeline items -->
          <div
            v-for="(item, idx) in filteredHistory"
            :key="item.id"
            class="relative flex items-start group"
          >
            <!-- Timeline dot -->
            <div
              class="z-10 mt-2 w-4 h-4 rounded-full border-2 border-gray-800 shadow-inner flex items-center justify-center"
              :class="{
                'bg-emerald-500': item.sourceType === 'user',
                'bg-cyan-500': item.sourceType === 'system',
                'bg-teal-400': item.sourceType === 'import',
                'bg-gray-400': item.sourceType === 'api',
                'bg-gray-600': !['user','system','import','api'].includes(item.sourceType?.toLowerCase())
              }"
              style="margin-left: -2px;"
            >
              <font-awesome-icon
                :icon="sourceIcon(item.sourceType)"
                class="text-xs text-white"
              />
            </div>
            <!-- Timeline card -->
            <div
              class="ml-8 mb-8 w-full max-w-2xl bg-gray-800/80 rounded-lg shadow-lg px-6 py-4 transition-all duration-150 border border-cyan-800/20 group-hover:border-cyan-400/40"
            >
              <div class="flex items-center gap-2 mb-1">
                <font-awesome-icon icon="edit" class="text-cyan-400 text-xs" />
                <span class="bg-cyan-700/20 text-cyan-200 px-2 py-0.5 rounded text-xs font-medium">
                  {{ formatPropertyName(item.propertyName) }}
                </span>
                <span class="ml-auto flex items-center text-xs text-gray-400">
                  <font-awesome-icon icon="clock" class="mr-1 text-cyan-400" />
                  {{ formatDate(item.createdAt) }}
                </span>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">Old:</span>
                  <span
                    v-if="item.oldValue !== item.newValue"
                    class="line-through opacity-70 text-sm text-gray-400"
                  >{{ item.oldValue || '-' }}</span>
                  <span
                    v-else
                    class="text-sm text-gray-400"
                  >{{ item.oldValue || '-' }}</span>
                </div>
                <font-awesome-icon icon="arrow-right" class="text-cyan-400 text-xs mx-2 hidden sm:block" />
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">New:</span>
                  <span
                    v-if="item.oldValue !== item.newValue"
                    class="text-emerald-300 font-semibold text-sm"
                  >{{ item.newValue || '-' }}</span>
                  <span
                    v-else
                    class="text-gray-400 text-sm"
                  >{{ item.newValue || '-' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="bg-gray-700/40 text-cyan-200 px-2 py-0.5 rounded text-xs font-medium capitalize flex items-center gap-1">
                  <font-awesome-icon
                    :icon="sourceIcon(item.sourceType)"
                    class="text-cyan-300 text-xs"
                  />
                  {{ item.sourceType }}
                </span>
                <span v-if="item.userId" class="ml-2 text-xs text-gray-400">User ID: {{ item.userId }}</span>
              </div>
            </div>
          </div>
          
          <!-- No results message -->
          <div v-if="filteredHistory.length === 0" class="text-center py-8 text-gray-400">
            No changes match your filters
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, defineProps, computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';
import { useUserStore } from "@/stores/UserStore"

interface PropertyHistoryItem {
  id: string;
  entityType: string;
  entityId: string;
  propertyName: string;
  oldValue: string | null;
  newValue: string | null;
  sourceType: string;
  sourceId: string | null;
  userId: number | null;
  createdAt: string;
}

const props = defineProps<{
  entityType: string;
  entityId: string;
  propertyName?: string | null;
}>();

const history = ref<PropertyHistoryItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const userStore = useUserStore();
const propertyFilter = ref('');
const sourceTypeFilter = ref('all');

const fetchHistory = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params: Record<string, string> = {
      entityType: props.entityType,
      entityId: props.entityId
    };
    if (props.propertyName) {
      params.propertyName = props.propertyName;
    }
    const response = await axios.get('/api/property-history?id=' + userStore.currentWebsite, { params });
    history.value = response.data.history;
  } catch (err) {
    console.error('Error fetching property history:', err);
    error.value = 'Failed to load property history';
  } finally {
    loading.value = false;
  }
};

const formatPropertyName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Map sourceType to FontAwesome icon
const sourceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'system':
      return 'cogs';
    case 'user':
      return 'user-edit';
    case 'import':
      return 'file-import';
    case 'api':
      return 'cloud';
    default:
      return 'question-circle';
  }
};

// Sort history by createdAt descending (newest first)
const sortedHistory = computed(() =>
  [...history.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

// Get unique properties for filter dropdown
const uniqueProperties = computed(() => 
  [...new Set(history.value.map(item => item.propertyName))].sort()
);

// Get unique source types for filter dropdown
const uniqueSourceTypes = computed(() => 
  [...new Set(history.value.map(item => item.sourceType))].sort()
);

// Apply filters
const filteredHistory = computed(() => {
  let filtered = sortedHistory.value;
  
  if (propertyFilter.value) {
    filtered = filtered.filter(item => 
      item.propertyName === propertyFilter.value
    );
  }
  
  if (sourceTypeFilter.value !== 'all') {
    filtered = filtered.filter(item => 
      item.sourceType === sourceTypeFilter.value
    );
  }
  
  return filtered;
});

onMounted(fetchHistory);
</script>

<style scoped>
/* Custom scrollbar styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.7);
}

/* Firefox scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(6, 182, 212, 0.5) rgba(31, 41, 55, 0.5);
}

/* Smooth scrolling */
.custom-scrollbar {
  scroll-behavior: smooth;
}
</style>