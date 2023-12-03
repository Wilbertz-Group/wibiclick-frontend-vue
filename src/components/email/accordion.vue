<script setup>
	import { uuid } from 'vue-uuid';
	import { onMounted } from 'vue'
	import moment from 'moment'
	import { AVWaveform } from 'vue-audio-visual'
	import { dateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'
	import { VideoPlayer } from '@videojs-player/vue'
  import 'video.js/dist/video-js.css'

	const props = defineProps(['msgs'])

	props?.msgs[0] != null ? props.msgs.forEach((msg) => { 
		msg.uid = uuid.v1()
	}) : '' 

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props?.msgs[0] != null ? props.msgs.forEach((msg) => { 
			accordionItems.push({
				id: 'accordion-email-heading-'+ msg.uid,
				triggerEl: document.querySelector('#accordion-email-heading-'+msg.uid),
				targetEl: document.querySelector('#accordion-email-body-'+msg.uid),
				active: true
			})
		}) : ''

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

	<div v-for="(msg) in msgs" :key="msg.uid" :id="dateTimestamp(msg.createdAt)">
		<span class="absolute flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full -left-3 ring-white dark:ring-gray-900 dark:bg-blue-900">
			<svg class="svg-inline--fa fa-envelope cursor-pointer rounded-full shadow tag-content-email hover:bg-slate-700 text-white" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>
		</span>

		<div class="shadow relative rounded-lg sm:overflow-hidden bg-white mb-4">
			<h2 :id="'accordion-email-heading-'+ msg.uid">
				<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
					<span class="flex items-center">
						<span class="text-sm">
							<span class="font-semibold">We have <span v-if="!msg.from.includes('info@')">received</span> <span v-if="msg.from.includes('info@')">sent</span> a message <span v-if="!msg.from.includes('info@')">from</span> <span v-if="msg.from.includes('info@')">to</span> {{msg.to}}</span>
						</span>
					</span>
					<div class="flex items-center">
						<span v-if="!msg.from.includes('info@')">
							<svg class="w-5 h-5 rounded-full" fill="#3b67c2" stroke="white" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</span>
						<span v-if="msg.from.includes('info@')">
							<svg class="w-5 h-5 rounded-full rotate-180" fill="#55c588" stroke="white" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</span>
						<span class="ml-5 text-xs italic">{{ dateFormatter(msg.createdAt) }}</span>
						<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
					</div>
				</button>
			</h2> 

			<div :id="'accordion-email-body-'+ msg.uid" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
				<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">				
					<div class="py-1">
						<p class="p-2 my-2 text-md italic font-normal bg-white text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">
							{{ msg.subject }} 
						</p>
					</div>
					<div class="py-1">
						<p class="p-2 my-2 text-xs italic font-normal bg-white text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">
							{{ msg.bodyText }} 
						</p>
					</div>
				</div>
			</div>

			<span class="tag-content-email tag-content-style tag-hover-effect"></span>
		</div> 
	</div>
</template>

<style scoped>
	.bg-slate-800.border-slate-500 > audio {
    width: 100%;
    margin: 3% 0;
	}
</style>