<script setup>
	const props = defineProps(['params'])
</script>

<template>	
	<div class="flex items-center -space-x-4 hover:space-x-1">
		<button v-if="params.data.reason == 'paid'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-green-500 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-green-600 hover:shadow-lg focus:bg-green-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-700 active:shadow-lg transition duration-150 ease-in-out">paid</button>
    <button v-else-if="params.data.reason == 'processing'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-blue-500 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-blue-600 hover:shadow-lg focus:bg-blue-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-700 active:shadow-lg transition duration-150 ease-in-out">processing</button>
    <button v-else-if="params.data.reason == 'pending'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-yellow-500 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-yellow-600 hover:shadow-lg focus:bg-yellow-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-yellow-700 active:shadow-lg transition duration-150 ease-in-out">pending</button>
    <button v-else-if="params.data.reason == 'Pending'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-yellow-500 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-yellow-600 hover:shadow-lg focus:bg-yellow-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-yellow-700 active:shadow-lg transition duration-150 ease-in-out">pending</button>
		<button v-else type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 border-2 border-gray-800 text-gray-800 font-thin text-sm leading-tight rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out">{{params.data.reason || ' - '}}</button>
	</div>	
</template>