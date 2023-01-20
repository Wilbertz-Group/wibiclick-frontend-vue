<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted, ref } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['invoices', 'status', 'user', 'created'])

	props.invoices.forEach((invoice) => { 
		invoice.uid = uuid.v1()
	})

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props.invoices.forEach((invoice) => { 
			accordionItems.push({
				id: 'accordion-invoice-heading-'+ invoice.uid,
				triggerEl: document.querySelector('#accordion-invoice-heading-'+invoice.uid),
				targetEl: document.querySelector('#accordion-invoice-body-'+invoice.uid),
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
	<div v-for="(invoice) in invoices" :key="invoice.uid" :id="dateTimestamp(invoice.createdAt)">	
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full -left-3 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg id="tooltip-invoice-button" class="cursor-pointer rounded-full shadow bg-slate-900 hover:bg-slate-700 p-1 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
			</svg>
		</span>

		<div class="shadow rounded-lg sm:overflow-hidden bg-white mb-4">
			<h2 :id="'accordion-invoice-heading-'+invoice.uid">
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<span class="font-semibold normal-case"><span class="capitalize">{{ status }}</span> by <b>{{ user }}</b></span>
						</span>
					</span>
					<div class="flex items-center">
						<span class="ml-5 text-xs italic">{{ dateFormatter(created) }}</span>
						<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2> 
			<div :id="'accordion-invoice-body-'+invoice.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
					<p class="p-2 my-2 text-xs italic font-normal text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">#{{ invoice.number }}: {{ status }} by <b>{{ user }}</b> on {{ dateFormatter(created) }}</p>
				</div>
			</div>
		</div> 
	</div>
</template>