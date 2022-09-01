<script setup>
  import Header from "@/components/Header.vue";  
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, watchEffect } from "vue";
  import { useRouter, useRoute } from "vue-router";
  import { Grid, h } from "gridjs";
  import moment from 'moment'
  import "gridjs/dist/theme/mermaid.css";
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import axios from "axios";
  import _ from 'lodash';
  import { useToast } from 'vue-toast-notification';

  const userStore = useUserStore()
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

  async function fetchVisitors() {
    try {
      loading.value = true;
      const response = await axios.get(
        `visitors?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

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

  const grid = new Grid().updateConfig({
    columns: ['Page', 'Views', 'Clicks', 'Customer', 'Updated'],
    pagination: {
      enabled: true,
      limit: 5,
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
      url: `https://wibi.wilbertzgroup.com/visitors/`,
      then: data => data.visitors.map(c => 
        [ c.page.url, c.views, c.clicks, c.customer ? c.customer.name : '', c.updatedAt ? moment().isSame(c.updatedAt, 'day') ? moment(c.updatedAt).format('h:mm a') : moment(c.updatedAt).format('MMM DD, YYYY h:mm a') : '-']
      ),
      total: data => data.total
    },
    language: {
      'search': {
        'placeholder': '🔍 Search page...'
      },
      'pagination': {
        'previous': '⬅️',
        'next': '➡️',
        'showing': 'Displaying',
        'results': () => 'Visitors'
      }
    }
  })


  onMounted(() => {
    if(userStore.currentWebsite && userStore.user){
      fetchVisitors()  
      grid.render(visitorsNode.value)
    }
  })

  watchEffect(() => {    
    if(userStore.currentWebsite){
      if(grid.callbacks == undefined){
        grid.render(visitorsNode.value)
      } else {
        grid.forceRender()
      }
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
                 <router-link :to="{name: 'add-visitor'}" class="text-white bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5">Add Visitor</router-link>                
              </div>                   

            </div>   
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <div id="label"></div>
                  <div ref="visitorsNode"></div>
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
