<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['customer', 'url', 'title', 'created'])
	const uid = uuid.v1()

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [{
				id: 'accordion-views-heading-'+ uid,
				triggerEl: document.querySelector('#accordion-views-heading-'+uid),
				targetEl: document.querySelector('#accordion-views-body-'+uid),
				active: true
			}];

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
	<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full -left-3 ring-white dark:ring-gray-900 dark:bg-blue-900">
		<svg id="tooltip-views-button" class="p-.5 cursor-pointer rounded-full shadow bg-slate-900 hover:bg-slate-700 p-0 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
		</svg>
	</span>

	<div :key="uid" :id="dateTimestamp(created)" class="shadow rounded-lg sm:overflow-hidden bg-white mb-4">
		<h2 :id="'accordion-views-heading-'+uid">
			<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
				<span class="flex items-center">
					<span class="text-sm">
						<span class="font-semibold normal-case"><span class="capitalize">{{ customer }}</span> viewed a page</span>
					</span>
				</span>
				<div class="flex items-center">
					<span class="ml-2 sm:ml-5 text-xs italic">{{ dateFormatter(created) }}</span> <!-- Responsive margin -->
					<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
				</div>
			</button>
		</h2> 
		<div :id="'accordion-views-body-'+uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
			<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
				<p class="p-2 my-2 text-xs italic font-normal text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300"><span class="capitalize">{{ customer }}</span> viewed <a target="_blank" class="text-blue-700" :href="url">{{ title }}</a></p>
			</div>
		</div>
	</div> 
</template>