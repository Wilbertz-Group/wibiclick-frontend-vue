<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import { onMounted, ref, reactive, watchEffect } from "vue";
  import moment from 'moment'
  import { useUserStore } from "@/stores/UserStore"
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  import { AgGridVue } from "ag-grid-vue3";
  import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
  import Edit from "@/components/Edit.vue";

  const selectedUser = ref(null)
  const paginationPageSize = ref(6)
  const modalOpen = ref(false)
  const websitesModalOpen = ref(false)
  const loading = ref(false);
  const toast = useToast();
  const allWebsites = ref()
  const allUserWebsites = ref()

  const userStore = useUserStore()

  const groups = (() => {
      const byDay = (item) => moment(item.x).format('MMM DD YYYY'),
          byHour = (item) => moment(byDay(item) + ' ' + moment(item.x).format('hh a'), "dd MMM yyyy").toISOString(),
          by6Hour = (item) => {
              const m = moment(item.x);
              return byDay(item) + ' ' + ['first', 'second', 'third', 'fourth'][Number(m.format('k')) % 6] + ' 6 hours';
          },
          byMonth = (item) => moment(item.x).format('MMM YYYY'),
          byWeek = (item) => byMonth(item) + ' ' + moment(item.x).format('ww');
      return {
          byDay,
          byHour,
          by6Hour,
          byMonth,
          byWeek,
      };
  })();

  const gridApi = ref(null); 
  const onGridReady = (params) => {
    gridApi.value = params.api;
  };
  const rowData = reactive({}); 

  const dateFormatter = (params) => {
    let dt = params.value
    return params.value ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY h:mm a') : '-';
  }

  const columnDefs = reactive({
    value: [
      { field: "firstName" }, 
      { field: "lastName" }, 
      { field: "email", minWidth: 200, }, 
      { field: "lifetime" }, 
      { field: "payments" },
      { field: "websites"}, 
      { field: "country"},  
      { 
        field: "createdAt", 
        minWidth: 150,
        valueFormatter: dateFormatter 
      },  
      { 
        field: "Edit", 
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
        headerName: 'Connect',
        maxWidth: 180,
        cellRendererSelector: params => {
          return {
              component: Edit,
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
  };

  async function update(credentials) {
    try {
      loading.value = true
      const { data } = await axios.post('update-user?id='+ userStore.currentWebsite, credentials);
      loading.value = false
      toast.success(data)
      modalOpen.value = !modalOpen.value
      fetchUsers()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
    loading.value = false;
  }

  const toggleEditModal = async (event) => {
    if( event.colDef.field === 'Edit' ){
      selectedUser.value = event.data
      modalOpen.value = !modalOpen.value
    } 

    if( event.colDef.field === 'id' ){
      selectedUser.value = event.data
      await fetchUserWebsites(event.data.id)
      websitesModalOpen.value = !websitesModalOpen.value
    } 
  }

  async function fetchWebsites() {
    try {
      loading.value = true
      const response = await axios.get('get-websites');
      allWebsites.value = response.data
      loading.value = false      
    } catch (error) {
      console.log(error)
      toast.error("Error getting websites")
      loading.value = false;
    }

    loading.value = false;
  }

  async function fetchUserWebsites(id) {
    try {
      loading.value = true
      const response = await axios.get('get-websites-for-user?id='+ id);
      allUserWebsites.value = response.data
      loading.value = false
    } catch (error) {
      console.log(error)
      toast.error("Error getting user websites")
      loading.value = false;
    }

    loading.value = false;
  }

  async function fetchUsers() {
    try {
      loading.value = true;
      const response = await axios.get(
        `users?id=${userStore.currentWebsite}&limit=100&offset=0`
      );

      rowData.value = response.data.users
      loading.value = false;
      fetchWebsites()
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting jobs data")
    }

    loading.value = false;
  }

  async function connectUserToWebsite(userId, websiteId) {
    try {
      loading.value = true
      const { data } = await axios.post('connect-user-to-website', { userId, websiteId });
      loading.value = false
      toast.success("User connected to the website.")
      websitesModalOpen.value = !websitesModalOpen.value
      fetchUsers()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
    loading.value = false;
  }

  async function disconnectUserFromWebsite(userId, websiteId) {
    try {
      loading.value = true
      const { data } = await axios.post('disconnect-user-from-website', { userId, websiteId });
      loading.value = false
      toast.success("User disconnected from the website.")
      websitesModalOpen.value = !websitesModalOpen.value
      fetchUsers()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
    loading.value = false;
  }

  function objectExistsById(id) {
    return allUserWebsites.value.some(obj => obj.value === id);
  }


  onMounted(() => {
    fetchUsers()
  })

  watchEffect(() => {
    let b = selectedUser.value ? selectedUser.value.id : 0
  })

</script>

<template>
  <Header title="Users" /> 
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
          </div>
          <div class="mt-3 md:col-span-2">
            <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                 <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                  <div><h2 class="text-xl font-semibold text-left">User List</h2> </div>
                  <div class="relative text-right"></div>
                  <div class="relative text-right">
                    
                  </div>                   

                </div>  
                <ag-grid-vue
                    class="ag-theme-alpine"
                    style="height: 353px"
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
            Update User Details
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
          <FormKit type="form" v-if="selectedUser" id="employee" submit-label="Update" @submit="update" :actions="false" >

            <div class="double">
              <FormKit type="text" v-model="selectedUser.firstName" name="firstName" label="First Name" placeholder="Jane" outer-class="text-left" />
              <FormKit type="text" v-model="selectedUser.lastName" name="lastName" label="Last Name" placeholder="Doe" outer-class="text-left" />
            </div>

            <div class="double">
              <FormKit type="email" v-model="selectedUser.email" name="email" label="Email" placeholder="jane@company.com" outer-class="text-left" validation="email" />
              <FormKit type="tel" v-model="selectedUser.phone" name="phone" label="Phone" placeholder="0210002314" outer-class="text-left" validation="phone" />
            </div>


              
              <FormKit type="text" v-model="selectedUser.country" name="country" label="Country" placeholder="Country" outer-class="text-left" />
              <FormKit type="checkbox" v-model="selectedUser.lifetime" name="lifetime" label="Lifetime" placeholder="Cape Town" outer-class="text-left" />

            <FormKit type="submit" label="Update User" />

          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div id="websitesModalOpen" tabindex="-1" :class="{ flex: websitesModalOpen, hidden: !websitesModalOpen }" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-5xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl text-center font-semibold text-gray-900 dark:text-white">
            Connect or Disconnect websites for {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
          </h3>
          <button ref="closeDefaultModal" type="button"
            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            @click="websitesModalOpen = false">
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
          <ul class="list-none grid grid-cols-4 gap-4" v-if="allUserWebsites">
            <li v-for="website in allWebsites" :key="website.value" class="mb-1">
              <div class="text-center">
                <span v-if="website.label.length > 23">{{ website.label.slice(0, 23) + '...' }}</span>
                <span v-else>{{ website.label }}</span>
                <div>
                  <button
                    v-if="!objectExistsById(website.value)"
                    @click="connectUserToWebsite(selectedUser.id, website.value)"
                    class="bg-green-500 text-white font-semibold py-1 px-2 rounded-md hover:bg-green-600"
                  >
                    Connect
                  </button>
                  <button
                    v-else
                    @click="disconnectUserFromWebsite(selectedUser.id, website.value)"
                    class="bg-red-500 text-white font-semibold py-1 px-2 rounded-md ml-2 hover:bg-red-600"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen || websitesModalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>
