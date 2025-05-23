<template>
  <div class="bg-gray-800/50 rounded-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-cyan-300 font-semibold">Complete Visitor Journey</h3>
      <div class="flex items-center gap-2 text-xs text-gray-400">
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span>Entry</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Page View</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span>Interaction</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Exit</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
    </div>

    <div v-else-if="error" class="text-center py-8 text-red-300">
      {{ error }}
    </div>

    <div v-else-if="!journeySteps.length" class="text-center py-8 text-gray-400">
      No journey data available
    </div>

    <div v-else class="space-y-6">
      <!-- Source Attribution Card -->
      <div v-if="sourceAttribution" class="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
            <font-awesome-icon :icon="getSourceIcon(sourceAttribution.firstSource)" class="text-white text-sm" />
          </div>
          <div>
            <h4 class="text-emerald-300 font-semibold">Visitor Arrived</h4>
            <p class="text-xs text-gray-400">{{ formatDate(sourceAttribution.firstVisitTimestamp) }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span class="text-gray-400">Source:</span>
            <span class="text-white ml-1 font-medium">{{ formatSource(sourceAttribution.firstSource) }}</span>
          </div>
          <div v-if="sourceAttribution.firstSourceDetail">
            <span class="text-gray-400">From:</span>
            <span class="text-white ml-1">{{ sourceAttribution.firstSourceDetail }}</span>
          </div>
          <div v-if="sourceAttribution.campaign">
            <span class="text-gray-400">Campaign:</span>
            <span class="text-cyan-300 ml-1">{{ sourceAttribution.campaign }}</span>
          </div>
        </div>
        <div v-if="sourceAttribution.firstReferrer" class="mt-2 text-xs">
          <span class="text-gray-400">Referrer:</span>
          <a :href="sourceAttribution.firstReferrer" target="_blank" class="text-cyan-300 hover:text-cyan-200 ml-1 break-all">
            {{ sourceAttribution.firstReferrer }}
          </a>
        </div>
      </div>

      <!-- Journey Timeline -->
      <div class="relative">
        <!-- Timeline Line -->
        <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600"></div>

        <!-- Journey Steps -->
        <div class="space-y-6">
          <div
            v-for="(step, index) in journeySteps"
            :key="`${step.sessionId}-${step.timestamp}-${index}`"
            class="relative flex items-start gap-4"
          >
            <!-- Timeline Node -->
            <div class="relative z-10 flex-shrink-0">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg"
                :class="getStepStyles(step.type)"
              >
                <font-awesome-icon :icon="getStepIcon(step.type)" class="text-lg" />
              </div>
              <!-- Session Indicator -->
              <div v-if="step.sessionStart" class="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                {{ step.sessionNumber }}
              </div>
            </div>

            <!-- Step Content -->
            <div class="flex-1 min-w-0">
              <div class="bg-gray-900/60 rounded-lg p-4 border border-gray-700/50">
                <!-- Step Header -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <h4 class="font-semibold text-white">{{ step.title }}</h4>
                    <span v-if="step.sessionStart" class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                      Session {{ step.sessionNumber }}
                    </span>
                    <span v-if="step.isBot" class="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                      Bot
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ formatTime(step.timestamp) }}
                  </div>
                </div>

                <!-- Step Details -->
                <div class="space-y-2">
                  <!-- Page Information -->
                  <div v-if="step.url" class="flex items-start gap-2">
                    <font-awesome-icon icon="globe" class="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div class="min-w-0 flex-1">
                      <a :href="step.url" target="_blank" class="text-cyan-300 hover:text-cyan-200 text-sm break-all">
                        {{ step.pageTitle || step.url }}
                      </a>
                      <div v-if="step.pageTitle && step.url !== step.pageTitle" class="text-xs text-gray-500 break-all">
                        {{ step.url }}
                      </div>
                    </div>
                  </div>

                  <!-- Action Details -->
                  <div v-if="step.actionDetails" class="flex items-start gap-2">
                    <font-awesome-icon icon="info-circle" class="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div class="text-sm text-gray-300">
                      {{ step.actionDetails }}
                    </div>
                  </div>

                  <!-- Device/Location Changes -->
                  <div v-if="step.deviceChange || step.locationChange" class="flex items-center gap-4 text-xs">
                    <div v-if="step.deviceChange" class="flex items-center gap-1 text-amber-400">
                      <font-awesome-icon icon="mobile-alt" />
                      <span>Device: {{ step.deviceChange }}</span>
                    </div>
                    <div v-if="step.locationChange" class="flex items-center gap-1 text-emerald-400">
                      <font-awesome-icon icon="map-marker-alt" />
                      <span>Location: {{ step.locationChange }}</span>
                    </div>
                  </div>

                  <!-- Duration from previous step -->
                  <div v-if="step.timeSincePrevious && index > 0" class="text-xs text-gray-500">
                    <font-awesome-icon icon="clock" class="mr-1" />
                    {{ step.timeSincePrevious }} since last action
                  </div>

                  <!-- Session Summary for session end -->
                  <div v-if="step.sessionSummary" class="mt-3 p-3 bg-gray-800/80 rounded border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Session Summary</div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span class="text-gray-400">Duration:</span>
                        <span class="text-white ml-1">{{ step.sessionSummary.duration }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">Pages:</span>
                        <span class="text-white ml-1">{{ step.sessionSummary.pageViews }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">Actions:</span>
                        <span class="text-white ml-1">{{ step.sessionSummary.actions }}</span>
                      </div>
                      <div v-if="step.sessionSummary.exitPage">
                        <span class="text-gray-400">Exit:</span>
                        <span class="text-white ml-1 truncate">{{ step.sessionSummary.exitPage }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Final Exit Indicator -->
        <div v-if="finalExit" class="relative flex items-start gap-4 mt-6">
          <div class="relative z-10 flex-shrink-0">
            <div class="w-12 h-12 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center shadow-lg">
              <font-awesome-icon icon="sign-out-alt" class="text-lg text-white" />
            </div>
          </div>
          <div class="flex-1">
            <div class="bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-500/30 rounded-lg p-4">
              <h4 class="font-semibold text-red-300 mb-1">Visitor Left</h4>
              <div class="text-xs text-gray-400">{{ formatDate(finalExit.timestamp) }}</div>
              <div v-if="finalExit.totalTime" class="text-sm text-gray-300 mt-1">
                Total time on site: {{ finalExit.totalTime }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Journey Statistics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div class="text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ journeyStats.totalSessions }}</div>
          <div class="text-xs text-gray-400">Sessions</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ journeyStats.totalPageViews }}</div>
          <div class="text-xs text-gray-400">Page Views</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ journeyStats.totalActions }}</div>
          <div class="text-xs text-gray-400">Interactions</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ journeyStats.totalTime }}</div>
          <div class="text-xs text-gray-400">Total Time</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';

const props = defineProps<{
  visitorId: string;
}>();

const visitorData = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const sourceAttribution = computed(() => visitorData.value?.sourceAttribution);

const journeySteps = computed(() => {
  if (!visitorData.value?.sessions) return [];

  const steps: any[] = [];
  let sessionNumber = 0;
  let previousTimestamp: Date | null = null;
  let previousDevice: string | null = null;
  let previousLocation: string | null = null;

  // Sort sessions by start date
  const sortedSessions = [...visitorData.value.sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  sortedSessions.forEach((session: any) => {
    sessionNumber++;
    let sessionPageViews = 0;
    let sessionActions = 0;

    // Session start
    const sessionStart = new Date(session.startedAt);
    const currentDevice = `${session.deviceType || 'Unknown'} ${session.browser || ''}`.trim();
    const currentLocation = [session.city, session.country].filter(Boolean).join(', ') || 'Unknown';

    steps.push({
      type: 'session_start',
      title: 'Session Started',
      timestamp: sessionStart,
      sessionId: session.id,
      sessionNumber,
      sessionStart: true,
      url: session.entryPage,
      pageTitle: 'Entry Page',
      deviceChange: previousDevice && previousDevice !== currentDevice ? currentDevice : null,
      locationChange: previousLocation && previousLocation !== currentLocation ? currentLocation : null,
      timeSincePrevious: previousTimestamp ? formatDuration(sessionStart.getTime() - previousTimestamp.getTime()) : null,
      isBot: visitorData.value.isBot
    });

    previousDevice = currentDevice;
    previousLocation = currentLocation;
    previousTimestamp = sessionStart;

    // Process events
    if (session.events && session.events.length > 0) {
      session.events.forEach((event: any) => {
        const eventTime = new Date(event.timestamp);
        let stepType = 'unknown';
        let title = 'Unknown Event';
        let actionDetails = '';

        switch (event.eventType) {
          case 'PAGE_VIEW':
            stepType = 'page_view';
            title = 'Viewed Page';
            sessionPageViews++;
            actionDetails = event.eventDetails?.title || 'Page view';
            break;
          case 'CLICK':
            stepType = 'interaction';
            title = 'Clicked Element';
            sessionActions++;
            actionDetails = `Clicked: ${event.eventDetails?.actionType || 'button'}`;
            break;
          case 'FORM_SUBMISSION':
            stepType = 'conversion';
            title = 'Submitted Form';
            sessionActions++;
            actionDetails = 'Form submission - potential lead!';
            break;
          default:
            stepType = 'action';
            title = event.eventType.replace('_', ' ');
            sessionActions++;
        }

        steps.push({
          type: stepType,
          title,
          timestamp: eventTime,
          sessionId: session.id,
          sessionNumber,
          url: event.eventDetails?.url,
          pageTitle: event.eventDetails?.title,
          actionDetails,
          timeSincePrevious: formatDuration(eventTime.getTime() - previousTimestamp!.getTime())
        });

        previousTimestamp = eventTime;
      });
    }

    // Process session actions if no events
    if (session.actions && (!session.events || session.events.length === 0)) {
      session.actions.forEach((action: any) => {
        if (action.type && action.timestamp) {
          const actionTime = new Date(action.timestamp);
          
          steps.push({
            type: action.type === 'session_end' ? 'session_end' : 'action',
            title: formatActionTitle(action.type),
            timestamp: actionTime,
            sessionId: session.id,
            sessionNumber,
            url: action.url,
            actionDetails: formatActionDetails(action),
            timeSincePrevious: previousTimestamp ? formatDuration(actionTime.getTime() - previousTimestamp.getTime()) : null
          });

          previousTimestamp = actionTime;
        }
      });
    }

    // Session end
    if (session.endedAt) {
      const sessionEnd = new Date(session.endedAt);
      const duration = session.duration ? formatDuration(session.duration * 1000) : 'Unknown';

      steps.push({
        type: 'session_end',
        title: 'Session Ended',
        timestamp: sessionEnd,
        sessionId: session.id,
        sessionNumber,
        sessionSummary: {
          duration,
          pageViews: sessionPageViews || session.pageViewCount || 0,
          actions: sessionActions,
          exitPage: session.exitPage
        },
        timeSincePrevious: previousTimestamp ? formatDuration(sessionEnd.getTime() - previousTimestamp.getTime()) : null
      });

      previousTimestamp = sessionEnd;
    }
  });

  return steps;
});

const finalExit = computed(() => {
  if (!visitorData.value) return null;

  const lastSession = visitorData.value.sessions?.[0]; // Sessions are ordered desc
  if (!lastSession?.endedAt) return null;

  return {
    timestamp: lastSession.endedAt,
    totalTime: visitorData.value.totalTimeOnSite ? formatDuration(visitorData.value.totalTimeOnSite * 1000) : null
  };
});

const journeyStats = computed(() => {
  const sessions = visitorData.value?.sessions || [];
  return {
    totalSessions: sessions.length,
    totalPageViews: visitorData.value?.totalPageViews || 0,
    totalActions: journeySteps.value.filter(step => 
      ['interaction', 'conversion', 'action'].includes(step.type)
    ).length,
    totalTime: visitorData.value?.totalTimeOnSite ? 
      formatDuration(visitorData.value.totalTimeOnSite * 1000) : '0s'
  };
});

function getSourceIcon(source: string) {
  const sourceMap: Record<string, string> = {
    'DIRECT_TRAFFIC': 'globe',
    'ORGANIC_SEARCH': 'search',
    'SOCIAL_MEDIA': 'share-alt',
    'REFERRAL': 'external-link-alt',
    'EMAIL': 'envelope',
    'PAID_SEARCH': 'dollar-sign',
    'GOOGLE_ADS': 'google',
    'FACEBOOK_ADS': 'facebook',
    'UNKNOWN': 'question'
  };
  return sourceMap[source] || 'question';
}

function getStepIcon(type: string) {
  const iconMap: Record<string, string> = {
    'session_start': 'play',
    'page_view': 'eye',
    'interaction': 'mouse-pointer',
    'conversion': 'star',
    'action': 'bolt',
    'session_end': 'stop',
    'unknown': 'circle'
  };
  return iconMap[type] || 'circle';
}

function getStepStyles(type: string) {
  const styleMap: Record<string, string> = {
    'session_start': 'bg-emerald-600 border-emerald-400 text-white',
    'page_view': 'bg-blue-600 border-blue-400 text-white',
    'interaction': 'bg-amber-600 border-amber-400 text-white',
    'conversion': 'bg-purple-600 border-purple-400 text-white',
    'action': 'bg-cyan-600 border-cyan-400 text-white',
    'session_end': 'bg-gray-600 border-gray-400 text-white',
    'unknown': 'bg-gray-500 border-gray-400 text-white'
  };
  return styleMap[type] || 'bg-gray-500 border-gray-400 text-white';
}

function formatSource(source: string) {
  return source.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function formatActionTitle(actionType: string) {
  const titleMap: Record<string, string> = {
    'page_view': 'Viewed Page',
    'page_hidden': 'Page Hidden',
    'session_end': 'Session Ended',
    'interaction': 'User Interaction',
    'widget_opened': 'Opened Contact Widget',
    'widget_closed': 'Closed Contact Widget'
  };
  return titleMap[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatActionDetails(action: any) {
  if (action.detail) {
    if (typeof action.detail === 'string') {
      try {
        const detail = JSON.parse(action.detail);
        if (detail.duration) return `Duration: ${formatDuration(detail.duration)}`;
        if (detail.pageViews) return `${detail.pageViews} page views`;
      } catch (e) {
        return action.detail;
      }
    }
  }
  return '';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString();
}

function formatDuration(ms: number) {
  if (ms < 1000) return '< 1s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

async function fetchVisitorData() {
  loading.value = true;
  error.value = null;

  try {
    const { data } = await axios.get(`/api/analytics/visitor/${props.visitorId}`);
    visitorData.value = data.visitor;
  } catch (err: any) {
    error.value = 'Failed to load visitor journey data';
    console.error('Error fetching visitor data:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchVisitorData);
</script>