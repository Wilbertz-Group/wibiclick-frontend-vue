<!-- TransactionList.vue -->
<script setup>
import { computed } from 'vue';
import moment from 'moment';

const props = defineProps(['jobs', 'expenses', 'payments']);

const allTransactions = computed(() => {
  return [
    ...props.jobs.map(job => ({ ...job, type: 'Job', amount: job.techAmount, date: job.slotStart })),
    ...props.expenses.map(expense => ({ ...expense, type: 'Expense', amount: -expense.amount, date: expense.date })),
    ...props.payments.map(payment => ({ ...payment, type: 'Payment', date: payment.createdAt }))
  ].sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};
</script>

<template>
  <table class="min-w-full bg-white">
    <thead>
      <tr>
        <th class="py-2 px-4 border-b">Date</th>
        <th class="py-2 px-4 border-b">Type</th>
        <th class="py-2 px-4 border-b">Description</th>
        <th class="py-2 px-4 border-b">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(transaction, index) in allTransactions" :key="index">
        <td class="py-2 px-4 border-b">{{ moment(transaction.date).format('YYYY-MM-DD') }}</td>
        <td class="py-2 px-4 border-b">{{ transaction.type }}</td>
        <td class="py-2 px-4 border-b">{{ transaction.name || transaction.description }}</td>
        <td class="py-2 px-4 border-b">{{ formatCurrency(transaction.amount) }}</td>
      </tr>
    </tbody>
  </table>
</template>