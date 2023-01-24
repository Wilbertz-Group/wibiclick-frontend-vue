<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect } from "vue";
  import moment from 'moment'
  import _ from 'lodash';
  import { useRouter } from "vue-router";
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  import { AgGridVue } from "ag-grid-vue3";
  import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
  import Edit from "@/components/insurance/Edit.vue";
  import View from "@/components/insurance/View.vue";
  import Status from "@/components/insurance/Status.vue";
  import Draggable from "vue3-draggable";

  const userStore = useUserStore()
  const toast = useToast();
  const loading = ref(false)
  const options = ref()
  const series = ref()
  const router = useRouter()

  const selectedInsurance = ref({})
  const paginationPageSize = ref(12)
  const modalOpen = ref(false)
  const status = ref(userStore.status)
  const insurancesApi = ref([])
  const insurancesStatusesApi = ref([])
  const colors = ref({
    rejected: "bg-red-600",
    accepted: "bg-green-500",
    sent: "bg-blue-600",
  })

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
      name: 'insurance-reports',
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

  async function fetchInsurances() {
    try {
      loading.value = true;
      const response = await axios.get(
        `insurance-reports?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      rowData.value = response.data.insurance

      let fInsurances = {}, estAp = []

      response.data.insurance.forEach((itm) => {
        if (fInsurances[itm.status]) {
          fInsurances[itm.status].push(itm);
        } else {
          fInsurances[itm.status] = [itm];
        }
      });

      Object.keys(fInsurances).forEach((itm) => {
        estAp.push({
          title: itm,
          insurances: fInsurances[itm]
        })
      });

      insurancesApi.value = estAp.filter(e => e);

      insurancesStatusesApi.value = Object.keys(fInsurances)

      let insurancess = [];

      for (const insurances of response.data.insurance) {
        insurancess.push({
          x: insurances.issuedAt,
          y: 1,
        });
      }

      const data = _.sortBy(insurancess, 'x')

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
        name: 'insurance-reports',
        data: seriesData
      }]

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting insurance reports data")
    }
  }

  const gridApi = ref(null); 
  const onGridReady = (params) => {
    gridApi.value = params.api;
  };
  const rowData = reactive({}); 

  const dateFormatter = (params) => {
    let dt = params.value
    return params.value ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY') : '-';
  }

  const nameFormatter = (params) => {
    return  params.data.employee.firstName + ' ' + params.data.employee.lastName
  }

  const universalDateFormatter = (dat) => {
    let dt = dat
    return moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format("dddd, DD MMMM YYYY");
  }

  const amountFormatter = (params) => {
    return  'R' + params.data.sales
  }

  const columnDefs = reactive({
    value: [
      { field: "number", headerName: 'Insurance #', sort: 'desc', maxWidth: 250, },      
      { 
        field: "customer.name", 
        headerName: 'Client',
        cellRenderer: (params) => {
            const link = document.createElement("a");
            link.href = './insurance-reports';
            link.classList.add("text-blue-600", "hover:underline", "dark:text-blue-500");
            link.innerText = params.value;
            link.addEventListener("click", e => {
              e.preventDefault();
              router.push({ path: '/contact', query: { customer_id: params.data.customer.id } })
            });
            return link;
        }
      }, 
      { field: "createdAt", valueFormatter: dateFormatter }, 
      { field: "status", headerName: 'Status', cellRendererSelector: params => {
          return {
              component: Status,
              params
          };
        }
      },              
      // { 
      //   field: "id", 
      //   headerName: 'Edit',
      //   maxWidth: 80,
      //   cellRendererSelector: params => {
      //     return {
      //         component: Edit,
      //         params
      //     };
      //   } 
      // },  
      // { 
      //   field: "id", 
      //   headerName: 'View',
      //   maxWidth: 85,
      //   cellRendererSelector: params => {
      //     return {
      //         component: View,
      //         params
      //     };
      //   } 
      // },       
    ],
  });

  const defaultColDef = {
    sortable: true,
    filter: true,
    flex: 1,
  }

  async function update(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-insurance-report?id='+ userStore.currentWebsite, credentials);
      loading.value = false
      modalOpen.value = false
      fetchInsurances() 
      toast.success("Successfully updated insurance report details")
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  const toggleEditModal = (event) => {
    if( event.value === undefined ){
      let data = event.data
      data.issuedAt = moment(data.issuedAt).format('YYYY-MM-DDTHH:MM')
      selectedInsurance.value = data      
      modalOpen.value = !modalOpen.value
    } 
  }

  // onMounted(() => {
  //   if(userStore.currentWebsite && userStore.user){
  //     fetchInsurances()  
  //   }
  // })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      fetchInsurances(selectedInsurance)  
    }
  })

</script>

<template>
  <Header title="Insurance reports" /> 
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-2 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
               
          </div>
          <div class="mt-3 md:col-span-2">
              <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">

                <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                  <div><h2 class="text-xl font-semibold text-left">All Insurance reports</h2> </div>
                  <div class="relative text-right"></div>
                  <div class="relative text-right">
                    <router-link :to="{name: 'add-insurance-report'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5">Add Insurance <svg class="w-6 h-6 inline pb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></router-link> 
                  </div>
                </div> 

                <ag-grid-vue
                    class="ag-theme-alpine"
                    style="height:580px"
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

                <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1  mx-auto py-6">
                  <div></div>
                  <div class="relative text-right"></div>
                  <div class="relative text-right">
                    
                  </div>
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

  <div id="modalOpen" tabindex="-1" :class="{ flex: modalOpen, hidden: !modalOpen }" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Update Insurance Details
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
          <FormKit type="form" v-if="selectedInsurance" id="insurance" submit-label="Add" @submit="update" :actions="false" >

            <FormKit type="hidden" v-model="selectedInsurance.jobId" name="jobId" label="Job" />                     

            <div class="double">
              <FormKit type="select" v-model="selectedInsurance.status" name="status" label="Insurance Stage" :options="status" />  
              <FormKit type="text" v-model="selectedInsurance.name" name="name" label="Insurance Name" placeholder="Insurance Name" outer-class="text-left" />                   
            </div>

            <div class="">
              <FormKit type="text" v-model="selectedInsurance.number" name="number" label="Insurance Number" placeholder="Insurance Number" outer-class="text-left" />
            </div>                    

            <div class="double">
              <FormKit type="datetime-local" v-model="selectedInsurance.issuedAt" name="issuedAt" label="Issued Date" placeholder="Issued Date" outer-class="text-left" />
              <FormKit type="text" v-model="selectedInsurance.amount" name="amount" label="Insurance Amount" placeholder="Insurance Amount" outer-class="text-left" />
            </div>   

            <FormKit type="textarea" v-model="selectedInsurance.notes" name="notes" label="Insurance Notes" placeholder="Insurance Notes" outer-class="text-left" />
            
            <FormKit type="hidden" v-model="selectedInsurance.id" name="id" label="ID" /> 

            <FormKit type="submit" label="Update insurance" />

          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>

</template>
