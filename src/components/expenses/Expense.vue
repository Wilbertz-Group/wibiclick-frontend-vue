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

const emit = defineEmits(['reloadTimeline'])
const props = defineProps(['expense'])
const userStore = useUserStore()
const toast = useToast() 

const expenseTypes = [
  { value: "FUEL", name: "Fuel" },
  { value: "PARTS", name: "Parts" },
  { value: "BONUS", name: "Bonus" },
  { value: "OTHER", name: "Other" },
]

const currentType = expenseTypes.filter(a => a.value == props.expense.type)?.length && props.expense?.type ? expenseTypes.filter(a => a.value == props.expense.type) : ''
const selectedType = ref(currentType[0])
const body = ref()
const heading = ref()
const isOpen = ref(false)

function closeModal() {
  isOpen.value = false
  emit('reloadTimeline')
}

watch(selectedType, async (n, o) => {
  toast.success('Updating the type of the expense')
  body.value = `Expense type changed from <b>${o.name}</b> to <b>${n.name}</b>`
  heading.value = "Expense type"
  
  const data = { 
    id: props.expense.id, 
    type: n.value, 
    employeeId: props.expense.employeeId
  }

  try {
    const response = await axios.put(`expense/${props.expense.id}?id=${userStore.currentWebsite}`, data);
    toast.success(response.data.message)
    isOpen.value = true
  } catch (error) {
    toast.error('Failed to update the expense type, please contact the administrator')
    // Removed console.log
  }
})
</script>

<template>
  <div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full">
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
      <div class="flex justify-between mb-2"> <!-- Added mb-2 for spacing -->
        <div class="flex flex-col justify-center"> <!-- Placeholder for potential title -->
          <p class="text-lg text-black" ></p>
        </div>
        <div class="relative">
          <Listbox v-model="selectedType">
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-slate-900 py-1 pl-3 pr-5 min-w-[120px] text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
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
                          selected ? 'font-small' : 'font-small',
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
      <div class="flex justify-between" >
        <p class="text-sm font-bold text-black" >Date</p>
        <p class="text-sm text-black" >{{ universalDateFormatter(expense.date) }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black" >Amount</p>
        <p class="text-sm text-black" >R{{ expense.amount }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black" >Type</p>
        <p class="text-sm text-black" >{{ expense.type }}</p>
      </div>
      <div class=""> 
        <p class="text-sm font-bold text-black" >Description</p>
        <p class="text-xs text-black" >{{ expense.description }}</p>
      </div>
    </div>
    <div class="flex mt-4 mb-1 justify-between items-center" >
      <router-link :to="{ name: 'edit-expense', query:{ expense_id: expense.id } }" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </router-link>
      <router-link :to="{ name: 'view-expense', query:{ expense_id: expense.id } }" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </router-link>
    </div>
  </div>
</template>