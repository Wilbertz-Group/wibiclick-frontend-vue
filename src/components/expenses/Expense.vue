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
    console.log(error)
  }
})
</script>

<template>
  <div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full">
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>     
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