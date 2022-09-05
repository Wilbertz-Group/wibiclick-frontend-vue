<script setup>
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect } from "vue";
  import moment from 'moment'
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import axios from "axios";
  import _ from 'lodash';
  import { useToast } from 'vue-toast-notification';

  import { AgGridVue } from "ag-grid-vue3";
  import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
  import Edit from "@/components/Edit.vue";
  import Hubspot from "@/components/customers/Hubspot.vue";

  const userStore = useUserStore()
  const selectedContact = ref(null)
  const toast = useToast();
  const loading = ref(false)
  const options = ref()
  const series = ref()
  const paginationPageSize = ref(6)
  const modalOpen = ref(false)

  options.value = {
    chart: {
      height: 350,
      type: 'bar'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      labels: {
      datetimeUTC: false
    },
      categories: []
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      },
    },
  },

  series.value = [{
      name: 'customers',
      data: []
  }]

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
    let dt = params.value.slice(0, 16)
    return params.value ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY h:mm a') : '-';
  }

  const columnDefs = reactive({
    value: [
      { field: "name" }, 
      { field: "phone" }, 
      { field: "message" }, 
      { field: "address" }, 
      { field: "channel" },
      { field: "createdAt", valueFormatter: dateFormatter },  
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
        field: "foreignID", 
        headerName: "View", 
        maxWidth: 90,
        cellRendererSelector: params => {
          return {
              component: Hubspot,
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

  async function fetchContacts() {
    try {
      loading.value = true;
      const response = await axios.get(
        `customers?id=${userStore.currentWebsite}&limit=1000&offset=0`
      );

      rowData.value = response.data.customers

      let customerss = [];

      for (const c of response.data.customers) {
        customerss.push({
          x: c.createdAt,
          y: 1,
        });
      }

      const data = _.sortBy(customerss, 'x')

      const currentGroup = 'byDay';
      const grouped = _.groupBy(data, groups[currentGroup])
      const seriesData = Object.values(grouped).map( a => a.length )
      const optionsData = Object.keys(grouped)
          
      options.value = {
          chart: {
            height: 350,
            type: 'bar',
            toolbar: {
              autoSelected: "pan",
              show: false
            } 
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          xaxis: {
            type: 'datetime',
            labels: {
      datetimeUTC: false
    },
            categories: optionsData,
            labels: {
              style: {
                colors: '#FFFFFF'
              }
            }
          },
          yaxis: {
            min: 0,
            tickAmount: 4,
            labels: {
              style: {
                colors: '#FFFFFF'
              }
            }
          },
          fill: {
            gradient: {
              enabled: true,
              opacityFrom: 0.55,
              opacityTo: 0
            }
          },
          grid: {
            borderColor: "#fff",
            strokeDashArray: 2,
            clipMarkers: false,
            yaxis: {
              lines: {
                show: true
              }
            }
          },
          markers: {
            size: 5,
            colors: ["#ffffff"],
            strokeColor: "#00BAEC",
            strokeWidth: 3
          },
          tooltip: {
            theme: "dark",
            x: {
              format: 'dd MMM yyyy'
            },
          },
      }
      series.value = [{
        name: 'customers',
        data: seriesData
      }]

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting jobs data")
    }
  }

  async function update(credentials) {
    try {
      loading.value = true
      const { data } = await axios.post('add-customer?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success(data)
      modalOpen.value = !modalOpen.value
      fetchContacts()
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  const toggleEditModal = (event) => {
    if( event.value === undefined ){
      selectedContact.value = event.data
      modalOpen.value = !modalOpen.value
    } 
  }

  onMounted(() => {
    if(userStore.currentWebsite && userStore.user){
      fetchContacts()  
    }
  })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      fetchContacts() 
    }
  })

</script>

<template>
  <Header title="Contacts" /> 
  <div class=" mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            
          </div>
          <div class="mt-3 md:col-span-2">
             
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                    <div><h2 class="text-xl font-semibold text-left">Recent Contacts</h2> </div>
                    <div class="relative text-right"></div>
                    <div class="relative text-right">
                      <router-link :to="{name: 'add-customer'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add Contact</router-link>                
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
                  <div class="text-center mt-10 mb-10 pb-6 pr-3 shadow-lg rounded-lg bg-blueGray-800">
                    <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
                      <div class="flex flex-wrap items-center">
                        <div class="relative w-full max-w-full flex-grow flex-1 text-left">
                          <h6 class="uppercase mb-1 text-xs font-semibold text-blueGray-200">
                            Overview
                          </h6>
                          <h2 class="text-xl font-semibold text-white">New Contacts</h2>
                        </div>
                      </div>
                    </div>
                    
                    <apexchart type="bar" height="450" :options="options" :series="series"></apexchart>
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

  <div id="modalOpen" tabindex="-1" :class="{ flex: modalOpen, hidden: !modalOpen }" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Update Contact Details
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
          <FormKit type="form" v-if="selectedContact" id="customer" submit-label="Add" @submit="update" :actions="false" #default="{ value }">

            <div class="double">
              <FormKit type="text" v-model="selectedContact.name" name="name" label="Full Name" placeholder="Jane" outer-class="text-left"  />
              <FormKit type="select" v-model="selectedContact.channel" name="Reply" label="Reply" :options="[ 'Reply me by Email', 'Send me a message on Whatsapp', 'Use any of the above' ]"  />   
            </div>

            <div class="double">
              <FormKit type="email" v-model="selectedContact.email" name="Email" label="Email" placeholder="jane@company.com" outer-class="text-left" />
              <FormKit type="tel" v-model="selectedContact.phone" name="Phone" label="Phone" placeholder="0210002314" outer-class="text-left" validation="required|phone" />
            </div>

            <div class="double">
              <FormKit type="text" v-model="selectedContact.portal" name="portal" label="Portal" placeholder="Cape Town" outer-class="text-left"  />
              <FormKit type="text" v-model="selectedContact.foreignID" name="foreignID" label="Hubspot ID" placeholder="Cape Town" outer-class="text-left"  />
            </div>

            <FormKit type="textarea" v-model="selectedContact.message" name="Message" label="Issue" placeholder="HVAC & Appliance Technician" outer-class="text-left"  />

            <FormKit type="submit" label="Update Contact" />

          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>
