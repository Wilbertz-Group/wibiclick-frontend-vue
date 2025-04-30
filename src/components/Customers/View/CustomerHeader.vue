<!-- wibiclick-frontend-vue/src/components/Customers/View/CustomerHeader.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { formatFullDate, formatRelativeTime } from '@/utils/formatters';

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
  'ai-book-job'  // Add new emit for AI Job Booking
]);
</script>

<template>
  <!-- Header Section -->
  <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
    <div class="flex items-center space-x-3">
      <button @click="emit('navigate-back')" class="btn-icon-modern" title="Go Back">
        <font-awesome-icon icon="arrow-left" />
      </button>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
          {{ customer.name || 'Loading Customer...' }}              
            <a v-if="customer.portal && customer.foreignID" :href="'https://app.hubspot.com/contacts/'+customer.portal+'/contact/'+customer.foreignID" target="_blank" class="ml-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400" title="View on HubSpot">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 cursor-pointer rounded-full shadow bg-[#ff7a59] hover:bg-[#ff7a59] p-2 text-white" x="0px" y="0px"
                        width="64" height="64"
                        viewBox="0,0,256,256">
                        <g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,256v-256h256v256z" id="bgRectangle"></path></g><g fill="#fffefe" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(8,8)"><path d="M7.5,4c-1.38071,0 -2.5,1.11929 -2.5,2.5c0,1.38071 1.11929,2.5 2.5,2.5c0.47179,-0.00127 0.93359,-0.13602 1.33203,-0.38867l7.48633,5.64062c-0.82356,1.02723 -1.31836,2.32885 -1.31836,3.74805c0,1.55169 0.59408,2.96031 1.56055,4.02539l-3.04492,3.04492c-0.16808,-0.04579 -0.34142,-0.06943 -0.51562,-0.07031c-1.10457,0 -2,0.89543 -2,2c0,1.10457 0.89543,2 2,2c0.62094,-0.00084 1.20627,-0.29004 1.58419,-0.78272c0.37793,-0.49268 0.50558,-1.13296 0.34549,-1.7329l3.20898,-3.20898c0.00049,0.00027 0.00146,-0.00027 0.00195,0c0.85016,0.4618 1.82375,0.72461 2.85938,0.72461c3.314,0 6,-2.686 6,-6c0,-2.9724 -2.16333,-5.43311 -5,-5.91016v-3.35938c0.78227,-0.45329 1.16316,-1.37503 0.92906,-2.24831c-0.2341,-0.87329 -1.02495,-1.48092 -1.92906,-1.48216c-0.90412,0.00123 -1.69497,0.60887 -1.92906,1.48216c-0.2341,0.87329 0.14679,1.79502 0.92906,2.24831v3.35938c-0.77851,0.13092 -1.50439,0.41247 -2.15039,0.8125l-7.89258,-5.94727c0.13516,-0.73009 -0.06121,-1.48249 -0.53591,-2.05341c-0.4747,-0.57093 -1.17862,-0.90131 -1.92112,-0.90166zM21,15c1.654,0 3,1.346 3,3c0,1.654 -1.346,3 -3,3c-1.654,0 -3,-1.346 -3,-3c0,-1.654 1.346,-3 3,-3z"></path></g></g>
                      </svg>
            </a>
        </h1>
        <p v-if="customer.createdAt" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Customer since {{ formatFullDate(customer.createdAt) }}
          <span v-if="customer.createdAt" class="ml-1 text-gray-400 dark:text-gray-500">
            ({{ formatRelativeTime(customer.createdAt) }})
          </span>
        </p>
      </div>
    </div>
    <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
       <button @click="emit('reload-data')" class="btn-icon-modern" title="Refresh Data" aria-label="Refresh customer data">
         <font-awesome-icon icon="sync" :class="{ 'fa-spin': isLoading }" />
       </button>
      <button @click="emit('open-note-modal')" type="button" class="btn-secondary-modern" title="Add Note">
        <font-awesome-icon icon="sticky-note" class="mr-1.5 h-4 w-4" /> Note
      </button>
      <button @click="emit('open-whatsapp-modal')" type="button" class="btn-secondary-modern" title="Send WhatsApp">
        <font-awesome-icon :icon="['fab', 'whatsapp']" class="mr-1.5 h-4 w-4" /> WhatsApp
      </button>
      <!-- Added AI Job Booking Button -->
      <button @click="emit('ai-book-job')" type="button" class="btn-secondary-modern bg-purple-600 hover:bg-purple-700 border-purple-700 text-white" title="AI Job Booking">
        <font-awesome-icon icon="magic" class="mr-1.5 h-4 w-4" /> AI Book Job
      </button>
      <button @click="emit('open-add-job-modal')" class="btn-primary-modern" title="Add New Job"> 
        <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Job
      </button>
    </div>
  </header>
</template>