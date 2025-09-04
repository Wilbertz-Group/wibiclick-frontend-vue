<!-- wibiclick-frontend-vue/src/components/Customers/View/CustomerHeader.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { formatFullDate, formatRelativeTime } from '@/utils/formatters';
import { computed } from 'vue';

library.add(faCalendarAlt);

const props = defineProps({
  customer: {
    type: Object,
    required: true
  },
  isLoading: Boolean
});

const emit = defineEmits([
  'navigate-back', 
  'open-note-modal', 
  'open-whatsapp-modal', 
  'open-add-job-modal',
  'reload-data',
  'ai-book-job'
]);

// Computed property for customer status/badge
const customerStatus = computed(() => {
  if (!props.customer) return null;
  // You can add logic here to determine customer status based on various factors
  if (props.customer.vip) return { label: 'VIP', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
  if (props.customer.inactive) return { label: 'Inactive', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  return { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
});
</script>

<template>
  <!-- Enhanced Header Section with better structure and styling -->
  <header class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6">
    
    <!-- Top Navigation Row -->
    <div class="flex items-center justify-between mb-6">
      <button 
        @click="emit('navigate-back')" 
        class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        title="Go Back"
      >
        <font-awesome-icon icon="arrow-left" class="w-4 h-4" />
        <span class="hidden sm:inline text-sm font-medium">Back</span>
      </button>
      
      <!-- Refresh button in top right -->
      <button 
        @click="emit('reload-data')" 
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
        title="Refresh Data"
        :disabled="isLoading"
      >
        <font-awesome-icon icon="sync" :class="{ 'fa-spin': isLoading }" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Customer Info Section -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <!-- Customer Name and Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start gap-3 mb-3">
            <!-- Customer Avatar/Initial -->
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0">
              {{ customer.name ? customer.name.charAt(0).toUpperCase() : '?' }}
            </div>
            
            <div class="flex-1 min-w-0">
              <!-- Name with HubSpot link -->
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {{ customer.name || 'Loading Customer...' }}
                </h1>
                
                <!-- Status Badge -->
                <span v-if="customerStatus" 
                  :class="customerStatus.class"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ customerStatus.label }}
                </span>
                
                <!-- HubSpot Link -->
                <a v-if="customer.portal && customer.foreignID" 
                  :href="'https://app.hubspot.com/contacts/'+customer.portal+'/contact/'+customer.foreignID" 
                  target="_blank" 
                  class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#ff7a59] hover:bg-[#ff6b4a] text-white transition-colors shadow-md"
                  title="View on HubSpot">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M7.5,4c-1.38071,0 -2.5,1.11929 -2.5,2.5c0,1.38071 1.11929,2.5 2.5,2.5c0.47179,-0.00127 0.93359,-0.13602 1.33203,-0.38867l7.48633,5.64062c-0.82356,1.02723 -1.31836,2.32885 -1.31836,3.74805c0,1.55169 0.59408,2.96031 1.56055,4.02539l-3.04492,3.04492c-0.16808,-0.04579 -0.34142,-0.06943 -0.51562,-0.07031c-1.10457,0 -2,0.89543 -2,2c0,1.10457 0.89543,2 2,2c0.62094,-0.00084 1.20627,-0.29004 1.58419,-0.78272c0.37793,-0.49268 0.50558,-1.13296 0.34549,-1.7329l3.20898,-3.20898c0.00049,0.00027 0.00146,-0.00027 0.00195,0c0.85016,0.4618 1.82375,0.72461 2.85938,0.72461c3.314,0 6,-2.686 6,-6c0,-2.9724 -2.16333,-5.43311 -5,-5.91016v-3.35938c0.78227,-0.45329 1.16316,-1.37503 0.92906,-2.24831c-0.2341,-0.87329 -1.02495,-1.48092 -1.92906,-1.48216c-0.90412,0.00123 -1.69497,0.60887 -1.92906,1.48216c-0.2341,0.87329 0.14679,1.79502 0.92906,2.24831v3.35938c-0.77851,0.13092 -1.50439,0.41247 -2.15039,0.8125l-7.89258,-5.94727c0.13516,-0.73009 -0.06121,-1.48249 -0.53591,-2.05341c-0.4747,-0.57093 -1.17862,-0.90131 -1.92112,-0.90166zM21,15c1.654,0 3,1.346 3,3c0,1.654 -1.346,3 -3,3c-1.654,0 -3,-1.346 -3,-3c0,-1.654 1.346,-3 3,-3z"/>
                  </svg>
                </a>
              </div>
              
              <!-- Customer Meta Info -->
              <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span v-if="customer.createdAt" class="flex items-center gap-1">
                  <font-awesome-icon icon="calendar-alt" class="w-3.5 h-3.5" />
                  Customer since {{ formatFullDate(customer.createdAt) }}
                </span>
                <span v-if="customer.createdAt" class="text-gray-400 dark:text-gray-500">
                  • {{ formatRelativeTime(customer.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Stats (optional - you can add customer stats here) -->
        <div class="hidden lg:flex gap-6">
          <div v-if="customer.totalJobs !== undefined" class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ customer.totalJobs || 0 }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Total Jobs</div>
          </div>
          <div v-if="customer.totalSpent !== undefined" class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ customer.totalSpent || 0 }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Total Spent</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="border-t border-gray-200 dark:border-gray-700 my-6"></div>
    
    <!-- Action Buttons Section - Improved layout -->
    <div class="flex flex-wrap gap-3">
      <!-- Primary Actions -->
      <button 
        @click="emit('open-add-job-modal')" 
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        title="Add New Job"
      > 
        <font-awesome-icon icon="plus" class="w-4 h-4" /> 
        <span>Add Job</span>
      </button>
      
      <!-- AI Job Booking Button -->
      <button 
        @click="emit('ai-book-job')" 
        class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all transform hover:scale-105"
        title="AI Job Booking"
      >
        <font-awesome-icon icon="magic" class="w-4 h-4" /> 
        <span>AI Book</span>
      </button>
      
      <!-- Secondary Actions -->
      <div class="flex gap-2 ml-auto">
        <button 
          @click="emit('open-note-modal')" 
          class="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm rounded-lg transition-colors"
          title="Add Note"
        >
          <font-awesome-icon icon="sticky-note" class="w-4 h-4" /> 
          <span class="hidden sm:inline">Note</span>
        </button>
        
        <button 
          @click="emit('open-whatsapp-modal')" 
          class="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          title="Send WhatsApp"
        >
          <font-awesome-icon :icon="['fab', 'whatsapp']" class="w-4 h-4" /> 
          <span class="hidden sm:inline">WhatsApp</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Custom animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

header {
  animation: slideDown 0.3s ease-out;
}

/* Ensure proper text truncation */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Button hover effects */
button {
  transition: all 0.2s ease;
}

button:active {
  transform: scale(0.98);
}

/* Gradient text effect (optional) */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>