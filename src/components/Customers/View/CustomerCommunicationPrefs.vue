<!-- Enhanced wibiclick-frontend-vue/src/components/Customers/View/CustomerCommunicationPrefs.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'vue-toast-notification';
import customerService from '@/services/customerService';
import { useUserStore } from '@/stores/UserStore';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit-comm-prefs', 'preferences-updated']);

// Reactive state
const toast = useToast();
const userStore = useUserStore();
const isGeneratingAI = ref(false);
const aiSuggestions = ref({});
const showAISuggestions = ref(false);
const isApplyingAll = ref(false);

// Computed properties
const missingPreferences = computed(() => {
  const missing = [];
  if (!props.customer.preferredContactMethod) missing.push('preferredContactMethod');
  if (!props.customer.preferredContactTimes) missing.push('preferredContactTimes');
  if (!props.customer.communicationFrequencyPreference) missing.push('communicationFrequencyPreference');
  if (!props.customer.languagePreference || props.customer.languagePreference === 'en') {
    // Only suggest language if it's null or default 'en' and there might be a better option
    missing.push('languagePreference');
  }
  return missing;
});

const hasMissingPreferences = computed(() => {
  return missingPreferences.value.length > 0;
});

const preferencesCompleteness = computed(() => {
  const totalFields = 4; // Total preference fields
  const filledFields = totalFields - missingPreferences.value.length;
  return Math.round((filledFields / totalFields) * 100);
});

const shouldShowAIButton = computed(() => {
  return hasMissingPreferences.value && !showAISuggestions.value;
});

// Methods
async function generateAIPreferences() {
  if (!props.customer?.id) {
    toast.error("No customer selected");
    return;
  }
  
  isGeneratingAI.value = true;
  showAISuggestions.value = true;
  aiSuggestions.value = {};
  
  try {
    const response = await customerService.generateCommPreferencesSuggestions(
      userStore.currentWebsite,
      props.customer.id,
      missingPreferences.value
    );
    
    if (response && response.suggestions) {
      aiSuggestions.value = response.suggestions;
      toast.success(`Generated AI suggestions for ${Object.keys(response.suggestions).length} preferences`);
    } else {
      showAISuggestions.value = false;
      toast.info("No AI suggestions available at this time.");
    }
  } catch (error) {
    console.error('Error generating AI preference suggestions:', error);
    showAISuggestions.value = false;
    toast.error("Could not generate AI suggestions: " + (error.response?.data?.message || error.message));
  } finally {
    isGeneratingAI.value = false;
  }
}

async function applySuggestion(field) {
  if (!aiSuggestions.value[field]) {
    toast.error(`No suggestion available for ${field}`);
    return;
  }

  try {
    const payload = {};
    payload[field] = aiSuggestions.value[field];
    
    await customerService.updateCommunicationPreferences(
      userStore.currentWebsite,
      props.customer.id,
      payload
    );
    
    // Remove the applied suggestion
    delete aiSuggestions.value[field];
    
    // If no more suggestions, hide the suggestion panel
    if (Object.keys(aiSuggestions.value).length === 0) {
      showAISuggestions.value = false;
    }
    
    toast.success(`Applied AI suggestion for ${getFieldLabel(field)}`);
    emit('preferences-updated');
  } catch (error) {
    toast.error(`Failed to apply suggestion: ${error.response?.data?.message || error.message}`);
  }
}

async function applyAllSuggestions() {
  if (Object.keys(aiSuggestions.value).length === 0) {
    toast.error("No suggestions to apply");
    return;
  }

  isApplyingAll.value = true;
  
  try {
    await customerService.updateCommunicationPreferences(
      userStore.currentWebsite,
      props.customer.id,
      aiSuggestions.value
    );
    
    const appliedCount = Object.keys(aiSuggestions.value).length;
    showAISuggestions.value = false;
    aiSuggestions.value = {};
    
    toast.success(`Applied ${appliedCount} AI suggestions`);
    emit('preferences-updated');
  } catch (error) {
    toast.error(`Failed to apply suggestions: ${error.response?.data?.message || error.message}`);
  } finally {
    isApplyingAll.value = false;
  }
}

function getFieldLabel(field) {
  const labels = {
    preferredContactMethod: 'Contact Method',
    preferredContactTimes: 'Contact Times',
    communicationFrequencyPreference: 'Communication Frequency',
    languagePreference: 'Language Preference'
  };
  return labels[field] || field;
}

function getFieldIcon(field) {
  const icons = {
    preferredContactMethod: 'comments',
    preferredContactTimes: ['far', 'clock'],
    communicationFrequencyPreference: 'signal',
    languagePreference: 'language'
  };
  return icons[field] || 'info-circle';
}

function formatSuggestionValue(field, value) {
  if (field === 'languagePreference') {
    const languages = {
      'en': 'English',
      'af': 'Afrikaans',
      'zu': 'Zulu',
      'xh': 'Xhosa',
      'st': 'Sotho',
      'tn': 'Tswana',
      'ss': 'Swati',
      'nd': 'Ndebele',
      've': 'Venda',
      'ts': 'Tsonga',
      'nr': 'Northern Ndebele'
    };
    return languages[value] || value;
  }
  return value;
}
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-lg shadow-gray-100/50 dark:shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 p-5 sm:p-6">
    
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-400/5 to-indigo-400/5 rounded-full blur-xl"></div>
    </div>

    <!-- Header -->
    <div class="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
      <div class="flex items-center space-x-3 min-w-0 flex-1">
        <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <FontAwesomeIcon icon="comments" class="text-white text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Communication Preferences
          </h3>
          <!-- Completeness indicator -->
          <div class="flex items-center space-x-2 mt-1">
            <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="preferencesCompleteness >= 75 ? 'bg-green-500' : preferencesCompleteness >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
                :style="`width: ${preferencesCompleteness}%`"
              ></div>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ preferencesCompleteness }}% complete</span>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- AI Generate Button -->
        <button 
          v-if="shouldShowAIButton"
          @click="generateAIPreferences"
          :disabled="isGeneratingAI"
          class="group flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate AI suggestions for missing preferences"
        >
          <FontAwesomeIcon 
            icon="magic" 
            class="mr-1.5 group-hover:scale-110 transition-transform" 
            :class="{ 'fa-spin': isGeneratingAI }" 
          />
          <span class="font-medium">
            {{ isGeneratingAI ? 'Generating...' : 'AI Suggest' }}
          </span>
        </button>

        <!-- Edit Button -->
        <button 
          @click="emit('edit-comm-prefs')" 
          class="group flex items-center justify-center px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:shadow-md text-xs"
          aria-label="Edit communication preferences"
        >
          <FontAwesomeIcon icon="edit" class="mr-1.5 group-hover:scale-110 transition-transform" />
          <span class="hidden sm:inline font-medium">Edit</span>
        </button>
      </div>
    </div>

    <!-- AI Suggestions Section -->
    <div 
      v-if="showAISuggestions && Object.keys(aiSuggestions).length > 0" 
      class="relative z-10 mb-4 p-4 border border-purple-300/50 dark:border-purple-700/50 rounded-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20"
    >
      <!-- Background decoration -->
      <div class="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-xl"></div>
      
      <div class="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
        <h4 class="text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center">
          <div class="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center mr-2">
            <FontAwesomeIcon icon="magic" class="text-white text-xs" />
          </div>
          AI Suggested Preferences
          <span class="ml-2 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
            {{ Object.keys(aiSuggestions).length }}
          </span>
        </h4>
        <button 
          @click="applyAllSuggestions" 
          :disabled="isApplyingAll"
          class="group flex items-center text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <FontAwesomeIcon 
            icon="check-double" 
            class="mr-1.5 group-hover:scale-110 transition-transform"
            :class="{ 'fa-spin': isApplyingAll }"
          />
          {{ isApplyingAll ? 'Applying...' : 'Apply All' }}
        </button>
      </div>
      
      <div class="relative space-y-2">
        <div 
          v-for="(value, field) in aiSuggestions" 
          :key="field" 
          class="group flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center mb-1">
              <FontAwesomeIcon :icon="getFieldIcon(field)" class="w-3 h-3 mr-2 text-purple-500" />
              <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">{{ getFieldLabel(field) }}</span>
            </div>
            <div class="text-sm text-gray-700 dark:text-gray-300 break-words bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
              {{ formatSuggestionValue(field, value) }}
            </div>
          </div>
          <button 
            @click="applySuggestion(field)"
            class="group flex items-center text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm self-start sm:self-auto"
          >
            <FontAwesomeIcon icon="plus" class="mr-1 group-hover:scale-110 transition-transform" />
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Preferences Display -->
    <div class="relative z-10 space-y-3 text-sm">
      <div class="flex items-center p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <FontAwesomeIcon icon="comments" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
        <span class="text-gray-700 dark:text-gray-300 min-w-0 flex-1">
          <span class="text-gray-500 dark:text-gray-400 text-xs block">Contact Method</span>
          <span class="font-medium" :class="!customer.preferredContactMethod ? 'text-gray-400 italic' : ''">
            {{ customer.preferredContactMethod || 'Not specified' }}
          </span>
        </span>
      </div>

      <div class="flex items-center p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <FontAwesomeIcon :icon="['far', 'clock']" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
        <span class="text-gray-700 dark:text-gray-300 min-w-0 flex-1">
          <span class="text-gray-500 dark:text-gray-400 text-xs block">Preferred Times</span>
          <span class="font-medium" :class="!customer.preferredContactTimes ? 'text-gray-400 italic' : ''">
            {{ customer.preferredContactTimes || 'Not specified' }}
          </span>
        </span>
      </div>

      <div class="flex items-center p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <FontAwesomeIcon icon="signal" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
        <span class="text-gray-700 dark:text-gray-300 min-w-0 flex-1">
          <span class="text-gray-500 dark:text-gray-400 text-xs block">Frequency</span>
          <span class="font-medium" :class="!customer.communicationFrequencyPreference ? 'text-gray-400 italic' : ''">
            {{ customer.communicationFrequencyPreference || 'Not specified' }}
          </span>
        </span>
      </div>

      <div class="flex items-center p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <FontAwesomeIcon icon="language" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
        <span class="text-gray-700 dark:text-gray-300 min-w-0 flex-1">
          <span class="text-gray-500 dark:text-gray-400 text-xs block">Language</span>
          <span class="font-medium" :class="!customer.languagePreference || customer.languagePreference === 'en' ? 'text-gray-400 italic' : ''">
            {{ customer.languagePreference && customer.languagePreference !== 'en' ? formatSuggestionValue('languagePreference', customer.languagePreference) : 'English (default)' }}
          </span>
        </span>
      </div>
    </div>

    <!-- Missing Preferences Alert -->
    <div 
      v-if="hasMissingPreferences && !showAISuggestions" 
      class="relative z-10 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
    >
      <div class="flex items-center">
        <FontAwesomeIcon icon="exclamation-triangle" class="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
        <span class="text-sm text-yellow-800 dark:text-yellow-300">
          Some communication preferences are missing. 
          <button 
            @click="generateAIPreferences"
            class="underline hover:no-underline font-medium"
          >
            Generate AI suggestions
          </button>
          to improve customer communication.
        </span>
      </div>
    </div>
  </section>
</template>