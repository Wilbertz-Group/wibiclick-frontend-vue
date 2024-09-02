<script setup>
import { uuid } from 'vue-uuid';
import { onMounted } from 'vue'
import { dateFormatter, dateTimestamp } from '../../helpers';
import { Accordion } from 'flowbite'

const props = defineProps(['expenses', 'type', 'employee', 'created'])

let uid;

props.expenses.forEach((expense) => { 
  expense.uid = uuid.v1()
})

onMounted(() => {
  // create an array of objects with the id, trigger element (eg. button), and the content element
  const accordionItems = [];

  props.expenses.forEach((expense) => { 
    accordionItems.push({
      id: 'accordion-expense-heading-'+ expense.uid,
      triggerEl: document.querySelector('#accordion-expense-heading-'+expense.uid),
      targetEl: document.querySelector('#accordion-expense-body-'+expense.uid),
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
  <div v-for="(expense) in expenses" :key="expense.uid" :id="dateTimestamp(created)">  
    <h2 :id="'accordion-expense-heading-'+expense.uid">
      <button type="button" class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" :data-accordion-target="'#accordion-expense-body-'+expense.uid" aria-expanded="true" :aria-controls="'accordion-expense-body-'+expense.uid">
        <span>{{ expense.description }} - {{ dateFormatter(expense.date) }}</span>
        <svg data-accordion-icon class="w-6 h-6 rotate-180 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </h2>
    <div :id="'accordion-expense-body-'+expense.uid" class="hidden" :aria-labelledby="'accordion-expense-heading-'+expense.uid">
      <div class="p-5 font-light border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
        <p class="mb-2 text-gray-500 dark:text-gray-400">Type: {{ expense.type }}</p>
        <p class="mb-2 text-gray-500 dark:text-gray-400">Amount: R{{ expense.amount }}</p>
        <p class="mb-2 text-gray-500 dark:text-gray-400">Date: {{ dateFormatter(expense.date) }}</p>
        <p class="mb-2 text-gray-500 dark:text-gray-400">Description: {{ expense.description }}</p>
        <p v-if="expense.employee" class="mb-2 text-gray-500 dark:text-gray-400">Employee: {{ expense.employee.firstName }} {{ expense.employee.lastName }}</p>
        <p v-if="expense.job" class="mb-2 text-gray-500 dark:text-gray-400">Job: #{{ expense.job.id }}</p>
        <div class="flex justify-between mt-4">
          <router-link :to="{ name: 'edit-expense', query: { expense_id: expense.id } }" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Edit</router-link>
          <router-link :to="{ name: 'view-expense', query: { expense_id: expense.id } }" class="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">View</router-link>
        </div>
      </div>
    </div>
  </div>
</template>