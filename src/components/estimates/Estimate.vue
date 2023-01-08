<script setup>
	import { universalDateFormatter } from '../../helpers';
	const props = defineProps(['estimate'])
</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full">
		<div class="mb-2 p-0">
			<div class="flex justify-between mb-2">
				<div class="flex flex-col justify-center">
					<p class="text-lg text-slate-900" >Status</p>
				</div>				
				<FormKit
					type="select"
					name="estimate_status"
					v-model="estimate.reason"
					outer-class="text-white mb-0 w-22 bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80" 
					input-class="font-xs text-xs m-0 text-white border-none focus-within:border-none"
				>
					<optgroup class="text-xs text-[#1e293b]">
						<option value="sent">Sent</option>
						<option value="accepted">Accepted</option>
						<option value="rejected">Rejected</option>
					</optgroup>
				</FormKit>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black" >Estimate Number</p>
				<p class="text-sm text-black" >#{{ estimate.number }}</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-black" >Amount</p>
				<p class="text-sm text-black" >R{{ estimate.sales }}</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-black" >Date</p>
				<p class="text-sm text-black" >{{ universalDateFormatter(estimate.issuedAt) }}</p>
			</div>
		</div>
		<div class="flex mt-4 mb-1 justify-between items-center" >
			<router-link :to="{ name: 'edit-estimate', query:{ estimate_id: estimate.id } }" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </router-link>
			<router-link :to="{ name: 'view-estimate', query:{ estimate_id: estimate.id } }" class="text-white cursor-pointer inline-block bg-slate-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </router-link>
		</div>
	</div>
</template>