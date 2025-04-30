<!-- wibiclick-frontend-vue/src/components/Customers/View/CustomerCommunicationPrefs.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit-comm-prefs']);
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Communication Preferences</h3>
      <button @click="emit('edit-comm-prefs')" class="btn-ghost-modern text-xs" aria-label="Edit communication preferences">
        <font-awesome-icon icon="edit" class="mr-1" /> Edit
      </button>
    </div>
    <div class="space-y-3 text-sm">
      <div class="flex items-center">
        <font-awesome-icon icon="comments" class="w-4 h-4 mr-2.5 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          Method: <span class="font-medium ml-1">{{ customer.preferredContactMethod || 'Any' }}</span>
        </span>
      </div>
      <div class="flex items-center">
        <font-awesome-icon :icon="['far', 'clock']" class="w-4 h-4 mr-2.5 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          Times: <span class="font-medium ml-1">{{ customer.preferredContactTimes || 'Any' }}</span>
        </span>
      </div>
      <div class="flex items-center">
        <font-awesome-icon icon="signal" class="w-4 h-4 mr-2.5 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          Frequency: <span class="font-medium ml-1">{{ customer.communicationFrequencyPreference || 'Moderate' }}</span>
        </span>
      </div>
      <div class="flex items-center">
        <font-awesome-icon icon="language" class="w-4 h-4 mr-2.5 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          Language: <span class="font-medium ml-1">{{ customer.languagePreference || 'en' }}</span>
        </span>
      </div>
    </div>
  </section>
</template>