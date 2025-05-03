<!-- VisitorJourneyTimeline.vue -->
<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <h3 class="text-cyan-300 font-semibold mb-6">Visitor Journey Timeline</h3>
    
    <div v-if="loading" class="flex justify-center py-8">
      <span class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
    </div>
    
    <div v-else-if="error" class="text-center py-8 text-red-300">
      {{ error }}
    </div>
    
    <div v-else-if="!sessions.length" class="text-center py-8 text-gray-400">
      No session data available
    </div>
    
    <div v-else class="space-y-6">
      <div v-for="(session, index) in sessions" :key="session.id" class="relative">
        <!-- Session Header -->
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
            {{ sessions.length - index }}
          </div>
          <div class="ml-4">
            <div class="text-sm font-semibold text-cyan-300">
              Session #{{ sessions.length - index }}
            </div>
            <div class="text-xs text-gray-400">
              {{ formatSessionDate(session.startedAt) }}
              <span v-if="session.duration" class="ml-2">
                • Duration: {{ formatDuration(session.duration) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Session Details -->
        <div class="ml-12 border-l-2 border-cyan-600/30 pl-6 pb-6">
          <!-- Device & Location Info -->
          <div class="flex flex-wrap gap-4 mb-4">
            <div class="flex items-center text-xs text-gray-400">
              <font-awesome-icon :icon="getDeviceIcon(session.deviceType)" class="mr-2" />
              {{ session.deviceType }}
            </div>
            <div class="flex items-center text-xs text-gray-400">
              <font-awesome-icon :icon="getDeviceIcon('desktop')" class="mr-2" />
              {{ session.browser }} {{ session.os }}
            </div>
            <div v-if="session.city || session.country" class="flex items-center text-xs text-gray-400">
              <font-awesome-icon icon="map-marker-alt" class="mr-2" />
              {{ [session.city, session.region, session.country].filter(Boolean).join(', ') }}
            </div>
          </div>
          
          <!-- Session Events -->
          <div class="space-y-2">
            <div v-for="event in session.events" :key="event.id" 
                 class="flex items-start gap-3 text-sm">
              <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                getEventTypeColor(event.eventType)
              ]">
                <font-awesome-icon :icon="getEventIcon(event.eventType)" class="text-xs" />
              </div>
              <div>
                <div class="text-gray-300">
                  {{ getEventDescription(event) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ formatEventTime(event.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';

const props = defineProps<{
  visitorId: string;
}>();

const sessions = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case 'mobile': return 'mobile-alt';
    case 'tablet': return 'tablet-alt';
    default: return 'desktop';
  }
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'PAGE_VIEW': return 'eye';
    case 'CLICK': return 'mouse-pointer';
    case 'FORM_SUBMISSION': return 'file-alt';
    default: return 'circle';
  }
}

function getEventTypeColor(eventType: string) {
  switch (eventType) {
    case 'PAGE_VIEW': return 'bg-blue-600';
    case 'CLICK': return 'bg-green-600';
    case 'FORM_SUBMISSION': return 'bg-amber-600';
    default: return 'bg-gray-600';
  }
}

function getEventDescription(event: any) {
  switch (event.eventType) {
    case 'PAGE_VIEW':
      return `Viewed page: ${event.eventDetails?.title || event.eventDetails?.pageUrl || 'Unknown'}`;
    case 'CLICK':
      return `Clicked: ${event.eventDetails?.button || 'Button'}`;
    case 'FORM_SUBMISSION':
      return `Submitted form`;
    default:
      return event.eventType;
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
  } catch (err: any) {
    error.value = 'Failed to load session data';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchSessions);
</script>