<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <h3 class="text-cyan-300 font-semibold mb-6">User Journey Map</h3>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
    </div>

    <div v-else-if="error" class="text-center py-8 text-red-300">
      {{ error }}
    </div>

    <div v-else-if="!sessions.length" class="text-center py-8 text-gray-400">
      No session data available
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="(session, sIdx) in sessions"
        :key="session.id"
        class="mb-8"
      >
        <!-- Session Header -->
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
            {{ sessions.length - sIdx }}
          </div>
          <div class="ml-4">
            <div class="text-sm font-semibold text-cyan-300">
              Session #{{ sessions.length - sIdx }}
            </div>
            <div class="text-xs text-gray-400">
              {{ formatSessionDate(session.startedAt) }}
              <span v-if="session.duration" class="ml-2">
                • Duration: {{ formatDuration(session.duration) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Horizontal Journey Map -->
        <div class="relative overflow-x-auto pb-4">
          <div class="flex items-center gap-0.5 min-w-max px-2">
            <template v-for="(action, idx) in session.actions || []" :key="action.id || idx">
              <!-- Action Node -->
              <div
                class="group relative flex flex-col items-center"
                @mouseenter="hoveredAction = { sIdx, idx }"
                @mouseleave="hoveredAction = null"
              >
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200"
                  :class="[
                    getActionTypeColor(action.type || action.actionType),
                    hoveredAction && hoveredAction.sIdx === sIdx && hoveredAction.idx === idx
                      ? 'scale-110 shadow-lg z-10'
                      : 'shadow'
                  ]"
                  style="min-width: 3rem;"
                >
                  <font-awesome-icon
                    :icon="getActionIcon(action.type || action.actionType)"
                    class="text-xl"
                  />
                </div>
                <div class="mt-1 text-xs text-gray-300 font-medium truncate max-w-[6rem] text-center">
                  {{ getActionLabel(action.type || action.actionType) }}
                </div>
                <!-- Action Details Popover -->
                <div
                  v-if="hoveredAction && hoveredAction.sIdx === sIdx && hoveredAction.idx === idx"
                  class="absolute left-1/2 -translate-x-1/2 top-14 z-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded shadow-lg p-3 w-64 border border-gray-200 dark:border-gray-700"
                >
                  <div class="font-semibold mb-1">{{ getActionLabel(action.type || action.actionType) }}</div>
                  <div class="text-xs text-gray-500 mb-1">{{ formatEventTime(action.timestamp) }}</div>
                  <div v-if="action.details" class="text-sm">{{ action.details }}</div>
                  <div v-else class="text-xs text-gray-400">No additional details</div>
                </div>
              </div>
              <!-- Arrow (except after last node) -->
              <div v-if="idx < (session.actions?.length || 0) - 1" class="flex items-center">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none" class="mx-1">
                  <path
                    d="M2 8h28m0 0l-4-4m4 4l-4 4"
                    :stroke="getActionTypeStrokeColor(action.type || action.actionType)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </template>
          </div>
          <!-- Mini-map (simple scroll indicator) -->
          <div class="h-1 mt-2 bg-gray-700/40 rounded relative">
            <div
              class="absolute h-1 bg-cyan-400 rounded transition-all duration-200"
              :style="miniMapStyle"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';

const props = defineProps<{
  visitorId: string;
}>();

const sessions = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const hoveredAction = ref<{ sIdx: number; idx: number } | null>(null);

function getActionIcon(type: string) {
  switch (type) {
    case 'PAGE_VIEW':
      return 'eye';
    case 'CLICK':
      return 'mouse-pointer';
    case 'FORM_SUBMISSION':
      return 'file-alt';
    case 'SCROLL':
      return 'arrows-alt-v';
    case 'NAVIGATION':
      return 'route';
    case 'BOT_DETECTED':
      return 'robot';
    default:
      return 'circle';
  }
}

function getActionTypeColor(type: string) {
  switch (type) {
    case 'PAGE_VIEW':
      return 'bg-blue-600 border-blue-400';
    case 'CLICK':
      return 'bg-green-600 border-green-400';
    case 'FORM_SUBMISSION':
      return 'bg-amber-600 border-amber-400';
    case 'SCROLL':
      return 'bg-purple-600 border-purple-400';
    case 'NAVIGATION':
      return 'bg-cyan-600 border-cyan-400';
    case 'BOT_DETECTED':
      return 'bg-yellow-500 border-yellow-400';
    default:
      return 'bg-gray-600 border-gray-400';
  }
}

function getActionTypeStrokeColor(type: string) {
  switch (type) {
    case 'PAGE_VIEW':
      return '#3b82f6';
    case 'CLICK':
      return '#22c55e';
    case 'FORM_SUBMISSION':
      return '#f59e42';
    case 'SCROLL':
      return '#a78bfa';
    case 'NAVIGATION':
      return '#06b6d4';
    case 'BOT_DETECTED':
      return '#eab308';
    default:
      return '#6b7280';
  }
}

function getActionLabel(type: string) {
  switch (type) {
    case 'PAGE_VIEW':
      return 'Page View';
    case 'CLICK':
      return 'Click';
    case 'FORM_SUBMISSION':
      return 'Form Submission';
    case 'SCROLL':
      return 'Scroll';
    case 'NAVIGATION':
      return 'Navigation';
    case 'BOT_DETECTED':
      return 'Bot Detected';
    default:
      return type || 'Action';
  }
}

function formatSessionDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatEventTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString();
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

async function fetchSessions() {
  loading.value = true;
  error.value = null;

  try {
    const { data } = await axios.get(`/api/analytics/visitor/${props.visitorId}`);
    sessions.value = data.visitor.sessions || [];
    await nextTick();
    updateMiniMap();
  } catch (err: any) {
    error.value = 'Failed to load session data';
  } finally {
    loading.value = false;
  }
}

// Mini-map logic (simple scroll indicator)
const miniMapStyle = ref({});
function updateMiniMap() {
  // For now, just set to 100% width (can be improved with actual scroll tracking)
  miniMapStyle.value = {
    left: '0%',
    width: '100%',
  };
}

onMounted(fetchSessions);
</script>