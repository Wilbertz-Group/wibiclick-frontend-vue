<script setup>
import { uuid } from 'vue-uuid';
import { onMounted } from 'vue'
import { dateFormatter, dateTimestamp } from '../../helpers';
import { Accordion } from 'flowbite'

const props = defineProps(['payments', 'status', 'user', 'created'])

let uid;

props.payments.forEach((payment) => { 
  payment.uid = uuid.v1()
})

onMounted(() => {
  // create an array of objects with the id, trigger element (eg. button), and the content element
  const accordionItems = [];

  props.payments.forEach((payment) => { 
    accordionItems.push({
      id: 'accordion-payment-heading-'+ payment.uid,
      triggerEl: document.querySelector('#accordion-payment-heading-'+payment.uid),
      targetEl: document.querySelector('#accordion-payment-body-'+payment.uid),
      active: true
    })
  })

  // options with default values
  const options = {
    alwaysOpen: true,
    activeClasses: 'text-gray-900 dark:text-white',
    inactiveClasses: 'text-gray-500 dark:text-gray-400',
  };

  const accordion = new Accordion(accordionItems, options);
})
</script>

<template>
  <div v-for="(payment) in payments" :key="payment.uid" :id="dateTimestamp(created)">  
    <!-- Accordion content (similar to insurance accordion) -->
  </div>
</template>