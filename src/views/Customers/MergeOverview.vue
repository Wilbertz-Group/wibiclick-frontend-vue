<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const mergeGroups = ref([])
const isLoading = ref(false)
const error = ref(null)
const isMerging = ref({}) // { [groupId]: boolean }
const selectedCustomerIds = ref({}) // { [groupId]: Set }
const targetCustomerId = ref({}) // { [groupId]: id }

const fetchMergeGroups = async () => {
  isLoading.value = true
  error.value = null
  try {
    const { data } = await axios.get('/customers/potential-merges/all')
    mergeGroups.value = data
    // Initialize selection state for each group
    selectedCustomerIds.value = {}
    targetCustomerId.value = {}
    isMerging.value = {}
    for (const group of data) {
      selectedCustomerIds.value[group.sharedPhoneNumber] = new Set(group.customers.map(c => c.id))
      targetCustomerId.value[group.sharedPhoneNumber] = group.customers[0]?.id || null
      isMerging.value[group.sharedPhoneNumber] = false
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to fetch merge groups'
  } finally {
    isLoading.value = false
  }
}

const handleCheckboxChange = (group, customerId, checked) => {
  let set = selectedCustomerIds.value[group.sharedPhoneNumber]
  if (!set) {
    // Safeguard: initialize if missing (should not happen, but prevents runtime error)
    set = new Set()
    selectedCustomerIds.value[group.sharedPhoneNumber] = set
    // Optionally, log a warning for debugging
    // console.warn(`Selection set for group ${group.sharedPhoneNumber} was missing and has been re-initialized.`)
  }
  if (checked) {
    set.add(customerId)
  } else {
    set.delete(customerId)
    // If the deselected customer was the target, pick another
    if (targetCustomerId.value[group.sharedPhoneNumber] === customerId) {
      targetCustomerId.value[group.sharedPhoneNumber] = Array.from(set)[0] || null
    }
  }
}

const handleTargetChange = (group, newTargetId) => {
  targetCustomerId.value[group.sharedPhoneNumber] = newTargetId
}

const handleMergeGroup = async (group) => {
  const groupKey = group.sharedPhoneNumber
  const selectedIds = Array.from(selectedCustomerIds.value[groupKey])
  const targetId = targetCustomerId.value[groupKey]
  if (!targetId || selectedIds.length < 2) {
    window.$toast?.error('Select at least two customers and a target for merging.')
    return
  }
  const mergeCustomerIds = selectedIds.filter(id => id !== targetId)
  if (mergeCustomerIds.length === 0) {
    window.$toast?.error('Target customer must not be the only selected customer.')
    return
  }
  isMerging.value[groupKey] = true
  try {
    await axios.post('/customers/merge', {
      targetCustomerId: targetId,
      mergeCustomerIds
    })
    window.$toast?.success('Merge successful!')
    // Remove the merged group from local state instead of refetching all
    const idx = mergeGroups.value.findIndex(g => g.sharedPhoneNumber === groupKey)
    if (idx !== -1) {
      mergeGroups.value.splice(idx, 1)
      // Clean up related state
      delete selectedCustomerIds.value[groupKey]
      delete targetCustomerId.value[groupKey]
      delete isMerging.value[groupKey]
    }
  } catch (e) {
    window.$toast?.error(e?.response?.data?.message || e.message || 'Merge failed')
  } finally {
    isMerging.value[groupKey] = false
  }
}

onMounted(fetchMergeGroups)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 transition-colors duration-300">
    <div class="max-w-4xl mx-auto px-4 sm:px-8 py-10 md:py-16">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-10 text-center">
        Merge Overview
      </h1>
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <span class="loader"></span>
        <span class="ml-3 text-lg text-gray-600 dark:text-gray-300">Loading potential merges...</span>
      </div>
      <div v-else-if="error" class="text-red-500 text-center py-8 text-lg font-medium">
        {{ error }}
      </div>
      <div v-else>
        <div v-if="mergeGroups.length === 0" class="text-gray-400 text-center py-20 text-lg">
          No potential merge groups found.
        </div>
        <div v-else class="space-y-12">
          <div
            v-for="group in mergeGroups"
            :key="group.sharedPhoneNumber"
            class="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 px-6 py-8 space-y-6 group-card-modern"
          >
            <!-- Group Header -->
            <div class="flex items-center gap-3 mb-2">
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 shadow">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 14a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V7a4 4 0 10-8 0v7m8 0a4 4 0 00-8 0" />
                </svg>
              </div>
              <div>
                <div class="text-lg md:text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                  {{ group.sharedPhoneNumber }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 font-medium">Shared Phone Number</div>
              </div>
            </div>
            <!-- Customer List -->
            <div class="space-y-4">
              <div
                v-for="customer in group.customers"
                :key="customer.id"
                :class="[
                  'flex items-center justify-between rounded-lg px-4 py-3 border transition',
                  customer.id === targetCustomerId[group.sharedPhoneNumber]
                    ? 'border-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40 shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/60'
                ]"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    class="custom-checkbox"
                    :checked="selectedCustomerIds[group.sharedPhoneNumber]?.has(customer.id)"
                    @change="handleCheckboxChange(group, customer.id, $event.target.checked)"
                  />
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                    </svg>
                    <span class="font-semibold text-gray-800 dark:text-gray-100">{{ customer.name }}</span>
                    <span
                      v-if="customer.id === targetCustomerId[group.sharedPhoneNumber]"
                      class="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200 text-xs font-bold tracking-wide"
                    >
                      Target
                    </span>
                  </div>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm">
                  <span
                    class="text-gray-500 dark:text-gray-400"
                    :title="customer.id"
                  >
                    <span class="font-medium">ID:</span>
                    {{ customer.id.substring(0, 8) }}...
                  </span>
                  <span class="text-gray-500 dark:text-gray-400"><span class="font-medium">Email:</span> {{ customer.email }}</span>
                  <span class="text-gray-500 dark:text-gray-400"><span class="font-medium">Website ID:</span> {{ customer.websiteId }}</span>
                  <span class="text-gray-400 dark:text-gray-500"><span class="font-medium">Created:</span> {{ customer.createdAt }}</span>
                </div>
              </div>
            </div>
            <!-- Target Selector -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
              <label class="font-semibold text-gray-700 dark:text-gray-200 text-sm">Target Customer:</label>
              <select
                class="custom-select"
                v-model="targetCustomerId[group.sharedPhoneNumber]"
                :disabled="selectedCustomerIds[group.sharedPhoneNumber]?.size < 2"
                @change="handleTargetChange(group, $event.target.value)"
              >
                <option
                  v-for="customer in group.customers"
                  :key="customer.id"
                  :value="customer.id"
                  :disabled="!selectedCustomerIds[group.sharedPhoneNumber]?.has(customer.id)"
                >
                  {{ customer.name }} (ID: {{ customer.id }})
                </option>
              </select>
            </div>
            <!-- Merge Button -->
            <div class="flex justify-end mt-4">
              <button
                class="btn-modern-primary"
                :disabled="isMerging[group.sharedPhoneNumber] || selectedCustomerIds[group.sharedPhoneNumber]?.size < 2"
                @click="handleMergeGroup(group)"
              >
                <span v-if="isMerging[group.sharedPhoneNumber]" class="loader loader-xs mr-2"></span>
                Merge Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Background and container handled by Tailwind in template */

/* Custom Checkbox */
.custom-checkbox {
  @apply w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400 transition;
  accent-color: #6366f1; /* Tailwind indigo-500 */
}

/* Custom Select */
.custom-select {
  @apply border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm;
}

/* Modern Primary Button */
.btn-modern-primary {
  @apply bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Loader */
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #6366f1;
  border-radius: 50%;
  width: 1em;
  height: 1em;
  animation: spin 1s linear infinite;
  display: inline-block;
}
.loader-xs {
  width: 0.75em;
  height: 0.75em;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}

/* Group Card Modern (for extra shadow/hover if desired) */
.group-card-modern {
  transition: box-shadow 0.2s;
}
.group-card-modern:hover {
  box-shadow: 0 8px 32px 0 rgba(99,102,241,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.04);
}
</style>