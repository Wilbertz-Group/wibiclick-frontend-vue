// wibiclick-frontend-vue/src/components/payments/PaymentAccordion.vue
<script setup>
import { uuid } from 'vue-uuid';
import { onMounted } from 'vue'
import { dateFormatter, dateTimestamp } from '../../helpers';
import { Accordion } from 'flowbite'

const props = defineProps(['payments', 'status', 'user', 'created'])

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
      active: true // Start expanded, adjust if needed
    })
  })

  // options with default values
  const options = {
    alwaysOpen: true,
    activeClasses: 'text-gray-900 dark:text-white',
    inactiveClasses: 'text-gray-500 dark:text-gray-400',
  };

  if (accordionItems.length > 0 && accordionItems[0].triggerEl) {
    const accordion = new Accordion(accordionItems, options);
  } else {
    // console.warn("Payment Accordion: No items or trigger elements found for initialization.");
  }
})
</script>

<template>
  <div v-for="(payment) in payments" :key="payment.uid" :id="dateTimestamp(created)">
    <span class="absolute flex items-center justify-center w-6 h-6 bg-green-200 rounded-full -left-3 ring-white dark:ring-gray-900 dark:bg-green-900">
      <!-- Payment Icon -->
      <svg class="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path></svg>
    </span>

    <div class="shadow relative rounded-lg sm:overflow-hidden bg-white mb-4">
      <h2 :id="'accordion-payment-heading-'+payment.uid">
        <button type="button" class="flex items-center justify-between w-full px-3 py-1 border-white " :data-accordion-target="'#accordion-payment-body-'+payment.uid" aria-expanded="true" :aria-controls="'accordion-payment-body-'+payment.uid">
          <span class="flex items-center">
            <span class="text-sm">
              <!-- Display Payment Info -->
              <span class="font-semibold normal-case">Payment {{ payment.status }} (R{{ payment.amountInCents / 100 }}) by <b>{{ user }}</b></span>
            </span>
          </span>
          <div class="flex items-center">
            <span class="ml-2 sm:ml-5 text-xs italic">{{ dateFormatter(created) }}</span>
            <svg data-accordion-icon class="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </div>
        </button>
      </h2>
      <div :id="'accordion-payment-body-'+payment.uid" class="hidden" :aria-labelledby="'accordion-payment-heading-'+payment.uid">
        <div class="px-3 py-1 rounded-b-md font-light border border-t-0 border-gray-200 dark:border-gray-700">
           <!-- Detailed Payment Info -->
           <p class="text-xs text-gray-700 dark:text-gray-400">Amount: R{{ payment.amountInCents / 100 }}</p>
           <p class="text-xs text-gray-700 dark:text-gray-400">Type: {{ payment.type }}</p>
           <p class="text-xs text-gray-700 dark:text-gray-400">Status: {{ payment.status }}</p>
           <p v-if="payment.reference" class="text-xs text-gray-700 dark:text-gray-400">Reference: {{ payment.reference }}</p>
           <p class="p-2 my-2 text-xs italic font-normal text-black border border-gray-200 rounded-lg dark:border-gray-500 dark:text-gray-300">Recorded by <b>{{ user }}</b> on {{ dateFormatter(created) }}</p>
        </div>
      </div>
      <!-- Optional: Add tag hover effect if needed -->
      <!-- <span class="tag-content-payment tag-content-style tag-hover-effect"></span> -->
    </div>
  </div>
</template>