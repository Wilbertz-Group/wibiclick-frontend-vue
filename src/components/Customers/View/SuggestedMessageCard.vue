<!-- wibiclick-frontend-vue/src/components/Customers/View/SuggestedMessageCard.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { formatRelativeTime } from '@/utils/formatters';
import customerService from '@/services/customerService.js';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  recentSuggestions: {
    type: Array,
    default: () => []
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'fetch-suggestions',
  'send-suggestion-now',
  'schedule-suggestion',
  'log-suggestion-manually',
]);

// Local state
const showGenerator = ref(false);
const generatedSuggestion = ref(null);
const isGenerating = ref(false);
const generationError = ref('');

// Editing state
const isEditing = ref(false);
const editedMessage = ref('');

// Rewriting state
const isRewriting = ref(false);
const rewritePrompt = ref('');
const isProcessingRewrite = ref(false);
const rewriteError = ref('');

// Sort previous suggestions by date (newest first)
const sortedRecentSuggestions = computed(() => {
  return [...props.recentSuggestions].sort((a, b) => {
    return new Date(b.generatedAt || b.createdAt) - new Date(a.generatedAt || a.createdAt);
  }).slice(0, 2); // Only show latest 2
});

// Current suggestion to display (either newly generated or null)
const currentSuggestion = computed(() => {
  return generatedSuggestion.value;
});

// Check if we have a valid suggestion to display
const hasGeneratedSuggestion = computed(() => {
  return currentSuggestion.value && currentSuggestion.value.draftMessage;
});

// Method to request a new suggestion
const generateNewSuggestion = async () => {
  if (isGenerating.value) return;
  if (!props.customer?.id) return;
  
  isGenerating.value = true;
  generationError.value = '';
  showGenerator.value = true;
  
  try {
    const response = await customerService.generateFollowupSuggestions(
      props.customer.websiteId, 
      props.customer.id
    );
    
    // Check if we got valid suggestions
    if (response.suggestions && response.suggestions.length > 0) {
      generatedSuggestion.value = response.suggestions[0];
    } else {
      generationError.value = 'No suggestions were generated. Please try again.';
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    generationError.value = error.response?.data?.message || error.message || 'Failed to generate suggestions';
  } finally {
    isGenerating.value = false;
  }
};

// Format the suggestion status for display
const formatSuggestionStatus = (suggestion) => {
  if (!suggestion) return '';
  
  // If it has a status property (like for sent/scheduled messages)
  if (suggestion.status) {
    const statusMap = {
      'SENT': 'Sent',
      'SCHEDULED': 'Scheduled',
      'PENDING': 'Pending',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[suggestion.status] || suggestion.status;
  }
  
  // If it's just a generated suggestion that hasn't been acted on
  return 'Generated';
};

// Begin editing a message
const startEditing = () => {
  if (!currentSuggestion.value) return;
  
  editedMessage.value = currentSuggestion.value.draftMessage || '';
  isEditing.value = true;
};

// Cancel editing
const cancelEditing = () => {
  isEditing.value = false;
  editedMessage.value = '';
};

// Save edited message
const saveEdit = () => {
  if (!currentSuggestion.value) return;
  
  // Create a copy of the current suggestion with the edited message
  generatedSuggestion.value = {
    ...currentSuggestion.value,
    draftMessage: editedMessage.value,
    wasEdited: true // Mark as edited
  };
  
  isEditing.value = false;
  editedMessage.value = '';
};

// Open rewrite prompt modal
const openRewritePrompt = () => {
  rewritePrompt.value = '';
  isRewriting.value = true;
};

// Cancel rewriting
const cancelRewrite = () => {
  isRewriting.value = false;
  rewritePrompt.value = '';
  rewriteError.value = '';
};

// Process rewrite request
const processRewrite = async () => {
  if (!currentSuggestion.value || !rewritePrompt.value.trim()) return;
  isProcessingRewrite.value = true;
  rewriteError.value = '';
  
  try {
    const response = await customerService.rewriteMessage(
      props.customer.websiteId,
      props.customer.id,
      {
        originalMessage: currentSuggestion.value.draftMessage,
        rewriteInstructions: rewritePrompt.value,
        customerContext: {
          name: props.customer.name,
          email: props.customer.email,
          phone: props.customer.phone,
          preferredContactMethod: props.customer.preferredContactMethod
        }
      }
    );
    
    if (response.rewrittenMessage) {
      // Create a copy of the current suggestion with the rewritten message
      generatedSuggestion.value = {
        ...currentSuggestion.value,
        draftMessage: response.rewrittenMessage,
        wasRewritten: true // Mark as rewritten
      };
      
      isRewriting.value = false;
      rewritePrompt.value = '';
    } else {
      rewriteError.value = 'Failed to rewrite message. Please try a different prompt.';
    }
  } catch (error) {
    console.error('Error rewriting message:', error);
    rewriteError.value = error.response?.data?.message || error.message || 'Failed to rewrite message';
  } finally {
    isProcessingRewrite.value = false;
  }
};

// Handle send action
const handleSendNow = (suggestion) => {
  emit('send-suggestion-now', suggestion);
  // Reset after sending
  generatedSuggestion.value = null;
  showGenerator.value = false;
};

// Handle schedule action
const handleSchedule = (suggestion) => {
  emit('schedule-suggestion', suggestion);
  // Reset after scheduling
  generatedSuggestion.value = null;
  showGenerator.value = false;
};

// Handle log action
const handleLog = (suggestion) => {
  emit('log-suggestion-manually', suggestion);
  // Reset after logging
  generatedSuggestion.value = null;
  showGenerator.value = false;
};

// Hide the generator
const hideGenerator = () => {
  showGenerator.value = false;
  generatedSuggestion.value = null;
  isEditing.value = false;
  isRewriting.value = false;
};

// Use a previously generated suggestion
const useExistingSuggestion = (suggestion) => {
  generatedSuggestion.value = suggestion;
  showGenerator.value = true;
};
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">AI Message Suggestions</h2>
      
      <!-- Only show generate button when not already showing generator -->
      <button 
        v-if="!showGenerator"
        @click="generateNewSuggestion" 
        class="btn-primary-modern text-xs" 
        :disabled="isGenerating"
      >
        <font-awesome-icon :icon="isGenerating ? 'spinner' : 'magic'" :class="{'fa-spin': isGenerating}" class="mr-1" /> 
        Generate New Suggestion
      </button>
      
      <!-- Close generator button when showing -->
      <button 
        v-else
        @click="hideGenerator"
        class="btn-ghost-modern text-xs"
        title="Close suggestion generator"
      >
        <font-awesome-icon icon="times" class="mr-1" />
        Cancel
      </button>
    </div>

    <!-- Previous Suggestions Section -->
    <div v-if="sortedRecentSuggestions.length > 0 && !showGenerator" class="mb-6">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Suggestions</h3>
      
      <div class="space-y-3">
        <div 
          v-for="(suggestion, idx) in sortedRecentSuggestions" 
          :key="idx"
          class="bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ suggestion.title || 'Message Suggestion' }}</span>
              <div class="flex items-center mt-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 mr-2">
                  {{ formatSuggestionStatus(suggestion) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatRelativeTime(suggestion.generatedAt || suggestion.createdAt) }}
                </span>
              </div>
            </div>
            <button 
              @click="useExistingSuggestion(suggestion)" 
              class="btn-secondary-modern text-xs"
              :disabled="suggestion.status === 'SENT' || suggestion.status === 'COMPLETED'"
            >
              <font-awesome-icon icon="redo" class="mr-1" />
              Use
            </button>
          </div>
          
          <!-- Preview of message content (truncated) -->
          <p class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
            {{ suggestion.draftMessage || suggestion.messageContent }}
          </p>
        </div>
      </div>
    </div>

    <!-- Suggestion Generator Section (Only shown when actively generating) -->
    <div v-if="showGenerator" class="mt-4">
      <!-- Loading State -->
      <div v-if="isGenerating" class="flex justify-center items-center py-8 text-gray-500 dark:text-gray-400">
        <font-awesome-icon icon="spinner" class="fa-spin mr-2" />
        Generating a personalized message...
      </div>

      <!-- Error State -->
      <div v-else-if="generationError" class="text-center py-6">
        <font-awesome-icon icon="exclamation-triangle" class="text-red-500 text-xl mb-2" />
        <p class="text-red-500">{{ generationError }}</p>
        <button @click="generateNewSuggestion" class="btn-secondary-modern mt-4">
          Try Again
        </button>
      </div>

      <!-- Editing Mode -->
      <div v-else-if="isEditing && hasGeneratedSuggestion" class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Edit Message</h3>
        </div>
        
        <textarea 
          v-model="editedMessage" 
          class="w-full min-h-[150px] rounded-lg p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          placeholder="Enter your message here..."
        ></textarea>
        
        <div class="flex space-x-2 pt-2">
          <button 
            @click="saveEdit" 
            class="btn-primary-modern flex-1"
          >
            <font-awesome-icon icon="check" class="mr-2" />
            Save Changes
          </button>
          <button 
            @click="cancelEditing" 
            class="btn-secondary-modern"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <!-- Rewriting Mode -->
      <div v-else-if="isRewriting && hasGeneratedSuggestion" class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Rewrite Instructions</h3>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Original message:</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ currentSuggestion.draftMessage }}</p>
        </div>
        
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Tell the AI how to rewrite this message:</label>
          <textarea 
            v-model="rewritePrompt" 
            class="w-full min-h-[80px] rounded-lg p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            placeholder="Example: Make it more formal, Add customer's name, Include a mention of their recent service, Make it shorter, etc."
          ></textarea>
        </div>
        
        <p v-if="rewriteError" class="text-red-500 text-sm">{{ rewriteError }}</p>
        
        <div class="flex space-x-2 pt-2">
          <button 
            @click="processRewrite" 
            class="btn-primary-modern flex-1"
            :disabled="isProcessingRewrite || !rewritePrompt.trim()"
          >
            <font-awesome-icon :icon="isProcessingRewrite ? 'spinner' : 'sync'" :class="{'fa-spin': isProcessingRewrite}" class="mr-2" />
            {{ isProcessingRewrite ? 'Rewriting...' : 'Rewrite Message' }}
          </button>
          <button 
            @click="cancelRewrite" 
            class="btn-secondary-modern"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Generated Suggestion -->
      <div v-else-if="hasGeneratedSuggestion" class="space-y-4">
        <!-- Message type badge -->
        <div class="flex justify-between items-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
            <font-awesome-icon :icon="currentSuggestion.channel === 'EMAIL' ? 'envelope' : 'comment'" class="mr-1" />
            {{ currentSuggestion.title || 'Follow-up Suggestion' }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ currentSuggestion.channel || 'WhatsApp' }}
          </span>
        </div>

        <!-- Message content -->
        <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div v-if="currentSuggestion.wasEdited || currentSuggestion.wasRewritten" class="mb-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 mr-2">
              <font-awesome-icon icon="pen" class="mr-1" />
              {{ currentSuggestion.wasRewritten ? 'AI Rewritten' : 'Edited' }}
            </span>
          </div>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ currentSuggestion.draftMessage }}</p>
        </div>

        <!-- Edit / Rewrite buttons -->
        <div class="flex space-x-2">
          <button 
            @click="startEditing" 
            class="btn-ghost-modern text-xs flex-1 flex items-center justify-center"
          >
            <font-awesome-icon icon="edit" class="mr-1" />
            Edit
          </button>
          <button 
            @click="openRewritePrompt" 
            class="btn-ghost-modern text-xs flex-1 flex items-center justify-center"
          >
            <font-awesome-icon icon="sync" class="mr-1" />
            Ask AI to Rewrite
          </button>
        </div>

        <!-- Action buttons -->
        <div class="flex space-x-2 pt-2">
          <button 
            @click="handleSendNow(currentSuggestion)" 
            class="btn-primary-modern flex-1 flex items-center justify-center"
          >
            <font-awesome-icon icon="paper-plane" class="mr-2" />
            Send Now
          </button>
          <button 
            @click="handleSchedule(currentSuggestion)" 
            class="btn-secondary-modern flex items-center justify-center"
          >
            <font-awesome-icon icon="clock" class="mr-2" />
            Schedule
          </button>
          <button 
            @click="handleLog(currentSuggestion)" 
            class="btn-ghost-modern flex items-center justify-center"
            title="Log manual follow-up"
          >
            <font-awesome-icon icon="clipboard" />
          </button>
        </div>
      </div>
      
      <!-- No Suggestion Generated (shouldn't normally happen) -->
      <div v-else class="text-center py-6">
        <font-awesome-icon icon="comment" class="text-gray-400 text-3xl mb-3" />
        <p class="text-gray-500 dark:text-gray-400 mb-2">No message suggestion was generated.</p>
        <button @click="generateNewSuggestion" class="btn-secondary-modern mt-2">
          Try Again
        </button>
      </div>
    </div>
    
    <!-- Empty State (When no previous suggestions and not generating) -->
    <div v-if="!sortedRecentSuggestions.length && !showGenerator" class="text-center py-8">
      <font-awesome-icon icon="comment" class="text-gray-400 text-3xl mb-3" />
      <p class="text-gray-500 dark:text-gray-400 mb-4">No message suggestions available.</p>
      <p class="text-gray-500 dark:text-gray-400 mb-4">Click "Generate New Suggestion" to create a personalized message based on customer communication history.</p>
    </div>
  </section>
</template>