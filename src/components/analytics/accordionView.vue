<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	// Changed props to accept a single 'view' object (the activity object)
	const props = defineProps(['view'])
	// UID will come from the parent activity object (props.view.uid)

	onMounted(() => {
		const accordionItems = [];
		const activity = props.view; // Use the single view activity object

		// Check if view prop is a valid object
		if (activity && typeof activity === 'object') {
			// Ensure UID exists on the activity object
			if (!activity.uid) {
				console.warn('Assigning UID in analytics/accordionView.vue, should be done in parent:', activity);
				activity.uid = uuid.v1();
			}

			const triggerEl = document.querySelector('#accordion-views-heading-' + activity.uid);
			const targetEl = document.querySelector('#accordion-views-body-' + activity.uid);

			// Only add if elements are found
			if (triggerEl && targetEl) {
				accordionItems.push({
					id: 'accordion-views-heading-' + activity.uid,
					triggerEl: triggerEl,
					targetEl: targetEl,
					active: false // Default to inactive
				});
			} else {
				console.warn(`Could not find trigger/target elements for view accordion item with uid: ${activity.uid}`);
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
					console.error("Failed to initialize Flowbite Accordion:", e, accordionItems);
				}
			}
		} else {
			// Handle case where there is no view activity object
			// console.log('No view activity object to initialize accordion for.'); // Optional logging
		}
	});
</script>

<template>
	<!-- Add v-if guard to ensure view activity object and nested data exist -->
	<template v-if="view && typeof view === 'object'">
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg id="tooltip-views-button" class="p-.5 cursor-pointer rounded-full shadow bg-slate-900 hover:bg-slate-700 p-0 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
			</svg>
		</span>

		<!-- Accordion Container: Added dark mode background and border -->
		<div :key="view.uid" :id="dateTimestamp(view.createdAt)" class="shadow relative rounded-lg sm:overflow-hidden bg-white dark:bg-gray-700/50 dark:border dark:border-gray-600/50 mb-4 ml-2">
			<h2 :id="'accordion-views-heading-'+view.uid">
				<!-- Accordion Button: Removed border-white, added dark hover -->
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 dark:hover:bg-gray-800/50" data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<!-- Access nested data -->
							<span class="font-semibold normal-case"><span class="capitalize">{{ view.customer?.name || 'Visitor' }}</span> viewed a page</span>
						</span>
					</span>
					<div class="flex items-center">
						<!-- Adjusted text color -->
						<span class="ml-2 sm:ml-5 text-xs italic text-gray-500 dark:text-gray-400">{{ dateFormatter(view.createdAt) }}</span>
						<!-- Adjusted icon color -->
						<svg class="w-6 h-6 shrink-0 rotate-180 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2>
			<div :id="'accordion-views-body-'+view.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<!-- Accordion Content Panel: Added dark mode background and border -->
				<div class="px-3 py-1 rounded-b-md font-light border-t border-gray-200 dark:border-gray-600/50 dark:bg-gray-800/30">
					{/* Text Content: Added dark mode styles */}
					<p class="p-2 my-2 text-xs italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
						<span class="capitalize">{{ view.customer?.name || 'Visitor' }}</span> viewed <a target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline" :href="view.page?.url">{{ view.page?.title || view.page?.url }}</a>
					</p>
				</div>
			</div>
		</div>
	</template>
</template>