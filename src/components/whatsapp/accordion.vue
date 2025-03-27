<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import moment from 'moment'
	import { AVWaveform } from 'vue-audio-visual'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'
	import { VideoPlayer } from '@videojs-player/vue'
  import 'video.js/dist/video-js.css'

 // Changed prop name from 'msgs' (array) to 'whatsapp' (single object)
 const props = defineProps(['whatsapp'])

 // Removed unsafe immediate access and uid assignment here.
 // UID assignment will happen within onMounted or a watcher if needed.

 onMounted(() => {
  const accordionItems = [];	
  const msg = props.whatsapp; // Use the single whatsapp object

  // Check if whatsapp prop is a valid object
  if (msg && typeof msg === 'object') {
  	// Ensure UID exists (should be assigned in parent, but safety check)
  	if (!msg.uid) {
  		console.warn('Assigning UID in whatsapp/accordion.vue, should be done in parent:', msg);
  		msg.uid = uuid.v1();
  	}

  	const triggerEl = document.querySelector('#accordion-whatsapp-heading-' + msg.uid);
  	const targetEl = document.querySelector('#accordion-whatsapp-body-' + msg.uid);

  	// Only add if elements are found
  	if (triggerEl && targetEl) {
  		accordionItems.push({
  			id: 'accordion-whatsapp-heading-' + msg.uid,
  			triggerEl: triggerEl,
  			targetEl: targetEl,
  			active: false // Default to inactive
  		});
  	} else {
  		console.warn(`Could not find trigger/target elements for whatsapp accordion item with uid: ${msg.uid}`);
  	}

  	// Only initialize Accordion if item was found
  	if (accordionItems.length > 0) {
  		// Set the first item to active if desired
  		// accordionItems[0].active = true;

  		const options = {
  			alwaysOpen: true, // Keep multiple items open if needed
  			activeClasses: 'text-gray-900 dark:text-white', // Classes for active trigger
  			inactiveClasses: 'text-gray-500 dark:text-gray-400', // Classes for inactive trigger
  		};

  		try {
  			const accordion = new Accordion(accordionItems, options);
  			// Optional: Store accordion instance if needed for programmatic control later
  			// accordionInstance.value = accordion;
  		} catch (e) {
  			console.error("Failed to initialize Flowbite Accordion:", e, accordionItems);
  		}
  	}
  } else {
  	// Handle case where there is no message object
  	// console.log('No whatsapp message object to initialize accordion for.'); // Optional logging
  }
 });
</script>

<template>
	<!-- Add v-if guard to ensure whatsapp and nested whatsapp object exist before rendering -->
	<template v-if="whatsapp && typeof whatsapp === 'object' && whatsapp.whatsapp">
		<div :key="whatsapp.uid" :id="dateTimestamp(whatsapp.createdAt)">
			<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full left-0 ring-white dark:ring-gray-900 dark:bg-blue-900">
				<svg class="svg-inline--fa fa-whatsapp cursor-pointer rounded-full shadow tag-content-whatsapp hover:bg-slate-700 p-1 text-white" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="whatsapp" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path class="" fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
			</span>

			<!-- Accordion Container: Added dark mode background and border -->
			<div class="shadow relative rounded-lg sm:overflow-hidden bg-white dark:bg-gray-700/50 dark:border dark:border-gray-600/50 mb-4 ml-2 ml-2">
				<h2 :id="'accordion-whatsapp-heading-'+ whatsapp.uid">
					<!-- Accordion Button: Removed border-white, added dark hover -->
					<button type="button" class="flex items-center justify-between w-full px-3 py-1 dark:hover:bg-gray-800/50" data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
						<span class="flex items-center">
							<span class="text-sm">
								<!-- Access nested whatsapp object -->
								<span class="font-semibold">We have <span v-if="!whatsapp.whatsapp.fromMe">received</span> <span v-if="whatsapp.whatsapp.fromMe">sent</span> a message <span v-if="!whatsapp.whatsapp.fromMe">from</span> <span v-if="whatsapp.whatsapp.fromMe">to</span> {{whatsapp.whatsapp.remoteJid?.split("@")[0]}}</span>
							</span>
						</span>
						<div class="flex items-center">
							<!-- Access nested whatsapp object -->
							<span v-if="!whatsapp.whatsapp.fromMe">
								<svg class="w-5 h-5 rounded-full" fill="#3b67c2" stroke="white" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</span>
							<!-- Access nested whatsapp object -->
							<span v-if="whatsapp.whatsapp.fromMe">
								<svg class="w-5 h-5 rounded-full rotate-180" fill="#55c588" stroke="white" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</span>
							<!-- Use activity createdAt -->
							<span class="ml-2 sm:ml-5 text-xs italic text-gray-500 dark:text-gray-400">{{ dateFormatter(whatsapp.createdAt) }}</span> 
							<svg class="w-6 h-6 shrink-0 rotate-180 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg> 
						</div>
					</button>
				</h2>

				<div :id="'accordion-whatsapp-body-'+ whatsapp.uid" aria-labelledby="accordion-arrow-icon-heading-2">
					<!-- Accordion Content Panel: Added dark mode background and border -->
					<div :class="whatsapp.whatsapp?.text?.match(/(\.ogg)/) ? 'bg-white dark:bg-gray-700' : ''" class="px-3 py-1 rounded-b-md font-light border-t border-gray-200 dark:border-gray-600/50 dark:bg-gray-800/30"> 
						<template v-if="whatsapp.whatsapp?.text?.match(/(\.jpeg|\.jpg|\.tif|\.tiff|\.bmp|\.gif|\.png|\.eps)/)">
							<div class="text-center py-2"> 
								<img :src="whatsapp.whatsapp?.text" class="m-auto w-full max-w-md rounded" loading="lazy" height="" width="" alt="WhatsApp Image">
								<div v-if="whatsapp.whatsapp.message" class="px-3 py-1 mt-2"> 
									
									<p class="p-2 my-2 text-xs italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
										{{ whatsapp.whatsapp.message }}
									</p>
								</div>
							</div>
						</template>
						<template v-else-if="whatsapp.whatsapp?.text?.match(/(.pdf)/)">
							<vue-pdf-embed :source="whatsapp.whatsapp.text" class="py-2"/> 
						</template>
						<template v-else-if="whatsapp.whatsapp?.text?.match(/(.ogg)/)">
							<audio class="w-full my-2" controls="" :src="whatsapp.whatsapp.text.replace('; ', '%3B_')"></audio>
						</template>
						<template v-else-if="whatsapp.whatsapp?.text?.match(/(.mp4)/)">
							<video-player
								:src="whatsapp.whatsapp?.text"
								class="video-player vjs-big-play-centered m-auto py-2"
								height="300px"
								crossorigin="anonymous"
								playsinline
								controls
								:loop="false"
								:volume="0.6"
							/>
						</template>
						<template v-else>
							<div class="py-1">
								
								<p class="p-2 my-2 text-xs italic font-normal bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
									{{ whatsapp.whatsapp?.text }}
								</p>
							</div>
						</template>
					</div>
				</div>

				<span class="tag-content-whatsapp tag-content-style tag-hover-effect"></span>
			</div>
		</div>
	</template> <!-- Closing tag for v-if -->
</template>

<style scoped>
	.bg-slate-800.border-slate-500 > audio {
    width: 100%;
    margin: 3% 0;
	}
</style>