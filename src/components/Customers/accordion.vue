<!-- wibiclick-frontend-vue/src/components/Customers/accordion.vue -->
<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['customers', 'status', 'user', 'created'])

	props.customers.forEach((customer) => { 
		customer.uid = uuid.v1()
	})

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props.customers.forEach((customer) => { 
			accordionItems.push({
				id: 'accordion-customer-heading-'+ customer.uid,
				triggerEl: document.querySelector('#accordion-customer-heading-'+customer.uid),
				targetEl: document.querySelector('#accordion-customer-body-'+customer.uid),
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
	<div v-for="(customer) in customers" :key="customer.uid" :id="dateTimestamp(created)">	
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg id="tooltip-customer-button" class="cursor-pointer rounded-full shadow bg-slate-900 hover:bg-slate-700 p-1 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"></path>
			</svg>
		</span>

		<div class="shadow rounded-lg sm:overflow-hidden bg-white mb-4">
			<h2 :id="'accordion-customer-heading-'+customer.uid">
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<span class="font-semibold normal-case"><span class="capitalize">{{ status.includes('ddress') ? 'Customer details updated' : status }}</span></span>
						</span>
					</span>
					<div class="flex items-center">
						<span class="ml-2 sm:ml-5 text-xs italic">{{ dateFormatter(created) }}</span> <!-- Responsive margin -->
						<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2> 
			<div :id="'accordion-customer-body-'+customer.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
					<p class="p-2 my-2 text-xs italic font-normal text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">{{ status }} by <b>{{ user }}</b> on {{ dateFormatter(created) }}</p>
				</div>
			</div>
		</div> 
	</div>
</template>