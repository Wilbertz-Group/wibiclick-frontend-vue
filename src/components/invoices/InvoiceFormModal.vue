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
  invoiceData: { // For editing existing invoice
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'invoice-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false);
const profile = ref(null);

// --- Form State ---
const invoiceForm = reactive({
  id: '', // Will be empty for new invoices
  customerId: '',
  name: 'Invoice',
  status: 'sent',
  invoice_nr: 1,
  invoice_date: moment().format('YYYY-MM-DD'),
  invoice_due_date: moment().add(7, 'days').format('YYYY-MM-DD'),
  subtotal: 0,
  paid: 0,
  notes: '',
  items: [],
  customer: {
    id: '',
    name: '',
    address: '',
    phone: '',
    vat: '',
  },
  company: {
    name: '',
    email: '',
    slogan: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    currency_symbol: '',
  },
  banking: {
    account_name: '',
    bank: '',
    account_number: '',
    account_type: '',
    branch_code: '',
  },
});

const lineItem = reactive({
  name: '',
  description: '',
  amount: 0,
  quantity: 1,
  id: null, // For tracking if we're editing an existing item
});

const isEditingLineItem = computed(() => lineItem.id !== null);

const INVOICE_STATUSES = ['sent', 'pending', 'processing', 'paid', 'accepted'];

const isEditing = computed(() => !!invoiceForm.id);
const lineItemTotal = computed(() => (Number(lineItem.amount) * Number(lineItem.quantity)).toFixed(2));

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetInvoiceForm = () => {
  Object.assign(invoiceForm, {
    id: '',
    customerId: '',
    name: 'Invoice',
    status: 'sent',
    invoice_nr: 1,
    invoice_date: moment().format('YYYY-MM-DD'),
    invoice_due_date: moment().add(7, 'days').format('YYYY-MM-DD'),
    subtotal: 0,
    paid: 0,
    notes: '',
    items: [],
    customer: {
      id: '',
      name: '',
      address: '',
      phone: '',
      vat: '',
    },
    company: {
      name: '',
      email: '',
      slogan: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      currency_symbol: '',
    },
    banking: {
      account_name: '',
      bank: '',
      account_number: '',
      account_type: '',
      branch_code: '',
    },
  });
  
  resetLineItemForm();
};

const resetLineItemForm = () => {
  Object.assign(lineItem, {
    name: '',
    description: '',
    amount: 1,
    quantity: 1,
    id: null,
  });
};

const prefillForm = async (customer) => {
  resetInvoiceForm();
  
  // Fetch profile data if not already loaded
  if (!profile.value) {
    await fetchProfile();
  }
  
  // Fetch invoice number
  let invoice_number = 0;
  try {
    loading.value = true;
    const response = await axios.get('invoice_number?id=' + userStore.currentWebsite);
    invoice_number = response.data.invoice_number;
    loading.value = false;
  } catch (error) {
    console.error("Failed to get invoice number", error);
    toast.warning("Failed to get invoice number");
    loading.value = false;
  }
  
  if (customer && customer.id) {
    invoiceForm.customer.id = customer.id;
    invoiceForm.customer.name = customer.name || '';
    invoiceForm.customer.phone = customer.phone || '';
    invoiceForm.customer.address = customer.address || '';
    invoiceForm.customerId = customer.id;
    
    // Set company and banking details from profile
    if (profile.value) {
      invoiceForm.company = profile.value.company || invoiceForm.company;
      invoiceForm.banking = profile.value.banking || invoiceForm.banking;
    }
    
    // Set invoice number
    invoiceForm.invoice_nr = invoice_number + 1;
  }
  
  // If editing, populate with existing invoice data
  if (props.invoiceData) {
    Object.assign(invoiceForm, {
      id: props.invoiceData.id,
      customerId: props.invoiceData.customerId,
      name: props.invoiceData.name || 'Invoice',
      status: props.invoiceData.reason || 'sent',
      invoice_nr: props.invoiceData.number || (invoice_number + 1),
      invoice_date: props.invoiceData.issuedAt ? moment(props.invoiceData.issuedAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      invoice_due_date: props.invoiceData.dueAt ? moment(props.invoiceData.dueAt).format('YYYY-MM-DD') : moment().add(7, 'days').format('YYYY-MM-DD'),
      subtotal: props.invoiceData.subtotal || props.invoiceData.sales || 0,
      paid: props.invoiceData.paid || 0,
      notes: props.invoiceData.notes || '',
      items: props.invoiceData.lineItem || [],
    });
  }
};

const fetchProfile = async () => {
  try {
    loading.value = true;
    const response = await axios.get('profile?id=' + userStore.currentWebsite);
    profile.value = response.data;
    loading.value = false;
  } catch (error) {
    console.error("Failed to get profile data", error);
    toast.warning("Failed to get profile data");
    loading.value = false;
  }
};

const editItem = (item, index) => {
  // Set the line item form with the selected item's values
  lineItem.name = item.item || item.name;
  lineItem.description = item.description || '';
  lineItem.amount = item.amount;
  lineItem.quantity = item.quantity;
  lineItem.id = item.id || Date.now(); // Use existing ID or create one
  lineItem.index = index; // Store the index for updating
};

const addItem = () => {
  if (lineItem.name && lineItem.amount && lineItem.quantity && lineItemTotal.value) {
    if (isEditingLineItem.value) {
      // Update existing item
      const index = lineItem.index;
      invoiceForm.items[index] = {
        item: lineItem.name,
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity),
        amount: parseFloat(lineItem.amount),
        id: lineItem.id
      };
    } else {
      // Add new item
      invoiceForm.items.push({
        item: lineItem.name,
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity),
        amount: parseFloat(lineItem.amount),
        id: Date.now() // Add unique ID for item management
      });
    }

    // Reset line item form
    resetLineItemForm();

    // Recalculate total
    getSum(invoiceForm.items);
  }
};

const cancelEdit = () => {
  resetLineItemForm();
};

const removeItem = (index) => {
  invoiceForm.items.splice(index, 1);
  getSum(invoiceForm.items);
};

const getSum = (array) => {
  if (array.length) {
    let values = array.map(item => item.quantity * item.amount);
    let total = values.reduce((a, b) => a + b, 0);
    invoiceForm.subtotal = total;
    return total;
  } else {
    invoiceForm.subtotal = 0;
    return 0;
  }
};

const submitInvoice = async () => {
  loading.value = true;
  try {
    const payload = {
      reason: invoiceForm.status,
      name: invoiceForm.name,
      number: invoiceForm.invoice_nr,
      issuedAt: moment(invoiceForm.invoice_date).toISOString(),
      dueAt: moment(invoiceForm.invoice_due_date).toISOString(),
      sales: invoiceForm.subtotal,
      subtotal: invoiceForm.subtotal,
      paid: parseFloat(invoiceForm.paid) || 0, // Add paid field
      notes: invoiceForm.notes,
      customerId: invoiceForm.customer.id || invoiceForm.customerId,
      items: invoiceForm.items.map(item => ({
        item: item.item || item.name,
        description: item.description,
        quantity: parseFloat(item.quantity),
        amount: parseFloat(item.amount)
      }))
    };

    // If editing, include the ID
    if (isEditing.value) {
      payload.id = invoiceForm.id;
    }

    const response = await axios.post('add-invoice?id=' + userStore.currentWebsite, payload);
    toast.success(response.data.message || 'Invoice saved successfully');
    emit('invoice-saved');
    closeModal();
  } catch (error) {
    console.error("Error submitting invoice:", error);
    toast.error(`Error submitting invoice: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form with customer data
    prefillForm(props.customerData);
  }
});

// --- Lifecycle ---
onMounted(() => {
  // Fetch profile data initially
  fetchProfile();
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
            {{ isEditing ? 'Edit Invoice' : 'Add New Invoice' }}
            <span v-if="!isEditing && customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <form @submit.prevent="submitInvoice" class="space-y-4">
            <div class="max-h-[60vh] overflow-y-auto pr-2">
              <!-- Invoice Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Invoice Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="invoice-name" class="label-modern">Invoice Title</label>
                    <input type="text" id="invoice-name" v-model="invoiceForm.name" required class="input-modern" />
                  </div>
                  <div>
                    <label for="invoice-status" class="label-modern">Status</label>
                    <select id="invoice-status" v-model="invoiceForm.status" required class="input-modern input-modern--select">
                      <option v-for="status in INVOICE_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                  <div>
                    <label for="invoice-number" class="label-modern">Invoice #</label>
                    <input type="number" id="invoice-number" v-model="invoiceForm.invoice_nr" required class="input-modern" />
                  </div>
                  <div>
                    <label for="invoice-date" class="label-modern">Invoice Date</label>
                    <input type="date" id="invoice-date" v-model="invoiceForm.invoice_date" required class="input-modern" />
                  </div>
                  <div>
                    <label for="invoice-due-date" class="label-modern">Due Date</label>
                    <input type="date" id="invoice-due-date" v-model="invoiceForm.invoice_due_date" required class="input-modern" />
                  </div>
                </div>
              </div>

              <!-- Customer Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Customer Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="customer-name" class="label-modern">Name</label>
                    <input type="text" id="customer-name" v-model="invoiceForm.customer.name" required class="input-modern" />
                  </div>
                  <div>
                    <label for="customer-phone" class="label-modern">Phone</label>
                    <input type="tel" id="customer-phone" v-model="invoiceForm.customer.phone" required class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="customer-address" class="label-modern">Address</label>
                    <textarea id="customer-address" v-model="invoiceForm.customer.address" rows="2" class="input-modern"></textarea>
                  </div>
                  <div>
                    <label for="customer-vat" class="label-modern">VAT (Optional)</label>
                    <input type="text" id="customer-vat" v-model="invoiceForm.customer.vat" class="input-modern" />
                  </div>
                </div>
              </div>

              <!-- Line Items Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Line Items</h4>
                
                <!-- Line Items Table -->
                <div class="overflow-x-auto mb-4">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                      <tr v-if="invoiceForm.items.length === 0">
                        <td colspan="5" class="px-3 py-3 text-sm text-center text-gray-500 dark:text-gray-400">No items added yet</td>
                      </tr>
                      <tr v-for="(item, index) in invoiceForm.items" :key="item.id || index" class="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td class="px-3 py-2 text-sm">
                          <div class="font-medium text-gray-900 dark:text-white">{{ item.item || item.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</div>
                        </td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ item.quantity }}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ item.amount }}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ (item.quantity * item.amount).toFixed(2) }}</td>
                        <td class="px-3 py-2 text-sm">
                          <div class="flex space-x-2">
                            <button type="button" @click="editItem(item, index)" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button type="button" @click="removeItem(index)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Add Line Item Form -->
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div class="sm:col-span-5">
                    <label for="item-name" class="label-modern">Item Name</label>
                    <input type="text" id="item-name" v-model="lineItem.name" class="input-modern" placeholder="Enter item name" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="item-quantity" class="label-modern">Quantity</label>
                    <input type="number" id="item-quantity" v-model="lineItem.quantity" min="1" class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="item-price" class="label-modern">Price</label>
                    <input type="number" id="item-price" v-model="lineItem.amount" min="0" step="0.01" class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="item-total" class="label-modern">Total</label>
                    <input type="text" id="item-total" :value="lineItemTotal" readonly class="input-modern bg-gray-100 dark:bg-gray-700" />
                  </div>
                  <div class="sm:col-span-1 flex items-end">
                    <div v-if="isEditingLineItem" class="flex flex-col space-y-2 w-full">
                      <button type="button" @click="addItem" class="btn-primary-modern w-full h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button type="button" @click="cancelEdit" class="btn-secondary-modern w-full h-10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <button v-else type="button" @click="addItem" class="btn-primary-modern w-full h-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div class="sm:col-span-12">
                    <label for="item-description" class="label-modern">Description (Optional)</label>
                    <textarea id="item-description" v-model="lineItem.description" rows="2" class="input-modern" placeholder="Enter item description"></textarea>
                  </div>
                </div>
              </div>

              <!-- Totals Section -->
              <div class="mb-6">
                <div class="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
                  <span class="text-sm text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ Number(invoiceForm.subtotal).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                  <label for="invoice-paid" class="text-sm font-medium text-gray-700 dark:text-gray-300">Paid to Date</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">{{ invoiceForm.company.currency_symbol || 'R' }}</span>
                    <input type="number" id="invoice-paid" v-model="invoiceForm.paid" min="0" step="0.01" class="input-modern w-32 pl-7 pr-2 py-1 text-right" />
                  </div>
                </div>
                <div class="flex justify-between py-2 border-t border-b border-gray-200 dark:border-gray-700">
                  <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Balance Due</span>
                  <span class="text-sm font-bold text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ Math.max(0, Number(invoiceForm.subtotal) - Number(invoiceForm.paid)).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Notes Section -->
              <div>
                <label for="invoice-notes" class="label-modern">Notes (Optional)</label>
                <textarea id="invoice-notes" v-model="invoiceForm.notes" rows="3" class="input-modern" placeholder="Add any additional notes here"></textarea>
              </div>
            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <button type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                {{ loading ? 'Saving...' : (isEditing ? 'Update Invoice' : 'Add Invoice') }}
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
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:w-full p-6 sm:p-8;
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