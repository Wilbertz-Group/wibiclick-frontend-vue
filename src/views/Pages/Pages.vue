<script setup>
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { Grid, h } from "gridjs";
  import moment from 'moment'
  import "gridjs/dist/theme/mermaid.css";
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  const userStore = useUserStore()
  const pagesNode = ref(null)

  const grid = new Grid().updateConfig({
    columns: ['Url', 'Visitors', 'Views', 'Clicks', 'Updated'],
    pagination: {
      enabled: true,
      limit: 20,
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
      url: `https://wibi.wilbertzgroup.com/pages/`,
      then: data => data.pages.map(c => 
        [ c.url, c.visitors, c.views, c.clicks, c.updatedAt ? moment().isSame(c.updatedAt, 'day') ? moment(c.updatedAt).format('h:mm a') : moment(c.updatedAt).format('MMM DD, YYYY h:mm a') : '-' ]
      ),
      total: data => data.total
    },
    language: {
      'search': {
        'placeholder': '🔍 Search name, url...'
      },
      'pagination': {
        'previous': '⬅️',
        'next': '➡️',
        'showing': 'Displaying',
        'results': () => 'Pages'
      }
    }
  })

  onMounted(() => {
    grid.render(pagesNode.value)
  })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      grid.render(customersNode.value)
      grid.forceRender()
    }
  })


</script>

<template>
  <Header title="Pages" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-2 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
  
          </div>
          <div class="mt-3 md:col-span-2">
              <div v-if="userStore.currentWebsite" class="sm:overflow-hidden">
                  <div id="label"></div>
                  <div ref="pagesNode">
                      
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
