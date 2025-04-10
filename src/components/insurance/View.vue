<script setup>
	const props = defineProps(['params'])
</script>

<template>
	<div class="flex items-center justify-center">
		<router-link :to="{ name: 'view-insurance-report', query:{ insurance_id: params.value } }" class="action-button view-button" title="View Report">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
			<span class="action-text">View</span>
		</router-link>
	</div>
</template>

<style scoped>
.action-button {
	display: flex;
	align-items: center;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-weight: 500;
	font-size: 0.75rem;
	transition: all 0.2s ease;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.view-button {
	background-color: rgba(16, 185, 129, 0.1);
	color: rgb(16, 185, 129);
	border: 1px solid rgba(16, 185, 129, 0.2);
}

.view-button:hover {
	background-color: rgb(16, 185, 129);
	color: white;
	transform: translateY(-1px);
	box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);
}

.action-text {
	margin-left: 0.375rem;
	display: none;
}

.action-button:hover .action-text {
	display: inline;
}
</style>