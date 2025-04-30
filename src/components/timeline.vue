<!-- wibiclick-frontend-vue/src/components/timeline.vue -->
<script setup>
import timelineItem from "@/components/timeline-item.vue";
const props = defineProps(['items', 'buttons'])

</script>

<template id="timeline-template">
  <ul class="timeline text-left overflow-y-auto">
		<timeline-item v-for="item in items" :item="item" :buttons="buttons"></timeline-item>	
  </ul>
</template>
