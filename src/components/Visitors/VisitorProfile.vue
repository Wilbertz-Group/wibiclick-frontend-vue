// wibiclick-frontend-vue/src/components/Visitors/VisitorProfile.vue
<template>
  <div class="card-modern p-4">
    <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
      Visitor Profile
      <span v-if="visitorProfile && visitorProfile.isBot" class="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :title="visitorProfile.botTag || 'Bot detected'">
        <font-awesome-icon icon="exclamation-triangle" class="mr-1 text-xs" />
        Bot
        <span v-if="visitorProfile.botTag" class="ml-1">
          <font-awesome-icon icon="info-circle" class="text-xs" v-tooltip="visitorProfile.botTag" />
        </span>
      </span>
    </h4>
    <div v-if="visitorProfile">
      <div class="space-y-3 text-gray-700 dark:text-gray-300">
        <p><strong>Visitor ID:</strong> {{ visitorProfile.id }}</p>
        <p><strong>First Seen:</strong> {{ visitorProfile.firstSeen ? new Date(visitorProfile.firstSeen).toLocaleString() : '-' }}</p>
        <p><strong>Last Seen:</strong> {{ visitorProfile.lastSeen ? new Date(visitorProfile.lastSeen).toLocaleString() : '-' }}</p>
        <p><strong>Total Sessions:</strong> {{ visitorProfile.totalSessions }}</p>
        <p><strong>Total Events:</strong> {{ visitorProfile.totalEvents }}</p>
        <!-- Add more visitor details as available from the API -->
        <div v-if="visitorProfile.isBot" class="flex items-center mt-2">
          <font-awesome-icon icon="exclamation-triangle" class="text-yellow-500 mr-2" />
          <span class="text-xs text-yellow-700 dark:text-yellow-400 font-semibold">Bot detected</span>
          <span v-if="visitorProfile.botTag" class="ml-2 text-xs text-gray-500 dark:text-gray-400" :title="visitorProfile.botTag">
            ({{ visitorProfile.botTag }})
          </span>
        </div>
      </div>

      <h5 class="text-md font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Recent Sessions</h5>
      <div v-if="visitorProfile.sessions && visitorProfile.sessions.length > 0">
        <ul class="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li v-for="session in visitorProfile.sessions" :key="session.id">
            Session ID: {{ session.id }} (Started: {{ new Date(session.startedAt).toLocaleString() }})
            <!-- Potentially add a link or button here to view the journey for this specific session -->
          </li>
        </ul>
      </div>
      <div v-else class="text-gray-500 dark:text-gray-400">
        No session history available.
      </div>

      <!-- You might want to add a section for a list of events here as well -->

    </div>
    <div v-else class="text-gray-500 dark:text-gray-400">
      No visitor profile data available.
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  visitorProfile: {
    type: Object,
    default: () => null
  }
});
</script>

<style scoped>
/* Add any specific styles for the visitor profile here */
/* Using existing modern styles from Visitors.vue */
.card-modern {
 @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}
</style>