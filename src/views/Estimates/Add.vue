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
  const job = ref('Select Estimate')
  const employee = ref()
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
    'invoiced',
    'done'    
  ])

  async function add(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-estimate?id='+ userStore.currentWebsite, credentials);
      loading.value = false
      toast.success(response.data.message)
      router.push({ name: 'estimates' })
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  async function getEstimates() {
    try {
      loading.value = true
      const response = await axios.get('jobs?id='+ userStore.currentWebsite+'&filter=estimates');
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
      customer.value = selectedJob.value.customer.id
      employee.value = selectedJob.value.employee.id
    }
  }

  onMounted(()=>{
    if(userStore.currentWebsite){
      getEstimates()
    }
  })

  watchEffect(() => {
    autofillForm(selectedJob)
  })
</script>

<template>
  <Header title="Add a estimate" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
                      
          </div>
          <div class="mt-3 md:col-span-2">
              <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <FormKit type="form" id="estimate" submit-label="Add" @submit="add" :actions="false" #default="{ value }">

                    <FormKit type="select" v-model="job" name="jobId" label="Job" :options="jobs" />  

                    <div class="double">
                      <FormKit type="select" name="reason" label="Estimate Stage" :options="status" />  
                      <FormKit type="text" name="name" label="Estimate Name" placeholder="Estimate Name" outer-class="text-left" />                   
                    </div>

                    <div class="double">
                      <FormKit type="text" name="number" label="Estimate Number" placeholder="Estimate Number" outer-class="text-left" />
                      <FormKit type="text" name="url" label="Estimate Url" placeholder="Estimate Url" outer-class="text-left" />
                    </div>                    

                    <div class="double">
                      <FormKit type="number" name="number" label="Estimate Amount" placeholder="Estimate Amount" outer-class="text-left" />
                      <FormKit type="datetime-local" name="issuedAt" label="Issued Date" placeholder="Issued Date" outer-class="text-left" />                     
                    </div>   

                    <FormKit type="textarea" name="notes" label="Estimate Notes" placeholder="Estimate Notes" outer-class="text-left" />

                    <FormKit type="hidden" v-if="selectedJob" v-model="selectedJob.employee.id" name="employeeId" label="Employee" />

                    <FormKit type="hidden" v-if="selectedJob" v-model="selectedJob.customer.id" name="customerId" label="Customer" /> 
                    
                    <FormKit type="hidden" v-if="selectedJob" v-model="selectedJob.estimate.id" name="estimateId" label="Estimate" /> 

                    <FormKit type="submit" label="Add estimate" />

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
