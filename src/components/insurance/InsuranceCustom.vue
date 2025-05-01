<!-- wibiclick-frontend-vue/src/components/insurance/InsuranceCustom.vue -->
<script setup>
import axios from "axios";
import { useToast } from 'vue-toast-notification';
import { watch, ref } from "vue";
import modal from "../misc/modal.vue"; // Keep if status update modal is needed
import  useUserStore  from "@/stores/UserStore"
import { universalDateFormatter } from '../../helpers';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added for delete icon
import { library } from '@fortawesome/fontawesome-svg-core' // Added for delete icon
import { faTrash } from '@fortawesome/free-solid-svg-icons' // Added for delete icon
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

library.add(faTrash) // Added for delete icon

const emit = defineEmits(['reloadTimeline', 'edit-insurance', 'view-insurance'])
const props = defineProps(['insurance']) // Changed prop name
const userStore = useUserStore()
const toast = useToast()

const statuses = [
  { value: "pending", name: "Pending" },
  { value: "processing", name: "Processing" },
  { value: "paid", name: "Paid" },
  { value: "accepted", name: "Accepted" },
  { value: "sent", name: "Sent" },
]

// Status update logic
const currentStatus = statuses.find(a => a.value === props.insurance.status) || statuses[0]; // Safer default
const selectedStatus = ref(currentStatus)
const body = ref()
const heading = ref()
const isOpen = ref(false) // For status update confirmation modal

function closeModal() {
  isOpen.value = false
  // emit('reloadTimeline')
}

watch(selectedStatus, async (n, o) => {
  if (!n || !o || n.value === o.value) return;

  toast.info('Updating insurance report status...')
  body.value = `Insurance report status changed from <b>${o.name}</b> to <b>${n.name}</b>`
  heading.value = "Insurance Report Status Update"

  const data = {
    id: props.insurance.id,
    status: n.value,
    // Include other necessary fields if required by the backend
    // customerId: props.insurance.customerId,
  }

  try {
    // Adjust endpoint based on your API for updating insurance report status
    const response = await axios.post(`update-insurance-report-status?id=${userStore.currentWebsite}`, data);
    toast.success(response.data.message || 'Insurance report status updated successfully')
    isOpen.value = true
    emit('reloadTimeline');
  } catch (error) {
    toast.error('Failed to update report status. Please try again.')
    // Removed console.error
    selectedStatus.value = o; // Revert status on error
  }
})

// --- Edit/View Handlers ---
function handleEditInsurance() {
  emit('edit-insurance', props.insurance);
}

function handleViewInsurance() {
  emit('view-insurance', props.insurance);
}

async function deleteInsuranceReport() {
  if (!props.insurance || !props.insurance.id) {
    toast.error('Cannot delete insurance report: ID missing.');
    return;
  }

  if (confirm(`Are you sure you want to delete insurance report #${props.insurance.number || props.insurance.id}? This action cannot be undone.`)) {
    try {
      // Use the confirmed endpoint: DELETE /insurance-report?custId={id}&id={websiteId}
      await axios.delete(`/insurance-report?custId=${props.insurance.id}&id=${userStore.currentWebsite}`);
      toast.success('Insurance report deleted successfully.');
      emit('reloadTimeline'); // Refresh the parent list
    } catch (error) {
      console.error("Error deleting insurance report:", error);
      toast.error(`Failed to delete insurance report: ${error.response?.data?.message || error.message}`);
    }
  }
}

</script>

<template>
  <!-- Style based on InvoiceCustom.vue -->
  <div class="shadow rounded-xl px-3 pt-3 pb-1 border border-white mt-3 cursor-move w-full dark:bg-white bg-white dark:bg-gray-800">
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
      <div class="flex justify-between mb-2">
        <div class="flex flex-col justify-center">
           <p class="text-sm font-semibold text-black dark:text-gray-100">Report #{{ insurance.number || insurance.id.substring(0, 8)+'...' }}</p> <!-- Show number or partial ID -->
        </div>
        <div class="relative">
          <!-- Status Dropdown styled like InvoiceCustom -->
          <Listbox v-model="selectedStatus">
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-slate-900 py-1 pl-3 pr-5 min-w-[100px] text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
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
                          selected ? 'font-medium' : 'font-normal',
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
      <!-- Data display -->
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black dark:text-gray-300">Date</p>
        <p class="text-sm text-black dark:text-gray-100">{{ universalDateFormatter(insurance.createdAt) }}</p> <!-- Assuming createdAt is the relevant date -->
      </div>
       <!-- Add other relevant fields like Provider, Policy No. if available -->
       <div v-if="insurance.details" class="mt-1">
         <p class="text-xs text-gray-500 dark:text-gray-400">{{ insurance.details.substring(0, 100) }}{{ insurance.details.length > 100 ? '...' : '' }}</p>
       </div>
    </div>
    <!-- Action Buttons styled like InvoiceCustom -->
    <div class="flex mt-2 mb-1 justify-between items-center">
      <button @click="handleEditInsurance" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </button>
      <button @click="handleViewInsurance" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </button>
      <!-- Delete Button -->
      <button @click="deleteInsuranceReport" class="text-white cursor-pointer inline-block bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center" title="Delete Insurance Report">
        <font-awesome-icon icon="trash" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Minimal styles, assuming global styles are available */
</style>