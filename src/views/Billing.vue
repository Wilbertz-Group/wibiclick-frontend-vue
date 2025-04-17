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
  <scale-loader :loading="loading" color="#6366f1" height="50px" class="vld-overlay is-active is-full-page" width="6px" />
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <Header title="Billing &amp; Usage" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <!-- Usage Card -->
        <section class="card-modern p-0 md:p-8 flex flex-col justify-between">
          <div>
            <h2 class="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Your Current Usage</h2>
            <div class="mb-6">
              <div class="flex justify-between mb-1">
                <span class="text-base font-medium text-gray-700 dark:text-gray-200">Credits</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ used }} / {{ total }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700 h-4">
                <div
                  class="bg-blue-600 text-xs font-medium text-blue-100 text-center h-4 flex items-center justify-center rounded-full transition-all duration-300"
                  :style="'width: ' + (total ? parseInt((used/total)*100) : 0) + '%'">
                  {{ total ? parseInt((used/total)*100) : 0 }}%
                </div>
              </div>
            </div>
            <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <span class="font-semibold text-cyan-500">&bull;</span>
                <span>Lifetime credits: <span class="font-medium text-gray-900 dark:text-white">{{ lifetime ? 'Yes' : 'No' }}</span></span>
              </li>
              <li>
                <span class="font-semibold text-cyan-500">&bull;</span>
                <span>Credits are used for page views and clicks</span>
              </li>
            </ul>
          </div>
        </section>
        <!-- Billing Card -->
        <section class="card-modern p-0 md:p-8 flex flex-col justify-between">
          <div>
            <h2 class="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Billing</h2>
            <p class="mb-6 text-gray-600 dark:text-gray-400">Top up credits as needed for your account.</p>
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
              <h3 class="text-2xl font-semibold text-center text-gray-700 dark:text-white mb-2">Professional Plan</h3>
              <div class="flex justify-center mb-4">
                <span class="text-3xl text-cyan-500 font-bold">R{{ price }}<span class="text-xl">/ credit</span></span>
              </div>
              <ul class="space-y-2 text-gray-600 dark:text-gray-400 text-sm mb-6">
                <li class="flex items-center space-x-2">
                  <span class="text-cyan-500 font-semibold">&check;</span>
                  <span>Unlimited websites</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-cyan-500 font-semibold">&check;</span>
                  <span>1 credit per page view</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-cyan-500 font-semibold">&check;</span>
                  <span>1 credit per page click</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-cyan-500 font-semibold">&check;</span>
                  <span>Integration help</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-cyan-500 font-semibold">&check;</span>
                  <span>Prioritized email support</span>
                </li>
              </ul>
              <FormKit
                type="number"
                label="Credits"
                :value="credits"
                v-model="credits"
                step="500"
                min="1000"
                validation="required|number|between:1000,100000"
                help="Our billing is in South African Rand"
                input-class="input-modern"
                label-class="label-modern"
              />
              <a
                href="javascript:void(0)"
                id="checkout-button"
                class="btn-primary-modern w-full mt-6 text-center justify-center"
              >
                Buy {{ credits }} Credits (R{{ credits * price }})
              </a>
            </div>
          </div>
        </section>
      </div>
      <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
    </div>
  </div>
</template>
