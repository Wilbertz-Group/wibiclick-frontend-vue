// wibiclick-frontend-vue/src/views/Expenses/AddExpense.vue
<template>
  <Header title="Add a new expense" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="mt-3 md:col-span-2">
            <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">
              <FormKit type="form" id="expense" submit-label="Add" @submit="saveExpense" :actions="false">
                <h2 class="mb-2 text-2xl text-cyan-900 font-bold">Add expense details below</h2>
                <hr />

                <div class="double mt-8">
                  <FormKit
                    type="select"
                    name="type"
                    label="Expense Type"
                    :options="expenseTypes"
                    v-model="expense.type"
                    validation="required"
                  />
                  <FormKit
                    type="select"
                    name="employeeId"
                    label="Employee"
                    :options="employees"
                    v-model="expense.employeeId"
                    validation="required"
                  />
                </div>

                <div class="double">
                  <FormKit
                    type="number"
                    name="amount"
                    label="Amount"
                    v-model="expense.amount"
                    validation="required|number|min:0"
                  />
                  <FormKit
                    type="date"
                    name="date"
                    label="Date"
                    v-model="expense.date"
                    validation="required|date"
                  />
                </div>

                <div class="double">
                  <FormKit
                    type="text"
                    name="description"
                    label="Description"
                    v-model="expense.description"
                    validation="required"
                  />
                  <FormKit
                    type="select"
                    name="jobId"
                    label="Job (Optional)"
                    :options="jobs"
                    v-model="expense.jobId"
                  />
                </div>

                <FormKit type="submit" label="Add expense" />
              </FormKit>
            </div>
            <div v-else class="shadow p-10 sm:rounded-md sm:overflow-hidden">Please select website on the navigation first</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import  useUserStore  from "@/stores/UserStore";
import { onMounted, ref, watch } from "vue";
import { useToast } from "vue-toast-notification";
import { useRouter, useRoute } from "vue-router";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

const loading = ref(false);
const toast = useToast();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const employees = ref([]);
const jobs = ref([]);

const expenseTypes = [
  { label: 'Fuel', value: 'FUEL' },
  { label: 'Parts', value: 'PARTS' },
  { label: 'Bonus', value: 'BONUS' },
  { label: 'Other', value: 'OTHER' },
]

const expense = ref({
  type: "",
  amount: 0,
  date: moment().format('YYYY-MM-DD'),
  description: "",
  employeeId: "",
  jobId: null,
});

async function fetchEmployees() {
  try {
    loading.value = true;
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    employees.value = response.data.employees.map(employee => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`
    }));
    loading.value = false;
  } catch (error) {
    console.error('Error fetching employees:', error);
    toast.error("Error fetching employees");
    loading.value = false;
  }
}

async function fetchJobs() {
  try {
    loading.value = true;
    const response = await axios.get(`jobs?id=${userStore.currentWebsite}`);
    jobs.value = [
      { value: null, label: 'No Job' },
      ...response.data.jobs.map(job => ({
        value: job.id,
        label: `${job.name || 'Unnamed Job'}: ${job.jobStatus} - ${moment(job.slotStart).format('dddd DD MMMM YYYY')}`
      }))
    ];
    loading.value = false;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    toast.error("Error fetching jobs");
    loading.value = false;
  }
}

async function saveExpense(data) {
  try {
    loading.value = true;
    const response = await axios.post(`add-expense?id=${userStore.currentWebsite}`, data);
    toast.success(response.data.message);
    loading.value = false;
    router.push({ name: 'expenses-list' });
  } catch (error) {
    console.error('Error adding expense:', error);
    loading.value = false;
    toast.error("Error adding expense");
  }
}

onMounted(() => {
  if (userStore.currentWebsite) {
    fetchEmployees();
    fetchJobs();
  }
});
</script>