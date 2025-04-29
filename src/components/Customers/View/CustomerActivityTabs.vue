<script setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import { formatRelativeTime } from '@/helpers';
import CustomerEngagementHub from '@/components/Customers/View/CustomerEngagementHub.vue';

const props = defineProps({
  activityTabs: {
    type: Array,
    required: true
  },
  customer: {
    type: Object,
    required: true
  },
  latestTimelineSummary: Object,
  latestSentimentAnalysis: Object,
  isFetchingTimelineSummary: Boolean,
  isFetchingSentiment: Boolean,
  timelineSummaryError: String,
  sentimentError: String,
  parsedSentimentContent: Object,
  wkey: Number,
  nkey: Number,
  isFetchingCustomer: Boolean,
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
  'fetch-timeline-summary',
  'fetch-sentiment-analysis',
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
  <section class="card-modern p-0 overflow-hidden min-h-[60vh] lg:min-h-[75vh] flex flex-col"> 
    <TabGroup>
      <TabList class="flex-shrink-0 flex space-x-1 rounded-t-lg bg-gray-100 dark:bg-gray-900/50 p-1 border-b border-gray-200 dark:border-gray-700/50"> 
        <Tab
          v-for="tab in activityTabs"
          :key="tab.name"
          v-slot="{ selected }"
          as="template"
        >
          <button
            :class="[
              'w-full rounded-md py-2 px-3 text-sm font-medium leading-5',
              'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 dark:ring-offset-gray-800 ring-white ring-opacity-60',
              selected
                ? 'bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.30] dark:hover:bg-black/[0.15] hover:text-gray-800 dark:hover:text-gray-200',
              'transition-colors duration-150'
            ]"
          >
            {{ tab.name }}
          </button>
        </Tab>
      </TabList>

      <TabPanels class="flex-grow p-6 sm:p-6 overflow-y-auto ml-5 relative min-h-[200px]">
        <!-- Loading Indicator -->
        <div v-if="isFetchingCustomer" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
          <p class="text-gray-500 dark:text-gray-400 mr-2">Loading activities...</p>
          <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
        </div>

        <!-- Actual Tab Content (rendered only when not fetching) -->
        <template v-else>
          <TabPanel
            v-for="(tab, idx) in activityTabs"
            :key="idx"
            :class="['focus:outline-none h-full']" 
          >
            <!-- Render 'All' Activities tab -->
            <div v-if="tab.name === 'All'" class="space-y-4 h-full">

              <!-- AI Timeline Summary Section -->
              <div class="mb-6 p-4 border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">AI Relationship Summary</h4>
                  <div class="flex items-center space-x-2">
                    <span v-if="latestTimelineSummary?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                      {{ formatRelativeTime(latestTimelineSummary.generatedAt) }}
                    </span>
                    <button @click="emit('fetch-timeline-summary')" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingTimelineSummary" aria-label="Refresh AI summary">
                      <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingTimelineSummary }" />
                    </button>
                  </div>
                </div>
                <div v-if="isFetchingTimelineSummary" class="text-center py-4">
                  <p class="text-sm text-gray-500 dark:text-gray-400">Generating summary...</p>
                </div>
                <div v-else-if="timelineSummaryError" class="text-sm text-red-600 dark:text-red-400">
                  Error generating summary: {{ timelineSummaryError }}
                </div>
                <!-- Use v-html to render HTML from backend -->
                <div v-else-if="latestTimelineSummary?.content" v-html="latestTimelineSummary.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2"></div>
                <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                  Click the refresh button to generate an AI summary of the customer's interaction history.
                </div>
              </div>
              <!-- End AI Timeline Summary Section -->

              <!-- AI Sentiment Analysis Section -->
              <div class="mb-6 p-4 border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow-sm">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-sm font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">AI Sentiment Analysis</h4>
                  <div class="flex items-center space-x-2">
                    <span v-if="latestSentimentAnalysis?.generatedAt" class="text-xs text-gray-400 dark:text-gray-500 italic">
                      {{ formatRelativeTime(latestSentimentAnalysis.generatedAt) }}
                    </span>
                    <button @click="emit('fetch-sentiment-analysis')" class="btn-ghost-modern text-xs p-1" :disabled="isFetchingSentiment" aria-label="Refresh AI sentiment analysis">
                      <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingSentiment }" />
                    </button>
                  </div>
                </div>
                <div v-if="isFetchingSentiment" class="text-center py-4">
                  <p class="text-sm text-gray-500 dark:text-gray-400">Analyzing sentiment...</p>
                </div>
                <div v-else-if="sentimentError" class="text-sm text-red-600 dark:text-red-400">
                  Error analyzing sentiment: {{ sentimentError }}
                </div>
                <!-- Display Sentiment Analysis -->
                <div v-else-if="latestSentimentAnalysis?.content" class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <!-- Use computed property for parsed content -->
                  <template v-if="parsedSentimentContent && typeof parsedSentimentContent === 'object'">
                    <p><strong>Overall Summary:</strong> {{ parsedSentimentContent.overallSummary || 'N/A' }}</p>
                    <div v-if="parsedSentimentContent.individualMessages && parsedSentimentContent.individualMessages.length > 0">
                      <strong>Individual Messages Summary ({{ parsedSentimentContent.individualMessages.length }}):</strong>
                      <ul class="list-disc list-inside ml-1 text-xs max-h-20 overflow-y-auto border dark:border-gray-600 p-1 rounded">
                        <li v-for="(msg, mIndex) in parsedSentimentContent.individualMessages" :key="mIndex">
                          {{ msg.date }} - {{ msg.sentiment }}: {{ msg.keyPoints?.join(', ') || 'No key points' }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="parsedSentimentContent.urgentIssues && parsedSentimentContent.urgentIssues.length > 0">
                      <strong>Urgent Issues:</strong>
                      <ul class="list-disc list-inside ml-1 text-xs text-red-500 dark:text-red-400">
                        <li v-for="(issue, iIndex) in parsedSentimentContent.urgentIssues" :key="iIndex">{{ issue }}</li>
                      </ul>
                    </div>
                    <div v-if="parsedSentimentContent.opportunities && parsedSentimentContent.opportunities.length > 0">
                      <strong>Opportunities:</strong>
                      <ul class="list-disc list-inside ml-1 text-xs text-green-600 dark:text-green-400">
                        <li v-for="(opp, oIndex) in parsedSentimentContent.opportunities" :key="oIndex">{{ opp }}</li>
                      </ul>
                    </div>
                  </template>
                  <!-- Fallback: Display original string content if parsing failed or content wasn't an object -->
                  <template v-else>
                    <p class="whitespace-pre-wrap">{{ latestSentimentAnalysis.content }}</p>
                  </template>
                </div>
                <!-- Empty state -->
                <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                  No sentiment analysis available. Click refresh to generate.
                </div>
              </div>
              <!-- End AI Sentiment Analysis Section -->

              <!-- Activities list -->
              <p v-if="!customer.activities || customer.activities.length === 0" class="text-center text-gray-500 py-8">No activities recorded yet.</p>
              <template v-else>
                <!-- Loop through all activities and try to determine type -->
                <div v-for="activity in customer.activities" :key="activity.uid" class="activity-item">
                  <!-- Basic display - ideally, use specific accordion components -->
                  <component
                    :is="tab.component"
                    v-if="activity.type === 'note'"
                    :note="activity"
                    class="mb-3"
                  />
                  <template v-else-if="activity.type === 'whatsapp'">                              
                    <component
                      :is="accordion"
                      :whatsapp="activity"
                      class="mb-3"
                    />
                  </template>
                  <component
                    :is="accordionEmail"
                    v-else-if="activity.type === 'email'"
                    :email="activity"
                    class="mb-3"
                  />
                  <component
                    :is="accordionView"
                    v-else-if="activity.type === 'view'"
                    :view="activity"
                    class="mb-3"
                  />
                  <component
                    :is="accordionClick"
                    v-else-if="activity.type === 'click'"
                    :click="activity"
                    class="mb-3"
                  />
                  <component
                    :is="accordionForm"
                    v-else-if="activity.type === 'form'"
                    :form="activity"
                    class="mb-3"
                  />
                </div>
              </template>
            </div>

            <!-- Render type-specific Activities (Receipts, Notes, Whatsapp, etc.) -->
            <div v-else-if="tab.name === 'Receipts'" class="space-y-4 h-full">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expense Receipts</h3>
              <div v-if="!customer.expenses || customer.expenses.filter(e => e.imageUrl).length === 0" class="text-center text-gray-500 py-8">
                No expense receipts found for this customer.
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div v-for="expense in customer.expenses.filter(e => e.imageUrl)" :key="expense.id" class="group relative">
                  <a :href="expense.imageUrl" target="_blank" rel="noopener noreferrer" class="block aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <img :src="expense.imageUrl" :alt="'Receipt for ' + expense.description" class="pointer-events-none object-cover group-hover:opacity-75 transition-opacity w-full h-full">
                  </a>
                  <p class="pointer-events-none mt-1 block truncate text-xs font-medium text-gray-700 dark:text-gray-300">{{ expense.description }}</p>
                  <p class="pointer-events-none block text-xs font-medium text-gray-500 dark:text-gray-400">{{ new Date(expense.date).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>

            <!-- Render Engagement Hub (Skipping detailed implementation for brevity) -->
            <div v-else-if="tab.name === 'Engagement'" class="space-y-6 h-full">
              <CustomerEngagementHub
                :followupSuggestions="followupSuggestions"
                :scheduledMessages="scheduledMessages"
                :loggedFollowUps="loggedFollowUps"
                :serviceFollowUps="serviceFollowUps"
                :holidayGreetings="holidayGreetings"
                :isFetchingSuggestions="isFetchingSuggestions"
                :suggestionsError="suggestionsError"
                :isFetchingScheduled="isFetchingScheduled"
                :scheduledError="scheduledError"
                :isFetchingGreetings="isFetchingGreetings"
                :greetingsError="greetingsError"
                @fetch-suggestions="emit('fetch-suggestions')"
                @schedule-suggestion="emit('schedule-suggestion', $event)"
                @send-suggestion-now="emit('send-suggestion-now', $event)"
                @log-suggestion-manually="emit('log-suggestion-manually', $event)"
                @dismiss-suggestion="emit('dismiss-suggestion', $event)"
                @fetch-scheduled-messages="emit('fetch-scheduled-messages')"
                @cancel-scheduled-message="emit('cancel-scheduled-message', $event)"
                @schedule-greeting="emit('schedule-greeting', $event)"
                @send-greeting-now="emit('send-greeting-now', $event)"
                @fetch-holiday-greetings="emit('fetch-holiday-greetings')"
              />
            </div>

            <!-- Render Activity Type Tabs (Notes, Whatsapp, Email, etc.) -->
            <div v-else class="space-y-3 h-full">
              <p v-if="!customer.activities || customer.activities.filter(a => a.type === tab.type).length === 0" class="text-center text-gray-500 py-8">No {{ tab.name.toLowerCase() }} recorded yet.</p>
              <template v-else>
                <template v-for="activity in customer.activities.filter(a => a.type === tab.type)" :key="(tab.name === 'Whatsapp' ? wkey : nkey) + activity.uid">
                  <component
                    :is="tab.component"
                    :[tab.type]="activity"
                  />
                </template>
              </template>
            </div>

          </TabPanel>
        </template>
      </TabPanels>
    </TabGroup>
  </section>
</template>