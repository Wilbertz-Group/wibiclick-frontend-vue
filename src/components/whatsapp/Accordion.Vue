<script setup>
	import { onMounted } from 'vue'
	import moment from 'moment'
	import { universalDateFormatter, dateTimestamp } from '../../helpers';
	import { Accordion } from 'flowbite'

	const props = defineProps(['msgs'])

	onMounted(() => {
    // create an array of objects with the id, trigger element (eg. button), and the content element
    const accordionItems = [];

		props.msgs.forEach((msg, i) => { 
			accordionItems.push({
				id: 'accordion-whatsapp-heading-'+ i,
				triggerEl: document.querySelector('#accordion-whatsapp-heading-'+i),
				targetEl: document.querySelector('#accordion-whatsapp-body-'+i),
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
	<div v-for="(msg, i) in msgs" :key="msg.id" :id="dateTimestamp(msg.createdAt)" class="shadow rounded-lg sm:overflow-hidden bg-white mb-4">
		<h2 :id="'accordion-whatsapp-heading-'+i">
			<button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " data-accordion-target="#accordion-arrow-icon-body-2" aria-expanded="false" aria-controls="accordion-arrow-icon-body-2">
				<span class="flex items-center">
					<div class="flex items-center -space-x-4 hover:space-x-1 mr-7" data-v-2fc82866-s="" data-v-2fb1486c-s="">
						<button type="button" class="block p-1.5 text-white bg-black border-2 border-white rounded-full transition-all active:bg-green-50 hover:scale-110 focus:outline-none focus:ring">
							<svg class="w-5 h-5 z-20 scale-110 bg-black rounded-full" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="whatsapp" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path class="" fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
						</button>
					</div>
					<span class="ml-3 text-sm text-teal-400">
						<span class="font-bold">We <span v-if="!msg.fromMe" class="text-gray-600">received</span> <span v-if="msg.fromMe" class="text-sky-500">sent</span> a message <span v-if="!msg.fromMe">from</span> <span v-if="msg.fromMe">to</span> {{msg.remoteJid.split("@")[0]}}</span>
					</span>
				</span>
				<div class="flex items-center">
					<span class="ml-5 text-xs italic">{{ universalDateFormatter(msg.createdAt) }}</span>
					<svg class="w-6 h-6 shrink-0 rotate-180" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
				</div>
			</button>
		</h2>
		<div :id="'accordion-whatsapp-body-'+i" class="hidden" aria-labelledby="accordion-arrow-icon-heading-2">
			<div class="px-3 py-1 rounded-b-md font-light border border-b-0 border-gray-200 dark:border-gray-700">
				<p class="mb-2 text-black dark:text-gray-400">{{ msg.text }}</p>
			</div>
		</div>
	</div>
</template>