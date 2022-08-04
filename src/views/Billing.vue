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
                  
								<div v-if="monthly" class="p-4 max-w-lg bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										
										<h3 class="text-3xl text-gray-700 font-semibold text-center">Monthly</h3>
										<div class="relative flex justify-around max-w-md m-auto">
												<div class="flex">
														<span class="-ml-6 mt-2 text-3xl text-cyan-500 font-bold">$</span>
														<span class="text-8xl text-gray-800 font-bold leading-0">4.99</span>
												</div>
												<span class="absolute right-9 bottom-2 text-xl text-cyan-500 font-bold">/ Month</span>
										</div>
										<ul role="list" class="w-max space-y-4 pb-6 pt-4 m-auto text-gray-600">
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>3 websites included</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Unlimited Page Views</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Unlimited Page Clicks</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Extra Website $2.05 each/month</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Integration help</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Prioritized email support</span>
												</li>
										</ul>
										
										<a href="javascript:void(0)" v-if="monthly" @click="initChargebee()" data-cb-type="portal" class="text-white bg-gray-800 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center"> Manage Plan</a>
										<span v-if="monthly && billing_data.status == 'active'" class="mt-2 text-xs text-green-600 text-center w-full block">automatically renews on {{ moment(billing_data.current_term_end).format('DD, MMMM YYYY') }} </span>
										<span v-if="monthly && billing_data.status != 'active'" class="mt-2 text-xs text-green-600 text-center w-full block">ends on {{ moment(billing_data.current_term_end).format('DD, MMMM YYYY') }} </span>
								</div>

								<div v-if="yearly" class="p-4 max-w-lg bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
										<h3 class="text-3xl text-gray-700 font-semibold text-center">Annual</h3>
										<div class="overflow-hidden">
												<div class="-mr-20 flex items-end justify-center max-w-md">
														<div class="flex">
																<span class="-ml-6 mt-2 text-3xl text-cyan-500 font-bold">$</span>
																<span class="text-8xl text-gray-800 font-bold leading-0">4</span>
														</div>
														<div class="mb-2">
																<span class="block text-xl font-bold">.15</span>
																<span class="block text-xl text-cyan-500 font-bold">/ Month</span>
														</div>
												</div>
												<div class="text-center text-2xl font-medium">
														<span class="text-gray-400 line-through">$59.88</span>
														<span class="text-gray-700 font-semibold">$49.90</span>
												</div>
												<span class="block uppercase text-xs text-cyan-500 text-center">BILLED YEARLY</span>
												<span class="hidden w-max mt-4 m-auto px-4 py-1 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300 text-sm font-medium text-yellow-900">1 Discount applied</span>
										</div>

										<ul role="list" class="w-max space-y-4 pb-6 pt-4 m-auto text-gray-600">
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>3 websites included</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Unlimited Page Views</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Unlimited Page Clicks</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Extra Website $20 each/year</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Integration help</span>
												</li>
												<li class="space-x-2">
														<span class="text-cyan-500 font-semibold">&check;</span>
														<span>Prioritized email support</span>
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
