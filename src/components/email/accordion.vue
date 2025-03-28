<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import moment from 'moment'
	import { AVWaveform } from 'vue-audio-visual'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'
	import { VideoPlayer } from '@videojs-player/vue'
  import 'video.js/dist/video-js.css'

 // Changed prop name from 'msgs' (array) to 'email' (single activity object)
 const props = defineProps(['email'])

 // Removed unsafe immediate access and uid assignment here.

 onMounted(() => {
 	const accordionItems = [];
 	const activity = props.email; // Use the single email activity object

 	// Check if email prop is a valid object and contains nested email details
 	if (activity && typeof activity === 'object' && activity.email) {
 		// Ensure UID exists on the activity object
 		if (!activity.uid) {
 			console.warn('Assigning UID in email/accordion.vue, should be done in parent:', activity);
 			activity.uid = uuid.v1();
 		}

 		const triggerEl = document.querySelector('#accordion-email-heading-' + activity.uid);
 		const targetEl = document.querySelector('#accordion-email-body-' + activity.uid);

 		// Only add if elements are found
 		if (triggerEl && targetEl) {
 			accordionItems.push({
 				id: 'accordion-email-heading-' + activity.uid,
 				triggerEl: triggerEl,
 				targetEl: targetEl,
 				active: false // Default to inactive
 			});
 		} else {
 			console.warn(`Could not find trigger/target elements for email accordion item with uid: ${activity.uid}`);
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
 		// Handle case where there is no email activity object or nested email details
 		// console.log('No email activity object to initialize accordion for.'); // Optional logging
 	}
 });
</script>

<template>
 <!-- Add v-if guard to ensure email activity and nested email object exist -->
 <template v-if="email && typeof email === 'object' && email.email">
 	<div :key="email.uid" :id="dateTimestamp(email.createdAt)">
 		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
 			<svg class="svg-inline--fa fa-envelope cursor-pointer rounded-full shadow tag-content-email hover:bg-slate-700 text-white" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>
 		</span>

 		<!-- Accordion Container: Added dark mode background and border -->
 		<div class="shadow relative rounded-lg sm:overflow-hidden bg-white dark:bg-gray-700/50 dark:border dark:border-gray-600/50 mb-4 ml-2">
 			<h2 :id="'accordion-email-heading-'+ email.uid">
 				<!-- Accordion Button: Removed border-white, added dark hover -->
 				<button type="button" class="flex items-center justify-between w-full px-3 py-1 dark:hover:bg-gray-800/50" data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
 					<span class="flex items-center">
 						<span class="text-sm">
 							<!-- Access nested email object -->
 							<span class="font-semibold"><span v-if="!email.email.from?.includes('info@')">received</span> <span v-if="email.email.from?.includes('info@')">sent</span> </span>
 						</span>
 					</span>
 					<div class="flex items-center">
 						<!-- Access nested email object -->
 						<span v-if="!email.email.from?.includes('info@')">
 							<svg class="w-5 h-5 rounded-full" fill="#3b67c2" stroke="white" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
 							</svg>
 						</span>
 						<!-- Access nested email object -->
 						<span v-if="email.email.from?.includes('info@')">
 							<svg class="w-5 h-5 rounded-full rotate-180" fill="#55c588" stroke="white" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
 							</svg>
 						</span>
 						<!-- Use activity createdAt -->
 						<span class="ml-2 sm:ml-5 text-xs italic text-gray-500 dark:text-gray-400">{{ dateFormatter(email.createdAt) }}</span> 
 						<svg class="w-6 h-6 shrink-0 rotate-180 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg> 
 					</div>
 				</button>
 			</h2>

 			<div :id="'accordion-email-body-'+ email.uid"  aria-labelledby="accordion-arrow-icon-heading-2">
 				<!-- Accordion Content Panel: Added dark mode background and border -->
 				<div class="px-3 py-1 rounded-b-md font-light border-t border-gray-200 dark:border-gray-600/50 dark:bg-gray-800/30"> 
 					<div class="py-1">
 						<p class="p-2 my-2 text-md italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
 							<!-- Access nested email object -->
 							{{ email.email.subject }}
 						</p>
 					</div>
 					<div class="py-1">
 						<p class="p-2 my-2 text-xs italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
 							<!-- Access nested email object -->
 							{{ email.email.bodyText }}
 						</p>
 					</div>
 				</div>
 			</div>

 			<span class="tag-content-email tag-content-style tag-hover-effect"></span>
 		</div>
 	</div>
 </template>
</template>

<style scoped>
	.bg-slate-800.border-slate-500 > audio {
    width: 100%;
    margin: 3% 0;
	}
</style>