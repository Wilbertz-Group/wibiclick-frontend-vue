<script setup>
	const props = defineProps(['params'])
</script>

<template>
	<div class="flex items-center justify-center">
		<div v-if="params.data.status == 'sent'" class="status-badge bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
			<span class="status-dot bg-indigo-500"></span>
			<span class="status-text">Sent</span>
		</div>
		<div v-else-if="params.data.status == 'accepted'" class="status-badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
			<span class="status-dot bg-emerald-500"></span>
			<span class="status-text">Accepted</span>
		</div>
		<div v-else-if="params.data.status == 'rejected'" class="status-badge bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300">
			<span class="status-dot bg-rose-500"></span>
			<span class="status-text">Rejected</span>
		</div>
		<div v-else class="status-badge bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
			<span class="status-dot bg-gray-500"></span>
			<span class="status-text">{{params.data.status || ' - '}}</span>
		</div>
	</div>
</template>

<style scoped>
.status-badge {
	display: flex;
	align-items: center;
	padding: 0.375rem 0.75rem;
	border-radius: 9999px;
	font-weight: 500;
	font-size: 0.75rem;
	line-height: 1rem;
	letter-spacing: 0.025em;
	white-space: nowrap;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	transition: all 0.2s ease;
}

.status-badge:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.status-dot {
	height: 0.5rem;
	width: 0.5rem;
	border-radius: 9999px;
	margin-right: 0.5rem;
	display: inline-block;
}

.status-text {
	text-transform: capitalize;
}
</style>