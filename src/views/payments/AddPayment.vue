// wibiclick-frontend-vue/src/views/payments/AddPayment.vue
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

const customers = ref([]);
const jobs = ref([]);
const invoices = ref([]);
const estimates = ref([]);
const technicians = ref([]);

const payment = ref({
  type: "INVOICE",
  status: "pending",
  amountInCents: 0,
  currency: "ZAR",
  customerId: "",
  jobId: "",
  invoiceId: null,
  estimateId: null,
  employeeId: "",
});

async function fetchTechnicians() {
  try {
    loading.value = true;
    const response = await axios.get(`employees?id=${userStore.currentWebsite}`);
    technicians.value = response.data.employees.map(technician => ({
      value: technician.id,
      label: `${technician.firstName} ${technician.lastName}`
    }));
    loading.value = false;
  } catch (error) {
    console.error(error);
    toast.error("Error fetching technicians");
    loading.value = false;
  }
}

async function fetchCustomers() {
  try {
    loading.value = true;
    const response = await axios.get(`customers-by-recent-jobs?id=${userStore.currentWebsite}`);
    customers.value = response.data.customers.map(customer => ({
      value: customer.id,
      label: customer.name
    }));
    loading.value = false;

    const customerIdFromQuery = route.query.customer_id;
    if (customerIdFromQuery) {
      payment.value.customerId = customerIdFromQuery;
      await fetchCustomerData(customerIdFromQuery);
    }
  } catch (error) {
    console.log(error);
    toast.error("Error fetching customers");
    loading.value = false;
  }
}

async function fetchCustomerData(customerId) {
  await Promise.all([
    fetchJobs(customerId),
    fetchInvoices(customerId),
    fetchEstimates(customerId)
  ]);
}

async function fetchJobs(customerId) {
  try {
    loading.value = true;
    const response = await axios.get(`jobs-for-contact?id=${userStore.currentWebsite}&contactId=${customerId}`);
    jobs.value = response.data.jobs.map(job => ({
      value: job.id,
      label: `Job #${job.jobStatus} - ${job.slotStart.split('T')[0]}`,
      slotStart: job.slotStart,
      employeeId: job.employee?.id
    })).sort((a, b) => new Date(b.slotStart) - new Date(a.slotStart));

    if (jobs.value.length > 0) {
      const mostRecentJob = jobs.value[0];
      payment.value.jobId = mostRecentJob.value;
      payment.value.employeeId = mostRecentJob.employeeId;
      await fetchInvoices(customerId, mostRecentJob.value);
      await fetchEstimates(customerId, mostRecentJob.value);
    }

    loading.value = false;
  } catch (error) {
    console.log(error);
    toast.error("Error fetching jobs");
    loading.value = false;
  }
}

async function fetchInvoices(customerId, jobId = null) {
  try {
    loading.value = true;
    let url = `invoices?id=${userStore.currentWebsite}&customerId=${customerId}`;
    if (jobId) url += `&jobId=${jobId}`;
    const response = await axios.get(url);
    invoices.value = response.data.invoices.map(invoice => ({
      value: invoice.id,
      label: `Invoice #${invoice.number} - ${invoice.reason} - R${invoice.sales}`,
      amount: invoice.sales * 100
    }));
    loading.value = false;
  } catch (error) {
    console.error(error);
    toast.error("Error fetching invoices");
    loading.value = false;
  }
}

async function fetchEstimates(customerId, jobId = null) {
  try {
    loading.value = true;
    let url = `estimates?id=${userStore.currentWebsite}&customerId=${customerId}`;
    if (jobId) url += `&jobId=${jobId}`;
    const response = await axios.get(url);
    estimates.value = response.data.estimates.map(estimate => ({
      value: estimate.id,
      label: `Estimate #${estimate.number} - ${estimate.reason} - R${estimate.sales}`
    }));
    loading.value = false;
  } catch (error) {
    console.error(error);
    toast.error("Error fetching estimates");
    loading.value = false;
  }
}

function handleInvoiceSelection(selectedInvoiceId) {  
  const selectedInvoice = invoices.value.find(invoice => invoice.value === selectedInvoiceId.target.value);
  if (selectedInvoice) {
    payment.value.amountInCents = selectedInvoice.amount;
  }
}

function handleJobSelection(selectedJobId) {
  payment.value.jobId = selectedJobId.target.value;
  const selectedJob = jobs.value.find(job => job.value === selectedJobId.target.value);
  if (selectedJob) {
    payment.value.employeeId = selectedJob.employeeId;
  }
  if (selectedJobId.target.value && payment.value.customerId) {
    fetchInvoices(payment.value.customerId, selectedJobId.target.value);
    fetchEstimates(payment.value.customerId, selectedJobId.target.value);
  } else {
    invoices.value = [];
    estimates.value = [];
  }
}

async function savePayment(data) {
  try {
    loading.value = true;
    const response = await axios.post('add-payment?id='+ userStore.currentWebsite, data);
    toast.success(response.data.message);
    loading.value = false;
    router.push({ name: 'payments-list' });
  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error adding payment");
  }
}

watch(() => payment.value.customerId, async (newCustomerId) => {
  if (newCustomerId) {
    await fetchJobs(newCustomerId);
    // The most recent job and technician are now auto-selected in fetchJobs
  } else {
    jobs.value = [];
    invoices.value = [];
    estimates.value = [];
    payment.value.jobId = "";
    payment.value.employeeId = "";
  }
});

watch(() => payment.value.jobId, (newJobId) => {
  if (newJobId && payment.value.customerId) {
    fetchInvoices(payment.value.customerId, newJobId);
    fetchEstimates(payment.value.customerId, newJobId);
  } else {
    invoices.value = [];
    estimates.value = [];
  }
});

onMounted(() => {
  if (userStore.currentWebsite) {
    fetchCustomers();
    fetchTechnicians();
  }
});
</script>

<template>
  <Header title="Add a new payment" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="mt-3 md:col-span-2">
            <div v-if="userStore.currentWebsite" class="shadow p-10 sm:rounded-md sm:overflow-hidden">
              <FormKit type="form" id="payment" submit-label="Add" @submit="savePayment" :actions="false">
                <h2 class="mb-2 text-2xl text-cyan-900 font-bold">Add payment details below</h2>
                <hr />

                <div class="double mt-8">
                  <FormKit
                    type="select"
                    name="customerId"
                    label="Customer"
                    :options="[{ value: null, label: 'Select Customer' }, ...customers]"
                    v-model="payment.customerId"
                    validation="required"
                  />
                  <FormKit
                    type="select"
                    name="type"
                    label="Payment Type"
                    :options="[
                      { label: 'Invoice', value: 'INVOICE' },
                      { label: 'Deposit', value: 'DEPOSIT' }
                    ]"
                    v-model="payment.type"
                    validation="required"
                  />
                </div>

                <div class="double">
                  <FormKit
                    type="number"
                    name="amountInCents"
                    label="Amount (in cents)"
                    v-model="payment.amountInCents"
                    validation="required|number|min:0"
                  />
                  <FormKit
                    type="text"
                    name="currency"
                    label="Currency"
                    v-model="payment.currency"
                    validation="required"
                  />
                </div>

                <div class="double">
                  <FormKit
                    type="select"
                    name="jobId"
                    label="Job"
                    :options="[{ value: null, label: 'Select Job' }, ...jobs]"
                    v-model="payment.jobId"
                    :disabled="!payment.customerId"
                    @change="handleJobSelection"
                  />
                  <FormKit
                    type="select"
                    name="invoiceId"
                    label="Invoice (Optional)"
                    :options="[{ value: null, label: 'Select Invoice' }, ...invoices]"
                    v-model="payment.invoiceId"
                    :disabled="!payment.customerId"
                    @change="handleInvoiceSelection"
                  />
                </div>

                <div class="double">
                  <FormKit
                    type="select"
                    name="estimateId"
                    label="Estimate (Optional)"
                    :options="[{ value: null, label: 'Select Estimate' }, ...estimates]"
                    v-model="payment.estimateId"
                    :disabled="!payment.customerId"
                  />
                  <FormKit
                    type="select"
                    name="status"
                    label="Payment Status"
                    :options="[
                      { label: 'Successful', value: 'successful' },
                      { label: 'Pending', value: 'pending' },                      
                      { label: 'Failed', value: 'failed' }
                    ]"
                    v-model="payment.status"
                    validation="required"
                  />
                </div>

                <div class="">
                  <FormKit
                    type="select"
                    name="employeeId"
                    label="Technician"
                    :options="[{ value: null, label: 'Select Technician' }, ...technicians]"
                    v-model="payment.employeeId"
                    validation="required"
                  />
                </div>

                <FormKit type="submit" label="Add payment" />
              </FormKit>
            </div>
            <div v-else class="shadow p-10 sm:rounded-md sm:overflow-hidden">Please select website on the navigation first</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>