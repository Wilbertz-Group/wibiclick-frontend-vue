<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { Grid, h } from "gridjs";
  import moment from 'moment'
  import "gridjs/dist/theme/mermaid.css";
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  const userStore = useUserStore()
  const jobsNode = ref(null)
  const jobs = ref()
  const toast = useToast();

  const grid = new Grid().updateConfig({
    columns: ['Name', 'Issue', 'Location', 'Technician', { 
        name: 'Send To',
        formatter: (cell, row) => {
          return h('button', {
            className: 'font-medium text-red-600 dark:text-green-600 hover:underline',
            onClick: async () => {
              let job = jobs.value.filter(a => a.id == row.cells[5].data)[0]
              let data = {}

              data.name = job.name
              data.callout = job.callout
              data.slotStart = job.slotStart
              data.address = job.address
              data.issue = job.issue
              data.employeeId = job.employee.id
              data.employeePhone = job.employee.phone
              data.location = job.location
              data.phone = job.phone
              data.slotTime = job.slotTime

              let b = await axios.post('send-whatsapp', data);
              toast.success(b.data)
            }
          }, 'Whatsapp');
        }
      }, 'Date'],
    pagination: {
      enabled: true,
      limit: 10,
      server: {
        url: (prev, page, limit) => `${prev}?limit=${limit}&offset=${page * limit}&id=${userStore.currentWebsite}`
      }
    },
    search: true,
    sort: true,
    resizable: true,
    fixedHeader: true,
    theme: 'mermaid',
    selecting: true,
    server: {
      headers: {'Authorization': `Bearer ${userStore.user.token}`},
      url: `https://wibi.wilbertzgroup.com/jobs/`,
      then: data => {
        jobs.value = data.jobs;
        let jobsData = data.jobs.sort((a, b) => new Date(a.slotStart) - new Date(b.slotStart)).reverse();
        return jobsData.map(c => 
        [c.name, c.issue, c.location, c.employee.firstName + ' ' + c.employee.lastName, c.id, c.slotStart ? moment().isSame(c.slotStart, 'day') ? moment(c.slotStart).format('h:mm a') : moment(c.slotStart).format('DD MMM @ h:mm a') : '-']
      )},
      total: data => data.total
    },
    language: {
      'search': {
        'placeholder': '🔍 Search name, location...'
      },
      'pagination': {
        'previous': '⬅️',
        'next': '➡️',
        'showing': 'Displaying',
        'results': () => 'Jobs'
      }
    }
  })

  onMounted(() => {
    grid.render(jobsNode.value)
  })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      if(grid.callbacks == undefined){
        grid.render(customersNode.value)
      } else {
        grid.forceRender()
      }
    }
  })

</script>

<template>
  <Header title="Jobs" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-2 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
              <div></div>
              <div class="relative text-right"></div>
              <div class="relative text-right">
                 <router-link :to="{name: 'add-job'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5">Add Job</router-link>                
              </div>                   

            </div>   
          </div>
          <div class="mt-3 md:col-span-2">
              <div v-if="userStore.currentWebsite" class="sm:overflow-hidden">
                  <div id="label"></div>
                  <div ref="jobsNode">
                      
                 </div>
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
