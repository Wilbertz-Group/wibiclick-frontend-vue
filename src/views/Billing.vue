<script setup>
import axios from "axios";
import moment from 'moment'
import { onMounted, ref } from "vue";
import Header from "@/components/Header.vue";
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

const credits = ref(1000)
const used = ref(0)
const total = ref(0)
const lifetime = ref(false)
const price = ref(0)
const loading = ref(false)
const toast = useToast();

price.value = 0.1;

const yoco = new window.YocoSDK({ publicKey: "pk_live_1e607eaebZEq7Gl96164" })

async function fetchCredits() {
		try {
			loading.value = true
			const response = await axios.get('get-credits');
			used.value = response.data.used
			total.value = response.data.total
			lifetime.value = response.data.lifetime
			loading.value = false
		} catch (error) {
			console.log(error)
		}
}

onMounted(async () => {
	fetchCredits()
	var checkoutButton = document.querySelector('#checkout-button');

	checkoutButton.addEventListener('click', function () {
		if( credits.value >= 1000){
			yoco.showPopup({
				amountInCents: credits.value * price.value * 100,
				currency: 'ZAR',
				name: `Buy R${credits.value * price.value } Credits`,
				callback: async (result)=>{
					if (result.error) {
						const errorMessage = result.error.message;
						toast.error("error occured: " + errorMessage);
					} else {
						if (result.status == "charge_ready" && result?.id) {
							let { data } = await axios.post('yoco-charge-api', {
								id: result?.id,
								amountInCents: credits.value * price.value * 100
							})
							toast.success("Credits successfully bought")
						} else {
							toast.error("Error in making payment, please contact the administrator")
						}					
					}
				}
			})
		} else {
			toast.error("Only a minimum of 1000 credits is allowed")
		}
	});
})
</script>

<template>
	<Header title="Billing & Usage" />
	<scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page"
		width="6px">
	</scale-loader>
	<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div>
				<div class="md:grid md:grid-cols-3 md:gap-6">
					<div class="md:col-span-1">
						<div class="px-4 sm:px-0">
							<h3 class="text-lg font-medium leading-6 text-gray-900">Your Current Usage</h3>
							<p class="mt-1 text-sm text-gray-600">Credits Used</p>
						</div>
					</div>
					<div class="mt-5 md:mt-0 md:col-span-2">
						<div class="p-4 shadow sm:rounded-md sm:overflow-hidden">
							<div class="flex justify-between mb-1">
								<span class="text-base font-medium text-black-700 dark:text-white">Credits</span>
								<span class="text-sm font-medium text-black-700 dark:text-white">{{used}} / {{total}}</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
								<div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
									:style="'width: '+ parseInt((used/total)*100) +'%'"> {{ parseInt((used/total)*100) }}%</div>
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
					<div class="md:col-span-1 sm:mt-10">
						<div class="px-4 sm:px-0 sm:pt-10">
							<h3 class="text-lg font-medium leading-6 text-gray-900">Billing</h3>
							<p class="mt-1 text-sm text-gray-600">Topup credits that you need</p>
						</div>
					</div>
					<div class="mt-5 md:mt-0 col-span-2 md:col-span-2">
						<div class="p-4 grid grid-cols-1 gap-3  shadow sm:rounded-md sm:overflow-hidden">

							<div
								class="p-4 max-w-lg bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">

								<h3 class="text-3xl text-gray-700 font-semibold text-center">Professional Plan</h3>
								<div class="relative flex justify-around max-w-md m-auto">
									<div class="flex">
										<span class="-ml-6 mt-2 text-3xl text-cyan-500 font-bold">R{{ price }}
											<span class="text-xl">/ credit</span>
										</span>
									</div>

								</div>
								<ul role="list" class="w-max space-y-4 pb-6 pt-4 m-auto text-gray-600">
									<li class="space-x-2">
										<span class="text-cyan-500 font-semibold">&check;</span>
										<span>Unlimited websites</span>
									</li>
									<li class="space-x-2">
										<span class="text-cyan-500 font-semibold">&check;</span>
										<span>1 credit per page View</span>
									</li>
									<li class="space-x-2">
										<span class="text-cyan-500 font-semibold">&check;</span>
										<span>1 credit per page Click</span>
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

								<FormKit type="number" label="Credits" :value="credits" v-model="credits" step="500"
									min="1000" validation="required|number|between:1000,100000"
									help="our billing is in South African Rand" />

								<a href="javascript:void(0)" id="checkout-button"
									class="text-white bg-gray-800 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">
									Buy {{ credits }} Credits (R{{ credits * price }})</a> 
							</div>
						</div>
					</div>
				</div>
			</div>
			<div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
		</div>
	</div>
</template>
