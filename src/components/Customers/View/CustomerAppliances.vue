<!-- Enhanced wibiclick-frontend-vue/src/components/Customers/View/CustomerAppliances.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ApplianceCard from '@/components/Customers/ApplianceCard.vue';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'vue-toast-notification';
import customerService from '@/services/customerService';
import { useUserStore } from '@/stores/UserStore';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  },
  predictiveMaintenanceAlerts: {
    type: Array,
    default: () => []
  },
  isFetchingPredMaint: Boolean,
  predMaintError: String,
  isDetectingAppliances: Boolean
});

const emit = defineEmits([
  'detect-appliances', 
  'open-add-appliance-modal', 
  'edit-appliance',
  'delete-appliance',
  'schedule-service',
  'dismiss-alert',
  'fetch-predictive-maintenance',
  'appliances-updated'
]);

// Reactive state
const toast = useToast();
const userStore = useUserStore();
const isGeneratingAI = ref(false);
const aiSuggestedAppliances = ref([]);
const showAISuggestions = ref(false);
const isApplyingAll = ref(false);
const isApplyingIndividual = ref({});

// Computed properties
const applianceCount = computed(() => {
  return props.customer.appliances?.length || 0;
});

const hasAppliances = computed(() => {
  return applianceCount.value > 0;
});

const alertCount = computed(() => {
  return props.predictiveMaintenanceAlerts?.length || 0;
});

const hasActiveAlerts = computed(() => {
  return alertCount.value > 0;
});

const shouldShowAIDetection = computed(() => {
  // Show AI detection if customer has few appliances or communication history suggests more
  return applianceCount.value < 3 && !showAISuggestions.value;
});

const aiDetectionReason = computed(() => {
  if (applianceCount.value === 0) {
    return "No appliances recorded. AI can analyze communications to find mentions of appliances.";
  } else if (applianceCount.value < 3) {
    return `Only ${applianceCount.value} appliance(s) recorded. AI can find additional appliances mentioned in communications.`;
  }
  return "AI can analyze communications to detect additional appliances.";
});

// Methods
async function generateAIAppliances() {
  if (!props.customer?.id) {
    toast.error("No customer selected");
    return;
  }
  
  isGeneratingAI.value = true;
  showAISuggestions.value = true;
  aiSuggestedAppliances.value = [];
  
  try {
    const response = await customerService.detectAppliancesFromCommunications(
      userStore.currentWebsite,
      props.customer.id
    );
    
    if (response && response.detectedAppliances && response.detectedAppliances.length > 0) {
      aiSuggestedAppliances.value = response.detectedAppliances;
      toast.success(`Found ${response.detectedAppliances.length} potential appliance(s) in communications`);
    } else {
      showAISuggestions.value = false;
      toast.info("No additional appliances detected in communications.");
    }
  } catch (error) {
    console.error('Error detecting appliances with AI:', error);
    showAISuggestions.value = false;
    toast.error("Could not detect appliances: " + (error.response?.data?.message || error.message));
  } finally {
    isGeneratingAI.value = false;
  }
}

async function addSuggestedAppliance(appliance, index) {
  if (!appliance) {
    toast.error('Invalid appliance data');
    return;
  }

  isApplyingIndividual.value[index] = true;

  try {
    await customerService.createAppliance(
      userStore.currentWebsite,
      props.customer.id,
      {
        type: appliance.type,
        brand: appliance.brand || null,
        modelNumber: appliance.model || null,
        serialNumber: appliance.serialNumber || null,
        installationDate: appliance.installationDate || null,
        notes: appliance.detectionContext || null
        // Removed location since it doesn't exist in your schema
      }
    );

    // Remove the applied suggestion
    aiSuggestedAppliances.value.splice(index, 1);
    
    // If no more suggestions, hide the suggestion panel
    if (aiSuggestedAppliances.value.length === 0) {
      showAISuggestions.value = false;
    }
    
    toast.success(`Added ${appliance.type} to appliances`);
    emit('appliances-updated');
  } catch (error) {
    toast.error(`Failed to add appliance: ${error.response?.data?.message || error.message}`);
  } finally {
    isApplyingIndividual.value[index] = false;
  }
}

async function addAllSuggestedAppliances() {
  if (aiSuggestedAppliances.value.length === 0) {
    toast.error("No suggested appliances to add");
    return;
  }

  isApplyingAll.value = true;
  let addedCount = 0;
  let failedCount = 0;

  try {
    for (const appliance of aiSuggestedAppliances.value) {
      try {
        await customerService.createAppliance(
          userStore.currentWebsite,
          props.customer.id,
          {
            type: appliance.type,
            brand: appliance.brand || null,
            modelNumber: appliance.model || null,
            serialNumber: appliance.serialNumber || null,
            installationDate: appliance.installationDate || null,
            notes: appliance.detectionContext || null
            // Removed location since it doesn't exist in your schema
          }
        );
        addedCount++;
      } catch (error) {
        console.error('Failed to add appliance:', appliance, error);
        failedCount++;
      }
    }

    showAISuggestions.value = false;
    aiSuggestedAppliances.value = [];
    
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} appliance(s)` + (failedCount > 0 ? ` (${failedCount} failed)` : ''));
      emit('appliances-updated');
    } else {
      toast.error('Failed to add any appliances');
    }
  } finally {
    isApplyingAll.value = false;
  }
}

function dismissSuggestion(index) {
  aiSuggestedAppliances.value.splice(index, 1);
  
  if (aiSuggestedAppliances.value.length === 0) {
    showAISuggestions.value = false;
  }
  
  toast.info('Suggestion dismissed');
}

function getApplianceIcon(type) {
  const iconMap = {
    'geyser': 'fire',
    'air conditioner': 'snowflake',
    'aircon': 'snowflake',
    'ac': 'snowflake',
    'refrigerator': 'cube',
    'fridge': 'cube',
    'oven': 'utensils',
    'stove': 'utensils',
    'washing machine': 'tshirt',
    'washer': 'tshirt',
    'dishwasher': 'utensils',
    'microwave': 'microchip',
    'heat pump': 'thermometer-half',
    'pool pump': 'swimming-pool',
    'boiler': 'fire',
    'freezer': 'icicles'
  };
  
  const lowerType = type.toLowerCase();
  return iconMap[lowerType] || 'cog';
}

function formatApplianceDetails(appliance) {
  const details = [];
  if (appliance.brand) details.push(appliance.brand);
  if (appliance.model) details.push(appliance.model);
  if (appliance.serialNumber) details.push(`S/N: ${appliance.serialNumber}`);
  // Removed location since it doesn't exist in your schema
  return details.join(' • ') || 'No additional details';
}

// Auto-detect appliances on mount if very few are recorded
onMounted(() => {
  if (applianceCount.value === 0) {
    // Auto-detect if no appliances at all
    setTimeout(() => {
      generateAIAppliances();
    }, 1500); // Slightly longer delay to let component settle
  }
});
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-white via-green-50/20 to-blue-50/20 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-lg shadow-gray-100/50 dark:shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 p-5 sm:p-6">
    
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-green-400/5 to-blue-400/5 rounded-full blur-xl"></div>
      <div class="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-blue-400/5 to-green-400/5 rounded-full blur-xl"></div>
    </div>

    <!-- Header -->
    <div class="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
      <div class="flex items-center space-x-3 min-w-0 flex-1">
        <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <FontAwesomeIcon icon="cog" class="text-white text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Client Appliances
          </h3>
          <!-- Status indicators -->
          <div class="flex items-center space-x-3 mt-1">
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ applianceCount }} appliance{{ applianceCount !== 1 ? 's' : '' }}</span>
            </div>
            <div v-if="hasActiveAlerts" class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-orange-600 dark:text-orange-400">{{ alertCount }} alert{{ alertCount !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- AI Detection Button -->
        <button 
          v-if="shouldShowAIDetection"
          @click="generateAIAppliances" 
          :disabled="isGeneratingAI || isDetectingAppliances"
          class="group flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xs rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Analyze communications to detect appliances"
        >
          <FontAwesomeIcon 
            icon="search" 
            class="mr-1.5 group-hover:scale-110 transition-transform" 
            :class="{ 'fa-spin': isGeneratingAI }" 
          />
          <span class="font-medium">
            {{ isGeneratingAI ? 'Analyzing...' : 'AI Detect' }}
          </span>
        </button>


        <!-- Add Appliance Button -->
        <button 
          @click="emit('open-add-appliance-modal')" 
          class="group flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 text-xs"
          aria-label="Add new appliance for this client"
        >
          <FontAwesomeIcon icon="plus" class="mr-1.5 group-hover:scale-110 transition-transform" />
          <span class="hidden sm:inline font-medium">Add</span>
        </button>
      </div>
    </div>

    <!-- AI Suggestions Section -->
    <div 
      v-if="showAISuggestions && aiSuggestedAppliances.length > 0" 
      class="relative z-10 mb-4 p-4 border border-green-300/50 dark:border-green-700/50 rounded-xl bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-indigo-900/20"
    >
      <!-- Background decoration -->
      <div class="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-xl"></div>
      
      <div class="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
        <h4 class="text-sm font-bold text-green-800 dark:text-green-300 flex items-center">
          <div class="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-600 rounded-md flex items-center justify-center mr-2">
            <FontAwesomeIcon icon="search" class="text-white text-xs" />
          </div>
          Detected Appliances in Communications
          <span class="ml-2 text-xs bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
            {{ aiSuggestedAppliances.length }}
          </span>
        </h4>
        <button 
          @click="addAllSuggestedAppliances" 
          :disabled="isApplyingAll"
          class="group flex items-center text-xs bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <FontAwesomeIcon 
            icon="check-double" 
            class="mr-1.5 group-hover:scale-110 transition-transform"
            :class="{ 'fa-spin': isApplyingAll }"
          />
          {{ isApplyingAll ? 'Adding...' : 'Add All' }}
        </button>
      </div>
      
      <div class="relative space-y-3">
        <div 
          v-for="(appliance, index) in aiSuggestedAppliances" 
          :key="index" 
          class="group flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center mb-2">
              <FontAwesomeIcon :icon="getApplianceIcon(appliance.type)" class="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <h5 class="text-sm font-semibold text-green-700 dark:text-green-400 capitalize">{{ appliance.type }}</h5>
                <p class="text-xs text-gray-600 dark:text-gray-300">{{ formatApplianceDetails(appliance) }}</p>
              </div>
            </div>
            <div v-if="appliance.detectionContext" class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border-l-2 border-green-200 dark:border-green-800">
              <span class="font-medium">Found in:</span> {{ appliance.detectionContext }}
            </div>
          </div>
          
          <div class="flex items-center gap-2 flex-shrink-0">
            <button 
              @click="dismissSuggestion(index)"
              class="group flex items-center text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded-md transition-all duration-200"
              title="Dismiss suggestion"
            >
              <FontAwesomeIcon icon="times" class="group-hover:scale-110 transition-transform" />
            </button>
            
            <button 
              @click="addSuggestedAppliance(appliance, index)"
              :disabled="isApplyingIndividual[index]"
              class="group flex items-center text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon 
                icon="plus" 
                class="mr-1 group-hover:scale-110 transition-transform"
                :class="{ 'fa-spin': isApplyingIndividual[index] }"
              />
              {{ isApplyingIndividual[index] ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Detection Suggestion (when no suggestions shown) -->
    <div 
      v-if="shouldShowAIDetection && !showAISuggestions && applianceCount < 2" 
      class="relative z-10 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <div class="flex items-start">
        <FontAwesomeIcon icon="lightbulb" class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <span class="text-sm text-blue-800 dark:text-blue-300">
            {{ aiDetectionReason }}
            <button 
              @click="generateAIAppliances"
              class="underline hover:no-underline font-medium ml-1"
            >
              Run AI detection
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State for Predictive Maintenance -->
    <div v-if="isFetchingPredMaint" class="relative z-10 text-center py-6">
      <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Checking predictive maintenance...</p>
    </div>

    <!-- Error State for Predictive Maintenance -->
    <div v-else-if="predMaintError" class="relative z-10 text-center py-6">
      <div class="text-red-600 dark:text-red-400 mb-3">
        <FontAwesomeIcon icon="exclamation-triangle" class="w-5 h-5 mb-2" />
        <p class="text-sm">Error checking maintenance: {{ predMaintError }}</p>
      </div>
      <button @click="emit('fetch-predictive-maintenance')" class="btn-secondary-modern">
        <FontAwesomeIcon icon="sync" class="mr-1.5" />
        Retry
      </button>
    </div>

    <!-- Appliance List -->
    <div v-else-if="hasAppliances" class="relative z-10 space-y-3 max-h-80 overflow-y-auto pr-1">
      <ApplianceCard
        v-for="appliance in customer.appliances"
        :key="appliance.id"
        :appliance="appliance"
        :alert="predictiveMaintenanceAlerts.find(a => a.applianceId === appliance.id)?.alert"
        @edit="emit('edit-appliance', $event)"
        @delete="emit('delete-appliance', $event)"
        @schedule-service="emit('schedule-service', $event)"
        @dismiss-alert="emit('dismiss-alert', $event)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="relative z-10 text-center py-8">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <FontAwesomeIcon icon="cog" class="w-8 h-8 text-gray-400" />
      </div>
      <h4 class="text-base font-medium text-gray-900 dark:text-white mb-2">No appliances recorded</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Add appliances manually or let AI detect them from communications
      </p>
      <div class="flex items-center justify-center gap-3">
        <button 
          @click="generateAIAppliances"
          :disabled="isGeneratingAI"
          class="btn-secondary-modern"
        >
          <FontAwesomeIcon 
            icon="search" 
            :class="{ 'fa-spin': isGeneratingAI }" 
            class="mr-1.5" 
          />
          {{ isGeneratingAI ? 'Analyzing...' : 'AI Detect' }}
        </button>
        <button @click="emit('open-add-appliance-modal')" class="btn-primary-modern">
          <FontAwesomeIcon icon="plus" class="mr-1.5" />
          Add Manually
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Custom scrollbar for appliance list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded-full;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500;
}

/* Animation for alert indicator */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>