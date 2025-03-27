<script setup>
	import axios from "axios";
	import { uuid } from 'vue-uuid';
  import { onMounted, ref } from "vue";
  import { useToast } from 'vue-toast-notification';
  import { useRouter, useRoute } from "vue-router";
  import { useUserStore } from "@/stores/UserStore"
 import { tooltips, noteModal, whatsappModal } from '../../helpers';
 import JobVue from '@/components/jobs/Job.vue'
 import VueQuill from '@/components/editor/VueQuill.vue' // Keep for modals defined below
 import ItemVue from '@/components/line-items/item.vue'
 import EstimateVue from '@/components/estimates/Estimate.vue'
 import InsuranceVue from '@/components/insurance/Insurance.vue'
 import InvoiceVue from '@/components/invoices/Invoice.vue'
 import PaymentVue from '@/components/payments/Payment.vue'
 import accordionPayment from '@/components/payments/PaymentAccordion.vue'
 import ExpenseVue from '@/components/expenses/Expense.vue'
 import accordionJob from '@/components/jobs/accordion.vue'
 import accordionCustomer from '@/components/customers/accordion.vue'
 import accordionView from '@/components/analytics/accordionView.vue'
 import accordionClick from '@/components/analytics/accordionClick.vue'
 import accordionForm from '@/components/analytics/accordionForm.vue'
 import accordionLineitem from '@/components/line-items/accordion.vue'
 import accordion from '@/components/whatsapp/accordion.vue'
 import accordionEmail from '@/components/email/accordion.vue'
 import accordionNotes from '@/components/notes/accordion.vue'
 import accordionInvoice from '@/components/invoices/accordion.vue'
 import accordionEstimate from '@/components/estimates/accordion.vue'
 import accordionInsurance from '@/components/insurance/accordion.vue'
 import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
 import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
 import CustomerCard from '@/components/customers/CustomerCard.vue'; // Import the new component
 import CustomerInfoForm from '@/components/customers/CustomerInfoForm.vue'; // Import the form component
 import CustomerActivityTabs from '@/components/customers/CustomerActivityTabs.vue'; // Import the tabs component

 const loading = ref(false)
 const lineItems = ref()
 const notes = ref('') // Model for note modal
 const whatsapp = ref('') // Model for whatsapp modal
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
  // Ensure all necessary fields used by CustomerCard are here
 })
  const modalOpen = ref(false) // This might be redundant now if modals are handled by Flowbite instances
  const toast = useToast()
 const route = useRoute()
 const router = useRouter()
  const userStore = useUserStore()
 const wkey = ref(0)
 const nkey = ref(0)
 const noteModalInstance = ref(null); // Added for modal control
 const whatsappModalInstance = ref(null); // Added for modal control

 async function fetchContacts() {
    try {
      loading.value = true;
  	const response = await axios.get(
  		`customer?id=${userStore.currentWebsite}&custId=${route.query.customer_id}`
  	);

  	customer.value = response.data.customer
  	
  	if(customer.value?.activities){
  		customer.value?.activities.forEach((a) => {
  			a.uid = uuid.v1()
  		})
  	}

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

  	// Add this to include payments in the customer data
  	if (Array.isArray(response.data.customer?.payments)) {
  		customer.value.payments = response.data.customer.payments;
  	}

  	// Add this to include expenses in the customer data
  	if (Array.isArray(response.data.customer?.expenses)) {
  		customer.value.expenses = response.data.customer.expenses;
  	}

  	lineItems.value = items

  	// Store modal instances returned by helpers (assuming they return the instance)
  	whatsappModalInstance.value = await whatsappModal(whatsapp, userStore.currentWebsite, customer.value.phone)
  	noteModalInstance.value = await noteModal(notes, userStore.currentWebsite, customer.value.id, reloadTimeline)

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting customer data")
    }
  }

 function reloadTimeline() {
  fetchContacts(); // Re-fetch might re-initialize modals, check helper logic if issues arise
  wkey.value += 1
  nkey.value += 1
  if (customer.value.payments) { // Ensure payments exist before spreading
  	customer.value.payments = [...customer.value.payments];
  }
 }

 async function updateCustomer(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-customer?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success("Customer updated successfully")
  	reloadTimeline()
    } catch (error) {
      console.log(error)
      loading.value = false
  	toast.error("Error updating customer") // Add error toast
    }
  }

 async function aiBookJob(customerId){
  try {
      loading.value = true
      await axios.post('ai-booking?id='+ userStore.currentWebsite, {data: customerId});
      loading.value = false
      toast.success("Customer job booked successfully")
  	reloadTimeline()
    } catch (error) {
      console.log(error)
      loading.value = false
  	toast.error("Error booking job via AI") // Add error toast
    }
 }

 // --- Event Handlers for CustomerCard ---
 function handleNavigateBack() {
  router.back();
 }

 function handleOpenNoteModal() {
  // Assuming noteModalInstance holds the Flowbite Modal object
  noteModalInstance.value?.show();
 }

 function handleOpenWhatsappModal() {
  // Assuming whatsappModalInstance holds the Flowbite Modal object
  whatsappModalInstance.value?.show();
 }
 // --- End Event Handlers ---


 onMounted(()=>{
  	fetchContacts();
  tooltips(); // Ensure tooltips are initialized after component mounts
 })
</script>

<template>
	<div class="px-2 py-2 grid md:grid-cols-4 sm:grid-cols-2 gap-3 bg-white h-[92vh]">

		<div class="h-full overflow-y-scroll col-span-1 md:col-span-1 p-1">
			
			<!-- Use CustomerCard Component -->
			<CustomerCard
				:customer="customer"
				v-model:notesContent="notes"
				v-model:whatsappContent="whatsapp"
				@navigate-back="handleNavigateBack"
				@open-note-modal="handleOpenNoteModal"
				@open-whatsapp-modal="handleOpenWhatsappModal"
			/>

			<!-- Note Modal Structure (Remains here as it's controlled by helper/Flowbite) -->
			<!-- This div is necessary for Flowbite to find and control the modal -->
			<div id="noteModal" data-modal-placement="bottom-right" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
					<div class="relative w-full max-w-2xl max-h-full">
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

			<!-- Whatsapp Modal Structure (Remains here as it's controlled by helper/Flowbite) -->
			<!-- This div is necessary for Flowbite to find and control the modal -->
			<div id="whatsappModal" data-modal-placement="bottom-right" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
					<div class="relative w-full max-w-2xl max-h-full">
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

			<!-- Use CustomerInfoForm Component -->
			<CustomerInfoForm
				:customer="customer"
				@update-customer="updateCustomer"
			/>

		</div>

		<!-- Use CustomerActivityTabs Component -->
		<CustomerActivityTabs
			:customer="customer"
			:wkey="wkey"
			:nkey="nkey"
		/>

		<div class="h-full overflow-y-scroll col-span-1 md:col-span-1 p-1">
			<!-- Jobs Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Jobs</span>
						<div id="tooltip-add-job-button" @click="router.push({name: 'add-job', query: { contact_id: customer?.id } })" data-tooltip-target="tooltip-add-job" data-tooltip-placement="left" class="cursor-pointer">+ Add</div>
						<div id="tooltip-ai" role="tooltip" class="">
							<img src="@/assets/images/sparkle.gif" @click="aiBookJob(customer?.id)" alt="image" loading="lazy" width="26" height="26" class="cursor-pointer" />
						</div>
						<div id="tooltip-add-job" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Job
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Job item -->
					<JobVue v-for="job in customer?.jobs" :job="job" v-bind:key="job" @reload-timeline="reloadTimeline"></JobVue>
				</div>
			</section>

			<!-- Estimates Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Estimates</span>
						<div id="tooltip-add-estimate-button" @click="router.push({name: 'add-estimate', query: { job_id: customer?.jobs.length ? customer?.jobs[customer?.jobs.length - 1]?.id : '', contact_id: customer?.id } })" data-tooltip-target="tooltip-add-estimate" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-estimate" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Estimate
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Estimate item -->
					<EstimateVue v-for="estimate in customer?.estimate" :estimate="estimate" v-bind:key="estimate" @reload-timeline="reloadTimeline"></EstimateVue>

				</div>
			</section>

			<!-- Invoices Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Invoices</span>
						<div id="tooltip-add-invoice-button" @click="router.push({name: 'add-invoice', query: { job_id: customer?.jobs.length ? customer?.jobs[customer?.jobs.length - 1]?.id : '', contact_id: customer?.id } })" data-tooltip-target="tooltip-add-invoice" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-invoice" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Invoice
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Invoice item -->
					<InvoiceVue v-for="invoice in customer?.invoice" :invoice="invoice" v-bind:key="invoice" @reload-timeline="reloadTimeline"></InvoiceVue>
				</div>
			</section>

			<!-- Payments Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Payments</span>
						<div id="tooltip-add-payment-button" @click="router.push({name: 'add-payment', query: { customer_id: customer?.id } })" data-tooltip-target="tooltip-add-payment" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-payment" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
							Add Payment
							<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Payment item -->
					<PaymentVue v-for="payment in customer?.payments" :payment="payment" v-bind:key="payment" @reload-timeline="reloadTimeline"></PaymentVue>
				</div>
			</section>

			<!-- New Expenses Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Expenses</span>
						<div id="tooltip-add-expense-button" @click="router.push({name: 'add-expense', query: { customer_id: customer?.id } })" data-tooltip-target="tooltip-add-expense" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-expense" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
							Add Expense
							<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Expense item -->
					<ExpenseVue v-for="expense in customer?.expenses" :expense="expense" v-bind:key="expense" @reload-timeline="reloadTimeline"></ExpenseVue>
				</div>
			</section>

			<!-- Insurance Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
				<div class="p-3 sm:rounded-md sm:overflow-hidden">
					<h5 class="border-b-4 border-gray-900 flex justify-between">
						<span class="text-xl font-medium text-gray-900 dark:text-white">Insurance Reports</span>
						<div id="tooltip-add-insurance-button" @click="router.push({name: 'add-insurance-report', query: { job_id: customer?.jobs.length ? customer?.jobs[customer?.jobs.length - 1]?.id : '', contact_id: customer?.id } })" data-tooltip-target="tooltip-add-insurance" data-tooltip-placement="top" class="cursor-pointer">+ Add</div>
						<div id="tooltip-add-insurance" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
								Add Report
								<div class="tooltip-arrow" data-popper-arrow></div>
						</div>
					</h5>

					<!-- Insurance item -->
					<InsuranceVue v-for="insurance in customer?.insurance" :insurance="insurance" v-bind:key="insurance" @reload-timeline="reloadTimeline"></InsuranceVue>

				</div>
			</section>

			<!-- Line Items Section -->
			<section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
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