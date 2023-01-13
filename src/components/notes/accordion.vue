<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['notes', 'status', 'user', 'created'])

	props.notes.forEach((note) => { 
		note.uid = uuid.v1()
	})

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props.notes.forEach((note) => { 
			accordionItems.push({
				id: 'accordion-note-heading-'+ note.uid,
				triggerEl: document.querySelector('#accordion-note-heading-'+note.uid),
				targetEl: document.querySelector('#accordion-note-body-'+note.uid),
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
	<div v-for="(note) in notes" :key="note.uid" :id="dateTimestamp(created)" class="shadow rounded-lg sm:overflow-hidden bg-white mb-4">
		<h2 :id="'accordion-note-heading-'+note.uid">
			<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
				<span class="flex items-center">
					<div class="flex items-center -space-x-4 hover:space-x-1" data-v-2fc82866-s="" data-v-2fb1486c-s="">
						<button type="button" class="">
							<svg id="tooltip-note-button" data-tooltip-target="tooltip-note" class="w-8 h-8 cursor-pointer rounded-full shadow-lg bg-slate-900 hover:bg-slate-700 p-2 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z"></path><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z"></path></svg>
						</button>
					</div>
					<span class="ml-3 text-sm">
						<span class="font-semibold normal-case"><span class="capitalize">{{ status ? status : note?.activities[0]?.status }}</span> by <b>{{ user ? user : note?.User?.firstName }}</b></span>
					</span>
				</span>
				<div class="flex items-center">
					<span class="ml-5 text-xs italic">{{ created ? dateFormatter(created) : dateFormatter(note?.createdAt) }}</span>
					<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
				</div>
			</button>
		</h2> 
		<div :id="'accordion-note-body-'+note.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
			<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
				<p class="mb-2 text-black dark:text-gray-400" v-html="note.body"></p>
			</div>
		</div>
	</div> 
</template>