// wibiclick-frontend-vue/src/views/Expenses/ViewExpense.vue
<template>
  <Header title="View expense" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <main class="detail">
        <div v-if="expense.id" class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Expense Details</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about the expense.</p>
          </div>
          <div class="border-t border-gray-200">
            <dl>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Expense ID</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ expense.id }}</dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Type</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ expense.type }}</dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Amount</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ formatAmount(expense.amount) }}</dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Date</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ formatDate(expense.date) }}</dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Description</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ expense.description }}</dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Employee</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ expense.employee ? `${expense.employee.firstName} ${expense.employee.lastName}` : 'N/A' }}</dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Job</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ expense.job ? `Job #${expense.job.id}` : 'N/A' }}</dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Created At</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ formatDate(expense.createdAt) }}</dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Updated At</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ formatDate(expense.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <router-link :to="{ name: 'edit-expense', query: { expense_id: expense.id } }" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Edit Expense
          </router-link>
          <router-link :to="{ name: 'expenses-list' }" class="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Back to List
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref } from "vue";
import { useToast } from "vue-toast-notification";
import { useRoute, useRouter } from "vue-router";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

const loading = ref(false);
const toast = useToast();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const expense = ref({});

async function fetchExpense() {
  try {
    loading.value = true;
    const response = await axios.get(`expense/${route.query.expense_id}?id=${userStore.currentWebsite}`);
    expense.value = response.data.expense;
    loading.value = false;
  } catch (error) {
    console.error('Error fetching expense:', error);
    loading.value = false;
    toast.error("Error fetching expense data");
  }
}

onMounted(() => {
  if (!userStore.currentWebsite) {
    toast.warning("Please select a website first");
    router.push({ name: 'dashboard' });
  } else if (!route.query.expense_id) {
    toast.warning("No expense selected");
    router.push({ name: 'expenses-list' });
  } else {
    fetchExpense();
  }
});

function formatDate(date) {
  return moment(date).format('MMMM D, YYYY h:mm A');
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}
</script>