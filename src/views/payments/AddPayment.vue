<script setup>
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, watch } from "vue";
import { useToast } from "vue-toast-notification";
import { useRouter } from "vue-router";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

const loading = ref(false);
const toast = useToast();
const router = useRouter();
const userStore = useUserStore();

const customers = ref([]);
const jobs = ref([]);
const invoices = ref([]);
const estimates = ref([]);

const payment = ref({
  type: "INVOICE",
  status: "pending",
  amountInCents: 0,
  currency: "ZAR",
  customerId: "",
  jobId: "",
  invoiceId: null,
  estimateId: null,
});

async function fetchCustomers() {
  try {
    loading.value = true;
    const response = await axios.get(`customers-by-recent-jobs?id=${userStore.currentWebsite}`);
    customers.value = response.data.customers.map(customer => ({
      value: customer.id,
      label: customer.name
    }));
    loading.value = false;
  } catch (error) {
    console.log(error);
    toast.error("Error fetching customers");
    loading.value = false;
  }
}

async function fetchJobs(customerId) {
  try {
    loading.value = true;
    const response = await axios.get(`jobs-for-contact?id=${userStore.currentWebsite}&contactId=${customerId}`);
    jobs.value = response.data.jobs.map(job => ({
      value: job.id,
      label: `Job #${job.jobStatus} - ${job.slotStart.split('T')[0]}`
    }));
    loading.value = false;
  } catch (error) {
    console.log(error);
    toast.error("Error fetching jobs");
    loading.value = false;
  }
}

async function fetchInvoices(customerId) {
  try {
    loading.value = true;
    const response = await axios.get(`invoices?id=${userStore.currentWebsite}&customerId=${customerId}`);
    invoices.value = response.data.invoices.map(invoice => ({
      value: invoice.id,
      label: `Invoice #${invoice.number} - ${invoice.reason} - R${invoice.sales}`
    }));
    loading.value = false;
  } catch (error) {
    console.log(error);
    toast.error("Error fetching invoices");
    loading.value = false;
  }
}

async function fetchEstimates(customerId) {
  try {
    loading.value = true;
    const response = await axios.get(`estimates?id=${userStore.currentWebsite}&customerId=${customerId}`);
    estimates.value = response.data.estimates.map(estimate => ({
      value: estimate.id,
      label: `Estimate #${estimate.number} - ${estimate.reason} - R${estimate.sales}`
    }));
    loading.value = false;
  } catch (error) {
    console.log(error);
    toast.error("Error fetching estimates");
    loading.value = false;
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

watch(() => payment.value.customerId, (newCustomerId) => {
  if (newCustomerId) {
    fetchJobs(newCustomerId);
    fetchInvoices(newCustomerId);
    fetchEstimates(newCustomerId);
  } else {
    jobs.value = [];
    invoices.value = [];
    estimates.value = [];
  }
});

onMounted(() => {
  if (userStore.currentWebsite) {
    fetchCustomers();
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
                    :options="customers"
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
                    :options="[{ value: null, label: 'No Job' }, ...jobs]"
                    v-model="payment.jobId"
                    :disabled="!payment.customerId"
                  />
                  <FormKit
                    type="select"
                    name="invoiceId"
                    label="Invoice (Optional)"
                    :options="[{ value: null, label: 'No Invoice' }, ...invoices]"
                    v-model="payment.invoiceId"
                    :disabled="!payment.customerId"
                  />
                </div>

                <div class="double">
                  <FormKit
                    type="select"
                    name="estimateId"
                    label="Estimate (Optional)"
                    :options="[{ value: null, label: 'No Estimate' }, ...estimates]"
                    v-model="payment.estimateId"
                    :disabled="!payment.customerId"
                  />
                  <FormKit
                    type="select"
                    name="status"
                    label="Payment Status"
                    :options="[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Successful', value: 'successful' },
                      { label: 'Failed', value: 'failed' }
                    ]"
                    v-model="payment.status"
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