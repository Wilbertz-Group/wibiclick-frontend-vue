<script setup>
  import axios from "axios";
  import { onMounted, ref } from "vue";
  import Header from "@/components/Header.vue";  
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

	const dispayApps = ref('')
  const loading = ref(false)

  dispayApps.value = [
    {
      id: 1,
      name: 'Hubspot',
      description: 'Run Wibi Click with Hubspot Workflow Actions',
      connectLink: 'https://app.hubspot.com/oauth/authorize?client_id=62079123-0eea-43db-8952-9bdd6d6084fa&redirect_uri=https://cat-frontend-vue.vercel.app/hubspot&scope=automation%20oauth%20integration-sync%20crm.lists.read%20crm.objects.contacts.read%20crm.objects.contacts.write%20crm.lists.write',
      connectTitle: 'Connect to Hubspot',
      reconnectLink: 'https://app.hubspot.com/oauth/authorize?client_id=62079123-0eea-43db-8952-9bdd6d6084fa&redirect_uri=https://cat-frontend-vue.vercel.app/hubspot&scope=automation%20oauth%20integration-sync%20crm.lists.read%20crm.objects.contacts.read%20crm.objects.contacts.write%20crm.lists.write',
      reconnectTitle: 'Reconnect Hubspot'
    },
  ]

  async function fetchApps() {
			try {
        loading.value = true
				// const response = await axios.get('apps');
        // apikey.value = response.data.apps
        loading.value = false
			} catch (error) {
				console.log(error)
			}
  }

  onMounted(() => {
    fetchApps();
  })
</script>

<template>
  <Header title="Integration Apps" /> 
  <scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Integration Apps</h3>
              <p class="mt-1 text-sm text-gray-600">Connect apps to use them with the coupon allocation system</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                  <div class="min-w-full p-5 grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-3 shadow sm:rounded-md sm:overflow-hidden"> 
                    <div v-for="app in dispayApps" :key="app.id" class="cursor-pointer max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                      <div disabled="false" class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:bg-slate-100">
                        <div class="flex flex-col items-center pb-4 pt-4">
                            <svg id="hs-nav-v4--logo" viewBox="0 0 242.04 257" alt="Home" class="nav-logo logo mb-3 w-16 h-16 rounded-full shadow-lg"> <defs> <clipPath id="a"> <rect class="cls-1" x="42.87" y="46.9" width="156.42" height="163.35"></rect> </clipPath> </defs> <g class="cls-2"> <g class="cls-2"> <path class="cls-3" d="M162.79,101.25V82a14.84,14.84,0,0,0,8.56-13.38v-.45a14.87,14.87,0,0,0-14.83-14.83h-.45a14.87,14.87,0,0,0-14.83,14.83v.45A14.84,14.84,0,0,0,149.8,82v19.29a42.06,42.06,0,0,0-20,8.8L76.86,68.86a16.89,16.89,0,1,0-7.91,10.29L121,119.67a42.18,42.18,0,0,0,.65,47.56l-15.84,15.84a13.6,13.6,0,0,0-3.93-.64,13.75,13.75,0,1,0,13.75,13.75,13.56,13.56,0,0,0-.64-3.93l15.67-15.67a42.25,42.25,0,1,0,32.1-75.33m-6.49,63.42A21.68,21.68,0,1,1,178,143a21.68,21.68,0,0,1-21.68,21.68"></path> </g> </g> </svg>
                            <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{{app.name}}</h5>
                            <span class="text-sm text-black dark:text-sky-400">{{app.description}}</span>
                            <span class="flex mt-3 items-center pt-1 pb-2 text-xs text-center px-2 text-white bg-green-600 rounded-lg hover:bg-green-500 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"><span class="">connected</span></span>
                            <hr class="mt-4 bg-gray divide-y divide-gray-200 dark:divide-gray-700 h-1 w-3/4 mr-10 ml-10">
                            <div class="flex space-x-5">
                              <div class="flex mt-4 space-x-3 lg:mt-6">
                                  <a :href="app.connectLink" target="_blank" class="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{{ app.connectTitle }}</a>
                                  <a :href="app.reconnectLink" target="_blank" class="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-gray-900 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">{{ app.reconnectTitle }}</a>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>

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
    <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
  </div>
  <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>
