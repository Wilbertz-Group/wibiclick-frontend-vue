<template>
	<header class="bg-white shadow">
      <div class="mx-auto py-6 px-4 sm:px-6 lg:px-10">
        <h1 class="text-3xl font-bold text-gray-900">{{title}}</h1>
      </div>
  </header>
</template>

<script setup>
	defineProps({
		title: String
	})
</script>
