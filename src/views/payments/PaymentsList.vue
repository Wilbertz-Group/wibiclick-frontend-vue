<script setup>
import axios from "axios";
import Header from "@/components/Header.vue";  
import { useUserStore } from "@/stores/UserStore"
import { onMounted, ref, reactive, watchEffect } from "vue";
import moment from 'moment'
import { useRouter } from "vue-router";
import { useToast } from 'vue-toast-notification';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

import { AgGridVue } from "ag-grid-vue3";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Edit from "@/components/payments/EditPayment.vue";
import View from "@/components/payments/ViewPayment.vue";
import Status from "@/components/payments/PaymentStatus.vue";

const userStore = useUserStore()
const toast = useToast();
const loading = ref(false)
const router = useRouter()

const selectedPayment = ref({})
const paginationPageSize = ref(12)
const modalOpen = ref(false)
const paymentsApi = ref([])

async function fetchPayments() {
  try {
    loading.value = true;
    const response = await axios.get(
      `payments?id=${userStore.currentWebsite}&limit=1500&offset=0`
    );

    rowData.value = response.data.payments;
    loading.value = false;
  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error getting payments data")
  }
}

const gridApi = ref(null); 
const onGridReady = (params) => {
  gridApi.value = params.api;
};
const rowData = reactive({}); 

const dateFormatter = (params) => {
  let dt = params.value
  return params.value ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY') : '-';
}

const amountFormatter = (params) => {
  return `${params.data.currency} ${(params.data.amountInCents / 100).toFixed(2)}`;
}

const columnDefs = reactive({
  value: [
    { field: "id", headerName: 'Payment ID', maxWidth: 200 },
    { field: "type", headerName: 'Type' },
    { field: "amountInCents", headerName: 'Amount', valueFormatter: amountFormatter },
    { field: "status", headerName: 'Status', cellRendererSelector: params => {
        return {
            component: Status,
            params
        };
      }
    },
    { field: "createdAt", sort: 'desc', valueFormatter: dateFormatter },
    { 
      field: "id", 
      headerName: 'Edit',
      maxWidth: 80,
      cellRendererSelector: params => {
        return {
            component: Edit,
            params
        };
      } 
    },  
    { 
      field: "id", 
      headerName: 'View',
      maxWidth: 85,
      cellRendererSelector: params => {
        return {
            component: View,
            params
        };
      } 
    },       
  ],
});

const defaultColDef = {
  sortable: true,
  filter: true,
  flex: 1,
}

async function update(credentials) {
  try {
    loading.value = true
    const response = await axios.put(`update-payment-status?id=${userStore.currentWebsite}`, credentials);
    loading.value = false
    modalOpen.value = false
    fetchPayments() 
    toast.success("Successfully updated payment details")
  } catch (error) {
    console.log(error)
    loading.value = false
  }
}

const toggleEditModal = (event) => {
  if (event.value === undefined) {
    let data = event.data
    data.createdAt = moment(data.createdAt).format('YYYY-MM-DDTHH:MM')
    selectedPayment.value = data      
    modalOpen.value = !modalOpen.value
  } 
}

watchEffect(() => {    
  if(userStore.currentWebsite){
    fetchPayments()  
  }
})

</script>

<template>
  <Header title="Payments" /> 
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-2 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="mt-3 md:col-span-2">
            <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">
              <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                <div><h2 class="text-xl font-semibold text-left">All Payments</h2></div>
                <div class="relative text-right"></div>
                <div class="relative text-right">
                  <router-link :to="{name: 'add-payment'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5">Add Payment <svg class="w-6 h-6 inline pb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></router-link> 
                </div>
              </div> 

              <ag-grid-vue
                class="ag-theme-alpine"
                style="height:580px"
                :columnDefs="columnDefs.value"
                :rowData="rowData.value"
                :defaultColDef="defaultColDef"
                :pagination="true"
                :paginationPageSize="paginationPageSize"
                rowSelection="multiple"
                animateRows="true"
                @grid-ready="onGridReady"
                @cell-clicked="toggleEditModal"
              >
              </ag-grid-vue>
            </div>
            <div v-else class="shadow p-10 sm:rounded-md sm:overflow-hidden">Please select website on the navigation first</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="modalOpen" tabindex="-1" :class="{ flex: modalOpen, hidden: !modalOpen }" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Update Payment Details
          </h3>
          <button ref="closeDefaultModal" type="button"
            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            @click="modalOpen = false">
            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" v-if="selectedPayment" id="payment" submit-label="Update" @submit="update" :actions="false" >
            <FormKit type="select" v-model="selectedPayment.status" name="status" label="Payment Status" :options="['pending', 'successful', 'failed']" />  
            <FormKit type="text" v-model="selectedPayment.type" name="type" label="Payment Type" placeholder="Payment Type" outer-class="text-left" />                   
            <FormKit type="number" v-model="selectedPayment.amountInCents" name="amountInCents" label="Amount (in cents)" placeholder="Amount" outer-class="text-left" />
            <FormKit type="datetime-local" v-model="selectedPayment.createdAt" name="createdAt" label="Payment Date" placeholder="Payment Date" outer-class="text-left" />
            <FormKit type="hidden" v-model="selectedPayment.id" name="id" label="ID" /> 
            <FormKit type="submit" label="Update payment" />
          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>