<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	// Changed prop name from 'notes' (array) to 'note' (single activity object)
	// Kept status, user, created as they might be passed separately in some contexts? Review if needed.
	const props = defineProps(['note', 'status', 'user', 'created'])

	// Removed unsafe immediate access and uid assignment here.

	onMounted(() => {
		const accordionItems = [];
		const activity = props.note; // Use the single note activity object

		// Check if note prop is a valid object
		if (activity && typeof activity === 'object') {
			// Ensure UID exists on the activity object
			if (!activity.uid) {
				console.warn('Assigning UID in notes/accordion.vue, should be done in parent:', activity);
				activity.uid = uuid.v1();
			}

			const triggerEl = document.querySelector('#accordion-note-heading-' + activity.uid);
			const targetEl = document.querySelector('#accordion-note-body-' + activity.uid);

			// Only add if elements are found
			if (triggerEl && targetEl) {
				accordionItems.push({
					id: 'accordion-note-heading-' + activity.uid,
					triggerEl: triggerEl,
					targetEl: targetEl,
					active: false // Default to inactive
				});
			} else {
				console.warn(`Could not find trigger/target elements for note accordion item with uid: ${activity.uid}`);
			}

			// Only initialize Accordion if item was found
			if (accordionItems.length > 0) {
				const options = {
					alwaysOpen: true, // Keep multiple items open if needed
					activeClasses: 'text-gray-900 dark:text-white', // Classes for active trigger
					inactiveClasses: 'text-gray-500 dark:text-gray-400', // Classes for inactive trigger
				};

				try {
					const accordion = new Accordion(accordionItems, options);
				} catch (e) {
					// Removed console.error
				}
			}
		} else {
			// Handle case where there is no note activity object
			// Removed console.log
		}
	});
</script>

<template>
	<!-- Add v-if guard to ensure note activity object exists -->
	<template v-if="note && typeof note === 'object'">
		<div :key="note.uid" :id="dateTimestamp(created || note.createdAt)"> 
			<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
				<svg id="tooltip-note-button" class="cursor-pointer rounded-full shadow tag-content-note hover:bg-slate-700 p-1 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z"></path><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z"></path></svg>
			</span>

			<!-- Accordion Container: Added dark mode background and border -->
			<div class="shadow relative rounded-lg sm:overflow-hidden bg-white dark:bg-gray-700/50 dark:border dark:border-gray-600/50 mb-4 ml-2">
				<h2 :id="'accordion-note-heading-'+note.uid">
					<!-- Accordion Button: Removed border-white, added dark hover -->
					<button type="button" class="flex items-center justify-between w-full px-3 py-1 dark:hover:bg-gray-800/50" data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
						<span class="flex items-center">
							<span class="text-sm">
								<span class="font-semibold normal-case"><span class="capitalize">{{ status ? status : note.status }}</span> by <b>{{ user ? user : note.User?.firstName }}</b></span>
							</span>
						</span>
						<div class="flex items-center">
							<span class="ml-2 sm:ml-5 text-xs italic text-gray-500 dark:text-gray-400">{{ created ? dateFormatter(created) : dateFormatter(note.createdAt) }}</span>
							<svg class="w-6 h-6 shrink-0 rotate-180 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
						</div>
					</button>
				</h2>
				<div :id="'accordion-note-body-'+note.uid" aria-labelledby="accordion-arrow-icon-heading-2">
					<!-- Accordion Content Panel: Added dark mode background and border -->
					<div class="px-3 py-1 rounded-b-md font-light border-t border-gray-200 dark:border-gray-600/50 dark:bg-gray-800/30">
						
						<p class="p-2 my-2 text-xs italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg" v-html="note.notes?.body || note.body"></p> 
					</div>
				</div>
				<span class="tag-content-note tag-content-style tag-hover-effect"></span>
			</div>
		</div>
	</template>
</template>