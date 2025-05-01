// wibiclick-frontend-vue/src/components/jobs/Job.vue
<script setup>
	import axios from "axios";
	import { useToast } from 'vue-toast-notification';
	import { watch, ref } from "vue";
	import modal from "../misc/modal.vue";
	import  useUserStore  from "@/stores/UserStore"
	import { universalDateFormatter, dateFormatter, universalTimeFormatter } from '../../helpers';
	import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added for delete icon
	import { library } from '@fortawesome/fontawesome-svg-core' // Added for delete icon
	import { faTrash } from '@fortawesome/free-solid-svg-icons' // Added for delete icon
	import {
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

	library.add(faTrash) // Added for delete icon

	const emit = defineEmits(['reloadTimeline', 'edit-job']) // Add edit-job emit
	const props = defineProps(['job'])
	const userStore = useUserStore()
	const toast = useToast()

	const statuses = [
		{ value: "scheduled", name: "Scheduled" },
		{ value: "quoting", name: "Quoting" },
		{ value: "quoted", name: "Quoted" },
		{ value: "no parts", name: "No parts" },
		{ value: "accepted", name: "Accepted" },
		{ value: "cancelled", name: "Cancelled" },
		{ value: "pending", name: "Pending" },
		{ value: "invoiced", name: "Invoiced" },
		{ value: "follow-up", name: "Follow-up" },
		{ value: "done", name: "Done" },
		{ value: "paid", name: "Paid" },
		{ value: "to order parts", name: "To order parts" },
		{ value: "parts ordered", name: "Parts ordered" },
		{ value: "parts arrived", name: "Parts arrived" },
		{ value: "parts installed", name: "Parts installed" },
		{ value: "parts paid", name: "Parts paid" },
		{ value: "parts not paid", name: "Parts not paid" },
		{ value: "parts not installed", name: "Parts not installed" },
		{ value: "parts not ordered", name: "Parts not ordered" },
		{ value: "parts not available", name: "Parts not available" },
		{ value: "parts not needed", name: "Parts not needed" },
		{ value: "parts not found", name: "Parts not found" },
		{ value: "waiting for price", name: "waiting for price"},
		{ value: "waiting for parts", name: "waiting for parts"},
		{ value: "waiting for customer", name: "waiting for customer"},
		{ value: "waiting for payment", name: "waiting for payment"}
  ]

	const currentStatus = statuses.filter(a => a.value == props.job.jobStatus)?.length && props.job?.jobStatus ? statuses.filter(a => a.value == props.job.jobStatus) : ''
	const selectedStatus = ref(currentStatus[0])
	const body = ref()
	const heading = ref()
	const isOpen = ref(false)

	// Watch for external changes to the job status prop
	watch(() => props.job.jobStatus, (newStatusValue) => {
	  const newStatusObject = statuses.find(s => s.value === newStatusValue);
	  if (newStatusObject && selectedStatus.value?.value !== newStatusObject.value) {
	    selectedStatus.value = newStatusObject;
	  }
	});

	// Helper function for currency formatting
	function formatCurrency(value) {
	  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';

	  // Use Intl.NumberFormat for locale-aware currency formatting
	  try {
	    return new Intl.NumberFormat('en-ZA', { // Use South African locale
	      style: 'currency',
	      currency: 'ZAR', // Specify ZAR currency code
	      minimumFractionDigits: 2,
	      maximumFractionDigits: 2,
	    }).format(Number(value));
	  } catch (error) {
	    // Removed console.error
	    // Fallback to basic formatting on error
	    return `R ${Number(value).toFixed(2)}`;
	  }
	}

	// Helper function to determine profit text color
	function getProfitClass(value) {
	  if (value === null || value === undefined) return 'text-gray-500';
	  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
	}

	function closeModal() {
		isOpen.value = false
		emit('reloadTimeline')
	}

	watch(selectedStatus, async (n, o) => {
		toast.success('updating the status of the job')
		body.value = `Job status changed from <b>${o.value}</b> to <b>${n.value}</b>`
		heading.value = "Job Status"

		const data = {
			id: props.job.id,
			jobStatus: n.value,
			customerId: props.job.customerId,
			employeeId: props.job.employeeId
		}

		try {
      const response = await axios.post('update-job-status?id='+ userStore.currentWebsite, data);
      toast.success(response.data.message)
			isOpen.value = true
    } catch (error) {
			toast.error('Failed to update the job status, please contact the administrator')
      // Removed console.log
    }
	})

	async function deleteJob() {
	  if (!props.job || !props.job.id) {
	    toast.error('Cannot delete job: ID missing.');
	    return;
	  }

	  if (confirm(`Are you sure you want to delete job for ${props.job.name}? This action cannot be undone.`)) {
	    try {
	      // Use the confirmed endpoint: DELETE /job?custId={id}&id={websiteId}
	      await axios.delete(`/job?custId=${props.job.id}&id=${userStore.currentWebsite}`);
	      toast.success('Job deleted successfully.');
	      emit('reloadTimeline'); // Refresh the parent list
	    } catch (error) {
	      console.error("Error deleting job:", error);
	      toast.error(`Failed to delete job: ${error.response?.data?.message || error.message}`);
	    }
	  }
	}

</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full dark:bg-[#ffffff]">
		<div class="mb-2 p-0 relative">
			<modal :heading="heading" :body="body" :isOpen="isOpen" @close-modal="closeModal"></modal>
			<div class="flex justify-between mb-2">
				<div class="flex flex-col justify-center">
					<p class="text-lg text-black dark:text-gray-300" ></p>
				</div>
				<div class="relative"> <!-- Status Dropdown -->
					<Listbox v-model="selectedStatus">
						<div class="relative mt-1">
							<ListboxButton
								class="relative w-full cursor-default rounded-lg bg-slate-900 py-1 pl-3 pr-5 min-w-[120px] text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
							>
								<span class="block truncate text-white">{{ selectedStatus?.name }}</span>
								<span
									class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
								>
									<svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
									</svg>
								</span>
							</ListboxButton>

							<transition
								leave-active-class="transition duration-100 ease-in"
								leave-from-class="opacity-100"
								leave-to-class="opacity-0"
							>
								<ListboxOptions
									class="absolute z-50 mt-1 max-h-60 w-full rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
								>
									<ListboxOption
										v-slot="{ active, selected }"
										v-for="status in statuses"
										:key="status.name"
										:value="status"
										as="template"
									>
										<li
											:class="[
												active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
												'relative cursor-default select-none pl-10 py-0 pr-2',
											]"
										>
											<span
												:class="[
													selected ? 'font-small' : 'font-small',
													'block truncate',
												]"
												>{{ status.name }}</span
											>
											<span
												v-if="selected"
												class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
											>
												<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
												</svg>

											</span>
										</li>
									</ListboxOption>
								</ListboxOptions>
							</transition>
						</div>
					</Listbox>
				</div>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black dark:text-gray-300">Technician:</p>
				<p v-if="job.employee?.firstName != undefined || job.employee?.lastName != undefined" class="text-sm text-black dark:text-gray-300">{{ (job.employee?.firstName || '') + ' ' + (job.employee?.lastName || '') }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black dark:text-gray-300">Scheduled Date:</p>
				<p class="text-sm text-black dark:text-gray-300">{{ universalDateFormatter(job.slotStart).includes(':') ? 'Today' : universalDateFormatter(job.slotStart) }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black dark:text-gray-300">Scheduled Time:</p>
				<p class="text-sm text-black dark:text-gray-300">{{ universalTimeFormatter(job.slotStart) }}</p>
			</div>
			<div class="">
				<p class="text-sm font-bold text-black dark:text-gray-300">Issue: </p>
				<p class="text-xs text-black dark:text-gray-300">{{ job.issue }}</p>
			</div>

				  <!-- Reviews Section -->
				  <div v-if="job.reviews && job.reviews.length > 0" class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
				    <p class="text-sm font-bold text-black dark:text-gray-300 mb-1">Feedback:</p>
				    <div v-for="review in job.reviews" :key="review.id" class="text-xs text-black dark:text-gray-300 mb-2 last:mb-0">
				      <div class="flex items-center mb-0.5">
				        <span class="font-medium mr-2">Rating:</span>
				        <!-- Simple Star Rating Display -->
				        <span class="text-yellow-500">
				          <template v-for="i in 5" :key="i">
				            <font-awesome-icon :icon="i <= review.rating ? 'star' : ['far', 'star']" />
				          </template>
				        </span>
				        <span class="ml-1">({{ review.rating }}/5)</span>
				      </div>
				      <p v-if="review.comment" class="pl-1">{{ review.comment }}</p>
				    </div>
				  </div>

				  <!-- Financials Section -->
				  <div class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
				    <p class="text-sm font-bold text-black dark:text-gray-300 mb-1">Financials:</p>
				    <div class="grid grid-cols-3 gap-x-2 text-xs text-black dark:text-gray-300">
				      <div class="text-center">
				        <span class="font-medium block">Payments</span>
				        <span class="text-green-600 dark:text-green-400">{{ formatCurrency(job.totalPayments) }}</span>
				      </div>
				      <div class="text-center">
				        <span class="font-medium block">Expenses</span>
				        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(job.totalExpenses) }}</span>
				      </div>
				      <div class="text-center">
				        <span class="font-medium block">Net Profit</span>
				        <span :class="getProfitClass(job.netProfit)">{{ formatCurrency(job.netProfit) }}</span>
				      </div>
				    </div>
				  </div>
		</div>
				<!-- Action Buttons -->
		  <div class="flex mt-2 mb-1 justify-between items-center"> <!-- Changed back to justify-between -->
		    <button @click="$emit('edit-job', job)" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </button>
		    <button @click="$emit('edit-job', job)" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </button>
				<!-- Delete Button -->
				<button @click="deleteJob" class="text-white cursor-pointer inline-block bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center" title="Delete Job">
					<font-awesome-icon icon="trash" />
				</button>
		  </div>
	</div>
</template>