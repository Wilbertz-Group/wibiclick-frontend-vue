<script setup>
	const props = defineProps(['params'])
</script>

<template>	
	<div class="flex items-center -space-x-4 hover:space-x-1">
		<a :href="'/edit-invoice?invoice_id='+params.value" target="_blank" class="z-20 p-2.5 block bg-blue-100 border-2 border-white rounded-full transition-all active:bg-blue-50 hover:scale-110 focus:outline-none focus:ring">
			<svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
			</svg>
		</a>
	</div>	
</template>