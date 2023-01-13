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
  import Edit from "@/components/invoices/Edit.vue";
  import View from "@/components/invoices/View.vue";
  import Status from "@/components/invoices/Status.vue";
  import Draggable from "vue3-draggable";

  const userStore = useUserStore()
  const toast = useToast();
  const loading = ref(false)
  const options = ref()
  const series = ref()
  const router = useRouter()

  const selectedInvoice = ref({})
  const paginationPageSize = ref(12)
  const modalOpen = ref(false)
  const status = ref(userStore.status)
  const invoicesApi = ref([])
  const invoicesStatusesApi = ref([])
  const colors = ref({
    pending: "bg-yellow-500",
    paid: "bg-green-500",
    processing: "bg-blue-500",
    sent: "bg-blue-800",
    Pending: "bg-yellow-500",
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
      name: 'invoices',
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

  async function fetchInvoices() {
    try {
      loading.value = true;
      const response = await axios.get(
        `invoices?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      rowData.value = response.data.invoices

      let fInvoices = {}, invAp = []

      response.data.invoices.forEach((itm) => {
        if (fInvoices[itm.reason]) {
          fInvoices[itm.reason].push(itm);
        } else {
          fInvoices[itm.reason] = [itm];
        }
      });

      Object.keys(fInvoices).forEach((itm) => {
        if(itm == 'sent' && itm != undefined){
          invAp[0] = {
            title: itm,
            invoices: fInvoices[itm]
          }
        } else if(itm == 'pending' && itm != undefined){
          invAp[1] = {
            title: itm,
            invoices: fInvoices[itm]
          }
        } else if(itm == 'paid' && itm != undefined){
          invAp[2] = {
            title: itm,
            invoices: fInvoices[itm]
          }
        }
      });

      invoicesApi.value = invAp.filter(e => e);

      invoicesStatusesApi.value = Object.keys(fInvoices)

      let invoicess = [];

      for (const invoice of response.data.invoices) {
        invoicess.push({
          x: invoice.issuedAt,
          y: 1,
        });
      }

      const data = _.sortBy(invoicess, 'x')

      const currentGroup = 'byDay';
      const grouped = _.groupBy(data, groups[currentGroup])
      const seriesData = Object.values(grouped).map( a => a.length )
      const optionsData = Object.keys(grouped)
          
      options.value = {
          chart: {
            height: 350,
            type: 'area',
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
        name: 'invoices',
        data: seriesData
      }]

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting invoices data")
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

  const depositFormatter = (params) => {
    return  'R' + params.data.deposit
  }

  const totalFormatter = (params) => {
    return  'R' + (Number(params.data.deposit) + Number(params.data.sales))
  }

  const columnDefs = reactive({
    value: [
      { field: "number", headerName: 'Invoice #', sort: 'desc', maxWidth: 150, },      
      { 
        field: "customer.name", 
        headerName: 'Client',
        cellRenderer: (params) => {
            const link = document.createElement("a");
            link.href = './invoices';
            link.classList.add("text-blue-600", "hover:underline", "dark:text-blue-500");
            link.innerText = params.value;
            link.addEventListener("click", e => {
              e.preventDefault();
              router.push({ path: '/contact', query: { customer_id: params.data.customer.id } })
            });
            return link;
        }
      },        
      { field: "employee", valueFormatter: nameFormatter },
      { field: "sales", headerName: 'Amount', valueFormatter: amountFormatter },
      { field: "deposit", headerName: 'Deposit', valueFormatter: depositFormatter },
      { field: "sales", headerName: 'Total', valueFormatter: totalFormatter },
      { field: "reason", headerName: 'Status', cellRendererSelector: params => {
          return {
              component: Status,
              params
          };
        }
      },  
      { field: "createdAt", valueFormatter: dateFormatter },      
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

  // onMounted(() => {
  //   if(userStore.currentWebsite && userStore.user){
  //     fetchInvoices()  
  //   }
  // })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      fetchInvoices(selectedInvoice)  
    }
  })

</script>

<template>
  <Header title="Invoices" /> 
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
                  <div><h2 class="text-xl font-semibold text-left">All Invoices</h2> </div>
                  <div class="relative text-right"></div>
                  <div class="relative text-right">
                    <router-link :to="{name: 'add-invoice'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5">Add Invoice <svg class="w-6 h-6 inline pb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></router-link> 
                  </div>
                </div> 

                <ag-grid-vue
                    class="ag-theme-alpine"
                    style="height: 580px"
                    :columnDefs="columnDefs.value"
                    :rowData="rowData.value"
                    :defaultColDef="defaultColDef"
                    :pagination="true"
                    :paginationPageSize="paginationPageSize"
                    rowSelection="multiple"
                    animateRows="true"
                    @grid-ready="onGridReady"
                  >
                </ag-grid-vue>

                <div class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1  mx-auto py-6">
                  <div></div>
                  <div class="relative text-right"></div>
                  <div class="relative text-right">
                    
                  </div>
                </div> 

                <div class="flex justify-center mb-24">    
                  <div class="min-h-[70vh] flex overflow-x-scroll overflow-y-scroll shadow bg-slate-100 w-full py-6 sm:px-6 lg:px-8 max-h-40 ">
                  
                    <div
                        v-for="column in invoicesApi"
                        :key="column.title"
                        v-if="invoicesApi"
                        class="rounded-lg px-3 py-3 column-width mr-4 max-h-40"
                      >
                      <p :class="colors[column.title]" class="text-white font-bold font-sans tracking-wide text-xl rounded-lg capitalize px-3 py-3">{{column.title}}</p>

                      <draggable v-model="column.invoices">
                          <template v-slot:item="{item}">
                              <div class="bg-white shadow rounded px-3 pt-3 pb-1 border border-white mt-3 cursor-move w-96">
                                <div class="flex justify-between mb-0">
                                  <p class="text-black font-bold font-sans tracking-wide text-xl capitalize">{{item.customer?.name}}</p>

                                  <p :class="colors[column.title]" class="text-sm text-white rounded-full shadow-md px-3 py-1.5 my-1 w-fit">{{item.reason}}</p>
                                </div>

                                <p class="text-lg text-black -mt-3 mb-3">{{item.employee?.firstName + ' ' + item.employee?.lastName}}</p>

                                <div class="mt-3 mb-4 p-2 shadow rounded-2xl bg-slate-100">
                                  <div class="flex justify-between">
                                    <p class="text-md font-bold text-black">Invoice Number</p>
                                    <p class="text-md text-black">#{{item.number}}</p>                                  
                                  </div>

                                  <div class="flex justify-between">
                                    <p class="text-md font-bold text-black">Amount</p>
                                    <p class="text-md text-black">{{'R' + (Number(item.deposit) + Number(item.sales))}}</p>                                  
                                  </div>

                                  <div class="flex justify-between">
                                    <p class="text-md font-bold text-black">Date</p>
                                    <p class="text-md text-black">{{universalDateFormatter(item.createdAt)}}</p>                                  
                                  </div>
                                </div>
                                                  
                                <div class="flex mt-4 mb-1 justify-between items-center">
                                  <router-link :to="{ name: 'edit-invoice', query:{ invoice_id: item.id } }" class="text-white cursor-pointer inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm  px-3 py-1 text-center">
                                    Edit
                                  </router-link>
                                  <router-link :to="{ name: 'view-invoice', query:{ invoice_id: item.id } }" class="text-white cursor-pointer inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm  px-3 py-1 text-center">
                                    View
                                  </router-link>
                                </div>
                              </div>
                          </template>
                      </draggable>
                    </div>


                  </div>
                </div>

                <div class="text-center mt-10 mb-10 pb-6 pr-3 shadow-lg rounded-lg bg-blueGray-800">
                  <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
                    <div class="flex flex-wrap items-center">
                      <div class="relative w-full max-w-full flex-grow flex-1 text-left">
                        <h6 class="uppercase mb-1 text-xs font-semibold text-blueGray-200">
                          Overview
                        </h6>
                        <h2 class="text-xl font-semibold text-white">Last sent invoices</h2>
                      </div>
                    </div>
                  </div>
                  <apexchart type="bar" height="450" :options="options" :series="series"></apexchart>
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
