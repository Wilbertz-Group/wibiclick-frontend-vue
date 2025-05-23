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
            <div class="text-xs text-gray-400 mt-1">
              <span class="font-semibold">Session ID:</span> {{ session.id }}
            </div>
            <div class="text-xs text-gray-400 mt-1" v-if="session.endedAt">
              <span class="font-semibold">Ended At:</span> {{ formatSessionDate(session.endedAt) }}
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
            <div class="text-sm text-gray-300">
              {{ session.deviceType || '-' }}
              <span v-if="session.browser">- {{ session.browser }}</span>
              <span v-if="session.os"> ({{ session.os }})</span>
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-400">Location</div>
            <div class="text-sm text-gray-300">{{ formatLocation(session) }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">Started At</div>
            <div class="text-sm text-gray-300">{{ formatSessionDate(session.startedAt) }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">Ended At</div>
            <div class="text-sm text-gray-300">{{ session.endedAt ? formatSessionDate(session.endedAt) : '-' }}</div>
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
        </div>

        <!-- Session Actions -->
        <div v-if="session.actions && session.actions.length" class="mt-3 pt-3 border-t border-gray-700">
          <div class="text-xs text-gray-400 mb-1">Actions ({{ session.actions.length }})</div>
          <ul class="space-y-2">
            <li v-for="(action, idx) in session.actions" :key="idx" class="text-xs text-gray-300">
              <template v-if="action.type === 'session_end'">
                <div>
                  <strong>• Session End</strong>
                  <span class="text-gray-400"> (Timestamp: {{ formatTimestamp(action.timestamp) }})</span>
                  <ul class="list-disc list-inside ml-4">
                    <li v-if="action.url"><strong>URL:</strong> <a :href="action.url" target="_blank" class="text-blue-400 hover:underline">{{ action.url }}</a></li>
                    <li v-if="parseJsonSafely(action.detail)?.duration"><strong>Duration:</strong> {{ formatDuration(parseJsonSafely(action.detail).duration) }}</li>
                    <li v-if="parseJsonSafely(action.detail)?.pageViews"><strong>Page Views:</strong> {{ parseJsonSafely(action.detail).pageViews }}</li>
                    <li v-if="parseJsonSafely(action.detail)?.actionsCount"><strong>Actions Count:</strong> {{ parseJsonSafely(action.detail).actionsCount }}</li>
                  </ul>
                </div>
              </template>
              <template v-else-if="action.type === 'page_hidden'">
                <div>
                  <strong>• Page Hidden</strong>
                  <span class="text-gray-400"> (Timestamp: {{ formatTimestamp(action.timestamp) }})</span>
                  <ul class="list-disc list-inside ml-4">
                    <li v-if="action.url"><strong>URL:</strong> <a :href="action.url" target="_blank" class="text-blue-400 hover:underline">{{ action.url }}</a></li>
                  </ul>
                </div>
              </template>
              <template v-else>
                <div>
                  <strong>• {{ action.type || action.actionType || 'Action' }}</strong>
                  <span class="text-gray-400"> (Timestamp: {{ formatTimestamp(action.timestamp) }})</span>
                  <ul class="list-disc list-inside ml-4">
                    <li
                      v-for="[key, val] in Object.entries(action)"
                      :key="key"
                      v-if="key !== 'type' && key !== 'actionType' && key !== 'timestamp'"
                    >
                      <strong>{{ key }}:</strong>
                      <span v-if="key === 'url'">
                        <a :href="val as string" target="_blank" class="text-blue-400 hover:underline">{{ val as string }}</a>
                      </span>
                      <span v-else>{{ val as string }}</span>
                    </li>
                  </ul>
                </div>
              </template>
            </li>
          </ul>
        </div>
        <div v-else class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          No actions recorded for this session.
        </div>

        <!-- Session Events -->
        <div v-if="session.events && session.events.length" class="mt-3 pt-3 border-t border-gray-700">
          <div class="text-xs text-gray-400 mb-1">Events ({{ session.events.length }})</div>
          <ul class="space-y-2">
            <li v-for="(event, idx) in session.events" :key="idx" class="text-xs text-gray-300">
              <div>
                <strong>• {{ (event.eventType || 'Event').replace('_', ' ') }}</strong>
                <span class="text-gray-400"> (Timestamp: {{ formatTimestamp(event.timestamp) }})</span>
                <ul class="list-disc list-inside ml-4">
                  <template v-if="event.eventDetails">
                    <template v-if="event.eventType === 'PAGE_VIEW'">
                      <li v-if="parseJsonSafely(event.eventDetails)?.url">
                        <strong>URL:</strong>
                        <a :href="parseJsonSafely(event.eventDetails).url" target="_blank" class="text-blue-400 hover:underline">
                          {{ parseJsonSafely(event.eventDetails).url }}
                        </a>
                      </li>
                      <li v-if="parseJsonSafely(event.eventDetails)?.title">
                        <strong>Title:</strong> {{ parseJsonSafely(event.eventDetails).title }}
                      </li>
                      <li v-if="parseJsonSafely(event.eventDetails)?.referrer">
                        <strong>Referrer:</strong> {{ parseJsonSafely(event.eventDetails).referrer }}
                      </li>
                      <li v-if="parseJsonSafely(event.eventDetails)?.timestamp">
                        <strong>Event Timestamp:</strong> {{ formatTimestamp(parseJsonSafely(event.eventDetails).timestamp) }}
                      </li>
                    </template>
                    <template v-else>
                      <li
                        v-for="[key, val] in Object.entries(parseJsonSafely(event.eventDetails))"
                        :key="key"
                      >
                        <strong>{{ key }}:</strong>
                        <span v-if="key === 'url'">
                          <a :href="val as string" target="_blank" class="text-blue-400 hover:underline">{{ val as string }}</a>
                        </span>
                        <span v-else-if="key === 'timestamp'">
                          {{ formatTimestamp(val as string | number) }}
                        </span>
                        <span v-else>{{ val as string }}</span>
                      </li>
                    </template>
                  </template>
                </ul>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          No events recorded for this session.
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

function formatTimestamp(ts: number | string) {
  if (!ts) return '-';
  const date = typeof ts === 'string' && !isNaN(Number(ts)) ? new Date(Number(ts)) : new Date(ts);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatDuration(seconds: number) {
  if (!seconds && seconds !== 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatLocation(session: any) {
  const parts = [session.city, session.region, session.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

function parseJsonSafely(val: any): any {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return {};
  }
}
</script>