<template>
  <div class="card-modern p-4">
    <!-- Compact Header with Visitor Identity -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <font-awesome-icon 
              :icon="isBot ? 'robot' : (hasCustomer ? 'user-check' : 'user')" 
              class="text-white text-lg" 
            />
          </div>
          <!-- Quality Score Badge -->
          <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
               :class="qualityScoreColor">
            {{ visitorQualityScore }}
          </div>
        </div>
        
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ visitorTitle }}</h2>
          <div class="flex items-center gap-2 mt-1">
            <!-- Compact Status Badges -->
            <span v-if="isBot" class="inline-flex items-center px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
              <font-awesome-icon icon="robot" class="mr-1 text-xs" />
              Bot
              <span v-if="botTag" class="ml-1 opacity-75">({{ botTag }})</span>
            </span>
            <span v-if="isReturning" class="inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
              <font-awesome-icon icon="sync" class="mr-1 text-xs" />
              Return
            </span>
            <span v-if="isHighValue" class="inline-flex items-center px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-xs font-medium">
              <font-awesome-icon icon="star" class="mr-1 text-xs" />
              High Value
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-1">
        <button 
          v-if="latitude && longitude"
          @click="openInMaps"
          class="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="View on map"
        >
          <font-awesome-icon icon="map-marker-alt" class="text-sm" />
        </button>
        <button 
          @click="copyCoordinates"
          v-if="latitude && longitude"
          class="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Copy coordinates"
        >
          <font-awesome-icon icon="copy" class="text-sm" />
        </button>
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <!-- Engagement Score -->
      <div class="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-700/30 rounded-lg p-3">
        <div class="flex items-center justify-between mb-1">
          <font-awesome-icon icon="fire" class="text-emerald-600 dark:text-emerald-400" />
          <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ engagementScore }}%</span>
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
        <div class="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-1 mt-1">
          <div class="bg-emerald-500 h-1 rounded-full transition-all duration-300" :style="{ width: `${engagementScore}%` }"></div>
        </div>
      </div>

      <!-- Conversion Potential -->
      <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700/30 rounded-lg p-3">
        <div class="flex items-center justify-between mb-1">
          <font-awesome-icon icon="bullseye" class="text-purple-600 dark:text-purple-400" />
          <span class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ conversionPotential }}%</span>
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">Conv. Potential</div>
        <div class="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1 mt-1">
          <div class="bg-purple-500 h-1 rounded-full transition-all duration-300" :style="{ width: `${conversionPotential}%` }"></div>
        </div>
      </div>

      <!-- Session Quality -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg p-3">
        <div class="flex items-center justify-between mb-1">
          <font-awesome-icon icon="chart-line" class="text-blue-600 dark:text-blue-400" />
          <span class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ sessionQualityGrade }}</span>
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">Session Quality</div>
        <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ sessionQualityDescription }}</div>
      </div>

      <!-- Time Investment -->
      <div class="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700/30 rounded-lg p-3">
        <div class="flex items-center justify-between mb-1">
          <font-awesome-icon icon="hourglass-half" class="text-orange-600 dark:text-orange-400" />
          <span class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ timeInvestmentLevel }}</span>
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">Time Investment</div>
        <div class="text-xs text-orange-600 dark:text-orange-400 font-medium">{{ timeInvestmentDescription }}</div>
      </div>
    </div>

    <!-- Visit Summary -->
    <div class="space-y-3">
      <!-- Session Overview -->
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <font-awesome-icon icon="history" class="text-gray-400" />
          <span class="text-gray-600 dark:text-gray-400">Sessions:</span>
        </div>
        <div class="text-right">
          <span class="font-semibold text-gray-900 dark:text-white">{{ totalSessions || 0 }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ avgSessionDurationFormatted }})</span>
        </div>
      </div>

      <!-- Page Views -->
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <font-awesome-icon icon="eye" class="text-gray-400" />
          <span class="text-gray-600 dark:text-gray-400">Page Views:</span>
        </div>
        <div class="text-right">
          <span class="font-semibold text-gray-900 dark:text-white">{{ totalPageViews || 0 }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ pagesPerSessionFormatted }} avg)</span>
        </div>
      </div>

      <!-- Time on Site -->
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <font-awesome-icon icon="clock" class="text-gray-400" />
          <span class="text-gray-600 dark:text-gray-400">Time on Site:</span>
        </div>
        <div class="text-right">
          <span class="font-semibold text-gray-900 dark:text-white">{{ formatDuration(totalTimeOnSite) }}</span>
        </div>
      </div>

      <!-- Location with Intelligence -->
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <font-awesome-icon icon="map-marker-alt" class="text-gray-400" />
          <span class="text-gray-600 dark:text-gray-400">Location:</span>
        </div>
        <div class="text-right">
          <span class="font-semibold text-gray-900 dark:text-white truncate max-w-32" :title="locationSummary">
            {{ locationSummary }}
          </span>
          <div v-if="timezone" class="text-xs text-gray-500 dark:text-gray-400">{{ localTime }}</div>
        </div>
      </div>

      <!-- Visit Timeline -->
      <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-gray-500 dark:text-gray-400">First Visit:</span>
            <div class="font-medium text-gray-700 dark:text-gray-300 truncate">{{ formatDateShort(firstVisit) }}</div>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Last Visit:</span>
            <div class="font-medium text-gray-700 dark:text-gray-300 truncate">{{ formatDateShort(lastVisit) }}</div>
          </div>
        </div>
        
        <!-- Visit Duration -->
        <div class="mt-2 text-center">
          <span class="text-xs text-gray-500 dark:text-gray-400">Visitor for: </span>
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ visitDuration }}</span>
        </div>
      </div>
    </div>

    <!-- AI Insight (if any) -->
    <div v-if="topInsight" class="mt-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700/30 rounded-lg">
      <div class="flex items-start gap-2">
        <font-awesome-icon :icon="topInsight.icon" :class="topInsight.color" class="mt-0.5 flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-gray-900 dark:text-white">{{ topInsight.title }}</div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ topInsight.description }}</div>
          <div v-if="topInsight.action" class="mt-2">
            <button 
              @click="handleInsightAction(topInsight)"
              class="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors"
            >
              {{ topInsight.action }} →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Geographic Intelligence Panel -->
    <div v-if="geographicIntelligence" class="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/30 rounded-lg">
      <div class="flex items-start gap-2">
        <font-awesome-icon icon="globe" class="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-gray-900 dark:text-white">Geographic Intelligence</div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ geographicIntelligence }}</div>
          <div v-if="coordinates" class="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
            {{ coordinates }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps<{
  firstVisit?: string | null;
  lastVisit?: string | null;
  totalSessions?: number;
  avgSessionDuration?: number;
  pagesPerSession?: number;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  language?: string | null;
  totalPageViews?: number | null;
  totalTimeOnSite?: number | null;
  isBot?: boolean;
  botTag?: string | null;
}>();

const emit = defineEmits(['suggest-customer-match', 'coordinates-copied']);

// Computed properties for visitor intelligence
const hasCustomer = computed(() => false); // Would come from actual customer data

const isReturning = computed(() => (props.totalSessions || 0) > 1);

const isHighValue = computed(() => visitorQualityScore.value >= 70);

const visitorQualityScore = computed(() => {
  let score = 0;
  
  // Page views (max 25 points)
  if (props.totalPageViews) {
    score += Math.min(25, props.totalPageViews * 3);
  }
  
  // Sessions (max 20 points)
  if (props.totalSessions) {
    score += Math.min(20, props.totalSessions * 10);
  }
  
  // Time on site (max 30 points)
  if (props.totalTimeOnSite) {
    score += Math.min(30, Math.floor(props.totalTimeOnSite / 30));
  }
  
  // Returning visitor bonus
  if (isReturning.value) score += 15;
  
  // Human visitor bonus
  if (!props.isBot) score += 10;
  
  return Math.min(100, Math.floor(score));
});

const qualityScoreColor = computed(() => {
  const score = visitorQualityScore.value;
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
});

const visitorTitle = computed(() => {
  if (hasCustomer.value) return 'Known Customer';
  if (props.isBot) return 'Bot Visitor';
  if (isReturning.value) return 'Returning Visitor';
  return 'New Visitor';
});

const locationSummary = computed(() => {
  const parts = [props.city, props.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
});

const coordinates = computed(() => {
  if (props.latitude && props.longitude) {
    return `${props.latitude.toFixed(4)}, ${props.longitude.toFixed(4)}`;
  }
  return null;
});

const localTime = computed(() => {
  if (!props.timezone) return null;
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: props.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(now);
  } catch (error) {
    return null;
  }
});

const engagementScore = computed(() => {
  let score = 0;
  
  if ((props.totalPageViews || 0) > 1) score += 25;
  if ((props.totalSessions || 0) > 1) score += 25;
  if ((props.totalTimeOnSite || 0) > 120) score += 25;
  if ((props.pagesPerSession || 0) > 3) score += 25;
  
  return score;
});

const conversionPotential = computed(() => {
  let potential = 0;
  
  if ((props.totalPageViews || 0) > 5) potential += 20;
  if ((props.totalSessions || 0) > 1) potential += 30;
  if ((props.totalTimeOnSite || 0) > 300) potential += 25;
  if ((props.avgSessionDuration || 0) > 180) potential += 15;
  if (!props.isBot) potential += 10;
  
  return Math.min(100, potential);
});

const sessionQualityGrade = computed(() => {
  const score = engagementScore.value;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D+';
  return 'D';
});

const sessionQualityDescription = computed(() => {
  const score = engagementScore.value;
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Poor';
});

const timeInvestmentLevel = computed(() => {
  const time = props.totalTimeOnSite || 0;
  if (time > 600) return 'High';
  if (time > 300) return 'Medium';
  if (time > 120) return 'Low';
  return 'Minimal';
});

const timeInvestmentDescription = computed(() => {
  const time = props.totalTimeOnSite || 0;
  if (time > 600) return 'Deep exploration';
  if (time > 300) return 'Moderate interest';
  if (time > 120) return 'Casual browsing';
  return 'Quick visit';
});

const visitDuration = computed(() => {
  if (!props.firstVisit || !props.lastVisit) return 'Single visit';
  
  const first = new Date(props.firstVisit);
  const last = new Date(props.lastVisit);
  const diffMs = last.getTime() - first.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 30) return `${Math.floor(diffDays / 30)} months`;
  if (diffDays > 7) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays > 0) return `${diffDays} days`;
  return 'Same day';
});

const avgSessionDurationFormatted = computed(() => {
  return formatDuration(props.avgSessionDuration);
});

const pagesPerSessionFormatted = computed(() => {
  if (!props.pagesPerSession) return '0';
  return props.pagesPerSession.toFixed(1);
});

const geographicIntelligence = computed(() => {
  if (!props.country) return null;
  
  const insights = [];
  
  if (props.timezone && localTime.value) {
    insights.push(`Local time: ${localTime.value}`);
  }
  
  if (props.countryCode === 'ZA' && props.region) {
    insights.push(`${props.region} region visitor`);
  }
  
  if (props.language) {
    insights.push(`Browser language: ${props.language}`);
  }
  
  return insights.length > 0 ? insights.join(' • ') : null;
});

const topInsight = computed(() => {
  // Return the most important insight for this visitor
  if (conversionPotential.value > 70 && !hasCustomer.value) {
    return {
      type: 'conversion_ready',
      icon: 'bullseye',
      color: 'text-purple-500',
      title: 'High Conversion Potential',
      description: 'Strong engagement signals suggest this visitor is ready to convert.',
      action: 'Consider outreach'
    };
  }
  
  if (isReturning.value && !hasCustomer.value) {
    return {
      type: 'returning_prospect',
      icon: 'sync',
      color: 'text-blue-500',
      title: 'Returning Prospect',
      description: 'This visitor has returned multiple times but hasn\'t converted.',
      action: 'Review journey'
    };
  }
  
  if (props.isBot) {
    return {
      type: 'bot_traffic',
      icon: 'robot',
      color: 'text-yellow-500',
      title: 'Bot Traffic Detected',
      description: `This appears to be automated traffic${props.botTag ? ` (${props.botTag})` : ''}.`,
      action: 'Review filters'
    };
  }
  
  if (engagementScore.value > 75) {
    return {
      type: 'high_engagement',
      icon: 'fire',
      color: 'text-orange-500',
      title: 'Highly Engaged Visitor',
      description: 'This visitor shows exceptional interest in your content.',
      action: 'Monitor closely'
    };
  }
  
  if (visitorQualityScore.value > 80 && !props.isBot) {
    return {
      type: 'premium_visitor',
      icon: 'star',
      color: 'text-green-500',
      title: 'Premium Quality Visitor',
      description: 'This visitor demonstrates high-value engagement patterns.',
      action: 'Prioritize contact'
    };
  }
  
  return null;
});

// Methods
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function openInMaps() {
  if (props.latitude && props.longitude) {
    const url = `https://www.google.com/maps?q=${props.latitude},${props.longitude}`;
    window.open(url, '_blank');
  }
}

async function copyCoordinates() {
  if (coordinates.value) {
    try {
      await navigator.clipboard.writeText(coordinates.value);
      emit('coordinates-copied', coordinates.value);
    } catch (error) {
      console.error('Failed to copy coordinates:', error);
    }
  }
}

function handleInsightAction(insight: any) {
  // Handle insight actions based on type
  switch (insight.type) {
    case 'conversion_ready':
    case 'returning_prospect':
    case 'premium_visitor':
      emit('suggest-customer-match');
      break;
    default:
      // Default action or emit specific events
      break;
  }
}
</script>

<style scoped>
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}
</style>