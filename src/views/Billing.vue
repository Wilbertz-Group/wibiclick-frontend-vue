<script setup>
  import axios from "axios";
  import { onMounted, ref } from "vue";
  import Header from "@/components/Header.vue";

	const apikey = ref('')
	const serviceKey = ref('')

  // async function fetchKeys() {
	// 		try {
	// 			const response = await axios.get('https://cat-apis.azurewebsites.net/keys');
  //       apikey.value = response.data.apikey
	// 			serviceKey.value = response.data.serviceKey
	// 			loading.value = false
	// 		} catch (error) {
	// 			console.log(error)
	// 		}
  // }

  onMounted(() => {
    //fetchKeys();
  })
</script>

<template>
  <Header title="Billing & Usage" />  
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Your Current Usage</h3>
              <p class="mt-1 text-sm text-gray-600">Codes delivered this period</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="p-4 shadow sm:rounded-md sm:overflow-hidden">
                  
								<div class="flex justify-between mb-1">
									<span class="text-base font-medium text-black-700 dark:text-white">Codes</span>
									<span class="text-sm font-medium text-black-700 dark:text-white">450 / 1000</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
									<div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: 45%"> 45%</div>
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

			<div>
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Billing</h3>
              <p class="mt-1 text-sm text-gray-600">Choose a plan that will work for you</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="p-4 grid grid-cols-2 gap-3 shadow sm:rounded-md sm:overflow-hidden">
                  
								<div class="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										<h5 class="mb-4 text-xl font-medium text-black-500 dark:text-gray-400">Starter 
											<span type="button" class="float-right text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg shadow-cyan-500/50 dark:shadow-lg dark:shadow-cyan-800/80 font-small rounded-lg text-sm px-5 py-1.5 text-center mr-2 mb-2">Your Current Plan</span>
										</h5>
										<div class="flex items-baseline text-gray-900 dark:text-white">
												<span class="text-3xl font-semibold">$</span>
												<span class="text-5xl font-extrabold tracking-tight">24</span>
												<span class="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span>
										</div>
										<!-- Campaign -->
										<ul role="campaign" class="my-7 space-y-5">
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Codes Included 1000/m</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Codes $0.05 each</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Integration help</span>
												</li>
												<li class="flex space-x-3 line-through decoration-gray-500">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500">API Access</span>
												</li>												
												<li class="flex space-x-3 line-through decoration-gray-500">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500">Prioritized email support</span>
												</li>
										</ul>
										<button disabled type="button" class="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Your plan</button>
								</div>

								<div class="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										<h5 class="mb-4 text-xl font-medium text-black-500 dark:text-gray-400">Pro</h5>
										<div class="flex items-baseline text-gray-900 dark:text-white">
												<span class="text-3xl font-semibold">$</span>
												<span class="text-5xl font-extrabold tracking-tight">79</span>
												<span class="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span>
										</div>
										<!-- Campaign -->
										<ul role="campaign" class="my-7 space-y-5">
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Codes Included 10 000/m</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Codes $0.02 each</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Integration help</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500">API Access</span>
												</li>												
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500">Prioritized email support</span>
												</li>
										</ul>
										<button type="button" class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Upgrade to Pro</button>
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
