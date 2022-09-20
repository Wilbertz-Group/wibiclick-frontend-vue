<script setup>
import moment from 'moment'
const props = defineProps(['item', 'buttons'])

</script>

<template id="timeline-item-template">
	<li class="timeline-item">
		<div :class="buttons[item.name].color" class="timeline-badge">
			<font-awesome-icon :icon="buttons[item.name].icon" />
		</div>
		<div class="timeline-panel p-0">
			<div class="timeline-heading text-left text-xs text-gray-500 font-bold">
				{{ moment(item.created).format('MMM DD, YYYY h:mm a') }} 
			</div>
			<div class="timeline-body text-left text-sm tracking-tight">
				{{ buttons[item.name].name == 'Hubspot' ? 'Hubspot form submitted' : buttons[item.name].name + ' button clicked' }} on <a :href="item.url" target="_blank" class="underline underline-offset-2">{{ item.title || item.url }}</a>
			</div>
		</div>
	</li>
</template>  