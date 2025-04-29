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

// Helper function to format activity status for display
function formatActivityStatus(status) {
  if (!status) return '';
  
  // Replace camelCase with spaces (e.g., "customerCreated" -> "customer Created")
  return status
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
}

// Helper function to get a readable date from a timestamp
function getFormattedDate(timestamp) {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return timestamp;
  }
}

// Helper to extract most relevant data from an activity
function getActivitySummary(activity) {
  if (!activity) return null;
  
  const summary = {
    title: '',
    description: '',
    timestamp: activity.createdAt || activity.updatedAt,
    icon: 'info-circle',
    iconClass: 'text-gray-500'
  };
  
  // Set title and description based on activity type
  switch (activity.type) {
    case 'customer':
      summary.title = 'Customer';
      summary.description = activity.status || 'Customer activity';
      summary.icon = 'user';
      summary.iconClass = 'text-blue-500';
      break;
    case 'job':
      summary.title = 'Job';
      summary.description = activity.status || 'Job activity';
      summary.icon = 'briefcase';
      summary.iconClass = 'text-green-500';
      break;
    case 'estimate':
      summary.title = 'Estimate';
      summary.description = activity.status || 'Estimate activity';
      summary.icon = 'file-invoice-dollar';
      summary.iconClass = 'text-purple-500';
      break;
    case 'invoice':
      summary.title = 'Invoice';
      summary.description = activity.status || 'Invoice activity';
      summary.icon = 'receipt';
      summary.iconClass = 'text-orange-500';
      break;
    case 'payment':
      summary.title = 'Payment';
      summary.description = activity.status || 'Payment activity';
      summary.icon = 'money-bill-wave';
      summary.iconClass = 'text-green-600';
      break;
    case 'expense':
      summary.title = 'Expense';
      summary.description = activity.status || 'Expense recorded';
      summary.icon = 'money-bill-wave';
      summary.iconClass = 'text-red-500';
      break;
    default:
      summary.title = activity.type || 'Activity';
      summary.description = activity.status || 'System activity';
  }
  
  // Clean up the description text
  if (summary.description) {
    summary.description = formatActivityStatus(summary.description);
  }
  
  return summary;
}
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
                <!-- Loop through all activities and render them with appropriate component -->
                <div v-for="activity in customer.activities" :key="activity.uid" class="activity-item">
                  <!-- Use specific components for messaging activity types -->
                  <component
                    v-if="activity.type === 'note' && activityTabs.find(t => t.type === 'note')?.component"
                    :is="activityTabs.find(t => t.type === 'note')?.component"
                    :note="activity"
                    class="mb-3"
                  />
                  <component
                    v-else-if="activity.type === 'whatsapp' && activityTabs.find(t => t.type === 'whatsapp')?.component"
                    :is="activityTabs.find(t => t.type === 'whatsapp')?.component"
                    :whatsapp="activity"
                    class="mb-3"
                  />
                  <component
                    v-else-if="activity.type === 'email' && activityTabs.find(t => t.type === 'email')?.component"
                    :is="activityTabs.find(t => t.type === 'email')?.component"
                    :email="activity"
                    class="mb-3"
                  />
                  <component
                    v-else-if="activity.type === 'view' && activityTabs.find(t => t.type === 'view')?.component"
                    :is="activityTabs.find(t => t.type === 'view')?.component"
                    :view="activity"
                    class="mb-3"
                  />
                  <component
                    v-else-if="activity.type === 'click' && activityTabs.find(t => t.type === 'click')?.component"
                    :is="activityTabs.find(t => t.type === 'click')?.component"
                    :click="activity"
                    class="mb-3"
                  />
                  <component
                    v-else-if="activity.type === 'form' && activityTabs.find(t => t.type === 'form')?.component"
                    :is="activityTabs.find(t => t.type === 'form')?.component"
                    :form="activity"
                    class="mb-3"
                  />
                  <!-- Generic card for other activity types (job, customer, invoice, etc.) -->
                  <div 
                    v-else 
                    class="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div class="flex items-start">
                      <!-- Activity Icon -->
                      <div class="mr-3 mt-0.5 flex-shrink-0">
                        <font-awesome-icon 
                          :icon="getActivitySummary(activity)?.icon || 'info-circle'" 
                          :class="getActivitySummary(activity)?.iconClass || 'text-gray-500'"
                          size="lg"
                        />
                      </div>
                      
                      <!-- Activity Content -->
                      <div class="flex-grow">
                        <div class="flex justify-between items-start">
                          <!-- Title and Status -->
                          <div>
                            <p class="font-medium text-gray-800 dark:text-gray-200">
                              {{ getActivitySummary(activity)?.title || 'Activity' }}
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              {{ getActivitySummary(activity)?.description || 'System activity' }}
                            </p>
                          </div>
                          
                          <!-- Timestamp -->
                          <span class="text-xs text-gray-500 dark:text-gray-500 ml-2">
                            {{ formatRelativeTime(getActivitySummary(activity)?.timestamp) }}
                          </span>
                        </div>
                        
                        <!-- Entity details - only show if there are relevant entity details -->
                        <div 
                          v-if="activity.job || activity.invoice || activity.estimate || activity.payment" 
                          class="mt-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/50 pt-1"
                        >
                          <!-- Job details -->
                          <div v-if="activity.job" class="mt-1">
                            <p><strong>Job:</strong> {{ activity.job.name || 'Unnamed job' }}</p>
                            <p v-if="activity.job.issue" class="text-xs text-gray-500 dark:text-gray-500">Issue: {{ activity.job.issue }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">Status: {{ activity.job.jobStatus }}</p>
                          </div>
                          
                          <!-- Invoice details -->
                          <div v-if="activity.invoice" class="mt-1">
                            <p><strong>Invoice #{{ activity.invoice.number }}:</strong> {{ formatCurrency ? formatCurrency(activity.invoice.sales) : 'R' + activity.invoice.sales }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">
                              Due: {{ new Date(activity.invoice.dueAt).toLocaleDateString() }}
                              <span v-if="activity.invoice.paid" class="ml-2 text-green-600 dark:text-green-400">• Paid</span>
                            </p>
                          </div>
                          
                          <!-- Estimate details -->
                          <div v-if="activity.estimate" class="mt-1">
                            <p><strong>Estimate #{{ activity.estimate.number }}:</strong> {{ formatCurrency ? formatCurrency(activity.estimate.sales) : 'R' + activity.estimate.sales }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">Status: {{ activity.estimate.reason || 'Pending' }}</p>
                          </div>
                          
                          <!-- Payment details -->
                          <div v-if="activity.payment" class="mt-1">
                            <p><strong>Payment:</strong> {{ formatCurrency ? formatCurrency(activity.payment.total) : 'R' + activity.payment.total }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">Method: {{ activity.payment.paymentMethod }}</p>
                          </div>
                        </div>
                        
                        <!-- User attribution -->
                        <div v-if="activity.User?.firstName" class="mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                          Updated by {{ activity.User.firstName }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Render Receipts Tab -->
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

            <!-- Render Engagement Hub -->
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