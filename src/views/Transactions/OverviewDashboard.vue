<script setup>
import { ref, onMounted, watchEffect } from "vue";
import axios from "axios";
import _ from 'lodash';
import moment from 'moment';
import { useUserStore } from "@/stores/UserStore";
import { useToast } from 'vue-toast-notification';
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";

const userStore = useUserStore();
const toast = useToast();

const loading = ref(false);
const options = ref({});
const series = ref([]);
const technicians = ref([]);
const selectedTechnician = ref(null);
const year = ref(moment().year());
const month = ref(moment().month() + 1);
const report = ref(null);

const fetchTechnicians = async () => {
  try {
    loading.value = true;
    const response = await axios.get(`/employees?id=${userStore.currentWebsite}`);
    technicians.value = response.data.employees;
  } catch (error) {
    console.error('Error fetching technicians:', error);
    toast.error("Error fetching technicians");
  } finally {
    loading.value = false;
  }
};

const fetchReport = async () => {
  if (!selectedTechnician.value) return;

  try {
    loading.value = true;
    const response = await axios.get(`/technician-reports/monthly/${selectedTechnician.value}`, {
      params: { 
        year: year.value, 
        month: month.value,
        id: userStore.currentWebsite
      }
    });
    report.value = response.data;
    updateChartData();
  } catch (error) {
    console.error('Error fetching report:', error);
    toast.error("Error fetching technician report");
  } finally {
    loading.value = false;
  }
};

const updateChartData = () => {
  if (!report.value) return;

  const data = _.sortBy(report.value.jobs, 'slotStart');
  const grouped = _.groupBy(data, job => moment(job.slotStart).format('YYYY-MM-DD'));
  const seriesData = Object.values(grouped).map(group => 
    group.reduce((sum, job) => sum + job.techAmount, 0)
  );
  const categories = Object.keys(grouped);

  options.value = {
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        autoSelected: "pan",
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      categories: categories,
      labels: {
        style: {
          colors: '#FFFFFF'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#FFFFFF'
        }
      }
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      },
    },
  };

  series.value = [{
    name: 'Earnings',
    data: seriesData
  }];
};

onMounted(() => {
  if (userStore.currentWebsite && userStore.user) {
    fetchTechnicians();
  }
});

watchEffect(() => {
  if (selectedTechnician.value && userStore.currentWebsite) {
    fetchReport();
  }
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};
</script>

<template>
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50">
    <div class="w-full min-h-screen relative bg-white px-6 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:rounded-lg sm:px-10">
      <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div class="flex space-x-4 mb-6">
        <select v-model="selectedTechnician" class="form-select">
          <option value="">Select Technician</option>
          <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
            {{ tech.firstName }} {{ tech.lastName }}
          </option>
        </select>

        <select v-model="month" class="form-select">
          <option v-for="m in 12" :key="m" :value="m">
            {{ moment().month(m-1).format('MMMM') }}
          </option>
        </select>

        <select v-model="year" class="form-select">
          <option v-for="y in 5" :key="y" :value="moment().year() - y + 1">
            {{ moment().year() - y + 1 }}
          </option>
        </select>
      </div>

      <div v-if="report" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-lg border border-gray-200 shadow-md">
          <h2 class="text-xl font-semibold p-4">Earnings Overview</h2>
          <apexchart type="area" height="350" :options="options" :series="series"></apexchart>
        </div>

        <div class="rounded-lg border border-gray-200 shadow-md p-4">
          <h2 class="text-xl font-semibold mb-4">Summary</h2>
          <p>Total Earnings: {{ formatCurrency(report.totalEarnings) }}</p>
          <p>Total Expenses: {{ formatCurrency(report.totalExpenses) }}</p>
          <p>Salary: {{ formatCurrency(report.salary) }}</p>
        </div>

        <div class="md:col-span-2 rounded-lg border border-gray-200 shadow-md p-4">
          <h2 class="text-xl font-semibold mb-4">Recent Jobs</h2>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="text-left">Date</th>
                <th class="text-left">Job Name</th>
                <th class="text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in report.jobs.slice(0, 5)" :key="job.id">
                <td>{{ moment(job.slotStart).format('YYYY-MM-DD') }}</td>
                <td>{{ job.name }}</td>
                <td>{{ formatCurrency(job.techAmount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>