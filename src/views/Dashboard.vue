<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { useUserStore } from "@/stores/UserStore"
import { useToast } from 'vue-toast-notification';

const options = ref();
const series = ref();
const voptions = ref();
const vseries = ref();
const loading = ref(false);
const userStore = useUserStore()
const toast = useToast();

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
    categories: ['2022-07-28T13:56:36.947Z']
  },
  tooltip: {
    x: {
      format: 'dd/MM/yy HH:mm'
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
    categories: ['2022-07-28T13:56:36.947Z']
  },
  tooltip: {
    x: {
      format: 'dd/MM/yy HH:mm'
    },
  },
},

vseries.value = [{
    name: 'clicks',
    data: ['12']
}]

async function fetchClicks() {
  try {
    loading.value = true;
    const response = await axios.get(
      "https://wibi.wilbertzgroup.com/get-website-clicks?id="+ userStore.currentWebsite
    );
    let clicksData = response.data.clicks;
        
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
          categories: Object.keys(clicksData)
        },
        tooltip: {
          x: {
            format: 'dd/MM/yy HH:mm'
          },
        },
    }
    series.value = [{
      name: 'clicks',
      data: Object.values(clicksData)
    }]

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
      "https://wibi.wilbertzgroup.com/get-website-views?id="+ userStore.currentWebsite
    );
    let viewsData = response.data.views;
        
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
          categories: Object.keys(viewsData)
        },
        tooltip: {
          x: {
            format: 'dd/MM/yy HH:mm'
          },
        },
    }
    vseries.value = [{
      name: 'views',
      data: Object.values(viewsData)
    }]

    loading.value = false;

  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error getting website views data")
  }
}

onMounted(() => {
  if(userStore.currentWebsite){
    fetchClicks()
    fetchViews()
  }
});
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
                  <span class="text-4xl grid md:grid-cols-2 ">{{ parseInt( (userStore?.analytics?.clicks/userStore?.analytics?.clicks) * 100 || 0 ) }} <i data-v-4d521fc4="" data-name="trending-up"
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

        <div class="w-full grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-1 gap-8">
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.whatsapp || 0 }}</h4>
            <button type="button"
              class="bg-gradient-to-r btn-air-light text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <span>
                <font-awesome-icon icon="fab fa-whatsapp" />
              </span>
              <span class="ml-2">Whatsapp</span>
            </button>
          </div>
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.messenger || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <span>
                <font-awesome-icon icon="fab fa-facebook-messenger" />
              </span>
              <span class="ml-2">Messenger</span>
            </button>
          </div>
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.mail || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <span>
                <font-awesome-icon icon="fas fa-envelope" />
              </span>
              <span class="ml-2">Mail</span>
            </button>
          </div>
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.message || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <font-awesome-icon icon="fas fa-comment" />
              <span class="ml-2">Send a message</span>
            </button>
          </div>

          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.call || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <span>
                <font-awesome-icon icon="fas fa-phone" />
              </span>
              <span class="ml-2">Calls</span>
            </button>
          </div>
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.telegram || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <span>
                <font-awesome-icon icon="fab fa-telegram" />
              </span>
              <span class="ml-2">Telegram</span>
            </button>
          </div>
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.viber || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <span>
                <font-awesome-icon icon="fab fa-viber" />
              </span>
              <span class="ml-2">Viber</span>
            </button>
          </div>
          <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.skype || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <font-awesome-icon icon="fas fa-comment" />
              <span class="ml-2">Skype</span>
            </button>
          </div>
          <!-- <div class="rounded-lg text-center pt-1 pb-6 border border-gray-200 shadow-md divide-y divide-gray-300/50">
            <h4 class="text-4xl py-4 text-center">{{ userStore?.analytics?.line || 0 }}</h4>
            <button type="button"
              class="btn-air-light text-white bg-green-400 hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-base px-10 pt-2 pb-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              <font-awesome-icon icon="fab fa-line" />
              <span class="ml-2">Line</span>
            </button>
          </div> -->
        </div>

        <div class="w-full rounded-lg text-center mt-10 pt-5 pb-6 pr-3 border border-gray-200 shadow-md divide-y divide-gray-300/50">
          <h4 class="text-4xl py-4 text-center">Clicks Analytics</h4>
          <apexchart type="area" height="450" :options="options" :series="series"></apexchart>
        </div>

        <div class="w-full rounded-lg text-center mt-10 pt-5 pb-6 pr-3 border border-gray-200 shadow-md divide-y divide-gray-300/50">
          <h4 class="text-4xl py-4 text-center">Views Analytics</h4>
          <apexchart type="area" height="450" :options="voptions" :series="vseries"></apexchart>
        </div>

      </div>
    </div>
  </div>
</template>
