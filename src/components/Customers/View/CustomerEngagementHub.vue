<!-- wibiclick-frontend-vue/src/components/Customers/View/CustomerEngagementHub.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import { formatRelativeTime } from '@/helpers';

const props = defineProps({
  followupSuggestions: {
    type: Array,
    default: () => []
  },
  scheduledMessages: {
    type: Array,
    default: () => []
  },
  loggedFollowUps: {
    type: Array,
    default: () => []
  },
  serviceFollowUps: {
    type: Array,
    default: () => []
  },
  holidayGreetings: {
    type: Array,
    default: () => []
  },
  isFetchingSuggestions: Boolean,
  suggestionsError: String,
  isFetchingScheduled: Boolean,
  scheduledError: String,
  isFetchingGreetings: Boolean,
  greetingsError: String
});

const emit = defineEmits([
  'fetch-suggestions',
  'schedule-suggestion',
  'send-suggestion-now',
  'log-suggestion-manually',
  'dismiss-suggestion',
  'fetch-scheduled-messages',
  'cancel-scheduled-message',
  'schedule-greeting',
  'send-greeting-now',
  'fetch-holiday-greetings'
]);
</script>

<template>
  <div class="space-y-6 h-full">
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Proactive Engagement Hub</h3>

    <!-- LLM Suggestions Section -->
    <section class="card-modern p-4">
      <div class="flex justify-between items-center mb-3">
         <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200">AI Suggestions</h4>
         <button @click="emit('fetch-suggestions')" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingSuggestions" aria-label="Refresh AI suggestions">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingSuggestions }" />
         </button>
      </div>
      <div v-if="isFetchingSuggestions" class="text-center py-3 text-sm text-gray-500 dark:text-gray-400">Loading suggestions...</div>
      <div v-else-if="suggestionsError" class="text-sm text-red-600 dark:text-red-400">Error: {{ suggestionsError }}</div>
      <div v-else-if="followupSuggestions && followupSuggestions.length > 0" class="space-y-3">
         <!-- Suggestion display -->
         <div v-for="(suggestion, index) in followupSuggestions" :key="index" class="border rounded p-3 text-sm bg-gray-50 dark:bg-gray-700/30">
            <p class="font-medium mb-1">{{ suggestion.title }} (Reason: {{ suggestion.reason }})</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Timing: {{ suggestion.timing }}</p>
            <!-- Use v-html for draft message -->
            <div v-html="suggestion.draftMessage" class="bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-xs space-y-1"></div>
            <div class="flex justify-end space-x-2 mt-2">
               <button class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="emit('schedule-suggestion', suggestion)">Schedule</button>
               <button class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="emit('send-suggestion-now', suggestion)">Send Now</button>
               <button class="btn-ghost-modern text-xs py-0.5 px-1.5" @click="emit('log-suggestion-manually', suggestion)">Log Manual</button>
               <button class="btn-ghost-modern text-xs py-0.5 px-1.5 text-red-500" @click="emit('dismiss-suggestion', index)">Dismiss</button>
            </div>
         </div>
      </div>
      <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No AI suggestions available. Click refresh to check.</div>
    </section>

    <!-- Scheduled Messages Section -->
    <section class="card-modern p-4">
       <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Scheduled Messages</h4>
       <div class="flex justify-between items-center mb-2">
          <!-- Refresh button -->
          <button @click="emit('fetch-scheduled-messages')" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingScheduled" aria-label="Refresh scheduled messages">
             <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingScheduled }" />
          </button>
       </div>
       <!-- Loading State -->
       <div v-if="isFetchingScheduled" class="text-center py-3 text-sm text-gray-500 dark:text-gray-400">Loading scheduled messages...</div>
       <!-- Error State -->
       <div v-else-if="scheduledError" class="text-sm text-red-600 dark:text-red-400">Error: {{ scheduledError }}</div>
       <!-- Message List -->
       <div v-else-if="scheduledMessages && scheduledMessages.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-1">
          <div v-for="message in scheduledMessages" :key="message.id" class="border rounded p-3 text-sm bg-gray-50 dark:bg-gray-700/30 flex justify-between items-start">
             <div>
                <p class="font-medium mb-1">
                   Scheduled for: {{ message.scheduledAt ? new Date(message.scheduledAt).toLocaleString() : 'N/A' }}
                   <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ message.type || 'Follow-up' }})</span>
                </p>
                <p class="italic bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-xs">"{{ message.messageContent || 'No content' }}"</p>
             </div>
             <button
                @click="emit('cancel-scheduled-message', message.id)"
                class="btn-ghost-modern text-xs py-0.5 px-1.5 text-red-500 ml-2 flex-shrink-0"
                title="Cancel this scheduled message"
             >
                Cancel
             </button>
          </div>
       </div>
       <!-- Empty State -->
       <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No messages currently scheduled.</div>
    </section>

    <!-- Logged Follow-ups & Satisfaction Section -->
    <section class="card-modern p-4">
       <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Follow-up History & Satisfaction</h4>

       <!-- Follow-up History Display -->
       <div class="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700/50">
          <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">History</h5>
          <div v-if="loggedFollowUps && loggedFollowUps.length > 0" class="space-y-2 max-h-40 overflow-y-auto pr-1">
             <div v-for="followUp in loggedFollowUps" :key="followUp.id" class="text-xs">
                <p>
                   <span class="font-medium">{{ new Date(followUp.createdAt).toLocaleDateString() }}:</span>
                   Status: {{ followUp.status }}
                   <span v-if="followUp.jobId"> (Job #{{ followUp.jobId }})</span>
                </p>
                <p v-if="followUp.feedback" class="italic text-gray-600 dark:text-gray-400 pl-2">"{{ followUp.feedback }}"</p>
             </div>
          </div>
           <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">No logged follow-up history found.</p>
       </div>


       <!-- Post-Service Satisfaction Display -->
       <div class="">
          <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Satisfaction</h5>
           <!-- Service Follow-Ups -->
           <div v-if="serviceFollowUps && serviceFollowUps.length > 0">
             <div v-for="followUp in serviceFollowUps.slice(0, 3)" :key="followUp.id" class="text-xs border-b dark:border-gray-700/50 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                <p>Job #{{ followUp.jobId }} ({{ followUp.status }})</p>
                <p v-if="followUp.satisfactionRating">
                   Rating:
                   <span class="text-yellow-500 ml-1">
                      <template v-for="i in 5" :key="i">
                        <font-awesome-icon :icon="i <= followUp.satisfactionRating ? 'star' : ['far', 'star']" />
                      </template>
                   </span>
                </p>
                <p v-if="followUp.feedback" class="italic text-gray-600 dark:text-gray-400">"{{ followUp.feedback }}"</p>
             </div>
           </div>
           <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">No recent satisfaction feedback recorded.</p>
       </div>
    </section>

     <!-- Holiday/Occasion Messages Section -->
    <section class="card-modern p-4">
       <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Suggested Greetings</h4>
       <!-- Loading State -->
       <div v-if="isFetchingGreetings" class="text-center py-4">
         <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
         <p class="text-sm text-gray-500 mt-2">Loading greetings...</p>
       </div>
       <!-- Error State -->
       <div v-else-if="greetingsError" class="text-center py-4 text-red-600 dark:text-red-400">
         <p>Error loading greetings: {{ greetingsError }}</p>
         <button @click="emit('fetch-holiday-greetings')" class="btn-secondary-modern mt-2">Retry</button>
       </div>
       <!-- Display fetched greetings -->
       <div v-else-if="holidayGreetings && holidayGreetings.length > 0" class="space-y-3">
          <div v-for="(greeting, index) in holidayGreetings" :key="index" class="border rounded p-3 text-sm bg-gray-50 dark:bg-gray-700/30">
             <p class="font-medium mb-1">{{ greeting.specificOccasion }} ({{ greeting.occasionType }}) - {{ new Date(greeting.occasionDate).toLocaleDateString() }}</p>
             <!-- Use v-html for draft message -->
             <div v-html="greeting.draftMessage" class="bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-xs space-y-1"></div>
             <div class="flex justify-end space-x-2 mt-2">
                <!-- Show Schedule button only if not already scheduled -->
                <button v-if="!greeting.followUpId" class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="emit('schedule-greeting', greeting)">Schedule</button>
                <button class="btn-secondary-modern text-xs py-0.5 px-1.5" @click="emit('send-greeting-now', greeting)">Send Now</button>
                <!-- Show Cancel button only if scheduled -->
                <button v-if="greeting.followUpId" class="btn-ghost-modern text-xs py-0.5 px-1.5 text-red-500" @click="emit('cancel-scheduled-message', greeting.followUpId)">Cancel</button>
             </div>
          </div>
       </div>
       <!-- Empty State -->
       <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No suggested greetings available at this time.</p>
    </section>
  </div>
</template>