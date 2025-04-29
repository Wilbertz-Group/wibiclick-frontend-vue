<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ApplianceCard from '@/components/Customers/ApplianceCard.vue';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';

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
  'fetch-predictive-maintenance'
]);
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex justify-between items-center mb-4 gap-2">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Client Appliances</h3>
      <div class="flex items-center gap-2">
        <button @click="emit('detect-appliances')" class="btn-secondary-modern text-sm" :disabled="isDetectingAppliances" aria-label="Detect appliances using AI">
          <font-awesome-icon icon="magic" :class="{'fa-spin': isDetectingAppliances}" class="mr-1.5 h-3 w-3" /> Detect (AI)
        </button>
        <button @click="emit('open-add-appliance-modal')" class="btn-primary-modern text-sm" aria-label="Add new appliance for this client">
          <font-awesome-icon icon="plus" class="mr-1.5 h-3 w-3" /> Add Appliance
        </button>
      </div>
    </div>
    <!-- Loading State for Predictive Maintenance -->
    <div v-if="isFetchingPredMaint" class="text-center py-4">
      <ScaleLoader :loading="true" color="#4f46e5" height="25px" width="4px" />
      <p class="text-sm text-gray-500 mt-2">Checking predictive maintenance...</p>
    </div>
    <!-- Error State for Predictive Maintenance -->
    <div v-else-if="predMaintError" class="text-center py-4 text-red-600 dark:text-red-400">
      <p>Error checking maintenance: {{ predMaintError }}</p>
      <button @click="emit('fetch-predictive-maintenance')" class="btn-secondary-modern mt-2">Retry</button>
    </div>
    <!-- Appliance List (only show if not loading/erroring on maint check) -->
    <div v-else-if="customer.appliances && customer.appliances.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-1">
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
    <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
      No appliances recorded for this client yet.
    </div>
  </section>
</template>