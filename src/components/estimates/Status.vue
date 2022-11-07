<script setup>
	const props = defineProps(['params'])
</script>

<template>	
	<div class="flex items-center -space-x-4 hover:space-x-1">
		<button v-if="params.data.reason == 'sent'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-blue-600 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">sent</button>
    <button v-else-if="params.data.reason == 'accepted'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-green-500 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-green-600 hover:shadow-lg focus:bg-green-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-700 active:shadow-lg transition duration-150 ease-in-out">accepted</button>
    <button v-else-if="params.data.reason == 'rejected'" type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 bg-red-600 text-white font-thin text-sm leading-tight rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out">rejected</button>
		<button v-else type="button" class="mt-1 inline-block px-3 w-[70px] py-1.5 border-2 border-gray-800 text-gray-800 font-thin text-sm leading-tight rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out">{{params.data.reason || ' - '}}</button>
	</div>	
</template>