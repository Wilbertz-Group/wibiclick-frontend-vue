// wibiclick-frontend-vue/src/components/jobs/accordion.vue
<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['jobs', 'status', 'user', 'created'])

	props.jobs.forEach((job) => { 
		job.uid = uuid.v1()
	})

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props.jobs.forEach((job) => { 
			accordionItems.push({
				id: 'accordion-job-heading-'+ job.uid,
				triggerEl: document.querySelector('#accordion-job-heading-'+job.uid),
				targetEl: document.querySelector('#accordion-job-body-'+job.uid),
				active: true
			})
		})

    // options with default values
    const options = {
        alwaysOpen: true,
        activeClasses: 'text-gray-900 dark:text-white',
        inactiveClasses: 'text-gray-500 dark:text-gray-400',
    };

		const accordion = new Accordion(accordionItems, options);

	})
</script>

<template>
	<div v-for="(job) in jobs" :key="job.uid" :id="dateTimestamp(created)">	
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg id="tooltip-job-button" class="cursor-pointer rounded-full shadow tag-content-job hover:bg-slate-700 p-1 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"></path>
			</svg>
		</span>

		<div class="shadow relative rounded-lg sm:overflow-hidden bg-white mb-4">
			<h2 :id="'accordion-job-heading-'+job.uid">
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<span class="font-semibold normal-case"><span class="capitalize">{{ status.includes('Job updated') ? 'Job updated' : status }}</span> by <b>{{ user }}</b></span>
						</span>
					</span>
					<div class="flex items-center">
						<span class="ml-2 sm:ml-5 text-xs italic">{{ dateFormatter(created) }}</span> <!-- Responsive margin -->
						<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2> 
			<div :id="'accordion-job-body-'+job.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
					<p class="p-2 my-2 text-xs italic font-normal text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">{{ status }} by <b>{{ user }}</b> on {{ dateFormatter(created) }}</p>
				</div>
			</div>
			<span class="tag-content-job tag-content-style tag-hover-effect"></span>
		</div> 
	</div>
</template>