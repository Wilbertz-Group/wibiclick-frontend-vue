<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // Pre-fill data
    type: Object,
    default: () => ({}),
  },
  paymentData: { // For editing existing payment
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'payment-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false);

// --- Form State ---
const paymentForm = reactive({
  id: '', // Will be empty for new payments
  customerId: '',
  amount: 0,
  payment_date: moment().format('YYYY-MM-DD'),
  type: 'card', // Default payment type
  status: 'successful', // Default status
  notes: '',
});

const PAYMENT_TYPES = ['card', 'eft', 'cash', 'other'];
const PAYMENT_STATUSES = ['successful', 'pending', 'failed'];

const isEditing = computed(() => !!paymentForm.id);

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetPaymentForm = () => {
  Object.assign(paymentForm, {
    id: '',
    customerId: '',
    amount: 0,
    payment_date: moment().format('YYYY-MM-DD'),
    type: 'card',
    status: 'successful',
    notes: '',
  });
};

const prefillForm = (customer) => {
  resetPaymentForm();

  if (customer && customer.id) {
    paymentForm.customerId = customer.id;
  }

  // If editing, populate with existing payment data
  if (props.paymentData) {
    Object.assign(paymentForm, {
      id: props.paymentData.id,
      customerId: props.paymentData.customerId,
      amount: (props.paymentData.amountInCents / 100) || 0, // Convert cents to currency unit
      payment_date: props.paymentData.createdAt ? moment(props.paymentData.createdAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      type: props.paymentData.type || 'card',
      status: props.paymentData.status || 'successful',
      notes: props.paymentData.notes || '', // Assuming a notes field might exist
    });
  }
};

const submitPayment = async () => {
  loading.value = true;
  try {
    const payload = {
      amountInCents: Math.round(parseFloat(paymentForm.amount) * 100), // Convert back to cents
      type: paymentForm.type,
      status: paymentForm.status,
      customerId: paymentForm.customerId,
      // Include date if your backend supports it for payments
      // createdAt: moment(paymentForm.payment_date).toISOString(),
      notes: paymentForm.notes,
    };

    // If editing, include the ID
    if (isEditing.value) {
      payload.id = paymentForm.id;
    }

    // Determine the correct endpoint (add or update)
    const endpoint = isEditing.value ? `update-payment?id=${userStore.currentWebsite}` : `add-payment?id=${userStore.currentWebsite}`;
    const method = isEditing.value ? 'put' : 'post'; // Assuming PUT for update, POST for add

    const response = await axios({ method, url: endpoint, data: payload });

    toast.success(response.data.message || 'Payment saved successfully');
    emit('payment-saved');
    closeModal();
  } catch (error) {
    console.error("Error submitting payment:", error);
    toast.error(`Error submitting payment: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form
    prefillForm(props.customerData);
  }
});

</script>

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <!-- Modal positioning -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <!-- Modal panel -->
        <div class="modal-content-modern">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Payment' : 'Add New Payment' }}
            <span v-if="customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitPayment" class="space-y-4">
            <div class="max-h-[60vh] overflow-y-auto pr-2">
              <!-- Payment Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Payment Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="payment-amount" class="label-modern">Amount</label>
                     <div class="relative">
                       <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">R</span>
                       <input type="number" id="payment-amount" v-model="paymentForm.amount" required min="0" step="0.01" class="input-modern pl-7 text-right" />
                     </div>
                  </div>
                   <div>
                    <label for="payment-date" class="label-modern">Payment Date</label>
                    <input type="date" id="payment-date" v-model="paymentForm.payment_date" required class="input-modern" />
                  </div>
                  <div>
                    <label for="payment-type" class="label-modern">Payment Type</label>
                    <select id="payment-type" v-model="paymentForm.type" required class="input-modern input-modern--select">
                      <option v-for="type in PAYMENT_TYPES" :key="type" :value="type">{{ type }}</option>
                    </select>
                  </div>
                  <div>
                    <label for="payment-status" class="label-modern">Status</label>
                    <select id="payment-status" v-model="paymentForm.status" required class="input-modern input-modern--select">
                      <option v-for="status in PAYMENT_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                   <div class="sm:col-span-2">
                    <label for="payment-notes" class="label-modern">Notes (Optional)</label>
                    <textarea id="payment-notes" v-model="paymentForm.notes" rows="3" class="input-modern" placeholder="Add any payment notes here"></textarea>
                  </div>
                </div>
              </div>

            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                {{ loading ? 'Saving...' : (isEditing ? 'Update Payment' : 'Add Payment') }}
              </button>
              <button @click="closeModal" type="button" class="btn-secondary-modern w-full sm:w-auto">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Re-use styles from View.vue or global styles */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat bg-right;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
.label-modern {
  @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
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
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6 sm:p-8; /* Adjusted max-width */
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
/* Custom scrollbar for modal content */
.modal-content-modern .overflow-y-auto::-webkit-scrollbar { width: 6px; height: 6px; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-700/50; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
</style>