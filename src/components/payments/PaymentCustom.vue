<script setup>
import axios from "axios";
import { useToast } from 'vue-toast-notification';
import { watch, ref } from "vue";
import modal from "../misc/modal.vue"; // Keep if status update modal is needed
import { useUserStore } from "@/stores/UserStore"
import { universalDateFormatter } from '../../helpers';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

const emit = defineEmits(['reloadTimeline', 'edit-payment', 'view-payment'])
const props = defineProps(['payment'])
const userStore = useUserStore()
const toast = useToast()

const statuses = [
  { value: "pending", name: "Pending" },
  { value: "successful", name: "Successful" },
  { value: "failed", name: "Failed" },
]

// Status update logic (similar to Payment.vue)
const currentStatus = statuses.find(a => a.value === props.payment.status) || statuses[0]; // Safer default
const selectedStatus = ref(currentStatus)
const body = ref()
const heading = ref()
const isOpen = ref(false) // For status update confirmation modal

function closeModal() {
  isOpen.value = false
  // emit('reloadTimeline') // Maybe not needed if status update is quick
}

watch(selectedStatus, async (n, o) => {
  if (!n || !o || n.value === o.value) return; // Prevent unnecessary updates

  toast.info('Updating payment status...') // Use info for ongoing process
  body.value = `Payment status changed from <b>${o.name}</b> to <b>${n.name}</b>`
  heading.value = "Payment Status Update"

  const data = {
    id: props.payment.id,
    status: n.value,
    customerId: props.payment.customerId,
    // employeeId might not be relevant for status update, check backend requirements
  }

  try {
    // Assuming a dedicated endpoint for status update exists
    const response = await axios.post(`update-payment-status?id=${userStore.currentWebsite}`, data);
    toast.success(response.data.message || 'Payment status updated successfully')
    isOpen.value = true // Show confirmation modal
    emit('reloadTimeline'); // Reload data after successful update
  } catch (error) {
    toast.error('Failed to update payment status. Please try again.')
    // Removed console.error
    selectedStatus.value = o; // Revert status on error
  }
})

// --- Edit/View Handlers ---
function handleEditPayment() {
  emit('edit-payment', props.payment);
}

function handleViewPayment() {
  // View and Edit might use the same modal/handler in this context
  emit('view-payment', props.payment);
}

</script>

<template>
  <!-- Style based on InvoiceCustom.vue -->
  <div class="shadow rounded-xl px-3 pt-3 pb-1 border border-white mt-3 cursor-move w-full bg-white dark:bg-gray-800"> <!-- Adjusted background -->
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
      <div class="flex justify-between mb-2">
        <div class="flex flex-col justify-center">
          <!-- Removed empty <p> tag -->
        </div>
        <div class="relative">
          <!-- Status Dropdown styled like InvoiceCustom -->
          <Listbox v-model="selectedStatus">
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-slate-900 py-1 pl-3 pr-5 min-w-[120px] text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
              >
                <span class="block truncate text-white">{{ selectedStatus?.name }}</span>
                <span
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                >
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </span>
              </ListboxButton>

              <transition
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <ListboxOptions
                  class="absolute z-50 mt-1 max-h-60 w-full rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                >
                  <ListboxOption
                    v-slot="{ active, selected }"
                    v-for="status in statuses"
                    :key="status.name"
                    :value="status"
                    as="template"
                  >
                    <li
                      :class="[
                        active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                        'relative cursor-default select-none pl-10 py-0 pr-2',
                      ]"
                    >
                      <span
                        :class="[
                          selected ? 'font-medium' : 'font-normal',  /* Adjusted font weight */
                          'block truncate',
                        ]"
                        >{{ status.name }}</span
                      >
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                      >
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>
      </div>
      <!-- Data display styled like InvoiceCustom -->
       <div class="flex justify-between">
        <p class="text-sm font-bold text-black dark:text-gray-300 capitalize">Method</p> <!-- Changed Label -->
        <p class="text-sm text-black dark:text-gray-100 capitalize">{{ payment.paymentMethod || 'N/A' }}</p> <!-- Changed Value -->
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black dark:text-gray-300">Amount</p> <!-- Adjusted text color -->
        <p class="text-sm text-black dark:text-gray-100">R{{ (payment.amountInCents / 100).toFixed(2) }}</p> <!-- Adjusted text color -->
      </div>
       <div class="flex justify-between">
        <p class="text-sm font-bold text-black dark:text-gray-300">Type</p> <!-- Adjusted text color -->
        <p class="text-sm text-black dark:text-gray-100 capitalize">{{ payment.type }}</p> <!-- Adjusted text color -->
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black dark:text-gray-300">Date</p> <!-- Adjusted text color -->
        <p class="text-sm text-black dark:text-gray-100">{{ universalDateFormatter(payment.createdAt).includes(':') ? 'Today at '+ universalDateFormatter(payment.createdAt) : universalDateFormatter(payment.createdAt) }}</p> <!-- Adjusted text color -->
      </div>
    </div>
    <!-- Action Buttons styled like InvoiceCustom -->
    <div class="flex mt-2 mb-1 justify-between items-center">
      <button @click="handleEditPayment" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </button>
      <button @click="handleViewPayment" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </button>
    </div>
  </div>
</template>

<style scoped>
/* Minimal styles, assuming global styles are available */
</style>