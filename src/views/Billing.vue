<script setup>
  import axios from "axios";
	import moment from 'moment'
  import { onMounted, ref } from "vue";
  import Header from "@/components/Header.vue";
	import { useUserStore } from "@/stores/UserStore"
	import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

	const monthly = ref(false)
	const yearly = ref(false)
	const loading = ref(false);
	const billing_data = ref({})
	const userStore = useUserStore()

  async function fetchSubscriptionStatus() {
			try {
				loading.value = true
				const response = await axios.get('subscription-status');
        response.data.billing_period_unit == "month" ? monthly.value = true : ''
				response.data.billing_period_unit == "year" ? yearly.value = true : ''
				billing_data.value = response.data
				loading.value = false
			} catch (error) {
				console.log(error)
			}
  }

	async function initChargebee() {	
		try {		
			loading.value = true
			const chargebeeInstance = Chargebee.getInstance()	
			runChargebee(chargebeeInstance)
		} catch (error) {		
			const chargebeeInstance = window.Chargebee.getInstance();						
			runChargebee(chargebeeInstance)
		}
	}

	async function runChargebee(chargebeeInstance) {
		//Setup Portal Session
		const userData = await axios.get("/create_portal_session")
		await chargebeeInstance.setPortalSession(userData.data.portal_session)

		let cbPortal = chargebeeInstance.createChargebeePortal()
		loading.value = false
		cbPortal.open()
	}

  onMounted(() => {
    fetchSubscriptionStatus()
  })
</script>

<template>
  <Header title="Billing & Usage" />  
	<scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
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
									<span class="text-base font-medium text-black-700 dark:text-white">Websites</span>
									<span class="text-sm font-medium text-black-700 dark:text-white">1 / 3</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
									<div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: 33%"> 33%</div>
								</div>

              </div>
							<div class="p-4 shadow sm:rounded-md sm:overflow-hidden">                  
								<div class="flex justify-between mb-1">
									<span class="text-base font-medium text-black-700 dark:text-white">Invocations</span>
									<span class="text-sm font-medium text-black-700 dark:text-white">450 / 8000</span>
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
              <div class="p-4 grid grid-cols-1 gap-3  shadow sm:rounded-md sm:overflow-hidden">								
                  
								<div v-if="monthly" class="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										<h5 class="mb-4 text-xl font-medium text-black-500 dark:text-gray-400">Monthly Subscription</h5>
										
										<div class="flex items-baseline text-gray-900 dark:text-white">
												<span class="text-3xl font-semibold">{{ billing_data.currency_code }}</span>
												<span class="text-5xl font-extrabold tracking-tight">4.99</span>
												<span class="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span>
										</div>
										<!-- Campaign -->
										<ul role="campaign" class="my-7 space-y-5">
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">3 websites included </span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Invocations Included 8000/month</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Invocations $0.0005 each</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Website $2.05 each/month</span>
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
										
										<a href="javascript:void(0)" v-if="monthly" @click="initChargebee()" data-cb-type="portal" class="text-white bg-gray-800 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center"> Manage Plan</a>
										<span v-if="monthly && billing_data.status == 'active'" class="mt-2 text-xs text-green-600 text-center w-full block">automatically renews on {{ moment(billing_data.current_term_end).format('DD, MMMM YYYY') }} </span>
										<span v-if="monthly && billing_data.status != 'active'" class="mt-2 text-xs text-green-600 text-center w-full block">ends on {{ moment(billing_data.current_term_end).format('DD, MMMM YYYY') }} </span>
								</div>

								<div v-if="yearly" class="p-4 max-w-sm bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										<h5 class="mb-4 text-xl font-medium text-black-500 dark:text-gray-400">Yearly Subscription</h5>

										<div class="flex items-baseline text-gray-900 dark:text-white">
												<span class="text-3xl font-semibold">{{ billing_data.currency_code }}</span>
												<span class="text-5xl font-extrabold tracking-tight">49.90</span>
												<span class="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/year</span>
										</div>
										<!-- Campaign -->
										<ul role="campaign" class="my-7 space-y-5">
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">3 websites included </span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Invocations Included 100 000/year</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Invocations $0.02 each/year</span>
												</li>
												<li class="flex space-x-3">
														<!-- Icon -->
														<svg aria-hidden="true" class="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Check icon</title><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
														<span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">Extra Website $20 each/year</span>
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
																			
										<a href="javascript:void(0)" v-if="yearly" @click="initChargebee()" data-cb-type="portal" class="text-white bg-gray-800 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">Manage Plan</a>
										<span v-if="yearly && billing_data.status == 'active'" class="mt-2 text-xs text-green-600 text-center w-full block">automatically renews on {{ moment(billing_data.current_term_end).format('DD, MMMM YYYY') }} </span>
										<span v-if="yearly && billing_data.status != 'active'" class="mt-2 text-xs text-green-600 text-center w-full block">ends on {{ moment(billing_data.current_term_end).format('DD, MMMM YYYY') }} </span>
								</div>

              </div>
							<h3 v-if="billing_data.due_invoices_count" class="m-5 text-base font-normal leading-tight text-red-500 dark:text-red-400">You currently have {{ billing_data.due_invoices_count }} due invoices</h3>
          </div>
        </div>
      </div>
			<div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
    </div>
  </div>
</template>
