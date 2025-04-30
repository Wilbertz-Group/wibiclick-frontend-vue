<!-- wibiclick-frontend-vue/src/components/AISuggestions.vue -->
<script setup>
import { ref } from 'vue'
import axios from 'axios'

const props = defineProps({
  contactId: {
    type: String,
    required: true
  },
  visitorActivity: {
    type: Object,
    required: true
  }
})

const isLoading = ref(false)
const suggestions = ref([])
const errorMessage = ref(null)

const getAISuggestions = async () => {
  isLoading.value = true
  errorMessage.value = null
  
  try {
    const response = await axios.post('/api/ai/suggest-matches', {
      contactId: props.contactId,
      visitorActivity: props.visitorActivity
    })
    suggestions.value = response.data.suggestions
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to get AI suggestions'
  } finally {
    isLoading.value = false
  }
}

const handleConfirmSuggestion = (suggestion) => {
  // TODO: Implement confirmation logic
  console.log('Confirmed suggestion:', suggestion)
}

const handleRejectSuggestion = (suggestion) => {
  // TODO: Implement rejection logic
  console.log('Rejected suggestion:', suggestion)
}
</script>

<template>
  <div class="ai-suggestions">
    <button 
      @click="getAISuggestions"
      :disabled="isLoading"
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      {{ isLoading ? 'Loading...' : 'AI Suggest' }}
    </button>

    <div v-if="errorMessage" class="text-red-500 mt-2">
      {{ errorMessage }}
    </div>

    <div v-if="suggestions.length > 0" class="mt-4 space-y-4">
      <div 
        v-for="suggestion in suggestions" 
        :key="suggestion.visitorId"
        class="border p-4 rounded"
      >
        <div class="font-bold">Visitor ID: {{ suggestion.visitorId }}</div>
        <div>Confidence: {{ suggestion.confidence }}%</div>
        <div class="text-sm text-gray-600">Reasoning: {{ suggestion.reasoning }}</div>
        
        <div class="flex space-x-2 mt-2">
          <button 
            @click="handleConfirmSuggestion(suggestion)"
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Confirm
          </button>
          <button 
            @click="handleRejectSuggestion(suggestion)"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-suggestions {
  margin: 1rem 0;
}
</style>