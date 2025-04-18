<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Manual Match Review
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            @click="runBatchMatching"
            class="btn-primary-modern"
            :disabled="batchLoading"
            title="Run Batch Matching"
          >
            <span v-if="batchLoading">
              <svg class="animate-spin h-5 w-5 inline-block mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Running...
            </span>
            <span v-else>
              Run Batch Matching
            </span>
          </button>
        </div>
      </header>
      <!-- Card Section -->
      <section class="card-modern p-6">
        <div v-if="loading" class="text-gray-500">Loading potential matches...</div>
        <div v-else>
          <div v-if="matches.length === 0" class="text-green-600">No matches pending review.</div>
          <div v-else class="space-y-6">
            <div
              v-for="match in matches"
              :key="match.id"
              class="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 p-6"
            >
              <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div>
                  <div class="font-semibold text-lg">Potential Match</div>
                  <div class="text-sm text-gray-500 mb-2">Match ID: {{ match.id }}</div>
                  <div class="mb-2">
                    <span class="font-medium">Customer:</span>
                    <span>{{ match.customerName || match.customer?.name || 'N/A' }}</span>
                  </div>
                  <div class="mb-2">
                    <span class="font-medium">Identifiers:</span>
                    <span>
                      <template v-if="match.identifiers && match.identifiers.length">
                        <span v-for="(id, idx) in match.identifiers" :key="id">
                          {{ id }}<span v-if="idx !== match.identifiers.length - 1">, </span>
                        </span>
                      </template>
                      <template v-else>
                        N/A
                      </template>
                    </span>
                  </div>
                  <div class="mb-2">
                    <span class="font-medium">Context:</span>
                    <span>{{ match.context || 'No additional context.' }}</span>
                  </div>
                </div>
                <div class="flex flex-row gap-2 mt-2 md:mt-0">
                  <button
                    class="btn-primary-modern"
                    @click="updateMatchStatus(match.id, 'confirmed')"
                    :disabled="actionLoading[match.id]"
                  >
                    Confirm
                  </button>
                  <button
                    class="btn-secondary-modern"
                    @click="updateMatchStatus(match.id, 'rejected')"
                    :disabled="actionLoading[match.id]"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <AISuggestions
                :contactId="match.id"
                :visitorActivity="match.visitorActivity || {}"
              />
              <div v-if="errorMap[match.id]" class="text-red-600 text-sm mt-2">
                {{ errorMap[match.id] }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from "axios";
import AISuggestions from '@/components/AISuggestions.vue'
import { useToast } from 'vue-toast-notification'

const matches = ref([])
const loading = ref(true)
const actionLoading = ref({})
const errorMap = ref({})
const batchLoading = ref(false)
const toast = useToast()

async function fetchMatches() {
  loading.value = true
  try {
    const response = await axios.get('/api/v1/identifiers/pending-review')
    const data = response.data
    matches.value = data?.success && Array.isArray(data.data) ? data.data : []
  } catch (error) {
    matches.value = []
    toast.error('Error fetching matches. Please try again.')
  } finally {
    loading.value = false
  }
}

async function updateMatchStatus(matchId, status) {
  actionLoading.value = { ...actionLoading.value, [matchId]: true }
  errorMap.value = { ...errorMap.value, [matchId]: null }
  try {
    await axios.patch(`/api/matches/${matchId}/status`, { status })
    matches.value = matches.value.filter(m => m.id !== matchId)
    toast.success(`Match ${status === 'confirmed' ? 'confirmed' : 'rejected'} successfully.`)
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Failed to update status'
    errorMap.value = { ...errorMap.value, [matchId]: message }
    toast.error(message)
  } finally {
    actionLoading.value = { ...actionLoading.value, [matchId]: false }
  }
}

async function runBatchMatching() {
  batchLoading.value = true
  try {
    await axios.post('/api/v1/matching/run')
    toast.success('Batch matching started successfully.')
    // Optionally, you may want to refresh matches after running batch
    fetchMatches()
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Failed to run batch matching'
    toast.error(message)
  } finally {
    batchLoading.value = false
  }
}

onMounted(fetchMatches)
</script>

<style scoped>
.card-modern {
  @apply bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50;
}
.btn-primary-modern {
  @apply inline-flex items-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-150 ease-in-out;
}
.btn-secondary-modern {
  @apply inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-150 ease-in-out;
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-150 ease-in-out;
}
</style>