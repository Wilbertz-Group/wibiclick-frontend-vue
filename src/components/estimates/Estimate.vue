<script setup>
	import { universalDateFormatter } from '../../helpers';
	const props = defineProps(['estimate'])
</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full bg-[#1e293b]">
		<div class="mb-2 p-2">
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white" >Estimate Number</p>
				<p class="text-sm text-white" >#{{ estimate.number }}</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-white" >Status</p>
				<p class="text-sm text-sky-500" >{{ estimate.reason }}</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-white" >Amount</p>
				<p class="text-sm text-white" >R{{ estimate.sales }}</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-white" >Date</p>
				<p class="text-sm text-white" >{{ universalDateFormatter(estimate.issuedAt) }}</p>
			</div>
		</div>
		<div class="flex mt-4 mb-1 justify-between items-center" >
			<router-link :to="{ name: 'edit-estimate', query:{ estimate_id: estimate.id } }" class="text-gray-800 cursor-pointer inline-block bg-white hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> Edit </router-link>
			<router-link :to="{ name: 'view-estimate', query:{ estimate_id: estimate.id } }" class="text-gray-800 cursor-pointer inline-block bg-white hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center"> View </router-link>
		</div>
	</div>
</template>