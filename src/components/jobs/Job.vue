<script setup>
	const props = defineProps(['job'])
</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full bg-[#1e293b]">
		<div class="flex justify-right mb-0">
			<p class="bg-emerald-400 text-sm text-white rounded-full shadow-md px-3 py-1.5 my-1 w-fit">scheduled</p>
		</div>
		<div class="mb-4 p-2">
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Location:</p>
				<p class="text-sm text-white">Hermanus</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Technician:</p>
				<p class="text-sm text-white">Donald Poni</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Date:</p>
				<p class="text-sm text-white">Saturday, 07 Jan 2023</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white">Time:</p>
				<p class="text-sm text-white">9:01 am</p>
			</div>
			<div class="">
				<p class="text-sm font-bold text-white">Issue: </p>
				<p class="text-sm text-white">Hi, may you provide me a quote for my Defy Double door Fridge Freezer. It is the...</p>
			</div>
		</div>
		<div class="flex mb-1 justify-between items-center">
			<div class="flex items-center -space-x-4 hover:space-x-1">
				<button type="button" class="block p-1.5 text-white bg-green-600 border-2 border-white rounded-full transition-all active:bg-green-50 hover:scale-110 focus:outline-none focus:ring">
					<svg class="w-6 h-6 z-20 scale-110 bg-green-600 rounded-full" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="whatsapp" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path class="" fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
				</button>
			</div>
			<div class="flex items-center -space-x-4 hover:space-x-1">
				<button class="z-20 block p-3 text-blue-700 bg-blue-100 border-2 border-white rounded-full transition-all active:bg-blue-50 hover:scale-110 focus:outline-none focus:ring" type="button">
					<svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
				</button>
			</div>
			<div class="flex items-center -space-x-4 hover:space-x-1">
				<a href="https://app.hubspot.com/contacts/9315358/contact/813451" target="_blank" class="z-20 block p-2.5 bg-rose-100 border-2 border-white rounded-full transition-all active:bg-blue-50 hover:scale-110 focus:outline-none focus:ring">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 13.107 13.099" preserveAspectRatio="xMidYMid"><path d="M12.027 6.222a3.33 3.33 0 0 0-1.209-1.201c-.382-.222-.777-.363-1.223-.424V3a1.17 1.17 0 0 0 .722-1.097 1.2 1.2 0 0 0-1.2-1.206 1.21 1.21 0 0 0-1.21 1.206c0 .49.26.908.707 1.097v1.588a3.49 3.49 0 0 0-1.064.334L3.275 1.685c.03-.113.056-.23.056-.353 0-.738-.598-1.336-1.336-1.336S.66.594.66 1.332s.598 1.336 1.336 1.336c.252 0 .485-.074.686-.195l.28.212L6.797 5.45c-.203.186-.392.398-.543.636-.306.485-.493 1.018-.493 1.6v.12a3.35 3.35 0 0 0 .21 1.156c.116.316.286.604.497.864l-1.274 1.277c-.377-.14-.8-.047-1.085.238-.194.193-.303.456-.302.73s.108.535.303.73.456.303.73.303.537-.108.73-.303.303-.456.302-.73a1.03 1.03 0 0 0-.048-.31l1.316-1.316c.18.125.375.23.585.32a3.42 3.42 0 0 0 1.369.288h.09c.552 0 1.073-.13 1.562-.395a3.23 3.23 0 0 0 1.224-1.153c.307-.49.475-1.033.475-1.63v-.03c0-.587-.136-1.128-.42-1.624zM10.42 8.984c-.357.397-.768.642-1.232.642H9.1c-.265 0-.525-.073-.778-.207a1.8 1.8 0 0 1-.682-.621c-.184-.26-.284-.544-.284-.845v-.09c0-.296.057-.577.2-.842.153-.3.36-.515.635-.694s.558-.265.88-.265h.03c.29 0 .567.057.827.19a1.75 1.75 0 0 1 .65.591 1.88 1.88 0 0 1 .291.83l.007.187c0 .407-.156.784-.467 1.126z" fill="#f8761f"></path></svg>
				</a>
			</div>
		</div>
	</div>
</template>