<script setup>
const props = defineProps(['items', 'buttons'])

import timelineItem from "@/components/timeline-item.vue";

</script>

<template id="timeline-template">
  <ul class="timeline text-left overflow-auto">
		<timeline-item v-for="item in items" :item="item" :buttons="buttons"></timeline-item>	
  </ul>
</template>
