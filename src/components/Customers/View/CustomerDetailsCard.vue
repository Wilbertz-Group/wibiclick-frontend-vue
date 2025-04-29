<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  customer: {
    type: Object,
    required: true
  },
  editableCustomer: {
    type: Object,
    required: true
  },
  isEditing: Boolean,
  isUpdating: Boolean,
  isGeneratingAISuggestions: Boolean,
  aiSuggestedFields: {
    type: Object,
    default: () => ({})
  },
  showAISuggestions: Boolean
});

const emit = defineEmits([
  'edit-info', 
  'cancel-edit', 
  'update-customer', 
  'copy-to-clipboard',
  'edit-preferred-technician',
  'generate-ai-suggestions',
  'apply-ai-suggestion',
  'apply-all-ai-suggestions'
]);
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h2>
      <button v-if="!isEditing" @click="emit('edit-info')" class="btn-ghost-modern text-xs" aria-label="Edit customer details">
        <font-awesome-icon icon="edit" class="mr-1" /> Edit
      </button>
    </div>

    <!-- Display Mode -->
    <div v-if="!isEditing" class="space-y-3 text-sm">
      <div v-if="customer.phone" class="flex items-center group">
        <font-awesome-icon icon="phone" class="w-4 h-4 mr-2.5 text-gray-400" />
        <a :href="'tel:'+customer.phone" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">{{ customer.phone }}</a>
        <button @click="emit('copy-to-clipboard', customer.phone, 'Phone number')" class="ml-2 text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" title="Copy phone number">
          <font-awesome-icon icon="copy" class="w-3 h-3" />
        </button>
      </div>
      <div v-if="customer.email" class="flex items-center group">
        <font-awesome-icon icon="envelope" class="w-4 h-4 mr-2.5 text-gray-400" />
        <a :href="'mailto:'+customer.email" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">{{ customer.email }}</a>
        <button @click="emit('copy-to-clipboard', customer.email, 'Email address')" class="ml-2 text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" title="Copy email address">
          <font-awesome-icon icon="copy" class="w-3 h-3" />
        </button>
      </div>
      <div v-if="customer.address" class="flex items-start">
        <font-awesome-icon icon="map-marker-alt" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
        <span class="text-gray-700 dark:text-gray-300">{{ customer.address }}</span>
      </div>
      <div v-if="customer.channel" class="flex items-center">
         <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400" />
         <span class="text-gray-700 dark:text-gray-300">Channel: {{ customer.channel }}</span>
      </div>
       <div v-if="customer.message" class="flex items-start">
         <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
         <span class="text-gray-700 dark:text-gray-300">Details: {{ customer.message }}</span>
       </div>
      <div v-if="customer.portal" class="flex items-center">
         <font-awesome-icon icon="building" class="w-4 h-4 mr-2.5 text-gray-400" />
         <span class="text-gray-700 dark:text-gray-300">Portal: {{ customer.portal }}</span>
      </div>
      <div v-if="customer.foreignID" class="flex items-center">
         <font-awesome-icon icon="link" class="w-4 h-4 mr-2.5 text-gray-400" />
         <span class="text-gray-700 dark:text-gray-300">Foreign ID: {{ customer.foreignID }}</span>
      </div>
      <!-- Referral Info -->
      <div v-if="customer.referredBy" class="flex items-center">
        <font-awesome-icon icon="user" class="w-4 h-4 mr-2.5 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          Referred By:
          <span class="font-medium ml-1">{{ customer.referredBy.name || 'N/A' }}</span>
        </span>
      </div>
      <div v-if="customer.referrals && customer.referrals.length > 0" class="flex items-start">
        <font-awesome-icon icon="users" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
        <span class="text-gray-700 dark:text-gray-300">
          Referred Clients:
          <ul class="list-disc list-inside ml-1 mt-1">
            <li v-for="referral in customer.referrals" :key="referral.id">
              {{ referral.name || 'N/A' }}
            </li>
          </ul>
        </span>
      </div>
      <!-- Preferred Technician -->
      <div class="flex items-center">
        <font-awesome-icon icon="user-cog" class="w-4 h-4 mr-2.5 text-gray-400" />
        <span class="text-gray-700 dark:text-gray-300">
          Preferred Technician:
          <span class="font-medium ml-1">{{ customer.preferredTechnician?.name || 'None' }}</span>
          <button @click="emit('edit-preferred-technician')" class="btn-ghost-modern text-xs ml-2 p-0.5" aria-label="Edit preferred technician">
            <font-awesome-icon icon="edit" />
          </button>
        </span>
      </div>
    </div>

    <!-- Edit Mode Form -->
    <form v-else @submit.prevent="emit('update-customer')" class="space-y-4">
      <div>
        <label for="edit-name" class="label-modern">Name</label>
        <input type="text" id="edit-name" v-model="editableCustomer.name" required class="input-modern" />
      </div>
      
      <!-- AI Suggestions section -->
      <div v-if="showAISuggestions && Object.keys(aiSuggestedFields).length > 0" class="mt-4 p-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
        <div class="flex justify-between items-center mb-2">
          <h4 class="text-sm font-semibold text-purple-800 dark:text-purple-300">AI Suggested Fields</h4>
          <button 
            type="button" 
            @click="emit('apply-all-ai-suggestions')" 
            class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
          >
            Apply All
          </button>
        </div>
        
        <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div v-for="(value, field) in aiSuggestedFields" :key="field" class="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div>
              <span class="font-medium capitalize">{{ field }}: </span>
              <span>{{ value }}</span>
            </div>
            <button 
              type="button"
              @click="emit('apply-ai-suggestion', field)"
              class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 px-2 py-1 rounded transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <label for="edit-phone" class="label-modern">Phone</label>
        <input type="tel" id="edit-phone" v-model="editableCustomer.phone" class="input-modern" />
      </div>
      <div>
        <label for="edit-email" class="label-modern">Email</label>
        <input type="email" id="edit-email" v-model="editableCustomer.email" class="input-modern" />
      </div>
      <div>
        <label for="edit-address" class="label-modern">Address</label>
        <textarea id="edit-address" v-model="editableCustomer.address" rows="2" class="input-modern"></textarea>
      </div>
       <div>
         <label for="edit-channel" class="label-modern">Channel</label>
         <input type="text" id="edit-channel" v-model="editableCustomer.channel" class="input-modern" />
       </div>
       <div>
         <label for="edit-message" class="label-modern">Lead Source / Details</label>
         <textarea id="edit-message" v-model="editableCustomer.message" rows="2" class="input-modern"></textarea>
       </div>
       <div>
         <label for="edit-portal" class="label-modern">Portal</label>
         <input type="text" id="edit-portal" v-model="editableCustomer.portal" class="input-modern" />
       </div>
       <div>
         <label for="edit-foreignID" class="label-modern">Foreign ID</label>
         <input type="text" id="edit-foreignID" v-model="editableCustomer.foreignID" class="input-modern" />
       </div>
      <div class="flex justify-between items-center pt-2">
        <button 
          type="button" 
          @click="emit('generate-ai-suggestions')" 
          class="btn-secondary-modern flex items-center"
          :disabled="isGeneratingAISuggestions"
        >
          <font-awesome-icon icon="magic" class="mr-2" :class="{ 'fa-spin': isGeneratingAISuggestions }" />
          {{ isGeneratingAISuggestions ? 'Generating...' : 'AI Suggestions' }}
        </button>
        <div class="flex space-x-3 rtl:space-x-reverse">
          <button type="button" @click="emit('cancel-edit')" class="btn-secondary-modern">Cancel</button>
          <button type="submit" class="btn-primary-modern" :disabled="isUpdating">
            {{ isUpdating ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </form>
  </section>
</template>