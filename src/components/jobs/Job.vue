<script setup>
	import { universalDateFormatter, dateFormatter } from '../../helpers';
	const props = defineProps(['job'])
</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full bg-[#1e293b]">
		<div class="mb-4 p-2">
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Location:</p>
				<p class="text-sm text-white">{{ job.location }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Status:</p>
				<p class="text-sm text-sky-500">{{ job.jobStatus }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Technician:</p>
				<p v-if="job.employee?.firstName != undefined || job.employee?.lastName != undefined" class="text-sm text-white">{{ (job.employee?.firstName || '') + ' ' + (job.employee?.lastName || '') }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Date:</p>
				<p class="text-sm text-white">{{ universalDateFormatter(job.slotStart) }}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Time:</p>
				<p class="text-sm text-white">{{ dateFormatter(job.slotStart) }}</p>
			</div>
			<div class="">
				<p class="text-sm font-bold text-white">Issue: </p>
				<p class="text-sm text-white">{{ job.issue }}</p>
			</div>
		</div>
	</div>
</template>