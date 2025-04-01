<script setup>
import axios from "axios";
import { useToast } from 'vue-toast-notification';
import { watch, ref } from "vue";
import modal from "../misc/modal.vue";
import { useUserStore } from "@/stores/UserStore"
import { universalDateFormatter, dateFormatter, universalTimeFormatter } from '../../helpers';
import { 
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

const emit = defineEmits(['reloadTimeline', 'edit-estimate', 'view-estimate'])
const props = defineProps(['estimate'])
const userStore = useUserStore()
const toast = useToast() 

const statuses = [
  { value: "pending", name: "Pending" },
  { value: "processing", name: "Processing" },
  { value: "paid", name: "Paid" },
  { value: "accepted", name: "Accepted" },
  { value: "sent", name: "Sent" },
  { value: "rejected", name: "Rejected" },
]

// Find the status object matching the estimate's reason, provide a default if not found
const findStatus = (reason) => statuses.find(s => s.value === reason);
const initialStatus = findStatus(props.estimate?.reason) || statuses.find(s => s.value === 'sent') || { name: 'N/A', value: null }; // Default to 'sent' or N/A
const selectedStatus = ref(initialStatus);
const body = ref()
const heading = ref()
const isOpen = ref(false)

function closeModal() {
  isOpen.value = false
  emit('reloadTimeline')
}

function handleEditEstimate() {
  emit('edit-estimate', props.estimate);
}

function handleViewEstimate() {
  emit('view-estimate', props.estimate);
}

watch(selectedStatus, async (n, o) => {
  toast.success('updating the status of the estimate')
  body.value = `Estimate status changed from <b>${o.value}</b> to <b>${n.value}</b>`
  heading.value = "Estimate Status"
  
  const data = { 
    id: props.estimate.id, 
    reason: n.value, 
    customerId: props.estimate.customerId, 
    employeeId: props.estimate.employeeId
  }

  try {
    const response = await axios.post('update-estimate-status?id='+ userStore.currentWebsite, data);
    toast.success(response.data.message)
    isOpen.value = true
  } catch (error) {
    toast.error('Failed to update the estimate status, please contact the administrator')
    console.log(error)
  }
})

</script>

<template>
  <div class="shadow rounded-xl px-3 pt-3 pb-1 border border-white mt-3 cursor-move w-full">
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
      <div class="flex justify-between mb-2">
        <div class="flex flex-col justify-center">
          <p class="text-lg text-black" ></p>
        </div>				
        <div class="relative">
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
                          selected ? 'font-small' : 'font-small',
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
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black">Estimate Number</p>
        <p class="text-sm text-black">#{{ estimate.number }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black">Technician</p>
        <p v-if="estimate.employee?.firstName || estimate.employee?.lastName" class="text-sm text-black">{{ (estimate.employee?.firstName || '') + ' ' + (estimate.employee?.lastName || '') }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black">Total:</p> <!-- Added label -->
        <p class="text-sm text-black">R{{ Number(estimate.sales).toFixed(2) }}</p> <!-- Show sales amount, formatted -->
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black">Issued:</p> <!-- Changed label -->
        <p class="text-sm text-black">{{ universalDateFormatter(estimate.issuedAt) }}</p> <!-- Use issuedAt -->
      </div>
      <div class="flex justify-between"> <!-- Added Due Date -->
        <p class="text-sm font-bold text-black">Expires:</p>
        <p class="text-sm text-black">{{ universalDateFormatter(estimate.dueAt) }}</p>
      </div>
    </div>
    <div class="flex mt-2 mb-1 justify-between items-center">			
      <button @click="handleEditEstimate" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </button>
      <button @click="handleViewEstimate" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </button>
    </div>
  </div>
</template>