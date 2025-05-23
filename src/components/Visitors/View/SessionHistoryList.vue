<!-- SessionHistoryList.vue -->
<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <h3 class="text-cyan-300 font-semibold mb-6">Session History</h3>
    
    <div v-if="!sessions?.length" class="text-center py-8 text-gray-400">
      No sessions recorded
    </div>
    
    <div v-else class="space-y-4">
      <div v-for="session in sessions" :key="session.id" 
           class="bg-gray-900/50 rounded-lg p-4">
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="text-sm font-semibold text-white">
              Session {{ formatSessionDate(session.startedAt) }}
            </div>
            <div class="text-xs text-gray-400">
              Duration: {{ session.duration ? formatDuration(session.duration) : 'Active' }}
            </div>
          </div>
          <div class="text-xs text-gray-400">
            {{ session.pageViewCount }} page views
          </div>
        </div>
        
        <!-- Session Info -->
        <div class="grid grid-cols-2 gap-4 mt-3">
          <div>
            <div class="text-xs text-gray-400">Entry Page</div>
            <div class="text-sm text-gray-300 truncate">{{ session.entryPage || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">Exit Page</div>
            <div class="text-sm text-gray-300 truncate">{{ session.exitPage || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">Device</div>
            <div class="text-sm text-gray-300">{{ session.deviceType }} - {{ session.browser }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">Location</div>
            <div class="text-sm text-gray-300">{{ formatLocation(session) }}</div>
          </div>
        </div>
        
        <!-- Session Source -->
        <div v-if="session.sessionSource" class="mt-3 pt-3 border-t border-gray-700">
          <div class="text-xs text-gray-400">Source</div>
          <div class="text-sm text-gray-300">
            {{ session.sessionSource }} 
            <span v-if="session.sessionMedium" class="text-gray-400">/ {{ session.sessionMedium }}</span>
            <span v-if="session.sessionCampaign" class="text-cyan-400 ml-2">
              Campaign: {{ session.sessionCampaign }}
            </span>
          </div>
        <!-- Session Actions -->
        <div v-if="session.actions && session.actions.length" class="mt-3 pt-3 border-t border-gray-700">
          <div class="text-xs text-gray-400 mb-1">Actions ({{ session.actions.length }})</div>
          <ul class="list-disc ml-6 space-y-1">
            <li v-for="(action, idx) in session.actions.slice(0, 10)" :key="idx" class="text-xs text-gray-300">
              <span class="font-semibold">{{ action.type || action.actionType || 'Action' }}</span>
              <span v-if="action.timestamp" class="ml-2 text-gray-400">({{ formatSessionDate(action.timestamp) }})</span>
              <span v-if="action.details" class="ml-2 text-gray-400">- {{ action.details }}</span>
            </li>
            <li v-if="session.actions.length > 10" class="text-xs text-gray-400">...and {{ session.actions.length - 10 }} more</li>
          </ul>
        </div>
        <div v-else class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          No actions recorded for this session.
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
  sessions: any[];
}>();

function formatSessionDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatLocation(session: any) {
  const parts = [session.city, session.region, session.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}
</script>