<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { useRouter, useRoute } from "vue-router";
  import { Grid, h } from "gridjs";
  import moment from 'moment'
  import "gridjs/dist/theme/mermaid.css";
  import { useToast } from 'vue-toast-notification';

  const route = useRoute()
  const router = useRouter()
  const dropdownExport = ref(false)
  const userStore = useUserStore()
  const jobsNode = ref(null)
  const jobs = ref()
  const toast = useToast();

  const grid = new Grid().updateConfig({
    columns: ['Name', 'Issue', 'Location', 'Technician', 'Date', { 
        name: 'Send To',
        formatter: (cell, row) => {
          return h('button', {
            className: 'font-medium text-green-600 dark:text-green-600 hover:underline',
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

              let b = await axios.post('/sendtextmessage/', { 
                to: '27810072528',
                msg: `--------------------\nName: ${data?.name}\nPhone: ${data?.phone}\nCallout: ${data?.callout}\nDate: ${moment(data?.slotStart).format('dddd DD MMMM YYYY h:mm a')}\nAddress: ${data?.address}\nIssue: ${data?.issue}\n--------------------`
              });
              toast.success("Job resent to whatsapp sucessfully")
            }
          }, 'Whatsapp');
        }
      }],
    pagination: {
      enabled: true,
      limit: 10,
      server: {
        url: (prev, page, limit) => `${prev}?limit=${limit}&offset=${page * limit}&id=${userStore.currentWebsite}&employeeID=${route.query.employeeID}`
      }
    },
    search: true,
    fixedHeader: true,
    selecting: true,
    server: {
      headers: {'Authorization': `Bearer ${userStore.user.token}`},
      url: `https://wibi.wilbertzgroup.com/jobs/`,
      then: data => {
        jobs.value = data.jobs;
        let jobsData = data.jobs.sort((a, b) => new Date(a.slotStart) - new Date(b.slotStart)).reverse();
        return jobsData.map(c => 
        [c.name, c.issue, c.location, c.employee.firstName + ' ' + c.employee.lastName, c.slotStart ? moment().isSame(c.slotStart, 'day') ? moment(c.slotStart).format('h:mm a') : moment(c.slotStart).format('DD MMM @ h:mm a') : '-', c.id]
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
    },
    className: {
      td: 'py-4 px-6',
      table: 'w-full text-sm text-left text-gray-500 dark:text-gray-400',
      tr: 'bg-white border-b dark:bg-gray-800 dark:border-gray-700',
      thead: 'text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400',
      th: 'py-0 px-0',
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
  <Header :title="route.query.employeeName" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
              <div></div>
              <div class="relative text-right"></div>
              <div class="relative text-right">
                 
              </div>                   

            </div>   
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <div id="label"></div>
                  <div ref="jobsNode">
                      
                 </div>
              </div>
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
