<script setup>
import axios from "axios";
import _ from 'lodash';
import moment from 'moment'
import { ref, onMounted, watchEffect } from "vue";
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { useUserStore } from "@/stores/UserStore"
import { useToast } from 'vue-toast-notification';
import { useRoute } from "vue-router";
import timeline from "@/components/timeline.vue";


const route = useRoute()
const options = ref();
const series = ref();
const voptions = ref();
const vseries = ref();
const loading = ref(false);
const userStore = useUserStore()
const toast = useToast();
const items = ref([])

const buttons = {
  whatsapp: {
    name: "Whatsapp",
    icon: "fab fa-whatsapp",
    color: "bg-green-500 hover:bg-green-600"
  },
  messenger: {
    name: "Messenger",
    icon: "fab fa-facebook-messenger",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  mail: {
    name: "Mail",
    icon: "fas fa-envelope",
    color: "bg-red-500 hover:bg-red-600"
  },
  text: {
    name: "Text message",
    icon: "fas fa-comment",
    color: "bg-amber-500 hover:bg-amber-600"
  },
  call: {
    name: "Calls",
    icon: "fas fa-phone",
    color: "bg-black hover:bg-gray-800"
  },
  telegram: {
    name: "Telegram",
    icon: "fab fa-telegram",
    color: "bg-sky-600 hover:bg-sky-700"
  },
  viber: {
    name: "Viber",
    icon: "fab fa-viber",
    color: "bg-purple-500 hover:bg-purple-600"
  },
  skype: {
    name: "Skype",
    icon: "fab fa-skype",
    color: "bg-sky-500 hover:bg-sky-600"
  }
}

options.value = {
  chart: {
    height: 350,
    type: 'area'
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
    categories: ['2022-07-28T13:56:36.947Z']
  },
  tooltip: {
    x: {
      format: 'dd MMM yyyy'
    },
  },
},

series.value = [{
    name: 'clicks',
    data: ['12']
}]

voptions.value = {
  chart: {
    height: 350,
    type: 'area'
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
    categories: ['2022-07-28T13:56:36.947Z']
  },
  tooltip: {
    x: {
      format: 'dd MMM yyyy'
    },
  },
},

vseries.value = [{
    name: 'clicks',
    data: ['12']
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

async function fetchClicks() {
  try {
    loading.value = true;
    const response = await axios.get(
      "get-website-clicks?id="+ userStore.currentWebsite
    );

    const data = _.sortBy(response.data.clicks, 'x')

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
      name: 'clicks',
      data: seriesData
    }]

    loading.value = false;
    fetchViews()    
  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error getting website clicks data")
  }
}

async function fetchRecentClicks() {
  try {
    loading.value = true;
    const response = await axios.get(
      "get-recent-clicks?id="+ userStore.currentWebsite
    );

    items.value = response.data.clicks

    loading.value = false;

  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error getting website clicks data")
  }
}

async function fetchViews() {
  try {
    loading.value = true;
    const response = await axios.get(
      "get-website-views?id="+ userStore.currentWebsite
    );

    const data = _.sortBy(response.data.views, 'x')
    
    const currentGroup = 'byDay';
    const grouped = _.groupBy(data, groups[currentGroup])
    const seriesData = Object.values(grouped).map( a => a.length )
    const optionsData = Object.keys(grouped)
        
    voptions.value = {
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
    vseries.value = [{
      name: 'views',
      data: seriesData
    }]

    loading.value = false;
    
  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error getting website views data")
  }
}

async function checkParams() {
  if( route.query.state == "succeeded" ){    
    toast.success("You have successfully registered and automatically logged in..")
  }
} 

onMounted(async () => { 
  checkParams();
  if(userStore.currentWebsite && userStore.user){
    fetchClicks()  
    fetchRecentClicks()  
  }
  if(!userStore.user){
    toast.error("Please add billing information")
    userStore.$reset()
    localStorage.removeItem('user')
    localStorage.removeItem('UserStore')
    location.reload()
  }
})

watchEffect(() => {    
  if(userStore.currentWebsite){
    fetchClicks()
    fetchViews()
    fetchRecentClicks()
  }
})

</script>

<template>
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div>
    <div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50">
      <div
        class="w-full min-h-screen relative bg-white px-6 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:rounded-lg sm:px-10">
        <div class="w-full grid py-8 md:grid-cols-3 sm:grid-cols-1 gap-3">
          <div class="rounded-lg border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <div class="space-y-6 pt-8 pb-16 text-center leading-7 text-black-600 relative">
              <div class="grid px-4 md:grid-cols-2 gap-3">
                <span class="text-left text-sm tracking-tight font-bold">Total Views <br>
                  <span class="text-4xl grid md:grid-cols-2 ">{{ userStore?.analytics?.views || 0 }} <i data-v-4d521fc4="" data-name="trending-up"
                      data-tags="" data-type="trending-up" class="text-green-600 font-bold"><svg data-v-4d521fc4=""
                        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="feather feather-trending-up feather__content">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg></i></span>
                </span>
                <span class="text-right text-sm tracking-tight font-bold">
                  <span class="flat-badge-success py-1 px-1.5 rounded-xl">
                    <font-awesome-icon icon="fa-solid fa-circle-chevron-up" />
                  </span>
                </span>
              </div>
              <div class="progress sm-progress-bar progress-animate px-4">
                <div role="progressbar" aria-valuenow="99" aria-valuemin="0" aria-valuemax="100"
                  class="progress-gradient-success h-1.5" style="width: 99%">
                  <span class="text-green-600 absolute -bottom-4">99%</span>
                  <span class="animate-circle"></span>
                </div>
              </div>
              <span class="tag-content-success tag-hover-effect">
                <i data-v-4d521fc4="" data-name="trending-up" data-tags="" data-type="trending-up"
                  class="feather feather--trending-up"><svg data-v-4d521fc4="" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-trending-up feather__content">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </i>
              </span>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <div class="space-y-6 pt-8 pb-16 text-center leading-7 text-black-600 relative">
              <div class="grid px-4 md:grid-cols-2 gap-3">
                <span class="text-left text-sm tracking-tight font-bold">Total Clicks <br>
                  <span class="text-4xl grid md:grid-cols-2 ">{{ userStore?.analytics?.clicks || 0 }} <i data-v-4d521fc4="" data-name="trending-up"
                      data-tags="" data-type="trending-up" class="text-red-600 font-bold"><svg data-v-4d521fc4=""
                        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="feather feather-trending-up feather__content">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg></i></span>
                </span>
                <span class="text-right text-sm tracking-tight font-bold">
                  <span class="flat-badge-secondary py-1 px-1.5 rounded-xl">
                    <font-awesome-icon icon="fa-solid fa-circle-chevron-up" />
                  </span>
                </span>
              </div>
              <div class="progress sm-progress-bar progress-animate px-4">
                <div role="progressbar" aria-valuenow="87" aria-valuemin="0" aria-valuemax="100"
                  class="progress-gradient-secondary h-1.5" style="width: 87%">
                  <span class="text-red-600 absolute -bottom-4">87%</span>
                  <span class="animate-circle"></span>
                </div>
              </div>
              <span class="tag-content-secondary tag-hover-effect">
                <i data-v-4d521fc4="" data-name="trending-up" data-tags="" data-type="trending-up"
                  class="feather feather--trending-up"><svg data-v-4d521fc4="" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-trending-up feather__content">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </i>
              </span>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <div class="space-y-6 pt-8 pb-16 text-center leading-7 text-black-600 relative">
              <div class="grid px-4 md:grid-cols-2 gap-3">
                <span class="text-left text-sm tracking-tight font-bold">CTR Clickthrough Rate <br>
                  <span class="text-4xl grid md:grid-cols-2 ">{{ parseInt( (userStore?.analytics?.clicks/userStore?.analytics?.views) * 100 || 0 ) }}% <i data-v-4d521fc4="" data-name="trending-up"
                      data-tags="" data-type="trending-up" class="text-blue-600 font-bold"><svg data-v-4d521fc4=""
                        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="feather feather-trending-up feather__content">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg></i></span>
                </span>
                <span class="text-right text-sm tracking-tight font-bold">
                  <span class="flat-badge-primary py-1 px-1.5 rounded-xl">
                    <font-awesome-icon icon="fa-solid fa-circle-chevron-up" />
                  </span>
                </span>
              </div>
              <div class="progress sm-progress-bar progress-animate px-4">
                <div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"
                  class="progress-gradient-primary h-1.5" style="width: 75%">
                  <span class="text-blue-600 absolute -bottom-4">75%</span>
                  <span class="animate-circle"></span>
                </div>
              </div>
              <span class="tag-content-primary tag-hover-effect">
                <i data-v-4d521fc4="" data-name="trending-up" data-tags="" data-type="trending-up"
                  class="feather feather--trending-up"><svg data-v-4d521fc4="" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-trending-up feather__content">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </i>
              </span>
            </div>
          </div>
        </div>

        <div class="w-full md:grid md:grid-cols-3 gap-8">          
          <div class="md:col-span-2 sm:grid-cols-none">
            <div class="w-full grid md:grid-cols-3 sm:grid-cols-1 gap-8">
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.whatsapp || 0 }}</h4>
                <button type="button" :class="buttons.whatsapp.color"
                  class="bg-gradient-to-r btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.whatsapp.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.whatsapp.name }}</span>
                </button>
              </div>
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.messenger || 0 }}</h4>
                <button type="button" :class="buttons.messenger.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.messenger.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.messenger.name }}</span>
                </button>
              </div>
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.mail || 0 }}</h4>
                <button type="button" :class="buttons.mail.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.mail.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.mail.name }}</span>
                </button>
              </div>
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.message || 0 }}</h4>
                <button type="button" :class="buttons.text.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.text.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.text.name }}</span>
                </button>
              </div>

              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.call || 0 }}</h4>
                <button type="button" :class="buttons.call.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.call.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.call.name }}</span>
                </button>
              </div>
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.telegram || 0 }}</h4>
                <button type="button" :class="buttons.telegram.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.telegram.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.telegram.name }}</span>
                </button>
              </div>
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.viber || 0 }}</h4>
                <button type="button" :class="buttons.viber.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.viber.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.viber.name }}</span>
                </button>
              </div>
              <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
                <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.skype || 0 }}</h4>
                <button type="button" :class="buttons.skype.color"
                  class="btn-air-light text-white focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                  <span>
                    <font-awesome-icon :icon="buttons.skype.icon" />
                  </span>
                  <span class="ml-2">{{ buttons.skype.name }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="rounded-lg text-center border border-gray-200 shadow-md mt-5">
              <h4 class="text-sm tracking-tight font-bold py-6">Recent Click Activity</h4>
              <div class="h-96 overflow-y-auto">
                <timeline :items="items" :buttons="buttons"></timeline>
                <div v-if="!items.length">
                    No activity recorded yet
                </div>
              </div>
          </div> 
        </div>

        <div class="grid grid-cols-none md:grid-cols-2 gap-3">
          <div class="text-center mt-10 pb-6 pr-3 shadow-lg rounded-lg bg-blueGray-800">
            <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
              <div class="flex flex-wrap items-center">
                <div class="relative w-full max-w-full flex-grow flex-1 text-left">
                  <h6 class="uppercase mb-1 text-xs font-semibold text-blueGray-200">
                    Overview
                  </h6>
                  <h2 class="text-xl font-semibold text-white">Views Analytics</h2>
                </div>
              </div>
            </div>
            <apexchart type="area" height="450" :options="voptions" :series="vseries"></apexchart>
          </div>
          <div class="text-center mt-10 pb-6 pr-3 shadow-lg rounded-lg bg-blueGray-800">
            <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
              <div class="flex flex-wrap items-center">
                <div class="relative w-full max-w-full flex-grow flex-1 text-left">
                  <h6 class="uppercase mb-1 text-xs font-semibold text-blueGray-200">
                    Overview
                  </h6>
                  <h2 class="text-xl font-semibold text-white">Clicks Analytics</h2>
                </div>
              </div>
            </div>
            <apexchart type="area" height="450" :options="options" :series="series"></apexchart>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>