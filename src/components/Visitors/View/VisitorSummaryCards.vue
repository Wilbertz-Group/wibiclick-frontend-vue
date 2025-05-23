<template>
  <div class="space-y-4">
    <!-- Device Card -->
    <div v-if="device" class="card-modern p-5 flex flex-col gap-2">
      <div class="flex items-center gap-4">
        <div class="flex-shrink-0">
          <font-awesome-icon :icon="deviceIcon" class="text-3xl text-indigo-500" />
        </div>
        <div>
          <div class="text-base font-semibold text-gray-900 dark:text-white mb-1">Device</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">
            <span class="font-medium">{{ device.deviceType || device.type || 'Unknown' }}</span>
            <span v-if="device.brand" class="ml-2 text-xs text-gray-400">({{ device.brand }})</span>
            <span v-if="device.model" class="ml-2 text-xs text-gray-400">- {{ device.model }}</span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span class="font-semibold">OS:</span>
          <span v-if="device.os && device.os.name">{{ device.os.name }}</span>
          <span v-if="device.os && device.os.version">({{ device.os.version }})</span>
        </div>
        <div>
          <span class="font-semibold">Browser:</span>
          <span v-if="device.browser && device.browser.name">{{ device.browser.name }}</span>
          <span v-if="device.browser && device.browser.version">({{ device.browser.version }})</span>
          <span v-if="device.browser && device.browser.fullVersion" class="ml-1">[{{ device.browser.fullVersion }}]</span>
        </div>
        <div>
          <span class="font-semibold">Screen:</span>
          <span v-if="device.screen">
            {{ device.screen.width }}x{{ device.screen.height }}
            <span v-if="device.screen.orientation">({{ device.screen.orientation }})</span>
            <span v-if="device.screen.colorDepth">, Color: {{ device.screen.colorDepth }}bit</span>
          </span>
        </div>
        <div>
          <span class="font-semibold">Network:</span>
          <span v-if="device.network">
            RTT: {{ device.network.rtt }}ms,
            Downlink: {{ device.network.downlink }}Mbps,
            Type: {{ device.network.effectiveType }},
            SaveData: {{ device.network.saveData ? 'Yes' : 'No' }}
          </span>
        </div>
        <div>
          <span class="font-semibold">Capabilities:</span>
          <span v-if="device.capabilities">
            <span>Online: {{ device.capabilities.onLine ? 'Yes' : 'No' }}, </span>
            <span>Lang: {{ device.capabilities.language }}, </span>
            <span>Timezone: {{ device.capabilities.timezone }}, </span>
            <span>Mem: {{ device.capabilities.deviceMemory }}GB, </span>
            <span>Touch: {{ device.capabilities.maxTouchPoints }}, </span>
            <span>CPU: {{ device.capabilities.hardwareConcurrency }}, </span>
            <span>Cookies: {{ device.capabilities.cookieEnabled ? 'Yes' : 'No' }}, </span>
            <span>DNT: {{ device.capabilities.doNotTrack }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Performance Card -->
    <div v-if="performance" class="card-modern p-5 flex flex-col gap-2">
      <div class="flex items-center gap-4">
        <div class="flex-shrink-0">
          <font-awesome-icon icon="tachometer-alt" class="text-3xl text-emerald-500" />
        </div>
        <div>
          <div class="text-base font-semibold text-gray-900 dark:text-white mb-1">Performance</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span class="font-semibold">Load Time:</span>
          <span>{{ performance.loadTime !== null && performance.loadTime !== undefined ? performance.loadTime + ' ms' : '-' }}</span>
        </div>
        <div>
          <span class="font-semibold">First Paint:</span>
          <span>{{ performance.firstPaint !== null && performance.firstPaint !== undefined ? performance.firstPaint + ' ms' : '-' }}</span>
        </div>
        <div>
          <span class="font-semibold">DOM Content Loaded:</span>
          <span>{{ performance.domContentLoaded !== null && performance.domContentLoaded !== undefined ? performance.domContentLoaded + ' ms' : '-' }}</span>
        </div>
        <div>
          <span class="font-semibold">Page Size:</span>
          <span v-if="performance.pageSize">
            Decoded: {{ performance.pageSize.decoded }}B,
            Encoded: {{ performance.pageSize.encoded }}B,
            Transfer: {{ performance.pageSize.transfer }}B
          </span>
        </div>
      </div>
    </div>

    <!-- Bot Detection Card -->
    <div v-if="bot" class="card-modern p-5 flex flex-col gap-2">
      <div class="flex items-center gap-4">
        <div class="flex-shrink-0">
          <font-awesome-icon
            :icon="bot.isBot ? 'robot' : 'user'"
            :class="bot.isBot ? 'text-yellow-500' : 'text-green-500'"
            class="text-3xl"
          />
        </div>
        <div>
          <div class="text-base font-semibold text-gray-900 dark:text-white mb-1">Bot Detection</div>
          <div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="bot.isBot
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'"
            >
              <font-awesome-icon :icon="bot.isBot ? 'exclamation-triangle' : 'check-circle'" class="mr-1 text-xs" />
              {{ bot.isBot ? 'Bot Detected' : 'Human Visitor' }}
              <span v-if="bot.reasons && bot.reasons.length" class="ml-2 text-gray-500 dark:text-gray-400">({{ bot.reasons.join(', ') }})</span>
            </span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span class="font-semibold">Score:</span>
          <span>{{ bot.score }}</span>
        </div>
        <div>
          <span class="font-semibold">Confidence:</span>
          <span>{{ bot.confidence }}</span>
        </div>
        <div>
          <span class="font-semibold">Behavior Data:</span>
          <span v-if="bot.behaviorData">
            Clicks: {{ bot.behaviorData.clicks }},
            Scrolls: {{ bot.behaviorData.scrolls }},
            Keystrokes: {{ bot.behaviorData.keystrokes }},
            Mouse Moves: {{ bot.behaviorData.mouseMoves }},
            Start: {{ bot.behaviorData.startTime }}
          </span>
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
</script>