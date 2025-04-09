<script setup>
import axios from "axios";
import { useToast } from 'vue-toast-notification';
import { watch, ref } from "vue";
import modal from "../misc/modal.vue"; // Keep if status update modal is needed
import { useUserStore } from "@/stores/UserStore"
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

const emit = defineEmits(['reloadTimeline', 'edit-expense', 'view-expense'])
const props = defineProps(['expense'])
const userStore = useUserStore()
const toast = useToast()

const expenseTypes = [
  { value: "FUEL", name: "Fuel" },
  { value: "PARTS", name: "Parts" },
  { value: "BONUS", name: "Bonus" },
  { value: "OTHER", name: "Other" },
]

// Type update logic
const currentType = expenseTypes.find(a => a.value === props.expense.type) || expenseTypes.find(t => t.value === 'OTHER'); // Safer default
const selectedType = ref(currentType)
const body = ref()
const heading = ref()
const isOpen = ref(false) // For type update confirmation modal

function closeModal() {
  isOpen.value = false
  // emit('reloadTimeline') // Maybe not needed if type update is quick
}

watch(selectedType, async (n, o) => {
  if (!n || !o || n.value === o.value) return; // Prevent unnecessary updates

  toast.info('Updating expense type...') // Use info for ongoing process
  body.value = `Expense type changed from <b>${o.name}</b> to <b>${n.name}</b>`
  heading.value = "Expense Type Update"

  const data = {
    id: props.expense.id,
    type: n.value,
    // Include other necessary fields if required by the backend for update
    // amount: props.expense.amount,
    // description: props.expense.description,
    // date: props.expense.date,
    // customerId: props.expense.customerId,
    // employeeId: props.expense.employeeId
  }

  try {
    // Assuming a PUT request to update the expense type
    const response = await axios.put(`expense/${props.expense.id}?id=${userStore.currentWebsite}`, data);
    toast.success(response.data.message || 'Expense type updated successfully')
    isOpen.value = true // Show confirmation modal
    emit('reloadTimeline'); // Reload data after successful update
  } catch (error) {
    toast.error('Failed to update expense type. Please try again.')
    // Removed console.error
    selectedType.value = o; // Revert type on error
  }
})

// --- Edit/View Handlers ---
function handleEditExpense() {
  emit('edit-expense', props.expense);
}

function handleViewExpense() {
  // View and Edit might use the same modal/handler in this context
  emit('view-expense', props.expense);
}

async function deleteExpense() {
  if (!props.expense || !props.expense.id) {
    toast.error('Cannot delete expense: ID missing.');
    return;
  }

  if (confirm(`Are you sure you want to delete this expense: "${props.expense.description}"? This action cannot be undone.`)) {
    try {
      // Use the confirmed endpoint: DELETE /expense/{id}?id={websiteId}
      await axios.delete(`/expense/${props.expense.id}?id=${userStore.currentWebsite}`);
      toast.success('Expense deleted successfully.');
      emit('reloadTimeline'); // Refresh the parent list
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(`Failed to delete expense: ${error.response?.data?.message || error.message}`);
    }
  }
}

</script>

<template>
  <!-- Style based on InvoiceCustom.vue -->
  <div class="shadow rounded-xl px-3 pt-3 pb-1 border border-white mt-3 cursor-move w-full bg-white dark:bg-gray-800"> <!-- Adjusted background -->
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
      <div class="flex justify-between mb-2">
        <div class="flex flex-col justify-center">
           <p class="text-sm font-semibold text-black dark:text-gray-100">{{ expense.description.substring(0, 30) }}{{ expense.description.length > 30 ? '...' : '' }}</p> <!-- Show description snippet -->
        </div>
        <div class="relative">
          <!-- Type Dropdown styled like InvoiceCustom status -->
          <Listbox v-model="selectedType">
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-slate-900 py-1 pl-3 pr-5 min-w-[100px] text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
              >
                <span class="block truncate text-white">{{ selectedType?.name }}</span>
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
                    v-for="type in expenseTypes"
                    :key="type.name"
                    :value="type"
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
                        >{{ type.name }}</span
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
        <p class="text-sm font-bold text-black dark:text-gray-300">Amount</p>
        <p class="text-sm text-black dark:text-gray-100">R{{ Number(expense.amount).toFixed(2) }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black dark:text-gray-300">Date</p>
        <p class="text-sm text-black dark:text-gray-100">{{ universalDateFormatter(expense.date) }}</p>
      </div>
       <!-- Removed redundant Type display as it's in the dropdown -->
    </div>
    <!-- Action Buttons styled like InvoiceCustom -->
    <div class="flex mt-2 mb-1 justify-between items-center">
      <button @click="handleEditExpense" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </button>
      <button @click="handleViewExpense" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </button>
      <!-- Delete Button -->
      <button @click="deleteExpense" class="text-white cursor-pointer inline-block bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center" title="Delete Expense">
        <font-awesome-icon icon="trash" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Minimal styles, assuming global styles are available */
</style>