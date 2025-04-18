<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold mb-6">Manual Match Review</h1>
    <div v-if="loading" class="text-gray-500">Loading potential matches...</div>
    <div v-else>
      <div v-if="matches.length === 0" class="text-green-600">No matches pending review.</div>
      <div v-else class="space-y-6">
        <div
          v-for="match in matches"
          :key="match.id"
          class="bg-white rounded-lg shadow p-6 flex flex-col gap-2 border"
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
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                @click="updateMatchStatus(match.id, 'confirmed')"
                :disabled="actionLoading[match.id]"
              >
                Confirm
              </button>
              <button
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                @click="updateMatchStatus(match.id, 'rejected')"
                :disabled="actionLoading[match.id]"
              >
                Reject
              </button>
            </div>
          </div>
          <div v-if="errorMap[match.id]" class="text-red-600 text-sm mt-2">
            {{ errorMap[match.id] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const matches = ref([])
const loading = ref(true)
const actionLoading = ref({})
const errorMap = ref({})

async function fetchMatches() {
  loading.value = true
  try {
    // Adjust the endpoint as per backend API
    const res = await fetch('/api/matches/pending')
    if (!res.ok) throw new Error('Failed to fetch matches')
    const data = await res.json()
    matches.value = Array.isArray(data) ? data : (data.matches || [])
  } catch (e) {
    matches.value = []
  } finally {
    loading.value = false
  }
}

async function updateMatchStatus(matchId, status) {
  actionLoading.value = { ...actionLoading.value, [matchId]: true }
  errorMap.value = { ...errorMap.value, [matchId]: null }
  try {
    // Adjust the endpoint and method as per backend API
    const res = await fetch(`/api/matches/${matchId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to update status')
    }
    // Remove the match from the list after action
    matches.value = matches.value.filter(m => m.id !== matchId)
  } catch (e) {
    errorMap.value = { ...errorMap.value, [matchId]: e.message }
  } finally {
    actionLoading.value = { ...actionLoading.value, [matchId]: false }
  }
}

onMounted(fetchMatches)
</script>

<style scoped>
/* Add any additional styling if needed */
</style>