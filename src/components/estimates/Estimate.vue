<script setup>
	const props = defineProps(['estimate'])
</script>

<template>
	<div class="shadow rounded-xl px-3 pt-3 pb-1 mt-3 cursor-move w-full bg-[#1e293b]">
		<div class="flex justify-right mb-0">
			<p class="bg-blue-600 text-sm text-white rounded-full shadow-md px-3 py-1.5 my-1 w-fit">sent</p>
		</div>
		<div class="mb-2 p-2">
			<div class="flex justify-between">
				<p class="text-sm font-bold text-white" >Estimate Number</p>
				<p class="text-sm text-white" >#179</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-white" >Amount</p>
				<p class="text-sm text-white" >R3000</p>
			</div>
			<div class="flex justify-between" >
				<p class="text-sm font-bold text-white" >Date</p>
				<p class="text-sm text-white" >Saturday, 07 January 2023</p>
			</div>
		</div>
		<div class="flex mt-4 mb-1 justify-between items-center" >
			<a 
				href="/edit-estimate?estimate_id=650649a3-1582-426b-901d-f0bb599af38f" 
				class="text-gray-800 cursor-pointer inline-block bg-white hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center" 
			> Edit </a>
			<a 
				href="/view-estimate?estimate_id=650649a3-1582-426b-901d-f0bb599af38f" 
				class="text-gray-800 cursor-pointer inline-block bg-white hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-3 py-1 text-center" 
			> View </a>
		</div>
	</div>
</template>