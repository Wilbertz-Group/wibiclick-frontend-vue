<script setup>
  import Header from "@/components/Header.vue";  
  import { onMounted, ref } from "vue";
  import { Grid, h } from "gridjs";
  import moment from 'moment'
  import "gridjs/dist/theme/mermaid.css";
  import { useUserStore } from "@/stores/UserStore"

  const userStore = useUserStore()
  const usersNode = ref(null)
  const grid = new Grid().updateConfig({
    columns: ['Name', 'Email', 'Lifetime', 'Payments', 'Websites', 'Country', 'Created at'],
    pagination: {
      enabled: true,
      limit: 10,
      server: {
        url: (prev, page, limit) => `${prev}?limit=${limit}&offset=${page * limit}`
      }
    },
    search: true,
    sort: true,
    resizable: true,
    fixedHeader: true,
    theme: 'mermaid',
    server: {
      headers: {'Authorization': `Bearer ${userStore.user.token}`},
      url: `https://wibi.wilbertzgroup.com/users/`,
      then: data => data.users.map(c => 
        [c.firstName + ' ' +c.lastName, c.email, c.lifetime ? 'Yes' : 'No', c.payments, c.websites, c.country, c.createdAt ? moment(c.createdAt).format("ddd MMM DD, YYYY") : '-']
      ),
      total: data => data.total
    } 
  })

  onMounted(() => {
    grid.render(usersNode.value)
  })

</script>

<template>
  <Header title="Users" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                 <div ref="usersNode">
                      
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
