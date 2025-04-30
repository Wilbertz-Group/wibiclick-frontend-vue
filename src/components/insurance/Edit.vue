<!-- wibiclick-frontend-vue/src/components/insurance/Edit.vue -->
<script setup>
	const props = defineProps(['params'])
</script>

<template>
	<div class="flex items-center justify-center">
		<router-link :to="{ name: 'edit-insurance-report', query:{ insurance_id: params.value } }" class="action-button edit-button" title="Edit Report">
			<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
			</svg>
			<span class="action-text">Edit</span>
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

.edit-button {
	background-color: rgba(79, 70, 229, 0.1);
	color: rgb(79, 70, 229);
	border: 1px solid rgba(79, 70, 229, 0.2);
}

.edit-button:hover {
	background-color: rgb(79, 70, 229);
	color: white;
	transform: translateY(-1px);
	box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);
}

.action-text {
	margin-left: 0.375rem;
	display: none;
}

.action-button:hover .action-text {
	display: inline;
}
</style>