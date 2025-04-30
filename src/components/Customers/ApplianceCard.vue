<!-- wibiclick-frontend-vue/src/components/Customers/ApplianceCard.vue -->
<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faEdit, faTrashAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'; // Added warning icon
import { library } from '@fortawesome/fontawesome-svg-core';

library.add(faEdit, faTrashAlt, faExclamationTriangle);

// Define expected props for the appliance object and potential alert
interface Appliance {
  id: number | string; // Allow string if UUIDs are used elsewhere, though schema uses Int
  type: string;
  brand?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  lastServiceDate?: string | Date | null; // Allow string or Date
  // Add other relevant fields if needed from the backend model
}

// Define potential alert structure (matching backend plan/implementation)
interface MaintenanceAlert {
    risk: string; // e.g., 'Low', 'Medium', 'High'
    needs: string; // e.g., 'Filter Clean/Service', 'Anode Check Recommended'
    timing: string; // e.g., 'Next month', 'Next 3 months'
    priority: string; // e.g., 'Low', 'Medium', 'High'
}

const props = defineProps<{
  appliance: Appliance;
  alert?: MaintenanceAlert | null; // Optional predictive maintenance alert
}>();

// Define emits for edit, delete, and alert actions
const emit = defineEmits(['edit', 'delete', 'schedule-service', 'dismiss-alert']);

// Function to format date (basic example)
const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
};

// Functions to emit events
const handleEdit = () => {
  emit('edit', props.appliance); // Pass the appliance object back
};

const handleDelete = () => {
  emit('delete', props.appliance.id); // Pass the appliance ID back
};

// Helper to get alert color based on risk/priority
const getAlertClass = (alert: MaintenanceAlert | null | undefined): string => {
    if (!alert) return '';
    const priority = alert.priority?.toLowerCase();
    if (priority === 'high') return 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    if (priority === 'medium') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'; // Default for low or unknown
}
</script>

<template>
  <div class="block p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out mb-3">
    <div class="flex justify-between items-start">
      <div>
        <h5 class="text-md font-semibold tracking-tight text-gray-900 dark:text-white mb-1">
          {{ props.appliance.type || 'Appliance Type Missing' }}
        </h5>
        <p v-if="props.appliance.brand" class="text-sm text-gray-600 dark:text-gray-400">
          {{ props.appliance.brand }} <span v-if="props.appliance.modelNumber">({{ props.appliance.modelNumber }})</span>
        </p>
        <p v-if="props.appliance.serialNumber" class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Serial: {{ props.appliance.serialNumber }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Last Service: {{ formatDate(props.appliance.lastServiceDate) }}
        </p>
      </div>
      <div class="flex space-x-2 flex-shrink-0">
        <button @click="handleEdit" class="btn-ghost-modern p-1 h-6 w-6 text-gray-500 hover:text-indigo-600" title="Edit Appliance">
          <font-awesome-icon icon="edit" />
        </button>
        <button @click="handleDelete" class="btn-ghost-modern p-1 h-6 w-6 text-gray-500 hover:text-red-600" title="Delete Appliance">
          <font-awesome-icon icon="trash-alt" />
        </button>
      </div>
    </div>
     <!-- Predictive Maintenance Alert Section -->
     <div v-if="props.alert" :class="['mt-3 p-2 border-l-4 rounded-r text-xs', getAlertClass(props.alert)]">
        <p class="font-medium flex items-center">
            <font-awesome-icon icon="exclamation-triangle" class="mr-1.5 h-3 w-3" />
            Maintenance Alert ({{ props.alert.priority || 'Info' }})
        </p>
        <p class="mt-1">Needs: {{ props.alert.needs }}</p>
        <p>Timing: {{ props.alert.timing }}</p>
        <!-- Actions for Alert -->
        <div class="flex justify-end space-x-2 mt-2">
            <button
                @click="$emit('schedule-service', { appliance: props.appliance, alert: props.alert })"
                class="btn-secondary-modern text-xxs py-0.5 px-1.5"
                title="Schedule service based on this alert"
            >
                Schedule Service
            </button>
             <button
                @click="$emit('dismiss-alert', props.appliance.id)"
                class="btn-ghost-modern text-xxs py-0.5 px-1.5 text-gray-500 hover:text-red-600"
                title="Dismiss this alert"
            >
                Dismiss
            </button>
        </div>
     </div>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
/* Leverage existing modern button styles if available globally */
.btn-ghost-modern {
  @apply inline-flex items-center justify-center rounded text-xs font-medium;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>