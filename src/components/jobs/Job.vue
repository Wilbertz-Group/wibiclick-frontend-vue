<script setup>
	import { universalDateFormatter, dateFormatter, universalTimeFormatter } from '../../helpers';
	const props = defineProps(['job'])
</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full bg-[#ffffff]">
		<div class="mb-2 p-0">
			<div class="flex justify-between mb-2">
				<div class="flex flex-col justify-center">
					<p class="text-lg text-black" >Status</p>
				</div>				
				<FormKit
					type="select"
					name="job_status"
					v-model="job.jobStatus"
					outer-class="text-white mb-0 w-22 bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80" 
					input-class="font-xs text-xs m-0 text-white border-none focus-within:border-none"
				>
					<optgroup class="text-xs text-[#1e293b]">
						<option value="scheduled">Scheduled</option>
						<option value="quoting">Quoting</option>
						<option value="quoted">Quoted</option>
						<option value="no parts">No parts</option>
						<option value="accepted">Accepted</option>
						<option value="cancelled">Cancelled</option>
						<option value="pending">Pending</option>
						<option value="invoiced">Invoiced</option>
						<option value="follow-up">Follow-up</option>
						<option value="done">Done</option>
					</optgroup>
				</FormKit>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black">Technician:</p>
				<p v-if="job.employee?.firstName != undefined || job.employee?.lastName != undefined" class="text-sm text-black">{{ (job.employee?.firstName || '') + ' ' + (job.employee?.lastName || '') }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black">Scheduled Date:</p>
				<p class="text-sm text-black">{{ universalDateFormatter(job.slotStart).includes(':') ? 'Today' : universalDateFormatter(job.slotStart) }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-black">Scheduled Time:</p>
				<p class="text-sm text-black">{{ universalTimeFormatter(job.slotStart) }}</p>
			</div>
			<div class="">
				<p class="text-sm font-bold text-black">Issue: </p>
				<p class="text-xs text-black">{{ job.issue }}</p>
			</div>
		</div>
	</div>
</template>