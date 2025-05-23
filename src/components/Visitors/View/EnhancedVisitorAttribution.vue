<template>
  <section class="card-modern overflow-hidden shadow-xl">
    <!-- Advanced Header with Visitor Score -->
    <div class="bg-gradient-to-r from-emerald-800/90 via-teal-800/90 to-cyan-700/90 p-6 relative overflow-hidden">
      <div class="absolute right-0 top-0 w-40 h-40 rounded-full bg-cyan-500/20 blur-xl -mr-16 -mt-16"></div>
      <div class="absolute left-24 bottom-0 w-20 h-20 rounded-full bg-emerald-500/20 blur-lg -mb-10"></div>
      
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
        <!-- Visitor Identity & Score -->
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <font-awesome-icon 
                :icon="visitor?.isBot ? 'robot' : 'user'" 
                class="text-white text-2xl" 
              />
            </div>
            <div v-if="visitorScore" class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {{ visitorScore }}
            </div>
          </div>
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>{{ visitorTitle }}</span>
              <div v-if="visitor?.isBot" class="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                <font-awesome-icon icon="exclamation-triangle" class="text-yellow-300 text-xs" />
                <span class="text-yellow-300 text-xs font-medium">{{ visitor.botTag || 'Bot' }}</span>
              </div>
            </h2>
            <div class="flex items-center gap-4 text-sm text-cyan-200 mt-1">
              <span v-if="visitorLocation">📍 {{ visitorLocation }}</span>
              <span v-if="visitor?.totalSessions">🔄 {{ visitor.totalSessions }} sessions</span>
              <span v-if="lastSeen">⏰ {{ lastSeen }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <button
            v-if="visitor?.latitude && visitor?.longitude"
            @click="openMap"
            class="flex items-center gap-2 px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 rounded-lg transition-all text-sm"
          >
            <font-awesome-icon icon="map" />
            <span>View Map</span>
          </button>
          
          <button
            @click="refreshData"
            class="flex items-center justify-center w-10 h-10 text-cyan-200 hover:text-white rounded-full hover:bg-cyan-600/30 transition-all duration-150"
            :disabled="loading"
            :class="{ 'animate-spin': loading }"
          >
            <font-awesome-icon icon="sync" />
          </button>
        </div>
      </div>

      <!-- Quick Stats Bar -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ visitor?.totalPageViews || 0 }}</div>
          <div class="text-xs text-cyan-200">Page Views</div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ formatDuration(visitor?.totalTimeOnSite) }}</div>
          <div class="text-xs text-cyan-200">Time on Site</div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ engagementScore }}%</div>
          <div class="text-xs text-cyan-200">Engagement</div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ conversionProbability }}%</div>
          <div class="text-xs text-cyan-200">Conv. Probability</div>
        </div>
      </div>
    </div>

    <!-- Enhanced Navigation -->
    <div class="bg-gray-900 px-6 py-4 border-b border-gray-700">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium"
          :class="activeTab === tab.id
            ? 'bg-cyan-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <font-awesome-icon :icon="tab.icon" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.badge" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {{ tab.badge }}
          </span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="bg-gradient-to-b from-gray-900 to-gray-800">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 rounded-full bg-cyan-800/30 flex items-center justify-center mb-4">
          <span class="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
        </div>
        <p class="text-sm text-cyan-300 animate-pulse">Loading visitor intelligence...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center p-12">
        <div class="w-20 h-20 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-3xl" />
        </div>
        <p class="text-red-300 mb-4 text-lg font-medium">{{ error }}</p>
        <button @click="refreshData" class="px-6 py-3 bg-red-700/30 hover:bg-red-700/50 text-red-200 rounded-lg transition-colors">
          <font-awesome-icon icon="sync" class="mr-2" /> Retry
        </button>
      </div>

      <!-- No Data State -->
      <div v-else-if="!visitor" class="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div class="w-20 h-20 mx-auto bg-cyan-900/20 rounded-full flex items-center justify-center mb-6">
          <font-awesome-icon icon="user-slash" class="text-cyan-400 text-2xl" />
        </div>
        <p class="text-cyan-300 font-medium mb-2 text-lg">No visitor data available</p>
        <p class="text-gray-400 text-sm max-w-md">This visitor may not have been tracked yet or the data is still being processed.</p>
      </div>

      <!-- Main Content -->
      <div v-else class="p-6">
        <!-- Intelligence Overview Tab -->
        <div v-if="activeTab === 'intelligence'" class="space-y-6">
          <!-- AI Insights Panel -->
          <div class="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-lg p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <font-awesome-icon icon="brain" class="text-white" />
              </div>
              <div>
                <h3 class="text-purple-300 font-semibold">AI Visitor Intelligence</h3>
                <p class="text-xs text-gray-400">Automated insights and recommendations</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="insight in aiInsights" :key="insight.type" class="bg-gray-800/60 rounded-lg p-4 border border-gray-600/50">
                <div class="flex items-center gap-2 mb-2">
                  <font-awesome-icon :icon="insight.icon" :class="insight.color" />
                  <span class="text-sm font-medium text-white">{{ insight.title }}</span>
                </div>
                <p class="text-xs text-gray-300">{{ insight.description }}</p>
                <div v-if="insight.action" class="mt-2">
                  <button class="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                    {{ insight.action }} →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Visitor Behavior Heatmap -->
          <div class="bg-gray-800/50 rounded-lg p-6">
            <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
              <font-awesome-icon icon="fire" class="mr-2" />
              Behavior Heatmap
            </h3>
            <div class="grid grid-cols-7 gap-2 mb-4">
              <div v-for="day in behaviorHeatmap" :key="day.date" class="text-center">
                <div class="text-xs text-gray-400 mb-1">{{ day.label }}</div>
                <div 
                  class="w-full h-12 rounded border border-gray-600"
                  :class="day.activity > 0 ? 'bg-cyan-500' : 'bg-gray-700'"
                  :style="{ opacity: Math.max(0.1, day.activity / 100) }"
                  :title="`${day.activity}% activity`"
                ></div>
              </div>
            </div>
            <div class="text-xs text-gray-400 text-center">Activity levels over the past 7 days</div>
          </div>

          <!-- Conversion Funnel -->
          <div class="bg-gray-800/50 rounded-lg p-6">
            <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
              <font-awesome-icon icon="funnel-dollar" class="mr-2" />
              Conversion Funnel Progress
            </h3>
            <div class="space-y-3">
              <div v-for="(stage, index) in conversionFunnel" :key="stage.name" class="relative">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-white font-medium">{{ stage.name }}</span>
                  <span class="text-xs text-gray-400">{{ stage.completion }}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="stage.completed ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-gray-600 to-gray-500'"
                    :style="{ width: `${stage.completion}%` }"
                  ></div>
                  <div v-if="stage.completed" class="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <font-awesome-icon icon="check" class="text-white text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Geographic Intelligence Tab -->
        <div v-if="activeTab === 'geographic'" class="space-y-6">
          <GeographicIntelligence :visitor="visitor" />
        </div>

        <!-- Attribution Tab -->
        <div v-if="activeTab === 'attribution'" class="space-y-6">
          <AttributionFlowChart v-if="attribution" :attribution="attribution" />
          <div v-else class="text-center py-12 text-gray-400">
            <font-awesome-icon icon="project-diagram" class="text-4xl mb-4" />
            <p>No attribution data available</p>
          </div>
        </div>

        <!-- Journey Tab -->
        <div v-if="activeTab === 'journey'" class="space-y-6">
          <VisitorJourneyTimeline :visitor-id="visitorId" />
        </div>

        <!-- Sessions Tab -->
        <div v-if="activeTab === 'sessions'" class="space-y-6">
          <SessionHistoryList :sessions="sessions" />
        </div>

        <!-- Technical Details Tab -->
        <div v-if="activeTab === 'technical'" class="space-y-6">
          <TechnicalDetails :visitor="visitor" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from 'axios';
import AttributionFlowChart from './AttributionFlowChart.vue';
import VisitorJourneyTimeline from './VisitorJourneyTimeline.vue';
import SessionHistoryList from './SessionHistoryList.vue';

// Components for new tabs
const GeographicIntelligence = {
  props: ['visitor'],
  template: `
    <div class="space-y-6">
      <!-- Location Overview -->
      <div class="bg-gray-800/50 rounded-lg p-6">
        <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="globe" class="mr-2" />
          Geographic Profile
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Location Details -->
          <div class="space-y-3">
            <h4 class="text-white font-medium">Location Details</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Country:</span>
                <span class="text-white">{{ visitor?.country || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Region:</span>
                <span class="text-white">{{ visitor?.region || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">City:</span>
                <span class="text-white">{{ visitor?.city || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Timezone:</span>
                <span class="text-white">{{ visitor?.timezone || 'Unknown' }}</span>
              </div>
            </div>
          </div>

          <!-- Coordinates -->
          <div class="space-y-3">
            <h4 class="text-white font-medium">Coordinates</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Latitude:</span>
                <span class="text-white">{{ visitor?.latitude || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Longitude:</span>
                <span class="text-white">{{ visitor?.longitude || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Postal Code:</span>
                <span class="text-white">{{ visitor?.postalCode || 'Unknown' }}</span>
              </div>
            </div>
          </div>

          <!-- Regional Intelligence -->
          <div class="space-y-3">
            <h4 class="text-white font-medium">Regional Intelligence</h4>
            <div class="space-y-2 text-sm">
              <div class="bg-blue-600/20 p-3 rounded border border-blue-500/30">
                <div class="text-blue-300 font-medium mb-1">Market Insights</div>
                <div class="text-gray-300 text-xs">{{ getMarketInsights(visitor) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    getMarketInsights(visitor: any) {
      if (visitor?.country === 'South Africa') {
        return 'High-value market with strong digital adoption. Peak activity typically 9AM-5PM SAST.';
      }
      return 'International visitor - consider time zone differences for optimal engagement.';
    }
  }
};

const TechnicalDetails = {
  props: ['visitor'],
  template: `
    <div class="space-y-6">
      <!-- Device Information -->
      <div class="bg-gray-800/50 rounded-lg p-6">
        <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="laptop" class="mr-2" />
          Device & Technology Stack
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-white font-medium mb-3">Device Information</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Device Type:</span>
                <span class="text-white">{{ visitor?.deviceType || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Screen Resolution:</span>
                <span class="text-white">{{ visitor?.screenResolution || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Language:</span>
                <span class="text-white">{{ visitor?.language || 'Unknown' }}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="text-white font-medium mb-3">Browser & OS</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Browser:</span>
                <span class="text-white">{{ visitor?.browser || 'Unknown' }} {{ visitor?.browserVersion || '' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Operating System:</span>
                <span class="text-white">{{ visitor?.os || 'Unknown' }} {{ visitor?.osVersion || '' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Data -->
      <div v-if="visitor?.performance" class="bg-gray-800/50 rounded-lg p-6">
        <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="tachometer-alt" class="mr-2" />
          Performance Metrics
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-gray-900/60 rounded-lg">
            <div class="text-2xl font-bold text-cyan-400">{{ visitor.performance.loadTime || 0 }}ms</div>
            <div class="text-xs text-gray-400">Load Time</div>
          </div>
          <div class="text-center p-3 bg-gray-900/60 rounded-lg">
            <div class="text-2xl font-bold text-cyan-400">{{ visitor.performance.firstPaint || 0 }}ms</div>
            <div class="text-xs text-gray-400">First Paint</div>
          </div>
          <div class="text-center p-3 bg-gray-900/60 rounded-lg">
            <div class="text-2xl font-bold text-cyan-400">{{ visitor.performance.domContentLoaded || 0 }}ms</div>
            <div class="text-xs text-gray-400">DOM Ready</div>
          </div>
          <div class="text-center p-3 bg-gray-900/60 rounded-lg">
            <div class="text-2xl font-bold text-cyan-400">{{ getPerformanceScore(visitor.performance) }}</div>
            <div class="text-xs text-gray-400">Score</div>
          </div>
        </div>
      </div>

      <!-- Bot Detection -->
      <div v-if="visitor?.bot" class="bg-gray-800/50 rounded-lg p-6">
        <h3 class="text-cyan-300 font-semibold mb-4 flex items-center">
          <font-awesome-icon icon="robot" class="mr-2" />
          Bot Detection Analysis
        </h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-900/60 rounded-lg">
            <div>
              <div class="text-white font-medium">Detection Status</div>
              <div class="text-sm text-gray-400">{{ visitor.isBot ? 'Bot Detected' : 'Human Visitor' }}</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold" :class="visitor.isBot ? 'text-yellow-400' : 'text-green-400'">
                {{ visitor.bot.confidence ? Math.round(visitor.bot.confidence * 100) : 0 }}%
              </div>
              <div class="text-xs text-gray-400">Confidence</div>
            </div>
          </div>
          
          <div v-if="visitor.bot.reasons?.length" class="p-4 bg-gray-900/60 rounded-lg">
            <div class="text-white font-medium mb-2">Detection Reasons</div>
            <div class="flex flex-wrap gap-2">
              <span v-for="reason in visitor.bot.reasons" :key="reason" 
                    class="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs">
                {{ reason }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    getPerformanceScore(performance: any) {
      if (!performance?.loadTime) return 'N/A';
      const loadTime = performance.loadTime;
      if (loadTime < 1000) return 'A+';
      if (loadTime < 2000) return 'A';
      if (loadTime < 3000) return 'B';
      if (loadTime < 5000) return 'C';
      return 'D';
    }
  }
};

interface Visitor {
  id: string;
  isBot?: boolean;
  botTag?: string;
  totalSessions?: number;
  totalPageViews?: number;
  totalTimeOnSite?: number;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
  sourceAttribution?: any;
  sessions?: any[];
  customer?: any;
  device?: any;
  bot?: any;
  performance?: any;
}

const props = defineProps<{
  visitorId: string;
}>();

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
}

const tabs: Tab[] = [
  { id: 'intelligence', label: 'Intelligence', icon: 'brain', badge: 'AI' },
  { id: 'geographic', label: 'Geographic', icon: 'globe' },
  { id: 'attribution', label: 'Attribution', icon: 'project-diagram' },
  { id: 'journey', label: 'Journey', icon: 'route', badge: 'New' },
  { id: 'sessions', label: 'Sessions', icon: 'history' },
  { id: 'technical', label: 'Technical', icon: 'cog', badge: 'Beta' }
];

const activeTab = ref('intelligence');
const visitor = ref<Visitor | null>(null);
const attribution = ref<any>(null);
const sessions = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Computed properties
const visitorTitle = computed(() => {
  if (!visitor.value) return 'Unknown Visitor';
  if (visitor.value.customer?.name) return visitor.value.customer.name;
  if (visitor.value.isBot) return `Bot Visitor (${visitor.value.botTag || 'Detected'})`;
  return 'Anonymous Visitor';
});

const visitorLocation = computed(() => {
  if (!visitor.value) return null;
  const parts = [visitor.value.city, visitor.value.region, visitor.value.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
});

const lastSeen = computed(() => {
  if (!visitor.value?.updatedAt) return null;
  const date = new Date(visitor.value.updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Recently';
});

const visitorScore = computed(() => {
  if (!visitor.value) return 0;
  let score = 0;
  
  // Engagement factors
  if (visitor.value.totalPageViews) score += Math.min(20, visitor.value.totalPageViews * 2);
  if (visitor.value.totalSessions) score += Math.min(20, visitor.value.totalSessions * 5);
  if (visitor.value.totalTimeOnSite) score += Math.min(30, Math.floor(visitor.value.totalTimeOnSite / 60));
  if (visitor.value.customer) score += 30;
  
  return Math.min(100, score);
});

const engagementScore = computed(() => {
  if (!visitor.value) return 0;
  let score = 0;
  
  if (visitor.value.totalPageViews && visitor.value.totalPageViews > 1) score += 25;
  if (visitor.value.totalSessions && visitor.value.totalSessions > 1) score += 25;
  if (visitor.value.totalTimeOnSite && visitor.value.totalTimeOnSite > 60) score += 25;
  if (sessions.value.some(s => s.pageViewCount > 3)) score += 25;
  
  return score;
});

const conversionProbability = computed(() => {
  if (!visitor.value) return 0;
  if (visitor.value.customer) return 100;
  
  let probability = 0;
  if (visitor.value.totalPageViews && visitor.value.totalPageViews > 3) probability += 20;
  if (visitor.value.totalSessions && visitor.value.totalSessions > 1) probability += 30;
  if (visitor.value.totalTimeOnSite && visitor.value.totalTimeOnSite > 300) probability += 25;
  if (attribution.value?.campaign) probability += 15;
  if (!visitor.value.isBot) probability += 10;
  
  return Math.min(100, probability);
});

const aiInsights = computed(() => {
  if (!visitor.value) return [];
  
  const insights = [];
  
  // High engagement insight
  if (engagementScore.value > 75) {
    insights.push({
      type: 'high_engagement',
      icon: 'fire',
      color: 'text-orange-400',
      title: 'High Engagement Detected',
      description: 'This visitor shows strong interest and engagement patterns.',
      action: 'Consider reaching out'
    });
  }
  
  // Return visitor insight
  if (visitor.value.totalSessions && visitor.value.totalSessions > 1) {
    insights.push({
      type: 'returning_visitor',
      icon: 'sync',
      color: 'text-blue-400',
      title: 'Returning Visitor',
      description: 'This visitor has returned multiple times, showing sustained interest.',
      action: 'View journey history'
    });
  }
  
  // Bot detection insight
  if (visitor.value.isBot) {
    insights.push({
      type: 'bot_detected',
      icon: 'robot',
      color: 'text-yellow-400',
      title: 'Bot Traffic Detected',
      description: 'This appears to be automated traffic rather than a human visitor.',
      action: 'Review bot rules'
    });
  }
  
  return insights;
});

const behaviorHeatmap = computed(() => {
  // Generate mock heatmap data for the past 7 days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map((label, index) => ({
    date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    label,
    activity: Math.random() * 100 // Replace with actual activity data
  }));
});

const conversionFunnel = computed(() => {
  return [
    {
      name: 'Visited Website',
      completion: 100,
      completed: true
    },
    {
      name: 'Viewed Multiple Pages',
      completion: visitor.value?.totalPageViews && visitor.value.totalPageViews > 1 ? 100 : 0,
      completed: visitor.value?.totalPageViews && visitor.value.totalPageViews > 1
    },
    {
      name: 'Engaged (2+ min)',
      completion: visitor.value?.totalTimeOnSite && visitor.value.totalTimeOnSite > 120 ? 100 : 0,
      completed: visitor.value?.totalTimeOnSite && visitor.value.totalTimeOnSite > 120
    },
    {
      name: 'Converted to Customer',
      completion: visitor.value?.customer ? 100 : 0,
      completed: !!visitor.value?.customer
    }
  ];
});

// Methods
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function openMap() {
  if (visitor.value?.latitude && visitor.value?.longitude) {
    const url = `https://www.google.com/maps?q=${visitor.value.latitude},${visitor.value.longitude}`;
    window.open(url, '_blank');
  }
}

async function fetchData() {
  if (!props.visitorId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const { data } = await axios.get(`/api/analytics/visitor/${props.visitorId}`);
    visitor.value = data.visitor;
    attribution.value = data.visitor.sourceAttribution;
    sessions.value = data.visitor.sessions || [];
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load visitor data';
    visitor.value = null;
  } finally {
    loading.value = false;
  }
}

function refreshData() {
  fetchData();
}

onMounted(fetchData);
watch(() => props.visitorId, fetchData);
</script>

<style scoped>
.card-modern {
  border-radius: 1rem;
  background: #181f2a;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12);
  margin-bottom: 1.5rem;
}
</style>