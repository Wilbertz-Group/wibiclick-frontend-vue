<!-- Enhanced wibiclick-frontend-vue/src/components/Customers/View/CustomerDetailsCard.vue -->
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, computed, nextTick } from 'vue';

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
  showAISuggestions: Boolean,
  compact: {
    type: Boolean,
    default: false
  }
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

// Enhanced reactive state
const isCollapsed = ref(false);
const copiedField = ref(null);
const isAnimating = ref(false);

// Enhanced computed properties
const hasContactInfo = computed(() => 
  props.customer.phone || props.customer.email
);

const hasLocationInfo = computed(() => 
  props.customer.address
);

const hasBusinessInfo = computed(() => 
  props.customer.channel || props.customer.portal || props.customer.foreignID || props.customer.message
);

const hasReferralInfo = computed(() => 
  props.customer.referredBy || (props.customer.referrals && props.customer.referrals.length > 0)
);

const customerCompleteness = computed(() => {
  const fields = ['name', 'phone', 'email', 'address'];
  const filledFields = fields.filter(field => props.customer[field]);
  return Math.round((filledFields.length / fields.length) * 100);
});

const displayFields = computed(() => {
  const fields = [];
  
  // Contact Information
  if (props.customer.phone) {
    fields.push({
      icon: 'phone',
      label: 'Phone',
      value: props.customer.phone,
      type: 'phone',
      copyable: true,
      href: `tel:${props.customer.phone}`,
      category: 'contact'
    });
  }
  
  if (props.customer.email) {
    fields.push({
      icon: 'envelope',
      label: 'Email',
      value: props.customer.email,
      type: 'email',
      copyable: true,
      href: `mailto:${props.customer.email}`,
      category: 'contact'
    });
  }
  
  // Location
  if (props.customer.address) {
    fields.push({
      icon: 'map-marker-alt',
      label: 'Address',
      value: props.customer.address,
      type: 'text',
      multiline: true,
      copyable: true,
      category: 'location'
    });
  }
  
  // Business Info
  if (props.customer.channel) {
    fields.push({
      icon: 'share-alt',
      label: 'Channel',
      value: props.customer.channel,
      type: 'text',
      category: 'business'
    });
  }
  
  if (props.customer.message) {
    fields.push({
      icon: 'comment-alt',
      label: 'Lead Details',
      value: props.customer.message,
      type: 'text',
      multiline: true,
      category: 'business'
    });
  }
  
  if (props.customer.portal) {
    fields.push({
      icon: 'building',
      label: 'Portal',
      value: props.customer.portal,
      type: 'text',
      category: 'business'
    });
  }
  
  if (props.customer.foreignID) {
    fields.push({
      icon: 'link',
      label: 'Foreign ID',
      value: props.customer.foreignID,
      type: 'text',
      copyable: true,
      category: 'business'
    });
  }
  
  return fields;
});

const fieldsByCategory = computed(() => {
  const categories = {
    contact: [],
    location: [],
    business: []
  };
  
  displayFields.value.forEach(field => {
    if (categories[field.category]) {
      categories[field.category].push(field);
    }
  });
  
  return categories;
});

const totalFields = computed(() => displayFields.value.length);

// Enhanced methods
const toggleCollapse = async () => {
  isAnimating.value = true;
  isCollapsed.value = !isCollapsed.value;
  await nextTick();
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
};

const handleCopy = async (value, label) => {
  try {
    await navigator.clipboard.writeText(value);
    copiedField.value = label;
    emit('copy-to-clipboard', value, label);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      copiedField.value = null;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    emit('copy-to-clipboard', value, label);
  }
};

const getCategoryIcon = (category) => {
  const icons = {
    contact: 'address-book',
    location: 'map-marker-alt',
    business: 'briefcase'
  };
  return icons[category] || 'info-circle';
};

const getCategoryColor = (category) => {
  const colors = {
    contact: 'text-blue-500',
    location: 'text-green-500',
    business: 'text-purple-500'
  };
  return colors[category] || 'text-gray-500';
};
</script>

<template>
  <section 
    class="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-lg shadow-gray-100/50 dark:shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20"
    :class="[
      compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 lg:p-6',
      'h-fit'
    ]"
  >
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl"></div>
      <div class="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-purple-400/5 to-blue-400/5 rounded-full blur-xl"></div>
    </div>

    <!-- Header with enhanced design -->
    <div class="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 gap-3 sm:gap-0">
      <div class="flex items-center space-x-3 min-w-0 flex-1">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <FontAwesomeIcon icon="user-circle" class="text-white text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 
            class="font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            :class="compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'"
          >
            Customer Details
          </h2>
          <!-- Completeness indicator -->
          <div class="flex items-center space-x-2 mt-1">
            <div class="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="customerCompleteness >= 75 ? 'bg-green-500' : customerCompleteness >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
                :style="`width: ${customerCompleteness}%`"
              ></div>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ customerCompleteness }}% complete</span>
          </div>
        </div>
        
        <!-- Mobile collapse toggle -->
        <button
          v-if="!isEditing && totalFields > 3"
          @click="toggleCollapse"
          class="sm:hidden p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          :aria-label="isCollapsed ? 'Expand details' : 'Collapse details'"
        >
          <FontAwesomeIcon 
            :icon="isCollapsed ? 'chevron-down' : 'chevron-up'" 
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': isCollapsed }"
          />
        </button>
      </div>
      
      <button 
        v-if="!isEditing" 
        @click="emit('edit-info')" 
        class="group flex items-center justify-center px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:shadow-md flex-shrink-0"
        :class="compact ? 'text-xs' : 'text-sm'"
        aria-label="Edit customer details"
      >
        <FontAwesomeIcon icon="edit" class="mr-2 group-hover:scale-110 transition-transform duration-200" /> 
        <span class="hidden sm:inline font-medium">Edit</span>
      </button>
    </div>

    <!-- Display Mode -->
    <div v-if="!isEditing" class="relative z-10">
      <!-- Quick Contact Bar -->
      <div v-if="hasContactInfo" class="flex flex-wrap gap-0 mb-4 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/80 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <a 
          v-if="customer.phone" 
          :href="`tel:${customer.phone}`"
          class="group inline-flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 hover:shadow-sm"
        >
          <FontAwesomeIcon icon="phone" class="w-3 h-3 mr-1.5 group-hover:scale-110 transition-transform" />
          <span class="font-medium">Call</span>
        </a>
        
        <a 
          v-if="customer.email" 
          :href="`mailto:${customer.email}`"
          class="group inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 hover:shadow-sm"
        >
          <FontAwesomeIcon icon="envelope" class="w-3 h-3 mr-1.5 group-hover:scale-110 transition-transform" />
          <span class="font-medium">Email</span>
        </a>
        
        <span 
          v-if="customer.preferredTechnician?.name" 
          class="inline-flex items-center px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
        >
          <FontAwesomeIcon icon="user-cog" class="w-3 h-3 mr-1.5" />
          <span class="font-medium">{{ customer.preferredTechnician.name }}</span>
        </span>
      </div>

      <!-- Detailed Information with categories -->
      <div 
        class="transition-all duration-300 ease-in-out"
        :class="[
          compact ? 'text-xs sm:text-sm' : 'text-sm',
          { 'hidden sm:block': isCollapsed },
          { 'opacity-50': isAnimating }
        ]"
      >
        <!-- Contact Information Section -->
        <div v-if="fieldsByCategory.contact.length > 0" class="mb-4">
          <div class="flex items-center mb-1.5">
            <FontAwesomeIcon icon="address-book" class="w-4 h-4 text-blue-500 mr-2" />
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Information</h4>
          </div>
          <div class="space-y-2 ml-6">
            <div
              v-for="field in fieldsByCategory.contact"
              :key="field.label"
              class="group flex items-center justify-between p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              <div class="flex items-center min-w-0 flex-1">
                <FontAwesomeIcon 
                  :icon="field.icon" 
                  class="text-gray-400 flex-shrink-0 w-4 h-4 mr-3"
                />
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{{ field.label }}</div>
                  <a 
                    v-if="field.href"
                    :href="field.href" 
                    class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium break-all"
                  >
                    {{ field.value }}
                  </a>
                  <span 
                    v-else
                    class="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    {{ field.value }}
                  </span>
                </div>
              </div>
              
              <button 
                v-if="field.copyable"
                @click="handleCopy(field.value, field.label)"
                class="ml-3 p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                :title="`Copy ${field.label.toLowerCase()}`"
              >
                <FontAwesomeIcon 
                  :icon="copiedField === field.label ? 'check' : 'copy'" 
                  class="w-3 h-3"
                  :class="copiedField === field.label ? 'text-green-500' : ''"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Location Information Section -->
        <div v-if="fieldsByCategory.location.length > 0" class="mb-4">
          <div class="flex items-center mb-1.5">
            <FontAwesomeIcon icon="map-marker-alt" class="w-4 h-4 text-green-500 mr-2" />
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</h4>
          </div>
          <div class="space-y-2 ml-6">
            <div
              v-for="field in fieldsByCategory.location"
              :key="field.label"
              class="group flex items-start justify-between p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              <div class="flex items-start min-w-0 flex-1">
                <FontAwesomeIcon 
                  :icon="field.icon" 
                  class="text-gray-400 flex-shrink-0 w-4 h-4 mr-3 mt-0.5"
                />
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{{ field.label }}</div>
                  <span class="text-gray-700 dark:text-gray-300 font-medium break-words">
                    {{ field.value }}
                  </span>
                </div>
              </div>
              
              <button 
                v-if="field.copyable"
                @click="handleCopy(field.value, field.label)"
                class="ml-3 p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                :title="`Copy ${field.label.toLowerCase()}`"
              >
                <FontAwesomeIcon 
                  :icon="copiedField === field.label ? 'check' : 'copy'" 
                  class="w-3 h-3"
                  :class="copiedField === field.label ? 'text-green-500' : ''"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Business Information Section -->
        <div v-if="fieldsByCategory.business.length > 0" class="mb-4">
          <div class="flex items-center mb-1.5">
            <FontAwesomeIcon icon="briefcase" class="w-4 h-4 text-purple-500 mr-2" />
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Business Information</h4>
          </div>
          <div class="space-y-2 ml-6">
            <div
              v-for="field in fieldsByCategory.business"
              :key="field.label"
              class="group flex items-start justify-between p-0 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              <div class="flex items-start min-w-0 flex-1">
                <FontAwesomeIcon 
                  :icon="field.icon" 
                  class="text-gray-400 flex-shrink-0 w-4 h-4 mr-3"
                  :class="field.multiline ? 'mt-0.5' : ''"
                />
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{{ field.label }}</div>
                  <span 
                    class="text-gray-700 dark:text-gray-300 font-medium"
                    :class="field.multiline ? 'break-words' : 'break-all'"
                  >
                    {{ field.value }}
                  </span>
                </div>
              </div>
              
              <button 
                v-if="field.copyable"
                @click="handleCopy(field.value, field.label)"
                class="ml-3 p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                :title="`Copy ${field.label.toLowerCase()}`"
              >
                <FontAwesomeIcon 
                  :icon="copiedField === field.label ? 'check' : 'copy'" 
                  class="w-3 h-3"
                  :class="copiedField === field.label ? 'text-green-500' : ''"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Referral Information -->
        <div v-if="hasReferralInfo" class="mb-4">
          <div class="flex items-center mb-1.5">
            <FontAwesomeIcon icon="users" class="w-4 h-4 text-orange-500 mr-2" />
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Referral Network</h4>
          </div>
          <div class="space-y-3 ml-6">
            <div v-if="customer.referredBy" class="flex items-center p-0 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <FontAwesomeIcon icon="user-arrow-up" class="w-4 h-4 text-orange-500 mr-3" />
              <div>
                <div class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Referred By</div>
                <span class="text-gray-700 dark:text-gray-300 font-medium">{{ customer.referredBy.name || 'N/A' }}</span>
              </div>
            </div>
            
            <div v-if="customer.referrals && customer.referrals.length > 0" class="p-0 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div class="flex items-center mb-2">
                <FontAwesomeIcon icon="user-arrow-down" class="w-4 h-4 text-green-500 mr-2" />
                <div class="text-xs text-green-600 dark:text-green-400">Referred Clients ({{ customer.referrals.length }})</div>
              </div>
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="referral in customer.referrals" 
                  :key="referral.id"
                  class="inline-block text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700"
                >
                  {{ referral.name || 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferred Technician -->
        <div class="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-700/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center min-w-0 flex-1">
              <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md mr-3">
                <FontAwesomeIcon icon="user-cog" class="text-white text-sm" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs text-indigo-600 dark:text-indigo-400 mb-0.5">Preferred Technician</div>
                <div class="font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {{ customer.preferredTechnician?.name || 'Not assigned' }}
                </div>
              </div>
            </div>
            <button 
              @click="emit('edit-preferred-technician')" 
              class="group flex items-center justify-center w-8 h-8 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-400 hover:text-indigo-500 transition-all duration-200 hover:shadow-md flex-shrink-0 ml-3"
              aria-label="Edit preferred technician"
            >
              <FontAwesomeIcon icon="edit" class="text-sm group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Edit Mode Form -->
    <form v-else @submit.prevent="emit('update-customer')" class="relative z-10 space-y-4">
      <!-- Customer Name -->
      <div class="relative">
        <label for="edit-name" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <FontAwesomeIcon icon="user" class="w-3 h-3 mr-1.5 text-indigo-500" />
          Customer Name
        </label>
        <input 
          type="text" 
          id="edit-name" 
          v-model="editableCustomer.name" 
          required 
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          placeholder="Enter customer name"
        />
      </div>
      
      <!-- AI Suggestions Enhanced Section -->
      <div 
        v-if="showAISuggestions && Object.keys(aiSuggestedFields).length > 0" 
        class="relative overflow-hidden p-3 border border-purple-300/50 dark:border-purple-700/50 rounded-lg bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20"
      >
        <!-- Background decoration -->
        <div class="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-xl"></div>
        
        <div class="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0 mb-1.5">
          <h4 class="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center">
            <div class="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center mr-1.5">
              <FontAwesomeIcon icon="magic" class="text-white text-xs" />
            </div>
            AI Suggested Improvements
            <span class="ml-1.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
              {{ Object.keys(aiSuggestedFields).length }}
            </span>
          </h4>
          <button 
            type="button" 
            @click="emit('apply-all-ai-suggestions')" 
            class="group flex items-center text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 self-start sm:self-auto"
          >
            <FontAwesomeIcon icon="check-double" class="mr-1.5 group-hover:scale-110 transition-transform" />
            Apply All
          </button>
        </div>
        
        <div class="relative space-y-2">
          <div 
            v-for="(value, field) in aiSuggestedFields" 
            :key="field" 
            class="group flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0 p-0.5 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center mb-1">
                <span class="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{{ field }}</span>
              </div>
              <div class="text-xs text-gray-700 dark:text-gray-300 break-words bg-gray-50 dark:bg-gray-900/50 p-0 rounded">
                {{ value }}
              </div>
            </div>
            <button 
              type="button"
              @click="emit('apply-ai-suggestion', field)"
              class="group flex items-center text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 px-2.5 py-1 rounded-md transition-all duration-200 hover:shadow-sm self-start sm:self-auto"
            >
              <FontAwesomeIcon icon="plus" class="mr-1 group-hover:scale-110 transition-transform" />
              Apply
            </button>
          </div>
        </div>
      </div>
      
      <!-- Contact Information Section -->
      <div class="space-y-3">
        <div class="flex items-center border-b border-gray-200 dark:border-gray-700 pb-1.5">
          <FontAwesomeIcon icon="address-book" class="w-3 h-3 text-blue-500 mr-1.5" />
          <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300">Contact Information</h3>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div class="relative">
            <label for="edit-phone" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FontAwesomeIcon icon="phone" class="w-3 h-3 mr-1.5 text-green-500" />
              Phone Number
            </label>
            <input 
              type="tel" 
              id="edit-phone" 
              v-model="editableCustomer.phone" 
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              placeholder="(555) 123-4567"
            />
          </div>
          <div class="relative">
            <label for="edit-email" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FontAwesomeIcon icon="envelope" class="w-3 h-3 mr-1.5 text-blue-500" />
              Email Address
            </label>
            <input 
              type="email" 
              id="edit-email" 
              v-model="editableCustomer.email" 
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="customer@example.com"
            />
          </div>
        </div>
      </div>
      
      <!-- Location Information Section -->
      <div class="space-y-3">
        <div class="flex items-center border-b border-gray-200 dark:border-gray-700 pb-1.5">
          <FontAwesomeIcon icon="map-marker-alt" class="w-3 h-3 text-green-500 mr-1.5" />
          <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300">Location Information</h3>
        </div>
        
        <div class="relative">
          <label for="edit-address" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <FontAwesomeIcon icon="home" class="w-3 h-3 mr-1.5 text-green-500" />
            Service Address
          </label>
          <textarea 
            id="edit-address" 
            v-model="editableCustomer.address" 
            rows="2" 
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
            placeholder="123 Main Street, City, State 12345"
          ></textarea>
        </div>
      </div>
      
      <!-- Business Information Section -->
      <div class="space-y-3">
        <div class="flex items-center border-b border-gray-200 dark:border-gray-700 pb-1.5">
          <FontAwesomeIcon icon="briefcase" class="w-3 h-3 text-purple-500 mr-1.5" />
          <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300">Business Information</h3>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="relative">
            <label for="edit-channel" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FontAwesomeIcon icon="share-alt" class="w-3 h-3 mr-1.5 text-purple-500" />
              Marketing Channel
            </label>
            <select 
              id="edit-channel" 
              v-model="editableCustomer.channel" 
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 appearance-none bg-no-repeat bg-right"
              style="background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22><path fill=%22%236b7280%22 d=%22M2 0L0 2h4zm0 5L0 3h4z%22/></svg>'); background-position: right 10px center; background-size: 10px;"
            >
              <option value="" disabled>Select marketing channel</option>
              <option value="Reply me by Email">Reply me by Email</option>
              <option value="Send me a message on Whatsapp">Send me a message on Whatsapp</option>
              <option value="Use any of the above">Use any of the above</option>
            </select>
          </div>
          <div class="relative">
            <label for="edit-portal" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FontAwesomeIcon icon="building" class="w-3 h-3 mr-1.5 text-purple-500" />
              Portal/Platform
            </label>
            <input 
              type="text" 
              id="edit-portal" 
              v-model="editableCustomer.portal" 
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="Angie's List, HomeAdvisor, etc."
            />
          </div>
        </div>
        
        <div class="relative">
          <label for="edit-message" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <FontAwesomeIcon icon="comment-alt" class="w-3 h-3 mr-1.5 text-purple-500" />
            Lead Details / Notes
          </label>
          <textarea 
            id="edit-message" 
            v-model="editableCustomer.message" 
            rows="2" 
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
            placeholder="Additional details about the lead or customer requirements..."
          ></textarea>
        </div>
        
        <div class="relative">
          <label for="edit-foreignID" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <FontAwesomeIcon icon="link" class="w-3 h-3 mr-1.5 text-purple-500" />
            External Reference ID
          </label>
          <input 
            type="text" 
            id="edit-foreignID" 
            v-model="editableCustomer.foreignID" 
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            placeholder="External system ID or reference"
          />
        </div>
      </div>
      
      <!-- Enhanced Action Buttons -->
      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          type="button" 
          @click="emit('generate-ai-suggestions')" 
          class="group flex items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 order-2 sm:order-1"
          :disabled="isGeneratingAISuggestions"
        >
          <FontAwesomeIcon 
            icon="magic" 
            class="mr-1.5 group-hover:scale-110 transition-transform" 
            :class="{ 'fa-spin': isGeneratingAISuggestions }" 
          />
          <span class="font-medium">
            {{ isGeneratingAISuggestions ? 'Generating...' : 'Get AI Suggestions' }}
          </span>
        </button>
        
        <div class="flex gap-0 order-1 sm:order-2">
          <button 
            type="button" 
            @click="emit('cancel-edit')" 
            class="flex items-center justify-center px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 hover:shadow-md flex-1 sm:flex-none"
          >
            <FontAwesomeIcon icon="times" class="mr-1.5" />
            <span class="font-medium">Cancel</span>
          </button>
          <button 
            type="submit" 
            class="group flex items-center justify-center ml-2 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 flex-1 sm:flex-none" 
            :disabled="isUpdating"
          >
            <FontAwesomeIcon 
              icon="save" 
              class="mr-1.5 group-hover:scale-110 transition-transform"
              :class="{ 'fa-spin': isUpdating }"
            />
            <span class="font-medium">
              {{ isUpdating ? 'Saving...' : 'Save Changes' }}
            </span>
          </button>
        </div>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* Enhanced focus states with better accessibility */
input:focus,
textarea:focus,
select:focus {
  @apply ring-2 ring-opacity-50 border-transparent outline-none;
}

/* Smooth transitions for all interactive elements */
* {
  @apply transition-colors duration-200;
}

/* Enhanced hover states for better UX */
.group:hover .opacity-0 {
  @apply opacity-100;
}

/* Custom scrollbar for better mobile experience */
textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded-full;
}

textarea::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500;
}

/* Progress bar animation */
@keyframes progressGrow {
  from {
    width: 0%;
  }
}

.progress-bar {
  animation: progressGrow 1s ease-out;
}

/* Copy button success animation */
@keyframes checkmark {
  0% {
    transform: scale(0) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.fa-check {
  animation: checkmark 0.3s ease-out;
}

/* Enhanced button focus states */
button:focus-visible {
  @apply ring-2 ring-offset-2 ring-indigo-500 ring-opacity-50 outline-none;
}

/* Responsive improvements */
@media (max-width: 640px) {
  .section {
    @apply shadow-md;
  }
  
  /* Ensure text doesn't overflow on small screens */
  .break-all {
    word-break: break-word;
  }
}

/* Enhanced dark mode support */
@media (prefers-color-scheme: dark) {
  .glass-effect {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Custom gradient animations */
@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.gradient-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

/* Loading state improvements */
.loading-state {
  @apply opacity-50 pointer-events-none;
}

/* Enhanced section transitions */
.section-enter-active,
.section-leave-active {
  transition: all 0.3s ease;
}

.section-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.section-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Enhanced button groups */
.button-group {
  @apply flex gap-0;
}

.button-group button {
  @apply flex-1 sm:flex-none;
}

/* Improved mobile typography */
@media (max-width: 640px) {
  .mobile-text-sm {
    @apply text-xs;
  }
  
  .mobile-text-base {
    @apply text-sm;
  }
}

/* Enhanced card styling */
section:hover {
  @apply transform translate-y-[-1px];
}

/* Custom select dropdown styling */
select {
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%236b7280" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 10px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* Dark mode select arrow */
@media (prefers-color-scheme: dark) {
  select {
    background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%239ca3af" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
  }
}
</style>