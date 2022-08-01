<script setup>
  import axios from "axios";
  import { onMounted, ref } from "vue";
  import Header from "@/components/Header.vue";
	import { useUserStore } from "@/stores/UserStore"

	const monthly = ref(false)
	const monthlyEl = ref()
	const yearly = ref(false)
	const userStore = useUserStore()

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
		try {		
			const cbInstance = Chargebee.getInstance()	
		} catch (error) {		
			document.addEventListener("DOMContentLoaded", function() {
				const cbInstance = Chargebee.getInstance();

				// To add coupons and customer related information with custom fields
				let cart = cbInstance.getCart();
				cart.setCustomer({ 
					email: userStore.user.email, 
					first_name: userStore.user.first_name, 
					last_name: userStore.user.last_name
				})
			})
		}
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
										<h5 class="mb-4 text-xl font-medium text-black-500 dark:text-gray-400">Monthly Subscription</h5>
										<div class="flex items-baseline text-gray-900 dark:text-white">
												<span class="text-3xl font-semibold">$</span>
												<span class="text-5xl font-extrabold tracking-tight">12</span>
												<span class="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span>
										</div>
										<!-- Campaign -->
										<ul role="campaign" class="my-7 space-y-5">
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Add Upto 5 Websites</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Invocations Included 8000/m</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Codes $0.0005 each</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Integration help</span>
												</li>											
												<li class="flex space-x-3 line-through decoration-gray-500">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500">Prioritized email support</span>
												</li>
										</ul>
										<a href="javascript:void(0)" v-if="monthly" ref="monthlyEl" data-cb-type="portal" class="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Manage Plan</a>
										<a href="javascript:void(0)" v-if="!monthly" data-cb-type="checkout" data-cb-item-0="Monthly-Subscription-USD-Monthly" data-cb-item-0-quantity="1" class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Choose Plan</a>
								</div>

								<div class="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										<h5 class="mb-4 text-xl font-medium text-black-500 dark:text-gray-400">Yearly Subscription</h5>
										<div class="flex items-baseline text-gray-900 dark:text-white">
												<span class="text-3xl font-semibold">$</span>
												<span class="text-5xl font-extrabold tracking-tight">120</span>
												<span class="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/year</span>
										</div>
										<!-- Campaign -->
										<ul role="campaign" class="my-7 space-y-5">
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Add Upto 5 Websites</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Invocations Included 100 000/year</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Invocation $0.0002 each</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Integration help</span>
												</li>											
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500">Prioritized email support</span>
												</li>
										</ul>
										<a href="javascript:void(0)" v-if="yearly" data-cb-type="portal" class="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Manage Plan</a>
										<a href="javascript:void(0)" v-if="!yearly" data-cb-type="checkout" data-cb-item-0="Yearly-Subscription-USD-Yearly" data-cb-item-0-quantity="1" class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Choose Plan</a>
								</div>

              </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
