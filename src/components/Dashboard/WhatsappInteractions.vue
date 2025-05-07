<!-- wibiclick-frontend-vue/src/components/Dashboard/WhatsappInteractions.vue -->
<script setup>
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
  interactions: {
    type: Array,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view-chat', 'send-message'])

// Filter options
const searchTerm = ref('')
const filterType = ref('all') // 'all', 'incoming', 'outgoing'

// Format relative time
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch (e) {
    return 'N/A'
  }
}

// Filtered interactions
const filteredInteractions = computed(() => {
  if (!props.interactions) return []
  
  return props.interactions.filter(interaction => {
    // Apply text search
    const searchMatches = !searchTerm.value || 
      (interaction.text && interaction.text.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (interaction.customer?.name && interaction.customer.name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (interaction.remoteJid && interaction.remoteJid.toLowerCase().includes(searchTerm.value.toLowerCase()))
    
    // Apply message type filter
    const typeMatches = filterType.value === 'all' || 
      (filterType.value === 'incoming' && !interaction.fromMe) ||
      (filterType.value === 'outgoing' && interaction.fromMe)
    
    return searchMatches && typeMatches
  })
})

// Group interactions by customer
const interactionsByCustomer = computed(() => {
  if (!filteredInteractions.value.length) return []
  
  const groups = {}
  
  // Group by customer ID or remote JID if no customer
  filteredInteractions.value.forEach(interaction => {
    const key = interaction.customer?.id || interaction.remoteJid
    if (!groups[key]) {
      groups[key] = {
        customer: interaction.customer,
        remoteJid: interaction.remoteJid,
        interactions: [],
        latestTimestamp: 0
      }
    }
    
    groups[key].interactions.push(interaction)
    
    // Track latest timestamp for sorting
    const timestamp = new Date(interaction.createdAt).getTime()
    if (timestamp > groups[key].latestTimestamp) {
      groups[key].latestTimestamp = timestamp
    }
  })
  
  // Convert to array and sort by latest timestamp
  return Object.values(groups).sort((a, b) => b.latestTimestamp - a.latestTimestamp)
})

// Get customer name or phone
const getDisplayName = (customer, remoteJid) => {
  if (customer?.name) return customer.name
  
  // Format phone number if it's just the remote JID
  if (remoteJid) {
    // Simple formatting - in a real app, you'd use a proper phone formatter
    return remoteJid.replace(/^\d+/, match => {
      // Add spaces to make phone number more readable
      return match.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    })
  }
  
  return 'Unknown'
}

// Handle view chat click
const viewChat = (customerOrJid) => {
  emit('view-chat', customerOrJid)
}

// Handle send message click
const sendMessage = (customerOrJid) => {
  emit('send-message', customerOrJid)
}

// Truncate text to a maximum length
const truncateText = (text, maxLength = 60) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<template>
  <section class="card-modern p-5 sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">WhatsApp Interactions</h2>
      
      <!-- Filter controls -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0 w-full sm:w-auto">
        <!-- Search box -->
        <div class="relative flex-grow max-w-xs">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search interactions..."
            class="input-modern w-full pr-8 text-sm"
          />
          <button 
            v-if="searchTerm" 
            @click="searchTerm = ''" 
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
          >
            <font-awesome-icon icon="times" />
          </button>
          <font-awesome-icon 
            v-else 
            icon="search" 
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
        
        <!-- Message type filter -->
        <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
          <button 
            @click="filterType = 'all'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              filterType === 'all' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
          >
            All
          </button>
          <button 
            @click="filterType = 'incoming'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              filterType === 'incoming' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
          >
            Incoming
          </button>
          <button 
            @click="filterType = 'outgoing'"
            :class="[
              'px-2 py-1 text-xs font-medium rounded-md transition-colors',
              filterType === 'outgoing' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'
            ]"
          >
            Outgoing
          </button>
        </div>
      </div>
    </div>
    
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- Total Interactions -->
      <div class="bg-white dark:bg-gray-800/70 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Interactions</h3>
        <p class="text-xl font-bold mt-1 text-gray-900 dark:text-white">
          {{ interactions.length }}
        </p>
      </div>
      
      <!-- Incoming Messages -->
      <div class="bg-white dark:bg-gray-800/70 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Incoming Messages</h3>
        <p class="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
          {{ interactions.filter(i => !i.fromMe).length }}
        </p>
      </div>
      
      <!-- Outgoing Messages -->
      <div class="bg-white dark:bg-gray-800/70 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 text-center">
        <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400">Outgoing Messages</h3>
        <p class="text-xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
          {{ interactions.filter(i => i.fromMe).length }}
        </p>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="filteredInteractions.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <font-awesome-icon :icon="['fab', 'whatsapp']" class="text-5xl mb-3 opacity-30" />
      <p v-if="interactions.length === 0">No WhatsApp interactions found.</p>
      <p v-else>No interactions match your search or filter criteria.</p>
    </div>
    
    <!-- Interactions List (Grouped by Customer) -->
    <div v-else class="space-y-4 max-h-96 overflow-y-auto pr-2">
      <div 
        v-for="group in interactionsByCustomer" 
        :key="group.customer?.id || group.remoteJid"
        class="bg-white dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50"
      >
        <!-- Customer header -->
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 overflow-hidden">
              <font-awesome-icon icon="user" class="text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ getDisplayName(group.customer, group.remoteJid) }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ group.interactions.length }} message{{ group.interactions.length > 1 ? 's' : '' }}
              </p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex space-x-2">
            <button 
              @click="viewChat(group.customer || { remoteJid: group.remoteJid })"
              class="btn-ghost-modern text-xs py-1 px-2"
              title="View complete chat history"
            >
              <font-awesome-icon icon="comment" class="mr-1" />
              View Chat
            </button>
            <button 
              @click="sendMessage(group.customer || { remoteJid: group.remoteJid })"
              class="btn-secondary-modern text-xs py-1 px-2"
              title="Send new message"
            >
              <font-awesome-icon icon="paper-plane" class="mr-1" />
              Message
            </button>
          </div>
        </div>
        
        <!-- Recent messages preview -->
        <div class="space-y-2 mt-3">
          <div 
            v-for="(interaction, idx) in group.interactions.slice(0, 3)" 
            :key="idx"
            :class="[
              'p-2 rounded-lg text-sm',
              interaction.fromMe 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 ml-6' 
                : 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 mr-6'
            ]"
          >
            <div class="flex justify-between items-baseline mb-1">
              <span class="text-xs font-medium" :class="interaction.fromMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-green-700 dark:text-green-300'">
                {{ interaction.fromMe ? 'Sent' : 'Received' }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-500">
                {{ formatRelativeTime(interaction.createdAt) }}
              </span>
            </div>
            <p :class="interaction.fromMe ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-200'">
              {{ truncateText(interaction.text) }}
            </p>
          </div>
          
          <!-- Show more messages indicator if there are more than 3 -->
          <div 
            v-if="group.interactions.length > 3" 
            class="text-center text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium cursor-pointer"
            @click="viewChat(group.customer || { remoteJid: group.remoteJid })"
          >
            + {{ group.interactions.length - 3 }} more message{{ group.interactions.length - 3 > 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>