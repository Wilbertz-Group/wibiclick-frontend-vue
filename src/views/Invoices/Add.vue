<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { useToast } from 'vue-toast-notification';
  import { useRouter } from "vue-router";
  import { computed } from "@vue/reactivity";

  const loading = ref(false)
  const toast = useToast();
  const router = useRouter()  
  const callout = ref()

  const jobs = ref({})
  const db_jobs = ref({})
  const job = ref('Select Job')
  const employee = ref()
  const estimate = ref()
  const customer = ref()
  
  const userStore = useUserStore()
  const status = ref([ 
    'quoting', 
    'quoted', 
    'no parts', 
    'accepted', 
    'scheduled',
    'cancelled',
    'pending',
    'done'    
  ])

  async function add(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-invoice?id='+ userStore.currentWebsite, credentials);
      loading.value = false
      toast.success(response.data.message)
      router.push({ name: 'invoices' })
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  async function getJobs() {
    try {
      loading.value = true
      const response = await axios.get('jobs?id='+ userStore.currentWebsite+'&filter=invoices');
      let b = {}
      response.data.jobs ? response.data.jobs.map(e => { b[e.id] = e.name}) : ''
      jobs.value = b
      db_jobs.value = response.data.jobs
      loading.value = false
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  const selectedJob = computed(() => db_jobs.value ? db_jobs.value.filter(e => { return e.id == job.value })[0] : '')

  function autofillForm(job) {
    if (selectedJob.value) {
      callout.value = selectedJob.value.callout
      estimate.value = selectedJob.value.estimate.id
      customer.value = selectedJob.value.customer.id
      employee.value = selectedJob.value.employee.id
    }
  }

  onMounted(()=>{
    if(userStore.currentWebsite){
      getJobs()
    }
  })

  watchEffect(() => {
    autofillForm(selectedJob)
  })
</script>

<template>
  <Header title="Add a invoice" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
                      
          </div>
          <div class="mt-3 md:col-span-2">
              <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <FormKit type="form" id="invoice" submit-label="Add" @submit="add" :actions="false" #default="{ value }">
                    <h2 class="mb-2 text-2xl text-cyan-900 font-bold">Add invoice details below </h2>
                    <hr />

                    <div class="double mt-8">
                      <FormKit type="select" v-model="job" name="jobId" label="Job" :options="jobs" />   
                      <FormKit type="text" v-if="selectedJob" v-model="selectedJob.callout" name="callout" label="Callout Fee" placeholder="Callout Fee" outer-class="text-left" />                    
                    </div>

                    <div class="double">
                      <FormKit type="select" name="reason" label="Invoice Stage" :options="status" />  
                      <FormKit type="text" name="name" label="Invoice Name" placeholder="Invoice Name" outer-class="text-left" />                   
                    </div>

                    <div class="double">
                      <FormKit type="number" name="number" label="Estimate Amount" placeholder="Estimate Amount" outer-class="text-left" />
                      <FormKit type="number" name="parts" label="Parts" placeholder="Parts" value="" outer-class="text-left" />                      
                    </div>

                    <div class="double">
                      <FormKit type="number" name="tech_expenses" label="Technician Expenses" placeholder="Technician Expenses" outer-class="text-left" />
                      <FormKit type="number" name="tech_share" label="Technician Share" placeholder="Technician Share" value="" outer-class="text-left" />                                   
                    </div>

                    <div class="double">
                      <FormKit type="number" name="company_expenses" label="Company Expenses" placeholder="Company Expenses" outer-class="text-left" />
                      <FormKit type="number" name="company_share" label="Company Share" placeholder="Company Share" value="" outer-class="text-left" />                                   
                    </div>

                    <div class="double">
                      <FormKit type="text" name="number" label="Invoice Number" placeholder="Invoice Number" outer-class="text-left" />
                      <FormKit type="text" name="url" label="Invoice Url" placeholder="Invoice Url" outer-class="text-left" />
                    </div>                    

                    <div class="double">
                      <FormKit type="datetime-local" name="issuedAt" label="Issued Date" placeholder="Issued Date" outer-class="text-left" />
                      <FormKit type="datetime-local" name="dueAt" label="Due Date" placeholder="Due Date" outer-class="text-left" />                      
                    </div>   

                    <FormKit type="text" name="sales" label="Invoice Amount" placeholder="Invoice Amount" outer-class="text-left" />
                    
                    <FormKit type="checkbox" label="Paid" name="paid" outer-class="text-left" />

                    <FormKit type="textarea" name="notes" label="Invoice Notes" placeholder="Invoice Notes" outer-class="text-left" />

                    <FormKit type="hidden" v-if="selectedJob" v-model="selectedJob.employee.id" name="employeeId" label="Employee" />

                    <FormKit type="hidden" v-if="selectedJob" v-model="selectedJob.customer.id" name="customerId" label="Customer" /> 
                    
                    <FormKit type="hidden" v-if="selectedJob" v-model="selectedJob.estimate.id" name="estimateId" label="Estimate" /> 

                    <FormKit type="submit" label="Add invoice" />

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
