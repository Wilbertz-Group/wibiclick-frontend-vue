// wibiclick-frontend-vue/src/views/Jobs/Add.vue
<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import  useUserStore  from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { useToast } from 'vue-toast-notification';
  import { useRouter, useRoute } from "vue-router";
  import { computed } from "@vue/reactivity";
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  const loading = ref(false)
  const modalOpen = ref(false)
  const toast = useToast();
  const router = useRouter()  
  const employees = ref({})
  const customers = ref({})
  const dbContacts = ref()
  const phone = ref('phone')
  const address = ref('address')
  const name = ref('name')
  const issue = ref('issue')
  const customer = ref('Select Customer')
  const userStore = useUserStore()
  const route = useRoute()

  async function add(credentials) {
    if(credentials.employeeId == "test") {
      toast.error("Please select an employee")
      return
    }
    try {
      loading.value = true
      const response = await axios.post('add-job?id='+ userStore.currentWebsite, credentials);
      loading.value = false
      toast.success(response.data.message)
      router.push({ name: 'jobs' })
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  async function getEmployees() {
    try {
      loading.value = true
      const response = await axios.get('employees?id='+ userStore.currentWebsite);
      let b = {}
      response.data.employees ? response.data.employees.map(e => { b[e.id] = e.firstName + ' ' + e.lastName }) : ''
      const newItem = { test: "Select Employee" }
      b = {
        ...newItem,
        ...b,
      }

      employees.value = b
      loading.value = false
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  async function getContacts() {
    try {
      loading.value = true
      const response = await axios.get('customers?id='+ userStore.currentWebsite);
      let b = {}
      response.data.customers ? response.data.customers.map(e => { b[e.id] = e.name}) : ''
      customers.value = b
      dbContacts.value = response.data.customers

      if( route.query?.contact_id ){ 
        loading.value = true
        const cres = await axios.get('customer?id='+ userStore.currentWebsite+'&custId='+route.query?.contact_id);
        let contact_data = cres.data.customer
        let newd = customers.value
        newd[contact_data.id] = contact_data.name
        customers.value = newd
        customer.value = ""
        autofillForm(contact_data)
        customer.value = contact_data.id
      } else {
        autofillForm(response.data.customers[0])
      }

      loading.value = false
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  function toggleModal() {
    modalOpen.value = !modalOpen.value
  }

  function autofillForm(c) {
    if (c) {
      customer.value = c.id
      phone.value = c.phone
      name.value = c.name
      address.value = c.address
      issue.value = c.message
    }
  }

  const selectedCustomer = computed(() => dbContacts.value ? dbContacts.value.filter(e => { return e.id == customer.value })[0] : '')

  onMounted(()=>{
    if(userStore.currentWebsite){
      getEmployees()
      getContacts()
    }
  })

  watchEffect(() => {
    autofillForm(selectedCustomer.value)
  })
</script>

<template>
  <Header title="Add a job" /> 
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
                      
          </div>
          <div class="mt-3 md:col-span-2">
              <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <FormKit type="form" id="job" submit-label="Add" @submit="add" :actions="false" >
                    <h2 class="mb-2 text-2xl text-cyan-900 font-bold">Add job details below </h2>
                    <hr />

                    <div class="double mt-8">
                      <FormKit type="select" v-model="customer" name="customerId" label="Customer" :options="customers" />   
                      <FormKit type="text" v-model="name" :value="name" name="name" label="Customer Name" placeholder="Customer Name" outer-class="text-left" validation="required" />                     
                    </div>

                    <div class="double">
                      <FormKit type="text" name="callout" label="Callout Fee" placeholder="Callout Fee" value="R350" outer-class="text-left" validation="required" />
                       <FormKit type="text" name="location" label="Location" placeholder="Location" outer-class="text-left" validation="required" />            
                    </div>

                    <div class="double">
                      <FormKit type="text" v-model="address" :value="address" name="address" label="Customer address" placeholder="Customer address" outer-class="text-left" validation="required" />
                      <FormKit type="tel" v-model="phone" :value="phone" name="phone" label="Customer Phone" placeholder="021 000 0000" outer-class="text-left" validation="required|phone" />
                    </div>                    

                    <div class="double">
                      <FormKit type="datetime-local" name="slotStart" label="Job Start Date" placeholder="Job Start" outer-class="text-left" validation="required" />
                      <FormKit type="select" name="slotTime" label="Job Duration" :options="['1hr', '2hrs', '3hrs', '4hrs']" validation="required" />
                    </div>

                    <FormKit type="select" name="employeeId" label="Employee" :options="employees" validation="required|not:test" />

                    <FormKit type="textarea" v-model="issue" :value="issue" name="issue" label="Issue" placeholder="Issue" outer-class="text-left" validation="required" />

                    <FormKit type="checkbox" label="Notify Employee" name="notify" outer-class="text-left" />

                    <FormKit type="hidden" value="scheduled" name="jobStatus" outer-class="text-left"  />

                    <FormKit type="submit" label="Add job" />

                  </FormKit>
              </div>
              <div v-else class="shadow p-10 sm:rounded-md sm:overflow-hidden">Please select website on the navigation first</div>
          </div>
        </div>
      </div>

      <div class="hidden sm:block" aria-hidden="true">
        <div class="py-5">
          <div class="border-t border-gray-200" />
        </div>
      </div>

    </div>
  </div>

 
</template>
