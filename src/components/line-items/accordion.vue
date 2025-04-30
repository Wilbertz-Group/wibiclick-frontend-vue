// wibiclick-frontend-vue/src/components/line-items/accordion.vue
<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['lineitems', 'status', 'user', 'created'])

	let uid;

	props.lineitems.forEach((lineitem) => { 
		lineitem.uid = uuid.v1()
	})

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props.lineitems.forEach((lineitem) => { 
			accordionItems.push({
				id: 'accordion-lineitem-heading-'+ lineitem.uid,
				triggerEl: document.querySelector('#accordion-lineitem-heading-'+lineitem.uid),
				targetEl: document.querySelector('#accordion-lineitem-body-'+lineitem.uid),
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
	<div v-for="(lineitem) in lineitems" :key="lineitem.uid" :id="dateTimestamp(created)">	
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg id="tooltip-lineitem-button" class="cursor-pointer rounded-full shadow tag-content-line-item hover:bg-slate-700 p-1 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"></path>
			</svg>
		</span>

		<div class="shadow relative rounded-lg sm:overflow-hidden bg-white mb-4">
			<h2 :id="'accordion-lineitem-heading-'+lineitem.uid">
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<span class="font-semibold normal-case"><span class="capitalize">{{ status }}</span> by <b>{{ user }}</b></span>
						</span>
					</span>
					<div class="flex items-center">
						<span class="ml-2 sm:ml-5 text-xs italic">{{ dateFormatter(created) }}</span> <!-- Responsive margin -->
						<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2> 
			<div :id="'accordion-lineitem-body-'+lineitem.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
					<p class="p-2 my-2 text-xs italic font-normal text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">{{ status }} by <b>{{ user }}</b> on {{ dateFormatter(created) }}</p>
				</div>
			</div>
			<span class="tag-content-line-item tag-content-style tag-hover-effect"></span>
		</div> 
	</div>
</template>