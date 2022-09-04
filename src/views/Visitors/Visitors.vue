<script setup>
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect } from "vue";
  import moment from 'moment'
  import axios from "axios";
  import _ from 'lodash';
  import { useToast } from 'vue-toast-notification';

  import { AgGridVue } from "ag-grid-vue3";
  import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS

  const userStore = useUserStore()
  const paginationPageSize = ref(16)

  const visitorsNode = ref(null)
  const toast = useToast();
  const loading = ref(false)
  const options = ref()
  const series = ref()

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
      name: 'visitors',
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
    return params.value ? moment().isSame(params.value, 'day') ? moment(params.value).format('h:mm a') : moment(params.value).format('MMM DD, YYYY h:mm a') : '-';
  }

  const columnDefs = reactive({
    value: [
      { field: "page.url" }, 
      { field: "views", maxWidth: 100 }, 
      { field: "clicks", maxWidth: 100 }, 
      { field: "updatedAt", valueFormatter: dateFormatter, maxWidth: 200 },   
    ],
  });

  const defaultColDef = {
    sortable: true,
    filter: true,
    flex: 1,
  };

  async function fetchVisitors() {
    try {
      loading.value = true;
      const response = await axios.get(
        `visitors?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      rowData.value = response.data.visitors

      let visitorss = [];

      for (const c of response.data.visitors) {
        visitorss.push({
          x: c.updatedAt,
          y: 1,
        });
      }

      const data = _.sortBy(visitorss, 'x')

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
        name: 'visitors',
        data: seriesData
      }]

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting visitors data")
    }
  }

  onMounted(() => {
    if(userStore.currentWebsite && userStore.user){
      fetchVisitors()  
    }
  })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      fetchVisitors() 
    }
  })

</script>

<template>
  <Header title="Visitors" /> 
  <div class=" mx-auto py-6 sm:px-6 lg:px-8">
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
          <div class="md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <ag-grid-vue
                      class="ag-theme-alpine"
                      style="height: 800px"
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
                  <div class="text-center mt-10 mb-10 pb-6 pr-3 shadow-lg rounded-lg bg-blueGray-800">
                    <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
                      <div class="flex flex-wrap items-center">
                        <div class="relative w-full max-w-full flex-grow flex-1 text-left">
                          <h6 class="uppercase mb-1 text-xs font-semibold text-blueGray-200">
                            Overview
                          </h6>
                          <h2 class="text-xl font-semibold text-white">New Visitors</h2>
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

</template>
