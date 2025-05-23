<template>
  <div class="space-y-4">
    <!-- Device Intelligence Card -->
    <div v-if="device" class="card-modern overflow-hidden">
      <!-- Card Header -->
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <font-awesome-icon :icon="deviceIcon" class="text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Device Intelligence</h3>
              <p class="text-indigo-100 text-sm">{{ deviceSummary }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold">{{ deviceQualityScore }}</div>
            <div class="text-xs text-indigo-200">Quality Score</div>
          </div>
        </div>
      </div>

      <!-- Card Content -->
      <div class="p-4 space-y-4">
        <!-- Device Overview -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon :icon="deviceTypeIcon" class="text-indigo-600 dark:text-indigo-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Device Type</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {{ device.deviceType || device.type || 'Unknown' }}
            </div>
            <div v-if="device.brand || device.model" class="text-xs text-gray-500 dark:text-gray-400">
              {{ [device.brand, device.model].filter(Boolean).join(' ') }}
            </div>
          </div>

          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon icon="globe" class="text-blue-600 dark:text-blue-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Browser</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ browserDisplay }}
            </div>
            <div v-if="browserCompatibility" class="text-xs" :class="browserCompatibilityColor">
              {{ browserCompatibility }}
            </div>
          </div>
        </div>

        <!-- Technical Specifications -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-if="device.os" class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <font-awesome-icon :icon="osIcon" class="text-gray-400 text-sm" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Operating System</span>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ osDisplay }}
            </span>
          </div>

          <div v-if="device.screen" class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <font-awesome-icon icon="tv" class="text-gray-400 text-sm" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Screen Resolution</span>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ screenDisplay }}
            </span>
          </div>

          <div v-if="device.capabilities" class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <font-awesome-icon icon="microchip" class="text-gray-400 text-sm" />
              <span class="text-sm text-gray-600 dark:text-gray-400">CPU Cores</span>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ device.capabilities.hardwareConcurrency || 'Unknown' }}
            </span>
          </div>

          <div v-if="device.capabilities && device.capabilities.deviceMemory" class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <font-awesome-icon icon="memory" class="text-gray-400 text-sm" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Device Memory</span>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ device.capabilities.deviceMemory }}GB
            </span>
          </div>
        </div>

        <!-- Network Information -->
        <div v-if="device.network" class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <font-awesome-icon icon="wifi" class="text-gray-500" />
            Network Performance
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ device.network.effectiveType || 'Unknown' }}</div>
              <div class="text-gray-500 dark:text-gray-400">Connection</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ device.network.downlink || 'Unknown' }}</div>
              <div class="text-gray-500 dark:text-gray-400">Mbps</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ device.network.rtt || 'Unknown' }}</div>
              <div class="text-gray-500 dark:text-gray-400">RTT (ms)</div>
            </div>
            <div class="text-center">
              <div class="font-bold" :class="device.network.saveData ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'">
                {{ device.network.saveData ? 'Enabled' : 'Disabled' }}
              </div>
              <div class="text-gray-500 dark:text-gray-400">Data Saver</div>
            </div>
          </div>
        </div>

        <!-- Device Insights -->
        <div v-if="deviceInsight" class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700/30 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <font-awesome-icon :icon="deviceInsight.icon" :class="deviceInsight.color" class="mt-0.5 flex-shrink-0" />
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ deviceInsight.title }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ deviceInsight.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Intelligence Card -->
    <div v-if="performance" class="card-modern overflow-hidden">
      <!-- Card Header -->
      <div class="bg-gradient-to-r from-emerald-500 to-cyan-600 p-4 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <font-awesome-icon icon="tachometer-alt" class="text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Performance Analytics</h3>
              <p class="text-emerald-100 text-sm">{{ performanceSummary }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold">{{ performanceGrade }}</div>
            <div class="text-xs text-emerald-200">Performance Grade</div>
          </div>
        </div>
      </div>

      <!-- Card Content -->
      <div class="p-4 space-y-4">
        <!-- Performance Metrics Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon icon="stopwatch" class="text-emerald-600 dark:text-emerald-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Load Time</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatMs(performance.loadTime) }}
            </div>
            <div class="text-xs" :class="getPerformanceColor(performance.loadTime, 'loadTime')">
              {{ getPerformanceLabel(performance.loadTime, 'loadTime') }}
            </div>
          </div>

          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon icon="paint-brush" class="text-blue-600 dark:text-blue-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">First Paint</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatMs(performance.firstPaint) }}
            </div>
            <div class="text-xs" :class="getPerformanceColor(performance.firstPaint, 'firstPaint')">
              {{ getPerformanceLabel(performance.firstPaint, 'firstPaint') }}
            </div>
          </div>
        </div>

        <!-- Additional Performance Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-if="performance.domContentLoaded !== null && performance.domContentLoaded !== undefined" class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <font-awesome-icon icon="code" class="text-gray-400 text-sm" />
              <span class="text-sm text-gray-600 dark:text-gray-400">DOM Content Loaded</span>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatMs(performance.domContentLoaded) }}
            </span>
          </div>

          <div v-if="performance.pageSize" class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <font-awesome-icon icon="file-alt" class="text-gray-400 text-sm" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Page Size</span>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatBytes(performance.pageSize.transfer) }}
            </span>
          </div>
        </div>

        <!-- Performance Score Visualization -->
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <font-awesome-icon icon="chart-bar" class="text-gray-500" />
            Performance Breakdown
          </h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Load Time</span>
              <span class="font-medium">{{ getPerformanceScore(performance.loadTime, 'loadTime') }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                   :style="{ width: `${getPerformanceScore(performance.loadTime, 'loadTime')}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Performance Insight -->
        <div v-if="performanceInsight" class="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-700/30 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <font-awesome-icon :icon="performanceInsight.icon" :class="performanceInsight.color" class="mt-0.5 flex-shrink-0" />
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ performanceInsight.title }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ performanceInsight.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bot Detection Intelligence Card -->
    <div v-if="bot" class="card-modern overflow-hidden">
      <!-- Card Header -->
      <div class="bg-gradient-to-r p-4 text-white" :class="bot.isBot ? 'from-yellow-500 to-orange-600' : 'from-green-500 to-emerald-600'">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <font-awesome-icon :icon="bot.isBot ? 'robot' : 'user-shield'" class="text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Bot Detection Analysis</h3>
              <p class="text-sm opacity-90">{{ botStatusText }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold">{{ Math.round((bot.confidence || 0) * 100) }}%</div>
            <div class="text-xs opacity-80">Confidence</div>
          </div>
        </div>
      </div>

      <!-- Card Content -->
      <div class="p-4 space-y-4">
        <!-- Bot Status Overview -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-lg p-3" :class="bot.isBot ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'">
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon :icon="bot.isBot ? 'exclamation-triangle' : 'check-circle'" :class="bot.isBot ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Detection Status</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ bot.isBot ? 'Bot Detected' : 'Human Visitor' }}
            </div>
            <div v-if="bot.reasons && bot.reasons.length" class="text-xs text-gray-500 dark:text-gray-400">
              {{ bot.reasons.slice(0, 2).join(', ') }}
            </div>
          </div>

          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <font-awesome-icon icon="chart-line" class="text-blue-600 dark:text-blue-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Score</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ bot.score || 0 }}/10
            </div>
            <div class="text-xs" :class="getRiskScoreColor(bot.score || 0)">
              {{ getRiskScoreLabel(bot.score || 0) }}
            </div>
          </div>
        </div>

        <!-- Behavioral Analysis -->
        <div v-if="bot.behaviorData" class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <font-awesome-icon icon="chart-area" class="text-gray-500" />
            Behavioral Analysis
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ bot.behaviorData.clicks || 0 }}</div>
              <div class="text-gray-500 dark:text-gray-400">Clicks</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ bot.behaviorData.scrolls || 0 }}</div>
              <div class="text-gray-500 dark:text-gray-400">Scrolls</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ bot.behaviorData.mouseMoves || 0 }}</div>
              <div class="text-gray-500 dark:text-gray-400">Mouse Moves</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-gray-900 dark:text-white">{{ bot.behaviorData.keystrokes || 0 }}</div>
              <div class="text-gray-500 dark:text-gray-400">Keystrokes</div>
            </div>
          </div>
        </div>

        <!-- Detection Reasons -->
        <div v-if="bot.reasons && bot.reasons.length" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <font-awesome-icon icon="list" class="text-gray-500" />
            Detection Indicators
          </h4>
          <div class="space-y-1">
            <div v-for="reason in bot.reasons.slice(0, 5)" :key="reason" 
                 class="flex items-center gap-2 text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <font-awesome-icon icon="dot-circle" class="text-gray-400 text-xs" />
              <span class="text-gray-700 dark:text-gray-300">{{ formatReason(reason) }}</span>
            </div>
          </div>
        </div>

        <!-- Bot Insight -->
        <div v-if="botInsight" class="border rounded-lg p-3" :class="bot.isBot ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700/30' : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700/30'">
          <div class="flex items-start gap-2">
            <font-awesome-icon :icon="botInsight.icon" :class="botInsight.color" class="mt-0.5 flex-shrink-0" />
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ botInsight.title }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ botInsight.description }}</div>
            </div>
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
  device?: any;
  performance?: any;
  bot?: any;
}>();

// Device Intelligence
const deviceIcon = computed(() => {
  const type = props.device?.deviceType || props.device?.type;
  switch (type) {
    case 'mobile':
      return 'mobile-alt';
    case 'tablet':
      return 'tablet-alt';
    case 'desktop':
    default:
      return 'desktop';
  }
});

const deviceTypeIcon = computed(() => {
  const type = props.device?.deviceType || props.device?.type;
  switch (type) {
    case 'mobile':
      return 'mobile-alt';
    case 'tablet':
      return 'tablet-alt';
    default:
      return 'desktop';
  }
});

const osIcon = computed(() => {
  const os = props.device?.os?.name?.toLowerCase() || '';
  if (os.includes('windows')) return 'windows';
  if (os.includes('mac') || os.includes('ios')) return 'apple';
  if (os.includes('android')) return ['fab', 'android'];
  if (os.includes('linux')) return 'linux';
  return 'laptop';
});

const deviceSummary = computed(() => {
  const type = props.device?.deviceType || props.device?.type || 'Unknown';
  const os = props.device?.os?.name || '';
  return `${type.charAt(0).toUpperCase() + type.slice(1)} • ${os}`;
});

const browserDisplay = computed(() => {
  const browser = props.device?.browser?.name || 'Unknown';
  const version = props.device?.browser?.version;
  return version ? `${browser} ${version}` : browser;
});

const osDisplay = computed(() => {
  const os = props.device?.os?.name || 'Unknown';
  const version = props.device?.os?.version;
  return version ? `${os} ${version}` : os;
});

const screenDisplay = computed(() => {
  if (!props.device?.screen) return 'Unknown';
  const { width, height, orientation } = props.device.screen;
  let display = `${width}×${height}`;
  if (orientation) display += ` (${orientation})`;
  return display;
});

const browserCompatibility = computed(() => {
  const browser = props.device?.browser?.name?.toLowerCase() || '';
  const version = parseFloat(props.device?.browser?.version || '0');
  
  if (browser.includes('chrome') && version >= 90) return 'Excellent compatibility';
  if (browser.includes('firefox') && version >= 88) return 'Excellent compatibility';
  if (browser.includes('safari') && version >= 14) return 'Good compatibility';
  if (browser.includes('edge') && version >= 90) return 'Excellent compatibility';
  
  return 'Limited compatibility';
});

const browserCompatibilityColor = computed(() => {
  const compat = browserCompatibility.value;
  if (compat.includes('Excellent')) return 'text-green-600 dark:text-green-400';
  if (compat.includes('Good')) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
});

const deviceQualityScore = computed(() => {
  let score = 0;
  
  // Modern browser bonus
  if (browserCompatibility.value.includes('Excellent')) score += 30;
  else if (browserCompatibility.value.includes('Good')) score += 20;
  else score += 10;
  
  // Device type bonus
  const type = props.device?.deviceType || props.device?.type || '';
  if (type === 'desktop') score += 25;
  else if (type === 'tablet') score += 20;
  else if (type === 'mobile') score += 15;
  
  // Hardware capabilities
  const memory = props.device?.capabilities?.deviceMemory;
  if (memory && memory >= 8) score += 25;
  else if (memory && memory >= 4) score += 15;
  else if (memory && memory >= 2) score += 10;
  
  // Network quality
  if (props.device?.network?.effectiveType === '4g') score += 20;
  else if (props.device?.network?.effectiveType === '3g') score += 10;
  
  return Math.min(100, score);
});

const deviceInsight = computed(() => {
  const score = deviceQualityScore.value;
  
  if (score >= 80) {
    return {
      icon: 'star',
      color: 'text-green-500',
      title: 'Premium Device Profile',
      description: 'High-end device with excellent capabilities for optimal user experience.'
    };
  }
  
  if (score >= 60) {
    return {
      icon: 'thumbs-up',
      color: 'text-blue-500',
      title: 'Good Device Profile',
      description: 'Well-equipped device suitable for most web experiences.'
    };
  }
  
  if (score >= 40) {
    return {
      icon: 'info-circle',
      color: 'text-yellow-500',
      title: 'Basic Device Profile',
      description: 'Standard device - consider optimizing for performance.'
    };
  }
  
  return {
    icon: 'exclamation-triangle',
    color: 'text-orange-500',
    title: 'Limited Device Profile',
    description: 'Lower-end device - ensure lightweight experience.'
  };
});

// Performance Intelligence
const performanceSummary = computed(() => {
  const loadTime = props.performance?.loadTime;
  if (!loadTime) return 'No performance data';
  
  if (loadTime < 1000) return 'Excellent performance';
  if (loadTime < 2000) return 'Good performance';
  if (loadTime < 3000) return 'Average performance';
  return 'Slow performance';
});

const performanceGrade = computed(() => {
  const loadTime = props.performance?.loadTime;
  if (!loadTime) return 'N/A';
  
  if (loadTime < 1000) return 'A+';
  if (loadTime < 1500) return 'A';
  if (loadTime < 2000) return 'B+';
  if (loadTime < 2500) return 'B';
  if (loadTime < 3000) return 'C+';
  if (loadTime < 4000) return 'C';
  return 'D';
});

const performanceInsight = computed(() => {
  const loadTime = props.performance?.loadTime;
  if (!loadTime) return null;
  
  if (loadTime < 1000) {
    return {
      icon: 'rocket',
      color: 'text-green-500',
      title: 'Lightning Fast',
      description: 'Exceptional loading performance providing optimal user experience.'
    };
  }
  
  if (loadTime < 2000) {
    return {
      icon: 'thumbs-up',
      color: 'text-blue-500',
      title: 'Good Performance',
      description: 'Solid loading times meeting modern web standards.'
    };
  }
  
  if (loadTime < 3000) {
    return {
      icon: 'clock',
      color: 'text-yellow-500',
      title: 'Room for Improvement',
      description: 'Consider optimizing images and scripts for better performance.'
    };
  }
  
  return {
    icon: 'exclamation-triangle',
    color: 'text-red-500',
    title: 'Performance Issues',
    description: 'Slow loading times may impact user experience and conversions.'
  };
});

// Bot Detection Intelligence
const botStatusText = computed(() => {
  if (props.bot?.isBot) {
    const confidence = Math.round((props.bot.confidence || 0) * 100);
    return `Bot detected with ${confidence}% confidence`;
  }
  return 'Verified human visitor';
});

const botInsight = computed(() => {
  if (!props.bot) return null;
  
  if (props.bot.isBot) {
    const confidence = props.bot.confidence || 0;
    if (confidence > 0.8) {
      return {
        icon: 'exclamation-triangle',
        color: 'text-red-500',
        title: 'High Confidence Bot Detection',
        description: 'Strong indicators suggest this is automated traffic. Consider filtering.'
      };
    } else {
      return {
        icon: 'question-circle',
        color: 'text-yellow-500',
        title: 'Possible Bot Activity',
        description: 'Some bot-like behavior detected. Monitor for additional patterns.'
      };
    }
  } else {
    return {
      icon: 'user-check',
      color: 'text-green-500',
      title: 'Verified Human Visitor',
      description: 'Natural interaction patterns indicate genuine human visitor.'
    };
  }
});

// Utility functions
function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return 'N/A';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function getPerformanceColor(value: number | null | undefined, metric: string): string {
  if (value === null || value === undefined) return 'text-gray-500';
  
  const thresholds = {
    loadTime: { good: 1000, poor: 3000 },
    firstPaint: { good: 500, poor: 1500 }
  };
  
  const threshold = thresholds[metric] || thresholds.loadTime;
  
  if (value <= threshold.good) return 'text-green-600 dark:text-green-400';
  if (value <= threshold.poor) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getPerformanceLabel(value: number | null | undefined, metric: string): string {
  if (value === null || value === undefined) return 'No data';
  
  const thresholds = {
    loadTime: { good: 1000, poor: 3000 },
    firstPaint: { good: 500, poor: 1500 }
  };
  
  const threshold = thresholds[metric] || thresholds.loadTime;
  
  if (value <= threshold.good) return 'Excellent';
  if (value <= threshold.poor) return 'Good';
  return 'Needs improvement';
}

function getPerformanceScore(value: number | null | undefined, metric: string): number {
  if (value === null || value === undefined) return 0;
  
  const thresholds = {
    loadTime: { excellent: 1000, good: 2000, poor: 4000 },
    firstPaint: { excellent: 500, good: 1000, poor: 2000 }
  };
  
  const threshold = thresholds[metric] || thresholds.loadTime;
  
  if (value <= threshold.excellent) return 100;
  if (value <= threshold.good) return 80;
  if (value <= threshold.poor) return 60;
  return 30;
}

function getRiskScoreColor(score: number): string {
  if (score <= 3) return 'text-green-600 dark:text-green-400';
  if (score <= 6) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getRiskScoreLabel(score: number): string {
  if (score <= 3) return 'Low Risk';
  if (score <= 6) return 'Medium Risk';
  return 'High Risk';
}

function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
</script>

<style scoped>
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}
</style>