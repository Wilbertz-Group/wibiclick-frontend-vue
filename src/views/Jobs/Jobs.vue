<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-800">Jobs</h1>
        <button @click="toggleDarkMode" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300">
          <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" class="text-yellow-500 dark:text-blue-300" />
        </button>
      </div>

      <div class="mb-6 flex flex-wrap gap-4 items-center">
        <div class="relative w-64">
          <Listbox v-model="selectedWebsite">
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
              >
                <span class="block truncate text-gray-700 dark:text-white">
                  {{ opt.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
                </span>
                <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <font-awesome-icon icon="chevron-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </ListboxButton>

              <transition
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <ListboxOptions
                  class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                >
                  <ListboxOption
                    v-for="website in opt"
                    :key="website.value"
                    :value="website.value"
                    v-slot="{ active, selected }"
                  >
                    <li
                      :class="[
                        active ? 'bg-amber-100 dark:bg-amber-600 text-amber-900 dark:text-white' : 'text-gray-900 dark:text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                        {{ website.label }}
                      </span>
                      <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600 dark:text-amber-300">
                        <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                      </span>
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>
        <button @click="openAddJobModal" class="btn-primary-custom">
          Add Job
        </button>
      </div>

      <div class="bg-white dark:bg-gray-700 dark:sm:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300 p-6">
        <div class="">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Job List</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="relative">
              <input v-model="filters.search" placeholder="Search jobs..." class="form-input pl-10">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select v-model="filters.status" class="form-select">
              <option value="">All Statuses</option>
              <option v-for="status in jobStatuses" :key="status" :value="status">{{ status }}</option>
            </select>
            <select v-model="filters.technician" class="form-select">
              <option value="">All Technicians</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">{{ tech.firstName }} {{ tech.lastName }}</option>
            </select>
            <div class="relative">
              <input v-model="filters.location" placeholder="Filter by location" class="form-input pl-10">
              <font-awesome-icon icon="map-marker-alt" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div class="relative">
              <input 
                :value="formatDateForInput(filters.date)" 
                @input="updateDateFilter" 
                type="date" 
                placeholder="Filter by date" 
                class="form-input pl-10"
              >
              <font-awesome-icon icon="calendar" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div class="relative">
              <input 
                :value="formatDateTimeForInput(filters.slotStart)" 
                @input="updateSlotStartFilter" 
                type="datetime-local" 
                placeholder="Filter by slot start" 
                class="form-input pl-10"
              >
              <font-awesome-icon icon="clock" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <!-- Job List (Mobile Card View) -->
        <div class="md:hidden space-y-4">
          <div v-for="job in paginatedJobs" :key="job.id" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ job.name }}</h3>
              <span :class="getStatusClass(job.jobStatus)" class="px-2 py-1 text-xs font-semibold rounded-full">
                {{ job.jobStatus }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span class="font-semibold">Issue:</span> 
              {{ job.issue.length > 100 ? job.issue.slice(0, 100) + '...' : job.issue }}
              <button v-if="job.issue.length > 100" @click="toggleIssue(job)" class="text-blue-600 dark:text-blue-400 ml-1">
                {{ job.showFullIssue ? 'View less' : 'View more' }}
              </button>
            </p>
            <p v-if="job.showFullIssue" class="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {{ job.issue }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <font-awesome-icon icon="calendar" class="mr-2" />{{ formatDate(job.slotStart) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <font-awesome-icon icon="user" class="mr-2" />{{ job.employee?.firstName }} {{ job.employee?.lastName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
              <font-awesome-icon icon="map-marker-alt" class="mr-2" />{{ job.location }}
            </p>
            <div class="flex justify-end space-x-2">
              <button @click="editJob(job)" class="btn-secondary">Edit</button>
              <button @click="notifyTechnician(job)" class="btn-secondary">Notify</button>
            </div>
          </div>
        </div>

        <!-- Job Table (Desktop View) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th v-for="header in tableHeaders" :key="header" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="job in paginatedJobs" :key="job.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                <td data-label="Customer Name" class="px-6 py-2 whitespace-nowrap">
                  <div class="text-md font-medium text-gray-900 dark:text-white">{{ job.name }}</div>
                </td>
                <td class="px-6 py-2">
                  <div class="text-md text-gray-500 dark:text-gray-300">
                    <p>
                      {{ job.issue.length > 45 ? job.issue.slice(0, 45) + '...' : job.issue }}
                      <button v-if="job.issue.length > 45" @click="toggleIssue(job)" class="text-blue-600 dark:text-blue-400 ml-1 text-xs underline hover:no-underline">
                        {{ job.showFullIssue ? 'View less' : 'View more' }}
                      </button>
                    </p>
                    <p v-if="job.showFullIssue" class="mt-2">
                      {{ job.issue }}
                    </p>
                  </div>
                </td>
                <td data-label="Status" class="px-6 py-2 whitespace-nowrap">
                  <span :class="getStatusClass(job.jobStatus)" class="w-full justify-center text-center px-3 py-2 inline-flex text-[16px] leading-5 font-semibold rounded-full">
                    {{ job.jobStatus }}
                  </span>
                </td>
                <td data-label="Date" class="px-6 py-2 whitespace-nowrap text-md text-gray-500 dark:text-gray-300">
                  {{ formatDate(job.slotStart) }}
                </td>
                <td data-label="Technician" class="px-6 py-2 whitespace-nowrap text-md text-gray-500 dark:text-gray-300">
                  {{ job.employee?.firstName }} {{ job.employee?.lastName }}
                </td>
                <td data-label="Location" class="px-6 py-2 whitespace-nowrap text-md text-gray-500 dark:text-gray-300">
                  {{ job.location }}
                </td>
                <td data-label="Actions" class="px-6 py-2 whitespace-nowrap text-right text-md font-medium">
                  <button @click="editJob(job)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-2">Edit</button>
                  <button @click="notifyTechnician(job)" class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">Notify</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalJobs }} results
          </div>
          <div>
            <button :disabled="currentPage === 1" @click="prevPage" class="btn-secondary mr-2">&laquo; Previous</button>
            <button :disabled="currentPage === totalPages" @click="nextPage" class="btn-secondary">Next &raquo;</button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-700 dark:sm:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300 p-6 mt-7">
        <h3 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Job Booking Trend</h3>
        <div class="relative w-full">
          <canvas ref="jobBookingTrendChart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- Job Form Modal -->
  <transition name="modal">
    <div v-if="showJobModal" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeJobModal"></div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">{{ editingJob ? 'Edit Job' : 'Add New Job' }}</h3>
            <form @submit.prevent="submitJob">
              <div class="grid grid-cols-1 gap-4">
                <div class="form-group">
                  <label for="customerId">Customer</label>
                  <select id="customerId" v-model="jobForm.customerId" required class="form-select">
                    <option value="">Select a customer</option>
                    <option v-for="customer in customerOptions" :key="customer.value" :value="customer.value">
                      {{ customer.label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="name">Job Name</label>
                  <input type="text" id="name" v-model="jobForm.name" required class="form-input">
                </div>
                <div class="form-group">
                  <label for="issue">Issue</label>
                  <textarea id="issue" v-model="jobForm.issue" required class="form-textarea"></textarea>
                </div>
                <div class="form-group">
                  <label for="jobStatus">Status</label>
                  <select id="jobStatus" v-model="jobForm.jobStatus" required class="form-select">
                    <option v-for="status in jobStatuses" :key="status" :value="status">{{ status }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="slotStart">Start Date</label>
                  <input type="datetime-local" id="slotStart" v-model="jobForm.slotStart" required class="form-input">
                </div>
                <div class="form-group">
                  <label for="employeeId">Technician</label>
                  <select id="employeeId" v-model="jobForm.employeeId" required class="form-select">
                    <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                      {{ tech.firstName }} {{ tech.lastName }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="location">Location</label>
                  <input type="text" id="location" v-model="jobForm.location" required class="form-input">
                </div>
                <div class="form-group">
                  <label for="callout">Callout Fee</label>
                  <input type="text" id="callout" v-model="jobForm.callout" required class="form-input">
                </div>
                <div class="form-group">
                  <label class="inline-flex items-center">
                    <input type="checkbox" v-model="jobForm.notify" class="form-checkbox">
                    <span class="ml-2">Notify Technician</span>
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="submitJob" class="btn-primary-custom w-full sm:w-auto sm:ml-3">
              {{ editingJob ? 'Update' : 'Add' }} Job
            </button>
            <button @click="closeJobModal" class="btn-secondary w-full sm:w-auto sm:mt-3 sm:mt-0">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- Loading Overlay -->
  <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <ScaleLoader color="#ffffff" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect, reactive } from 'vue'
import axios from 'axios'
import moment from 'moment'
import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-moment';
import { useUserStore } from '@/stores/UserStore'
import { useToast } from 'vue-toast-notification'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { storeToRefs } from 'pinia'
import { 
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { 
  faSun, faMoon, faCalendar, faUser, faMapMarkerAlt, 
  faChevronDown, faCheck, faSearch, faClock 
} from '@fortawesome/free-solid-svg-icons'

library.add(faSun, faMoon, faCalendar, faUser, faMapMarkerAlt, faChevronDown, faCheck, faSearch, faClock)

const userStore = useUserStore()
const toast = useToast()
const { currentWebsite, websites } = storeToRefs(userStore)

const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')
const loading = ref(false)
const jobs = ref([])
const showJobModal = ref(false)
const editingJob = ref(null)
const currentPage = ref(1)
const itemsPerPage = 10
const technicians = ref([])
const customerOptions = ref([])
const jobBookingTrendChart = ref(null)
const tableHeaders = ['Customer Name', 'Issue', 'Status', 'Date', 'Technician', 'Location', 'Actions']

const jobForm = reactive({
  customerId: '',
  name: '',
  issue: '',
  jobStatus: '',
  slotStart: '',
  employeeId: '',
  location: '',
  callout: '',
  notify: false
})

Chart.register(annotationPlugin)

const filters = reactive({
  search: '',
  status: '',
  technician: '',
  location: '',
  date: null,
  slotStart: null
})

const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
})

const opt = computed(() => [
  { label: 'Select Website', value: 'default', attrs: { disabled: true } },
  ...websites.value
])

const jobStatuses = computed(() => [...new Set(jobs.value.map(job => job.jobStatus))])

const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSearch = (job.name?.toLowerCase().includes(filters.search.toLowerCase()) || 
                           job.issue?.toLowerCase().includes(filters.search.toLowerCase())) ?? true
    const matchesStatus = !filters.status || job.jobStatus === filters.status
    const matchesTechnician = !filters.technician || job.employee?.id === filters.technician
    const matchesLocation = !filters.location || job.location?.toLowerCase().includes(filters.location.toLowerCase())
    const matchesDate = !filters.date || moment(job.slotStart).isSame(filters.date, 'day')
    const matchesSlotStart = !filters.slotStart || moment(job.slotStart).isSame(filters.slotStart)

    return matchesSearch && matchesStatus && matchesTechnician && matchesLocation && matchesDate && matchesSlotStart
  })
})

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredJobs.value.slice(start, end)
})

const totalJobs = computed(() => filteredJobs.value.length)
const totalPages = computed(() => Math.ceil(totalJobs.value / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage, totalJobs.value))

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
}

const fetchJobs = async () => {
  try {
    loading.value = true
    const response = await axios.get(`jobs?id=${currentWebsite.value}&limit=1500&offset=0`)
    jobs.value = response.data.jobs
    loading.value = false
  } catch (error) {
    console.error('Error fetching jobs:', error)
    toast.error('Error getting jobs data')
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    const response = await axios.get(`customers?id=${currentWebsite.value}`)
    customerOptions.value = response.data.customers.map(customer => ({
      label: customer.name,
      value: customer.id
    }))
  } catch (error) {
    console.error('Error fetching customers:', error)
    toast.error('Error fetching customers')
  }
}

const fetchTechnicians = async () => {
  try {
    const response = await axios.get(`employees?id=${currentWebsite.value}`)
    technicians.value = response.data.employees
  } catch (error) {
    console.error('Error fetching technicians:', error)
    toast.error('Error fetching technicians')
  }
}

const openAddJobModal = () => {
  editingJob.value = null
  resetJobForm()
  showJobModal.value = true
}

const editJob = (job) => {
  editingJob.value = job
  Object.assign(jobForm, {
    customerId: job.customer.id,
    name: job.name,
    issue: job.issue,
    jobStatus: job.jobStatus,
    slotStart: moment(job.slotStart).format('YYYY-MM-DDTHH:mm'),
    employeeId: job.employee?.id,
    location: job.location,
    callout: job.callout,
    notify: false
  })
  showJobModal.value = true
}

const closeJobModal = () => {
  showJobModal.value = false
  editingJob.value = null
  resetJobForm()
}

const resetJobForm = () => {
  Object.assign(jobForm, {
    customerId: '',
    name: '',
    issue: '',
    jobStatus: '',
    slotStart: '',
    employeeId: '',
    location: '',
    callout: '',
    notify: false
  })
}

const submitJob = async () => {
  try {
    loading.value = true
    const jobData = {
      ...jobForm,
      websiteId: currentWebsite.value,
      id: editingJob.value?.id
    }
    const response = await axios.post('add-job?id=' + currentWebsite.value, jobData)
    toast.success(editingJob.value ? 'Job updated successfully' : 'Job added successfully')
    closeJobModal()
    fetchJobs()
  } catch (error) {
    console.error('Error submitting job:', error)
    toast.error('Error submitting job')
  } finally {
    loading.value = false
  }
}

const notifyTechnician = async (job) => {
  try {
    loading.value = true
    const jobData = {
      id: job.id,
      name: job.name,
      callout: job.callout,
      paid: job.paid,
      phone: job.phone,
      location: job.location,
      payment: job.payment,
      address: job.address,
      issue: job.issue,
      slotStart: job.slotStart,
      slotEnd: job.slotEnd,
      slotTime: job.slotTime,
      jobStatus: job.jobStatus,
      parts: job.parts,
      to_do: job.to_do,
      techAmount: job.techAmount,
      companyAmount: job.companyAmount,
      estimate: job.estimate,
      invoice: job.invoice,
      employee: {
        id: job.employee.id,
        firstName: job.employee.firstName,
        lastName: job.employee.lastName,
        phone: job.employee.phone
      },
      customer: {
        id: job.customer.id,
        name: job.customer.name,
        foreignID: job.customer.foreignID,
        portal: job.customer.portal,
        address: job.customer.address,
        phone: job.customer.phone
      },
      website: {
        id: currentWebsite.value,
        url: websites.value.find(w => w.value === currentWebsite.value)?.label,
        userId: userStore.user.id,
        settingId: job.website?.settingId,
        createdAt: job.website?.createdAt,
        updatedAt: job.website?.updatedAt
      },
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      fuelExpense: job.fuelExpense || "0",
      partsExpense: job.partsExpense || "0",
      calloutFee: job.calloutFee || "0",
      expenses: job.expenses || []
    }

    await axios.post('send-job-to-technician', { job: jobData })
    toast.success('Technician notified successfully')
  } catch (error) {
    console.error('Error notifying technician:', error)
    toast.error('Error notifying technician')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  const jobDate = moment(date);
  const now = moment();

  // Function to format time with AM/PM
  const formatTime = (momentDate) => momentDate.format('h:mm A');

  if (jobDate.isSame(now, 'day')) {
    return `${formatTime(jobDate)}`;
  } else if (jobDate.isSame(now.clone().add(1, 'day'), 'day')) {
    return `Tomorrow at ${formatTime(jobDate)}`;
  } else if (jobDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return `Yesterday at ${formatTime(jobDate)}`;
  } else {
    return jobDate.format('MMM DD, YYYY h:mm A');
  }
}

const formatDateForInput = (date) => {
  return date ? moment(date).format('YYYY-MM-DD') : ''
}

const formatDateTimeForInput = (dateTime) => {
  return dateTime ? moment(dateTime).format('YYYY-MM-DDTHH:mm') : ''
}

const updateDateFilter = (event) => {
  filters.date = event.target.value ? new Date(event.target.value) : null
}

const updateSlotStartFilter = (event) => {
  filters.slotStart = event.target.value ? new Date(event.target.value) : null
}

const getStatusClass = (status) => {
  const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full '
  switch (status) {
    case 'scheduled': return baseClasses + 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100'
    case 'in progress': return baseClasses + 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
    case 'completed': return baseClasses + 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
    case 'cancelled': return baseClasses + 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
    case 'accepted': return baseClasses + 'bg-blue-600 text-white dark:bg-blue-800 dark:text-blue-100'
    case 'quoted': return baseClasses + 'bg-purple-600 text-white dark:bg-purple-800 dark:text-purple-100'
    case 'done': return baseClasses + 'bg-green-500 text-white dark:bg-green-700 dark:text-green-100'
    case 'no parts': return baseClasses + 'bg-yellow-500 text-white dark:bg-yellow-700 dark:text-yellow-100'
    case 'quoting': return baseClasses + 'bg-blue-400 text-white dark:bg-blue-600 dark:text-blue-100'
    case 'pending': return baseClasses + 'bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100'
    case 'invoiced': return baseClasses + 'bg-green-800 text-white dark:bg-green-900 dark:text-green-100'
    case 'follow-up': return baseClasses + 'bg-yellow-800 text-white dark:bg-yellow-900 dark:text-yellow-100'
    case 'paid': return baseClasses + 'bg-green-500 text-white dark:bg-green-700 dark:text-green-100'
    case 'to order parts': return baseClasses + 'bg-yellow-500 text-white dark:bg-yellow-700 dark:text-yellow-100'
    case 'parts ordered': return baseClasses + 'bg-yellow-400 text-white dark:bg-yellow-600 dark:text-yellow-100'
    case 'parts arrived': return baseClasses + 'bg-yellow-300 text-white dark:bg-yellow-500 dark:text-yellow-100'
    case 'parts installed': return baseClasses + 'bg-yellow-200 text-white dark:bg-yellow-400 dark:text-yellow-100'
    case 'parts paid': return baseClasses + 'bg-yellow-100 text-white dark:bg-yellow-300 dark:text-yellow-100'
    case 'parts not paid': return baseClasses + 'bg-red-100 text-white dark:bg-red-300 dark:text-red-100'
    case 'parts not installed': return baseClasses + 'bg-red-200 text-white dark:bg-red-400 dark:text-red-100'
    case 'parts not ordered': return baseClasses + 'bg-red-300 text-white dark:bg-red-500 dark:text-red-100'
    case 'parts not available': return baseClasses + 'bg-red-400 text-white dark:bg-red-600 dark:text-red-100'
    case 'parts not needed': return baseClasses + 'bg-red-500 text-white dark:bg-red-700 dark:text-red-100'
    case 'parts not found': return baseClasses + 'bg-red-600 text-white dark:bg-red-800 dark:text-red-100'
    case 'waiting for price': return baseClasses + 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-100'
    case 'waiting for parts': return baseClasses + 'bg-gray-700 text-white dark:bg-gray-800 dark:text-gray-100'
    case 'waiting for customer': return baseClasses + 'bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100'
    case 'waiting for payment': return baseClasses + 'bg-gray-900 text-white dark:bg-gray-600 dark:text-gray-100'
    default: return baseClasses + 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const toggleIssue = (job) => {
  job.showFullIssue = !job.showFullIssue;
}

const createCharts = () => {
  const ctx = jobBookingTrendChart.value.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(54, 162, 235, 0.5)');
  gradient.addColorStop(1, 'rgba(54, 162, 235, 0.1)');

  const currentYearData = processBookingData(jobs.value, 0);
  const lastYearData = processBookingData(jobs.value, 1);
  const movingAverageData = calculateMovingAverage(currentYearData.data, 30);

  // Ensure data starts from January 2024
  const startDate = moment('2024-01-01').startOf('month');
  const endDate = moment().endOf('month');
  const labels = [];
  let currentDate = startDate.clone();

  while (currentDate <= endDate) {
    labels.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'month');
  }

  new Chart(jobBookingTrendChart.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Current Year Bookings',
          data: currentYearData.data,
          borderColor: 'rgb(54, 162, 235)', 
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Last Year Bookings',
          data: lastYearData.data,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
        },
        {
          label: '30-Day Moving Average',
          data: movingAverageData,
          borderColor: 'rgb(75, 192, 192)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: {
              month: 'MMM YYYY'
            },
          },
          min: '2024-01-01',
          max: endDate.format('YYYY-MM-DD'),
          grid: {
            display: true,
            color: 'rgba(200, 200, 200, 0.3)',
          },
          title: {
            display: true,
            text: 'Date',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          beginAtZero: true,
          position: 'left',
          grid: {
            display: true,
            color: 'rgba(200, 200, 200, 0.3)',
          },
          title: {
            display: true,
            text: 'Number of Jobs',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { 
            precision: 0,
            stepSize: 5,
          },
        }
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (tooltipItems) => moment(tooltipItems[0].parsed.x).format('MMMM YYYY')
          }
        }
      },
      interaction: { intersect: false, mode: 'index' },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 20,
          bottom: 10
        }
      },
    }
  });
};

const calculateMovingAverage = (data, windowSize) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else {
      const windowSum = data.slice(Math.max(0, i - windowSize + 1), i + 1).reduce((sum, num) => sum + num, 0);
      result.push(windowSum / Math.min(windowSize, i + 1));
    }
  }
  return result;
};

const processBookingData = (jobs, yearOffset = 0) => {
  const targetYear = moment().subtract(yearOffset, 'years').year();
  const startDate = moment(`${targetYear}-01-01`).startOf('month');
  const endDate = moment().endOf('month');
  
  const groupedJobs = jobs
    .filter(job => moment(job.createdAt).isBetween(startDate, endDate, null, '[]'))
    .reduce((acc, job) => {
      const date = moment(job.createdAt).startOf('month').format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

  const data = [];
  let currentDate = startDate.clone();

  while (currentDate <= endDate) {
    const dateKey = currentDate.format('YYYY-MM-DD');
    data.push(groupedJobs[dateKey] || 0);
    currentDate.add(1, 'month');
  }

  return { data };
};

onMounted(() => {
  if (currentWebsite.value) {
    fetchJobs().then(() => {
      createCharts()
    })
    fetchCustomers()
    fetchTechnicians()
  }
})

watchEffect(() => {
  if (currentWebsite.value) {
    fetchJobs().then(() => {
      createCharts()
    })
    fetchCustomers()
    fetchTechnicians()
  }
})
</script>


<style scoped>
/* Base styles */
.form-input,
.form-select,
.form-textarea {
  @apply block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.dark .form-input,
.dark .form-select,
.dark .form-textarea {
  @apply bg-gray-700 border-gray-600 text-white;
}

.btn-primary-custom {
  @apply px-4 py-2 font-semibold text-sm rounded-lg shadow-md;
  @apply text-white bg-gray-800 hover:bg-gray-700;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75;
}

.btn-primary {
  @apply w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200;
}

.btn-secondary {
  @apply w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-200 mt-2;
}

.dark .btn-secondary {
  @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
}

/* Modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-200 dark:bg-gray-700;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-600 rounded;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500 dark:bg-gray-500;
}

/* Custom styles for date and time inputs */
input[type="date"],
input[type="datetime-local"] {
  @apply appearance-none;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  @apply filter dark:invert;
}

/* Job status colors */
.status-scheduled { @apply bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100; }
.status-in-progress { @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100; }
.status-completed { @apply bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100; }
.status-cancelled { @apply bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100; }

/* Transition for dark mode */
.transition-dark-mode {
  @apply transition-colors duration-300;
}

/* Media query for larger screens */
@media (min-width: 768px) {
  .btn-primary,
  .btn-secondary {
    @apply w-auto;
  }

  .btn-secondary {
    @apply mt-0 ml-2;
  }
}
</style>