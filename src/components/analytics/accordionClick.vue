<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	// Changed props to accept a single 'click' object (the activity object)
	const props = defineProps(['click'])
	// UID will come from the parent activity object (props.click.uid)

	onMounted(() => {
		const accordionItems = [];
		const activity = props.click; // Use the single click activity object

		// Check if click prop is a valid object
		if (activity && typeof activity === 'object') {
			// Ensure UID exists on the activity object
			if (!activity.uid) {
				console.warn('Assigning UID in analytics/accordionClick.vue, should be done in parent:', activity);
				activity.uid = uuid.v1();
			}

			const triggerEl = document.querySelector('#accordion-clicks-heading-' + activity.uid);
			const targetEl = document.querySelector('#accordion-clicks-body-' + activity.uid);

			// Only add if elements are found
			if (triggerEl && targetEl) {
				accordionItems.push({
					id: 'accordion-clicks-heading-' + activity.uid,
					triggerEl: triggerEl,
					targetEl: targetEl,
					active: false // Default to inactive
				});
			} else {
				console.warn(`Could not find trigger/target elements for click accordion item with uid: ${activity.uid}`);
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
			// Handle case where there is no click activity object
			// Removed console.log
		}
	});
</script>

<template>
	<!-- Add v-if guard to ensure click activity object and nested data exist -->
	<template v-if="click && typeof click === 'object'">
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg id="tooltip-clicks-button" class="p-.5 cursor-pointer rounded-full shadow bg-slate-900 hover:bg-slate-700 p-.5 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"></path>
			</svg>
		</span>

		<!-- Accordion Container: Added dark mode background and border -->
		<div :key="click.uid" :id="dateTimestamp(click.createdAt)" class="shadow relative rounded-lg sm:overflow-hidden bg-white dark:bg-gray-700/50 dark:border dark:border-gray-600/50 mb-4 ml-2">
			<h2 :id="'accordion-clicks-heading-'+click.uid">
				<!-- Accordion Button: Removed border-white, added dark hover -->
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 dark:hover:bg-gray-800/50" data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<!-- Access nested data -->
							<span class="font-semibold normal-case"><span class="capitalize">{{ click.customer?.name || 'Visitor' }}</span> clicked on a page</span>
						</span>
					</span>
					<div class="flex items-center">
						<!-- Adjusted text color -->
						<span class="ml-2 sm:ml-5 text-xs italic text-gray-500 dark:text-gray-400">{{ dateFormatter(click.createdAt) }}</span>
						<!-- Adjusted icon color -->
						<svg class="w-6 h-6 shrink-0 rotate-180 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2>
			<div :id="'accordion-clicks-body-'+click.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<!-- Accordion Content Panel: Added dark mode background and border -->
				<div class="px-3 py-1 rounded-b-md font-light border-t border-gray-200 dark:border-gray-600/50 dark:bg-gray-800/30">

					<p class="p-2 my-2 text-xs italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
						<span class="capitalize">{{ click.customer?.name || 'Visitor' }}</span> clicked <code class="font-mono font-semibold">{{ click.click?.button || 'unknown element' }}</code> on <a target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline" :href="click.page?.url">{{ click.page?.title || click.page?.url }}</a>
					</p>
				</div>
			</div>
		</div>
	</template>
</template>