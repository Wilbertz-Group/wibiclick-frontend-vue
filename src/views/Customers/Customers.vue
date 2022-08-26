<script setup>
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { useRouter, useRoute } from "vue-router";
  import { Grid, h } from "gridjs";
  import moment from 'moment'
  import "gridjs/dist/theme/mermaid.css";
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  const route = useRoute()
  const router = useRouter()
  const dropdownExport = ref(false)
  const userStore = useUserStore()
  const customersNode = ref(null)

  const grid = new Grid().updateConfig({
    columns: ['Name', 'Message', 'Channel', 
      { 
        name: 'Hubspot',
        formatter: (cell, row) => {
          return h('a', {
            className: 'font-medium text-red-600 dark:text-red-500 hover:underline',
            href: row.cells[3].data,
            target: "_blank"
          }, 'Hubspot');
        }
      },
      'Created at'
    ],
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
      url: `https://wibi.wilbertzgroup.com/customers/`,
      then: data => data.customers.map(c => 
        [c.name, c.message, c.channel, c.hubspotLink, c.createdAt ? moment().isSame(c.createdAt, 'day') ? moment(c.createdAt).format('h:mm a') : moment(c.createdAt).format('MMM DD, YYYY h:mm a') : '-']
      ),
      total: data => data.total
    },
    language: {
      'search': {
        'placeholder': '🔍 Search name, channel...'
      },
      'pagination': {
        'previous': '⬅️',
        'next': '➡️',
        'showing': 'Displaying',
        'results': () => 'Customers'
      }
    }
  })

  onMounted(() => {
    grid.render(customersNode.value)
  })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      grid.render(customersNode.value)
      grid.forceRender()
    }
  })

</script>

<template>
  <Header title="Customers" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
              <div></div>
              <div class="relative text-right"></div>
              <div class="relative text-right">
                 <router-link :to="{name: 'add-customer'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5">Add Customer</router-link>                
              </div>                   

            </div>   
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <div id="label"></div>
                  <div ref="customersNode">
                      
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
