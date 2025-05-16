<!-- wibiclick-frontend-vue/src/components/estimates/LineItemParserModal.vue -->
<script setup>
import { ref, reactive } from 'vue';
import { useToast } from 'vue-toast-notification';
import axios from 'axios';
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  customerId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'line-items-parsed']);

const toast = useToast();
const userStore = useUserStore();

const rawLineItems = ref('');
const isProcessing = ref(false);
const processingError = ref('');

const closeModal = () => {
  emit('update:modelValue', false);
};

const parseLineItems = async () => {
  if (!rawLineItems.value.trim()) {
    toast.warning('Please paste some text to parse into line items');
    return;
  }

  isProcessing.value = true;
  processingError.value = '';

  try {
    // Send the raw text to the backend AI parser
    const response = await axios.post(`parse-line-items?id=${userStore.currentWebsite}`, {
      customerId: props.customerId,
      rawText: rawLineItems.value
    });

    // Check if we received parsed line items
    if (response.data && response.data.lineItems && response.data.lineItems.length > 0) {
      // Format the line items to match the structure expected by the estimate form
      const formattedLineItems = response.data.lineItems.map(item => ({
        item: item.name || item.item,
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 1,
        amount: parseFloat(item.amount) || 0,
        id: Date.now() + Math.random() // Generate a temporary id
      }));

      // Emit the formatted line items
      emit('line-items-parsed', formattedLineItems);
      toast.success(`Successfully parsed ${formattedLineItems.length} line item(s)`);
      
      // Close the modal
      closeModal();
      
      // Clear the input for next use
      rawLineItems.value = '';
    } else {
      throw new Error('No valid line items were extracted from the text');
    }
  } catch (error) {
    console.error('Error parsing line items:', error);
    processingError.value = error.response?.data?.message || error.message || 'Failed to parse line items';
    toast.error(processingError.value);
  } finally {
    isProcessing.value = false;
  }
};

const clearText = () => {
  rawLineItems.value = '';
  processingError.value = '';
};

// Example format to show users what to expect
const exampleFormat = `Item: Office Chair
Description: Ergonomic design with adjustable height
Quantity: 2
Price: 149.99

Item: Desk Lamp
Description: LED desk lamp with adjustable brightness
Quantity: 3
Price: 39.95`;
</script>

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="fixed z-40 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <!-- Modal positioning -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <!-- Modal panel -->
        <div class="modal-content-modern">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
              Parse Line Items with AI
            </h3>
            <button 
              @click="closeModal" 
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Paste your line items in any format. Our AI will try to extract the items, quantities, and prices. 
          </p>

          <!-- <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
            <p class="text-xs text-yellow-800 dark:text-yellow-300 font-medium mb-1">Example Format (but any format works):</p>
            <pre class="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">{{ exampleFormat }}</pre>
          </div> -->

          <div class="space-y-4">
            <div>
              <textarea
                v-model="rawLineItems"
                rows="10"
                class="input-modern font-mono text-sm"
                placeholder="Paste your line items here in any format..."
              ></textarea>
            </div>

            <div v-if="processingError" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
              <p class="font-medium">Error:</p>
              <p>{{ processingError }}</p>
            </div>

            <div class="flex justify-between space-x-3">
              <button 
                @click="clearText" 
                type="button" 
                class="btn-secondary-modern"
              >
                Clear
              </button>
              <div class="space-x-3">
                <button 
                  @click="closeModal" 
                  type="button" 
                  class="btn-secondary-modern"
                >
                  Cancel
                </button>
                <button 
                  @click="parseLineItems" 
                  type="button"
                  class="btn-primary-modern"
                  :disabled="isProcessing || !rawLineItems.trim()"
                >
                  <svg v-if="isProcessing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isProcessing ? 'Processing...' : 'Parse Line Items' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Re-use styles from your global components */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.modal-content-modern {
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content-modern,
.modal-fade-leave-active .modal-content-modern {
  transition: all 0.3s ease;
}
.modal-fade-enter-from .modal-content-modern,
.modal-fade-leave-to .modal-content-modern {
   transform: translateY(20px) scale(0.98);
   opacity: 0;
}
</style>