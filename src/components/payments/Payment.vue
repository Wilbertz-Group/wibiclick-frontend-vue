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
const props = defineProps(['payment'])
const userStore = useUserStore()
const toast = useToast() 

const statuses = [
  { value: "pending", name: "Pending" },
  { value: "successful", name: "Successful" },
  { value: "failed", name: "Failed" },
]

const currentStatus = statuses.filter(a => a.value == props.payment.status)?.length && props.payment?.status ? statuses.filter(a => a.value == props.payment.status) : ''
const selectedStatus = ref(currentStatus[0])
const body = ref()
const heading = ref()
const isOpen = ref(false)

function closeModal() {
  isOpen.value = false
  emit('reloadTimeline')
}

watch(selectedStatus, async (n, o) => {
  toast.success('Updating the status of the payment')
  body.value = `Payment status changed from <b>${o.value}</b> to <b>${n.value}</b>`
  heading.value = "Payment status"
  
  const data = { 
    id: props.payment.id, 
    status: n.value, 
    customerId: props.payment.customerId, 
    employeeId: props.payment.employeeId
  }

  try {
    const response = await axios.post('update-payment-status?id='+ userStore.currentWebsite, data);
    toast.success(response.data.message)
    isOpen.value = true
  } catch (error) {
    toast.error('Failed to update the payment status, please contact the administrator')
    console.log(error)
  }
})
</script>

<template>
  <div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full">
    <div class="mb-2 p-0">
      <modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
      <div class="flex justify-between mb-2">    
        <div class="flex flex-col justify-center">
          <p class="text-lg text-black" ></p>
        </div>  
        <div class="relative">
          <Listbox v-model="selectedStatus">
            <!-- Listbox implementation (same as in Insurance.vue) -->
          </Listbox>
        </div>
      </div>      
      <div class="flex justify-between" >
        <p class="text-sm font-bold text-black" >Date</p>
        <p class="text-sm text-black" >{{ universalDateFormatter(payment.createdAt).includes(':') ? 'Today at '+ universalDateFormatter(payment.createdAt) : universalDateFormatter(payment.createdAt) }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black" >Amount</p>
        <p class="text-sm text-black" >R{{ payment.amountInCents / 100 }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black" >Type</p>
        <p class="text-sm text-black" >{{ payment.type }}</p>
      </div>
      <div class="flex justify-between">
        <p class="text-sm font-bold text-black" >Status</p>
        <p class="text-sm text-black" >{{ payment.status }}</p>
      </div>
    </div>
    <div class="flex mt-4 mb-1 justify-between items-center" >
      <router-link :to="{ name: 'edit-payment', query:{ payment_id: payment.id } }" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </router-link>
      <router-link :to="{ name: 'view-payment', query:{ payment_id: payment.id } }" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </router-link>
    </div>
  </div>
</template>