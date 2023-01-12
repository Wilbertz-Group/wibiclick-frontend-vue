<script setup>
	import axios from "axios";
  import { onMounted, ref } from "vue";
  import { useToast } from 'vue-toast-notification';
  import { useRouter, useRoute } from "vue-router";
  import { useUserStore } from "@/stores/UserStore"
	import { tooltips, noteModal, whatsappModal, timelineTabs } from '../../helpers';
	import JobVue from '@/components/jobs/Job.vue'
	import VueQuill from '@/components/editor/VueQuill.vue'
	import ItemVue from '@/components/line-items/item.vue'
	import EstimateVue from '@/components/estimates/Estimate.vue'
	import InvoiceVue from '@/components/invoices/Invoice.vue'
	import accordionJob from '@/components/jobs/accordion.vue'
	import accordionCustomer from '@/components/customers/accordion.vue'
	import accordionLineitem from '@/components/line-items/accordion.vue'
	import accordion from '@/components/whatsapp/accordion.vue'
	import accordionNotes from '@/components/notes/accordion.vue'
	import accordionInvoice from '@/components/invoices/accordion.vue'
	import accordionEstimate from '@/components/estimates/accordion.vue'
	import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

	const loading = ref(false)
	const lineItems = ref()
	const notes = ref('')
	const whatsapp = ref('')
	const customer = ref({
		"name":"",
		"phone":"",
		"email":"",
		"channel":"",
		"address":"",
		"message":"",
		"hubspotLink":"",
		"foreignID":"",
		"portal":"",
		"jobs":[],
		"estimate":[],
		"invoice":[],
		"employeeId":"",
		"createdAt":"",
		"updatedAt":""
	})
  const modalOpen = ref(false)
  const toast = useToast() 
	const route = useRoute()
	const router = useRouter()
  const userStore = useUserStore()
	const timeline = ref(null)

	async function fetchContacts() {
    try {
      loading.value = true;
      const response = await axios.get(
        `customer?id=${userStore.currentWebsite}&custId=${route.query.customer_id}`
      );

      customer.value = response.data.customer

			let items = []

			if (Array.isArray(response.data.customer?.estimate) && response.data.customer.estimate?.length && !response.data.customer.invoice?.length) {
				for (const item of response.data.customer.estimate) {					
					items = [...items, ...item.lineItem];
				}
      }

			if (Array.isArray(response.data.customer?.invoice) && response.data.customer.invoice?.length) {
				for (const item of response.data.customer.invoice) {					
					items = [...items, ...item.lineItem];
				} 
      }		

			lineItems.value = items

			await whatsappModal(whatsapp, userStore.currentWebsite, customer.value.phone)
			await noteModal(notes, userStore.currentWebsite, customer.value.id)

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting customer data")
    }
  }

	async function add(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-customer?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success("Customer updated successfully")
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

	onMounted(()=>{
		timelineTabs()
  	fetchContacts();
		tooltips();
	})
</script>

<template>
	<div class="px-2 py-2 grid md:grid-cols-4 sm:grid-cols-2 gap-3 bg-white h-[92vh]">

		<div class="h-full overflow-y-scroll col-span-1 md:col-span-1">
			
			<!-- Contact Card Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden relative">
				<!-- Go to all contacts -->
				<div @click="router.back()" class="flex justify-start absolute mt-4 ml-3">
					<svg id="tooltip-view-contacts-button" data-tooltip-target="tooltip-view-contacts" class="w-10 h-10 rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path clip-rule="evenodd" fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z"></path>
					</svg>
					<div id="tooltip-view-contacts" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
							Back
							<div class="tooltip-arrow" data-popper-arrow></div>
					</div>
				</div>

				<!-- Contact actions -->
				<div class="flex justify-end px-4 pt-4">
						<button id="contactActionsButton" data-dropdown-toggle="contactActions" class="inline-block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5" type="button">
								<span class="sr-only">Open dropdown</span>
								<svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
						</button>
						<!-- Dropdown menu -->
						<div id="contactActions" class="z-10 hidden text-base list-none bg-white divide-y divide-gray-100 rounded shadow w-44 dark:bg-gray-700">
								<ul class="py-1" aria-labelledby="dropdownButton">
								<li>
										<a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Edit</a>
								</li>
								<li>
										<a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Export Data</a>
								</li>
								<li>
										<a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Delete</a>
								</li>
								</ul>
						</div>
				</div>

				<!-- Contact Card and activity actions -->
				<div class="flex flex-col items-center pb-10">
						<svg class="w-16 h-16 mb-3 rounded-full shadow-lg p-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
						<h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{{ customer?.name }}</h5>
						<span v-if="customer?.email" class="text-sm text-gray-500 dark:text-gray-400">{{ customer?.email }}</span>
						<div class="flex mt-4 space-x-3 md:mt-6">

							<!-- Create a note using a modal -->
							<div>
								<svg id="tooltip-note-button" data-tooltip-target="tooltip-note" class="w-10 h-10 cursor-pointer rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 p-2 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z"></path>
									<path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z"></path>
								</svg>
								<!-- Create a note tool tip -->
								<div id="tooltip-note" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
										Create a note
										<div class="tooltip-arrow" data-popper-arrow></div>
								</div>

								<!-- Create a note Modal -->
								<div id="noteModal" data-modal-placement="bottom-right" data-modal-target="noteModal" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
										<div class="relative w-full h-full max-w-2xl md:h-auto">
												<!-- Modal content -->
												<div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
														<!-- Modal header -->
														<div class="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-600">
																<h3 class="text-xl font-medium text-gray-900 dark:text-white">
																	Note
																</h3>
																<button id="noteModalClose" type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="noteModal">
																		<svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
																		<span class="sr-only">Close modal</span>
																</button>
														</div>
														<!-- Modal body -->
														<div class="p-6 space-y-6">
															<VueQuill 
																v-model:modelValue="notes"
																contentType="html"
																placeholder="Start typing to leave a note..."
															></VueQuill>
														</div>
														<!-- Modal footer -->
														<div class="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
																<button id="noteModalSave" data-modal-hide="noteModal" type="button" class="bg-slate-900 hover:bg-slate-700 p-2 text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save Note</button>
														</div>
												</div>
										</div>
								</div>
							</div>

							<div>
								<svg id="tooltip-email-button" data-tooltip-target="tooltip-email" class="w-10 h-10 cursor-pointer rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 p-2 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"></path>
									<path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"></path>
								</svg>
								<div id="tooltip-email" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
										Create an email
										<div class="tooltip-arrow" data-popper-arrow></div>
								</div>
								
							</div>

							<div>
								<svg id="tooltip-whatsapp-button" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
									data-tooltip-target="tooltip-whatsapp"
									width="192" height="192"
									viewBox="0,0,256,256"
									class="w-10 h-10 p-1 cursor-pointer rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 text-white"
									style="fill:#000000;">
									<g fill="#000000" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,256v-256h256v256z" id="bgRectangle"></path></g><g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(10.66667,10.66667)"><path d="M19.077,4.928c-2.082,-2.083 -4.922,-3.134 -7.904,-2.894c-4.009,0.322 -7.523,3.11 -8.699,6.956c-0.84,2.748 -0.487,5.617 0.881,7.987l-1.296,4.303c-0.124,0.413 0.253,0.802 0.67,0.691l4.504,-1.207c1.459,0.796 3.101,1.215 4.773,1.216h0.004c4.195,0 8.071,-2.566 9.412,-6.541c1.306,-3.876 0.34,-7.823 -2.345,-10.511zM16.898,15.554c-0.208,0.583 -1.227,1.145 -1.685,1.186c-0.458,0.042 -0.887,0.207 -2.995,-0.624c-2.537,-1 -4.139,-3.601 -4.263,-3.767c-0.125,-0.167 -1.019,-1.353 -1.019,-2.581c0,-1.228 0.645,-1.832 0.874,-2.081c0.229,-0.25 0.499,-0.312 0.666,-0.312c0.166,0 0.333,0 0.478,0.006c0.178,0.007 0.375,0.016 0.562,0.431c0.222,0.494 0.707,1.728 0.769,1.853c0.062,0.125 0.104,0.271 0.021,0.437c-0.083,0.166 -0.125,0.27 -0.249,0.416c-0.125,0.146 -0.262,0.325 -0.374,0.437c-0.125,0.124 -0.255,0.26 -0.11,0.509c0.146,0.25 0.646,1.067 1.388,1.728c0.954,0.85 1.757,1.113 2.007,1.239c0.25,0.125 0.395,0.104 0.541,-0.063c0.146,-0.166 0.624,-0.728 0.79,-0.978c0.166,-0.25 0.333,-0.208 0.562,-0.125c0.229,0.083 1.456,0.687 1.705,0.812c0.25,0.125 0.416,0.187 0.478,0.291c0.062,0.103 0.062,0.603 -0.146,1.186z"></path></g></g><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="none" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g id="text" fill="#000000" stroke="none" stroke-width="1"><path d="M-32.295,-19.72l6.27,13.67l6.31,-13.67h6.83l-9.96,19.34v11h-6.35v-11l-9.96,-19.34zM7.325,10.62h-6.08c-0.28,-0.54667 -0.48333,-1.22 -0.61,-2.02v0c-1.45333,1.62 -3.34667,2.43 -5.68,2.43v0c-2.21333,0 -4.04333,-0.63667 -5.49,-1.91c-1.45333,-1.28 -2.18,-2.89333 -2.18,-4.84v0c0,-2.38667 0.88667,-4.22 2.66,-5.5c1.76667,-1.27333 4.32333,-1.91667 7.67,-1.93v0h2.77v-1.3c0,-1.04 -0.26667,-1.87333 -0.8,-2.5c-0.53333,-0.62 -1.37667,-0.93 -2.53,-0.93v0c-1.01333,0 -1.81,0.24333 -2.39,0.73c-0.57333,0.48667 -0.86,1.15333 -0.86,2v0h-6.02c0,-1.30667 0.40333,-2.51667 1.21,-3.63c0.80667,-1.11333 1.94333,-1.98333 3.41,-2.61c1.47333,-0.63333 3.12667,-0.95 4.96,-0.95v0c2.78,0 4.98667,0.69667 6.62,2.09c1.63333,1.4 2.45,3.36333 2.45,5.89v0v9.77c0.01333,2.14 0.31,3.75667 0.89,4.85v0zM-3.735,6.43v0c0.88667,0 1.70667,-0.19667 2.46,-0.59c0.74667,-0.4 1.3,-0.93333 1.66,-1.6v0v-3.87h-2.25c-3.01333,0 -4.61667,1.04 -4.81,3.12v0l-0.02,0.36c0,0.74667 0.26333,1.36333 0.79,1.85c0.52667,0.48667 1.25,0.73 2.17,0.73zM14.975,-11.92l4.18,14.02l4.17,-14.02h6.46l-9.06,26.04l-0.5,1.18c-1.34667,2.94667 -3.57,4.42 -6.67,4.42v0c-0.87333,0 -1.76333,-0.13 -2.67,-0.39v0v-4.57l0.92,0.02c1.14,0 1.99,-0.17333 2.55,-0.52c0.56667,-0.34667 1.01,-0.92333 1.33,-1.73v0l0.7,-1.85l-7.89,-22.6zM38.995,-19.72l-0.71,21.02h-5l-0.71,-21.02zM35.785,4.6v0c1.01333,0 1.83,0.29667 2.45,0.89c0.61333,0.6 0.92,1.36333 0.92,2.29v0c0,0.92 -0.30667,1.67667 -0.92,2.27c-0.62,0.6 -1.43667,0.9 -2.45,0.9v0c-1,0 -1.81,-0.3 -2.43,-0.9c-0.62,-0.59333 -0.93,-1.35 -0.93,-2.27c0,-0.91333 0.31,-1.67333 0.93,-2.28c0.62,-0.6 1.43,-0.9 2.43,-0.9z"></path></g></g>
								</svg>
								<div id="tooltip-whatsapp" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
										Send a whatsapp message
										<div class="tooltip-arrow" data-popper-arrow></div>
								</div>

								<!-- Create a whatsapp Modal -->
								<div id="whatsappModal" data-modal-placement="bottom-right" data-modal-target="whatsappModal" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
										<div class="relative w-full h-full max-w-2xl md:h-auto">
												<!-- Modal content -->
												<div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
														<!-- Modal header -->
														<div class="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-600">
																<h3 class="text-xl font-medium text-gray-900 dark:text-white">
																	Whatsapp
																</h3>
																<button id="whatsappModalClose" type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="whatsappModal">
																		<svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
																		<span class="sr-only">Close modal</span>
																</button>
														</div>
														<!-- Modal body -->
														<div class="p-6 space-y-6">
															<VueQuill 
																v-model:modelValue="whatsapp"
																contentType="text"
																placeholder="Start typing to send a whatsapp message..."
															></VueQuill>
														</div>
														<!-- Modal footer -->
														<div class="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
																<button id="whatsappModalSave" data-modal-hide="whatsappModal" type="button" class="bg-slate-900 hover:bg-slate-700 p-2 text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Send Whatsapp</button>
														</div>
												</div>
										</div>
								</div>
							</div>

							<div>
								<a :href="'callto:+'+customer.phone">
									<svg id="tooltip-call-button" data-tooltip-target="tooltip-call" class="w-10 h-10 cursor-pointer rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 p-2 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
										<path clip-rule="evenodd" fill-rule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"></path>
									</svg>
								
									<div id="tooltip-call" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
											Make a phone call
											<div class="tooltip-arrow" data-popper-arrow></div>
									</div>
								</a>
							</div>

							<div>
								<svg id="tooltip-activity-button" data-tooltip-target="tooltip-activity" class="w-10 h-10 cursor-pointer rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 p-2 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path clip-rule="evenodd" fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"></path>
								</svg>
								<div id="tooltip-activity" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
										Add Activity
										<div class="tooltip-arrow" data-popper-arrow></div>
								</div>
							</div>

							

						</div>
				</div>
			</section>

			<!-- Contact Information Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-2 sm:rounded-md sm:overflow-hidden">
						<FormKit type="form" id="customer" submit-label="Add" @submit="add" :actions="false">
							<span class="text-xl font-medium text-gray-900 dark:text-white border-b-4 border-gray-900">About contact</span>
							<div class="mt-4">
								<FormKit type="text" name="name" v-model="customer.name" label="Name" placeholder="--" inner-class="shadow-none" outer-class="text-left border-none" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
								<FormKit type="select" name="Reply" v-model="customer.channel" label="Reply" placeholder="--" inner-class="shadow-none" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" :options="[ 'Reply me by Email', 'Send me a message on Whatsapp', 'Use any of the above' ]"  />   
								<FormKit type="email" name="Email" v-model="customer.email" label="Email" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
								<FormKit type="tel" name="Phone" label="Phone" v-model="customer.phone" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" validation="required|phone" />
								<FormKit type="text" name="portal" label="Portal" v-model="customer.portal" inner-class="shadow-none" placeholder="--" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
								<FormKit type="text" name="foreignID" label="Hubspot ID" v-model="customer.foreignID" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
								<FormKit type="text" name="address" label="Address" v-model="customer.address" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
							</div>

							<FormKit type="textarea" name="Message" label="Issue" v-model="customer.message" inner-class="shadow-none" placeholder="--" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />

							<FormKit type="submit" input-class="rounded-full shadow-lg !bg-slate-900 hover:bg-slate-700 text-white" label="Update Customer" />
							
						</FormKit>
				</div>
			</section>

		</div>

		<div class="h-full overflow-y-scroll col-span-2 md:col-span-2 bg-slate-100 p-2 shadow sm:rounded-md sm:overflow-hidden">
			<div class="mb-4 border-b border-gray-200 dark:border-gray-700">
					<ul class="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400" id="tabExample" role="tablist">
							<li class="mr-2" role="presentation">
									<button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="activity-tab-el" type="button" role="tab" aria-controls="activity-el" aria-selected="false">Activity</button>
							</li>
							<li class="mr-2" role="presentation">
									<button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="whatsapp-tab-el" type="button" role="tab" aria-controls="whatsapp-el" aria-selected="false">Whatsapp</button>
							</li>
							<li class="mr-2" role="presentation">
									<button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="notes-tab-el" type="button" role="tab" aria-controls="notes-el" aria-selected="false">Notes</button>
							</li>
					</ul>
			</div>
			<div id="tabContentExample" class="h-[90%] overflow-y-scroll">
					<div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="activity-el" role="tabpanel" aria-labelledby="activity-tab-el">
						<div v-for="activity in customer?.activities" :key="activity.id">
							<accordion v-if="activity.type == 'whatsapp'" :msgs="[activity?.whatsapp]"></accordion>
							<accordion-notes v-if="activity.type == 'note'" :notes="[activity?.notes]" :status="activity?.status" :user="activity?.User?.firstName"></accordion-notes>
							<accordion-invoice v-if="activity.type == 'invoice'" :invoices="[activity?.invoice]" :status="activity?.status" :user="activity?.User?.firstName"></accordion-invoice>
							<accordion-estimate v-if="activity.type == 'estimate'" :estimates="[activity?.estimate]" :status="activity?.status" :user="activity?.User?.firstName"></accordion-estimate>
							<accordion-job v-if="activity.type == 'job'" :jobs="[activity?.job]" :status="activity?.status" :user="activity?.User?.firstName"></accordion-job>
							<accordion-customer v-if="activity.type == 'customer'" :customers="[activity?.customer]" :status="activity?.status" :user="activity?.User?.firstName"></accordion-customer>
							<accordion-lineitem v-if="activity.type == 'line item'" :lineitems="[activity?.lineitem]" :status="activity?.status" :user="activity?.User?.firstName"></accordion-lineitem>
						</div>
					</div>
					<div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="whatsapp-el" role="tabpanel" aria-labelledby="whatsapp-tab-el">
						<accordion v-if="customer?.whatsapp" :msgs="customer?.whatsapp"></accordion>
					</div>
					<div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="notes-el" role="tabpanel" aria-labelledby="notes-tab-el">
						<accordion-notes v-if="customer?.notes" :notes="customer?.notes"></accordion-notes>
					</div>
			</div>
		</div>

		<div class="h-full overflow-y-scroll col-span-1 md:col-span-1">
			<!-- Jobs Section -->
			<section class="shadow-lg sm:rounded-md sm:overflow-hidden">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Jobs</span>
						<div id="tooltip-add-job-button" @click="router.push({name: 'add-job'})" data-tooltip-target="tooltip-add-job" data-tooltip-placement="left" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-job" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Job
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Job item -->
					<JobVue v-for="job in customer?.jobs" :job="job" v-bind:key="job"></JobVue>
				</div>
			</section>

			<!-- Estimates Section -->
			<section class="shadow-lg sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Estimates</span>
						<div id="tooltip-add-estimate-button" @click="router.push({name: 'add-estimate'})" data-tooltip-target="tooltip-add-estimate" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-estimate" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Estimate
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Estimate item -->
					<EstimateVue v-for="estimate in customer?.estimate" :estimate="estimate" v-bind:key="estimate"></EstimateVue>

				</div>
			</section>

			<!-- Invoices Section -->
			<section class="shadow-lg sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Invoices</span>
						<div id="tooltip-add-invoice-button" @click="router.push({name: 'add-invoice'})" data-tooltip-target="tooltip-add-invoice" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-invoice" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Invoice
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Invoice item -->
					<InvoiceVue v-for="invoice in customer?.invoice" :invoice="invoice" v-bind:key="invoice"></InvoiceVue>
				</div>
			</section>

			<!-- Line Items Section -->
			<section class="shadow-lg sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="text-xl font-medium text-gray-900 dark:text-white border-b-4 border-gray-900">Line Items</h5>

					<!-- Invoice item -->
					<ItemVue v-for="item in lineItems" :item="item" v-bind:key="item"></ItemVue>
				</div>
			</section>
		</div>
	</div>
	<scale-loader v-if="loading" :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
	<div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>

<style>
	.ql-container.ql-snow {
    margin-top: 0px !important;
    min-height: 28vh;
	}
	.ql-editor.ql-blank {
    min-height: 200px;
	}
</style>