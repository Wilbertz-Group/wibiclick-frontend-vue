<script setup>
	const props = defineProps(['item'])
</script>

<template>
	<div class="flex items-center space-x-4 shadow rounded py-2 px-1 mt-2">
			<div class="flex-shrink-0">
				<span class="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full px-3 text-white bg-slate-900">{{ item.quantity }}</span>				
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-white dark:text-gray-900">
						{{ item.name }}
				</p>
				<p class="text-sm text-gray-500 dark:text-gray-400">
						{{ item.description }}
				</p>
			</div>
			<div class="inline-flex items-center text-base font-semibold text-white dark:text-gray-900">
				R{{ item.amount }}
			</div>
	</div>
</template>