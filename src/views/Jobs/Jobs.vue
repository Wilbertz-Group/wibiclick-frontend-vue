// wibiclick-frontend-vue/src/views/Jobs/Jobs.vue
<template>
  <!-- Main container with background placeholder and padding -->
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <!-- Placeholder for sophisticated background - replace with actual gradient/texture -->
    <!-- <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 opacity-50 -z-10"></div> -->

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

      <!-- Header Section with improved mobile responsiveness -->
      <header class="mb-10 md:mb-14">
        <!-- Title and actions container - stacks on mobile, side-by-side on desktop -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Manage Jobs
          </h1>
          
          <!-- Action buttons container - full width on mobile -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <!-- Website Selector - takes full width on mobile -->
            <Listbox v-model="selectedWebsite" as="div" class="relative w-full sm:w-72">
              <ListboxButton class="input-modern input-modern--select pl-3 pr-8 text-sm w-full flex items-center justify-between">
                <span class="block truncate">
                  {{ opt.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
                </span>
                <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <font-awesome-icon icon="chevron-down" class="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </ListboxButton>
              <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <ListboxOptions class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <ListboxOption v-for="website in opt" :key="website.value" :value="website.value" v-slot="{ active, selected }">
                    <li :class="[ active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                      <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ website.label }}</span>
                      <!-- <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                        <font-awesome-icon icon="check" class="h-5 w-5" aria-hidden="true" />
                      </span> -->
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </Listbox>
            
            <!-- Action buttons - flex row that wraps nicely -->
            <div class="flex items-center gap-2">
              <button @click="reloadJobs" 
                class="btn-icon-modern flex-shrink-0" 
                title="Reload Jobs">
                <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
              </button>
              <button @click="openAddJobModal" 
                class="btn-primary-modern flex-grow sm:flex-grow-0">
                <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> 
                <span>Add Job</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Filter Section -->
      <section class="mb-10 p-5 sm:p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50">
         <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4 items-end">
            <!-- Search Input -->
            <div class="relative sm:col-span-2 lg:col-span-1">
               <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
               <!-- Added input-icon-left class for text-indent -->
               <input v-model="filters.search" placeholder="Search customer or issue..." class="input-modern pl-3 pr-3 input-icon-left" />
            </div>
            <!-- Status Select -->
            <select v-model="filters.status" class="input-modern input-modern--select">
              <option value="">All Statuses</option>
              <option v-for="status in JOB_STATUSES" :key="status" :value="status">{{ status }}</option>
            </select>
            <!-- Technician Select -->
            <select v-model="filters.technician" class="input-modern input-modern--select">
              <option value="">All Technicians</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">{{ tech.firstName }} {{ tech.lastName }}</option>
            </select>

            <!-- Advanced Filters (conditionally rendered) -->
            <template v-if="showAdvancedFilters">
               <!-- Location Input -->
               <div class="relative">
                  <font-awesome-icon icon="map-marker-alt" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <!-- Added input-icon-left class for text-indent -->
                  <input v-model="filters.location" placeholder="Location" class="input-modern pl-3 pr-3 input-icon-left" />
               </div>
               <!-- Date Input -->
               <!-- Applied specific padding pl-3 pr-10 -->
               <input :value="formatDateForInput(filters.date)" @input="updateDateFilter" type="date" placeholder="Date" class="input-modern pl-3 pr-10" />
               <!-- Slot Start Input -->
               <!-- Applied specific padding pl-3 pr-10 -->
               <input :value="formatDateTimeForInput(filters.slotStart)" @input="updateSlotStartFilter" type="datetime-local" placeholder="Slot Start" class="input-modern pl-3 pr-10" />
            </template>

            <!-- Filter Actions -->
            <div class="flex items-center justify-end space-x-2 mt-2 sm:mt-0" :class="{ 'col-span-full sm:col-span-1': !showAdvancedFilters, 'sm:col-span-2 lg:col-span-1': showAdvancedFilters }">
               <button @click="showAdvancedFilters = !showAdvancedFilters" class="btn-secondary-modern text-xs sm:text-sm whitespace-nowrap">
                  {{ showAdvancedFilters ? 'Hide Advanced' : 'Advanced' }}
               </button>
               <button @click="clearFilters" class="btn-secondary-modern text-xs sm:text-sm whitespace-nowrap">
                  Clear All
               </button>
            </div>
         </div>
      </section>

      <!-- Job List Section -->
      <section>
         <!-- Mobile Card View -->
         <div class="md:hidden space-y-4">
            <!-- Mobile Skeleton -->
            <div v-if="loading" class="space-y-4">
               <div v-for="n in 5" :key="`skel-mob-${n}`" class="card-modern animate-pulse">
                  <div class="flex justify-between items-start mb-3">
                    <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/5"></div>
                    <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                  <div class="space-y-2">
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 pt-2"></div>
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                    <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                    <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                  </div>
               </div>
            </div>
            <!-- Mobile Actual Cards -->
            <div v-if="!loading && paginatedJobs.length > 0" v-for="job in paginatedJobs" :key="job.id" class="card-modern">
               <div class="flex justify-between items-start mb-3 gap-2">
                  <router-link :to="{ name: 'contact', query: { customer_id: job.customer?.id } }" class="text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:underline leading-tight">
                     {{ job.name }}
                  </router-link>
                  <span :class="getModernStatusClass(job.jobStatus)" class="status-badge-modern flex-shrink-0">
                     {{ job.jobStatus }}
                  </span>
               </div>
               <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                 <span class="font-medium text-gray-800 dark:text-gray-200">Issue:</span>
                 {{ job.issue.length > 100 ? job.issue.slice(0, 100) + '...' : job.issue }}
                 <button v-if="job.issue.length > 100" @click="toggleIssue(job)" class="text-indigo-600 dark:text-indigo-400 text-xs ml-1 hover:underline">
                   {{ job.showFullIssue ? 'Less' : 'More' }}
                 </button>
               </p>
               <p v-if="job.showFullIssue" class="text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                 {{ job.issue }}
               </p>
               <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                 <p><font-awesome-icon icon="calendar" class="mr-1.5 w-3" /> {{ formatDate(job.slotStart) }}</p>
                 <p><font-awesome-icon icon="user" class="mr-1.5 w-3" /> {{ job.employee?.firstName }} {{ job.employee?.lastName || 'Unassigned' }}</p>
                 <p><font-awesome-icon icon="map-marker-alt" class="mr-1.5 w-3" /> {{ job.location }}</p>
               </div>
               <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end space-x-2">
                  <button @click="editJob(job)" class="btn-ghost-modern">Edit</button>
                  <button @click="notifyTechnician(job)" class="btn-ghost-modern">Notify</button>
               </div>
            </div>
         </div>

         <!-- Desktop Table View -->
         <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
             <!-- Desktop Skeleton -->
             <div v-if="loading" class="animate-pulse">
                <table class="min-w-full">
                  <thead class="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th v-for="header in tableHeaders" :key="`skel-head-${header}`" class="th-modern">
                        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="n in 5" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div></td>
                      <td class="td-modern"><div class="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></td>
                      <td class="td-modern"><div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div></td>
                      <td class="td-modern text-right">
                        <div class="flex justify-end space-x-2">
                          <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-10"></div>
                          <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-10"></div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
             </div>
             <!-- Desktop Actual Table -->
             <table v-if="!loading && paginatedJobs.length > 0" class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
                <thead class="bg-gray-50 dark:bg-gray-900/30">
                   <tr>
                      <th v-for="header in tableHeaders" :key="header" scope="col" class="th-modern">
                        {{ header }}
                      </th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                   <tr v-for="job in paginatedJobs" :key="job.id" class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                      <td class="td-modern">
                         <router-link :to="{ name: 'contact', query: { customer_id: job.customer?.id } }" class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                            {{ job.name }}
                         </router-link>
                      </td>
                      <td class="td-modern text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                         <p class="truncate">
                           {{ job.issue }}
                           <!-- Consider tooltip or modal for full issue on desktop instead of expand button -->
                         </p>
                      </td>
                      <td class="td-modern">
                         <!-- Added w-28 and justify-center for consistent width -->
                         <span :class="getModernStatusClass(job.jobStatus)" class="status-badge-modern w-28 justify-center">
                            {{ job.jobStatus }}
                         </span>
                      </td>
                      <td class="td-modern text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {{ formatDate(job.slotStart) }}
                      </td>
                      <td class="td-modern text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {{ job.employee?.firstName }} {{ job.employee?.lastName || 'Unassigned' }}
                      </td>
                      <td class="td-modern text-sm text-gray-500 dark:text-gray-400">
                        {{ job.location }}
                      </td>
                      <td class="td-modern text-right space-x-2 whitespace-nowrap">
                         <button @click="editJob(job)" class="btn-ghost-modern">Edit</button>
                         <button @click="notifyTechnician(job)" class="btn-ghost-modern">Notify</button>
                      </td>
                   </tr>
                </tbody>
             </table>
         </div>

         <!-- Pagination -->
         <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
            <p class="text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
               Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalJobs }}</span> results
            </p>
            <div class="flex space-x-1">
               <button :disabled="currentPage === 1" @click="prevPage" class="btn-pagination-modern">
                  <font-awesome-icon icon="chevron-left" class="h-3 w-3 mr-1" /> Previous
               </button>
               <button :disabled="currentPage === totalPages" @click="nextPage" class="btn-pagination-modern">
                  Next <font-awesome-icon icon="chevron-right" class="h-3 w-3 ml-1" />
               </button>
            </div>
         </nav>

         <!-- No Results Message -->
         <div v-if="!loading && paginatedJobs.length === 0" class="text-center py-16 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No jobs found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
         </div>

      </section>

      <!-- Chart Section (Hidden on mobile) -->
      <section class="hidden md:block mt-12 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50">
         <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Job Booking Trend</h3>
         <div class="relative w-full h-64"> <!-- Added height constraint -->
           <canvas ref="jobBookingTrendChart"></canvas>
         </div>
      </section>

    </div> <!-- End container -->
  </div> <!-- End main div -->

  <!-- Job Form Modal (Restyled) -->
  <transition name="modal-fade">
     <div v-if="showJobModal" class="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeJobModal"></div>
          <!-- Modal positioning -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <!-- Modal panel -->
          <div class="modal-content-modern">
             <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
                {{ editingJob ? 'Edit Job Details' : 'Add New Job' }}
             </h3>
             <form @submit.prevent="submitJob" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <!-- Customer Selector (Only for Add New Job) -->
                   <template v-if="!editingJob">
                     <div class="sm:col-span-2">
                       <label for="customerSelect" class="label-modern">Select Customer (Optional)</label>
                       <select id="customerSelect" v-model="selectedCustomerIdInModal" class="input-modern input-modern--select">
                         <option value="">-- Select to Autofill --</option>
                         <option v-for="customer in allCustomers" :key="customer.id" :value="customer.id">
                           {{ customer.name }}
                         </option>
                       </select>
                     </div>
                   </template>

                   <div>
                      <label for="name" class="label-modern">Customer Name</label>
                      <input type="text" id="name" v-model="jobForm.name" required class="input-modern" />
                   </div>
                   <div>
                      <label for="jobStatus" class="label-modern">Job Status</label>
                      <select id="jobStatus" v-model="jobForm.jobStatus" required class="input-modern input-modern--select">
                        <option v-for="status in JOB_STATUSES" :key="status" :value="status">{{ status }}</option>
                      </select>
                   </div>
                   <div>
                      <label for="callout" class="label-modern">Callout Fee</label>
                      <input type="text" id="callout" v-model="jobForm.callout" required class="input-modern" />
                   </div>
                   <div>
                      <label for="location" class="label-modern">Location</label>
                      <input type="text" id="location" v-model="jobForm.location" required class="input-modern" />
                   </div>
                   <div>
                      <label for="address" class="label-modern">Customer Address</label>
                      <input type="text" id="address" v-model="jobForm.address" required class="input-modern" />
                   </div>
                   <div>
                      <label for="phone" class="label-modern">Customer Phone</label>
                      <input type="tel" id="phone" v-model="jobForm.phone" required class="input-modern" />
                   </div>
                   <div>
                      <label for="slotStart" class="label-modern">Job Start Date</label>
                      <input type="datetime-local" id="slotStart" v-model="jobForm.slotStart" required class="input-modern" />
                   </div>
                   <div>
                      <label for="slotTime" class="label-modern">Job Duration</label>
                      <select id="slotTime" v-model="jobForm.slotTime" required class="input-modern input-modern--select">
                        <option v-for="duration in ['1hr', '2hrs', '3hrs', '4hrs']" :key="duration" :value="duration">{{ duration }}</option>
                      </select>
                   </div>
                   <div>
                      <label for="employeeId" class="label-modern">Assign Employee</label>
                      <select id="employeeId" v-model="jobForm.employeeId" required class="input-modern input-modern--select">
                        <option value="">Select Technician</option>
                        <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                          {{ tech.firstName }} {{ tech.lastName }}
                        </option>
                      </select>
                   </div>
                   <div>
                      <label for="to_do" class="label-modern">To Do (Optional)</label>
                      <input type="text" id="to_do" v-model="jobForm.to_do" class="input-modern" />
                   </div>
                </div>
                <div class="sm:col-span-2">
                   <label for="issue" class="label-modern">Issue / Description</label>
                   <textarea id="issue" v-model="jobForm.issue" required rows="4" class="input-modern"></textarea>
                </div>
                <div class="sm:col-span-2">
                   <label class="flex items-center">
                     <input type="checkbox" v-model="jobForm.notify" class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600">
                     <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Notify Employee upon creation/update</span>
                   </label>
                </div>

                <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3">
                   <button type="submit" class="btn-primary-modern w-full sm:w-auto">
                      {{ editingJob ? 'Update Job' : 'Add Job' }}
                   </button>
                   <button @click="closeJobModal" type="button" class="btn-secondary-modern w-full sm:w-auto">
                      Cancel
                   </button>
                </div>
             </form>
          </div>
        </div>
     </div>
  </transition>
</template>


<script setup>
import { ref, computed, onMounted, watchEffect, reactive, watch } from 'vue' // Added watch
import axios from 'axios'
import moment from 'moment'
import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-moment';
import { useUserStore } from '@/stores/UserStore'
import { useThemeStore } from '@/stores/theme'; // Import the theme store
import { useToast } from 'vue-toast-notification'
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Keep for potential future use?
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
  faCalendar, faUser, faMapMarkerAlt,
  faChevronDown, faCheck, faSearch, faClock, faSync, faPlus,
  faChevronLeft, faChevronRight // Added icons
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faCalendar, faUser, faMapMarkerAlt, faChevronDown,
  faCheck, faSearch, faClock, faSync, faPlus, faChevronLeft, faChevronRight
)

const userStore = useUserStore()
const toast = useToast()
const themeStore = useThemeStore(); // Instantiate the theme store
const { isDarkMode } = storeToRefs(themeStore); // Get reactive isDarkMode
const { currentWebsite, websites } = storeToRefs(userStore)

const loading = ref(false)
const showAdvancedFilters = ref(false)
const jobs = ref([])
const showJobModal = ref(false)
const editingJob = ref(null)
const currentPage = ref(1)
const itemsPerPage = 10 // Keep pagination logic
const technicians = ref([])
const allCustomers = ref([]) // Store full customer objects
const selectedCustomerIdInModal = ref('') // ID of customer selected in modal
const customerOptions = ref([]) // Keep for potential future use
const jobBookingTrendChart = ref(null)
const tableHeaders = ['Customer', 'Issue', 'Status', 'Date', 'Technician', 'Location', 'Actions']

const jobForm = reactive({
  id: '',
  customerId: '', // Keep if needed for backend
  name: '',
  jobStatus: '',
  callout: 'R350', // Default?
  location: '',
  address: '',
  phone: '',
  slotStart: '',
  slotTime: '1hr', // Default?
  employeeId: '',
  to_do: '',
  issue: '',
  notify: false
});

// Keep JOB_STATUSES array
const JOB_STATUSES = [
  'scheduled', 'quoting', 'quoted', 'accepted', 'cancelled', 'no parts',
  'pending', 'invoiced', 'done', 'paid', 'to order parts', 'parts ordered',
  'parts arrived', 'parts installed', 'parts paid', 'parts not paid',
  'parts not installed', 'parts not ordered', 'parts not available',
  'parts not needed', 'parts not found', 'follow-up', 'waiting for price',
  'waiting for parts', 'waiting for customer', 'waiting for payment'
];

// Chart.register(annotationPlugin) // Moved before createCharts function

const filters = reactive({
  search: '',
  status: '',
  technician: '',
  location: '',
  date: null,
  slotStart: null
})

const clearFilters = () => {
  filters.search = ''
  filters.status = ''
  filters.technician = ''
  filters.location = ''
  filters.date = null
  filters.slotStart = null
}

const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
})

const opt = computed(() => [
  { label: 'Select Website', value: 'default', attrs: { disabled: true } },
  ...websites.value
])

// Keep computed properties for filtering and pagination
const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSearch = (job.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                           job.issue?.toLowerCase().includes(filters.search.toLowerCase())) ?? true
    const matchesStatus = !filters.status || job.jobStatus === filters.status
    const matchesTechnician = !filters.technician || job.employee?.id === filters.technician
    const matchesLocation = !filters.location || job.location?.toLowerCase().includes(filters.location.toLowerCase())
    const matchesDate = !filters.date || moment.utc(job.slotStart).isSame(moment.utc(filters.date), 'day')
    const matchesSlotStart = !filters.slotStart || moment.utc(job.slotStart).isSame(moment.utc(filters.slotStart), 'day') // Check if this logic is still desired

    return matchesSearch && matchesStatus && matchesTechnician && matchesLocation && matchesDate && matchesSlotStart
  }).map(job => ({ ...job, showFullIssue: job.showFullIssue || false })) // Ensure showFullIssue exists
})

const totalJobs = computed(() => filteredJobs.value.length)
const totalPages = computed(() => Math.ceil(totalJobs.value / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage, totalJobs.value))

const paginatedJobs = computed(() => {
  return filteredJobs.value.slice(startIndex.value, endIndex.value)
})

// Keep existing functions: toggleDarkMode, fetchJobs, fetchCustomers, fetchTechnicians,
// openAddJobModal, editJob, closeJobModal, resetJobForm, submitJob, notifyTechnician,
// formatDate, formatDateForInput, formatDateTimeForInput, updateDateFilter, updateSlotStartFilter,
// prevPage, nextPage, toggleIssue, createCharts, calculateMovingAverage, processBookingData, reloadJobs
// ... (Keep all these functions as they were) ...
const fetchJobs = async () => {
  try {
    loading.value = true
    // Add slight delay for skeleton visibility if needed
    // await new Promise(resolve => setTimeout(resolve, 300));
    const response = await axios.get(`jobs?id=${currentWebsite.value}&limit=1500&offset=0`)
    jobs.value = response.data.jobs.map(job => ({
      ...job,
      slotStart: moment.utc(job.slotStart).format(), // Keep UTC formatting consistent
      showFullIssue: false // Initialize for mobile card view
    }))
  } catch (error) {
    console.error('Error fetching jobs:', error)
    toast.error('Error getting jobs data')
  } finally {
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    const response = await axios.get(`customers?id=${currentWebsite.value}`)
    allCustomers.value = response.data.customers || []; // Assign full array to allCustomers
    // customerOptions.value = response.data.customers.map(customer => ({
    //   label: customer.name,
    //   value: customer.id
    // })) // Keep customerOptions if used elsewhere, otherwise remove
  } catch (error) {
    console.error('Error fetching customers:', error)
    // toast.error('Error fetching customers') // Maybe less aggressive error reporting
  }
}

const fetchTechnicians = async () => {
  try {
    const response = await axios.get(`employees?id=${currentWebsite.value}`)
    technicians.value = response.data.employees
  } catch (error) {
    console.error('Error fetching technicians:', error)
    // toast.error('Error fetching technicians')
  }
}

const openAddJobModal = () => {
  editingJob.value = null
  resetJobForm()
  // Ensure default values are set if needed
  jobForm.callout = 'R350';
  jobForm.slotTime = '1hr';
  showJobModal.value = true
}

const editJob = (job) => {
  editingJob.value = { ...job }; // Store original job data for potential revert
  Object.assign(jobForm, {
    id: job.id,
    customerId: job.customer?.id || '',
    name: job.name || '',
    jobStatus: job.jobStatus || '',
    callout: job.callout || 'R350',
    location: job.location || '',
    address: job.address || '',
    phone: job.phone || '',
    // Convert UTC from server to local time string for the input
    slotStart: job.slotStart ? moment.utc(job.slotStart).local().format('YYYY-MM-DDTHH:mm') : '',
    slotTime: job.slotTime || '1hr',
    employeeId: job.employee?.id || '',
    to_do: job.to_do || '',
    issue: job.issue || '',
    notify: false // Reset notify checkbox
  });
  showJobModal.value = true;
}

const closeJobModal = () => {
  showJobModal.value = false
  // Delay resetting form slightly for animation
  setTimeout(() => {
    editingJob.value = null
    resetJobForm()
  }, 300);
}

const resetJobForm = () => {
  Object.assign(jobForm, {
    id: '', customerId: '', name: '', jobStatus: '', callout: 'R350',
    location: '', address: '', phone: '', slotStart: '', slotTime: '1hr',
    employeeId: '', to_do: '', issue: '', notify: false
  })
  selectedCustomerIdInModal.value = ''; // Clear selected customer in modal
}

const submitJob = async () => {
  // Keep existing submit logic, ensure it uses jobForm
  try {
    loading.value = true; // Maybe use a different loading state for modal actions
    const jobData = {
      ...jobForm,
      websiteId: currentWebsite.value,
      // Ensure slotStart is formatted correctly if needed by backend
      slotStart: jobForm.slotStart ? moment(jobForm.slotStart).toISOString() : null
    };

    // Remove id if it's a new job
    if (!editingJob.value) {
      delete jobData.id;
    }

    // Always use POST to /add-job; backend handles create vs update based on body.id
    const url = `add-job?id=${currentWebsite.value}`;
    const payload = jobData; // Send the raw job data

    const response = await axios.post(url, payload); // Always use POST

    toast.success(editingJob.value ? 'Job updated successfully' : 'Job added successfully');
    closeJobModal();
    fetchJobs(); // Refresh list
  } catch (error) {
    console.error('Error submitting job:', error);
    toast.error(`Error submitting job: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false; // Reset loading state
  }
}

const notifyTechnician = async (job) => {
  // Keep existing notify logic
   try {
     loading.value = true // Maybe a specific notification loading state?
     // Construct payload as needed by 'send-job-to-technician' endpoint
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
       // Parse UTC, convert to local, format as ISO string with local offset
       slotStart: job.slotStart ? moment.utc(job.slotStart).local().format() : null,
       slotEnd: job.slotEnd ? moment.utc(job.slotEnd).local().format() : null, // Apply same logic to slotEnd if needed
       slotTime: job.slotTime,
       jobStatus: job.jobStatus,
       parts: job.parts,
       to_do: job.to_do,
       techAmount: job.techAmount,
       companyAmount: job.companyAmount,
       estimate: job.estimate,
       invoice: job.invoice,
       employee: job.employee ? { // Check if employee exists
         id: job.employee.id,
         firstName: job.employee.firstName,
         lastName: job.employee.lastName,
         phone: job.employee.phone
       } : null, // Send null if no employee assigned
       customer: job.customer ? { // Check if customer exists
         id: job.customer.id,
         name: job.customer.name,
         foreignID: job.customer.foreignID,
         portal: job.customer.portal,
         address: job.customer.address,
         phone: job.customer.phone
       } : null, // Send null if no customer linked
       website: { // Construct website info based on current context
         id: currentWebsite.value,
         url: websites.value.find(w => w.value === currentWebsite.value)?.label,
         userId: userStore.user?.id, // Use optional chaining
         // settingId, createdAt, updatedAt might not be available directly on job.website
       },
       createdAt: job.createdAt,
       updatedAt: job.updatedAt,
       // Include other potential fields, ensuring defaults if they might be null/undefined
       fuelExpense: job.fuelExpense || "0",
       partsExpense: job.partsExpense || "0",
       calloutFee: job.calloutFee || "0", // Assuming this is different from 'callout'
       expenses: job.expenses || []
     };
     await axios.post('send-job-to-technician', { job: jobData }) // Ensure endpoint and payload match backend
     toast.success('Technician notified successfully')
   } catch (error) {
     console.error('Error notifying technician:', error)
     toast.error(`Error notifying technician: ${error.response?.data?.message || error.message}`)
   } finally {
     loading.value = false
   }
}

const formatDate = (date) => {
  if (!date) return 'N/A';
  // Reverted: Keep original UTC parsing for table display
  // Parse the incoming date (assumed UTC) and convert to local time
  const localJobDate = moment.utc(date).local();
  // Get local 'now' for comparison
  const now = moment(); // moment() without args gives local time

  // Compare localJobDate with local 'now'
  if (localJobDate.isSame(now, 'day')) {
    return localJobDate.format('h:mm A'); // Format local time
  } else if (localJobDate.isSame(now.clone().add(1, 'day'), 'day')) {
    return `Tomorrow, ${localJobDate.format('h:mm A')}`; // Format local time
  } else if (localJobDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return `Yesterday, ${localJobDate.format('h:mm A')}`; // Format local time
  } else {
    // Check if it's current year (using local time)
    if (localJobDate.isSame(now, 'year')) {
      return localJobDate.format('MMM DD, h:mm A'); // Format local time
    } else {
      return localJobDate.format('MMM DD YYYY, h:mm A'); // Format local time
    }
  }
};

const formatDateForInput = (date) => {
  return date ? moment(date).format('YYYY-MM-DD') : ''
}

const formatDateTimeForInput = (dateTime) => {
  // Use local time for datetime-local input
  return dateTime ? moment(dateTime).format('YYYY-MM-DDTHH:mm') : ''
}

const updateDateFilter = (event) => {
  // Parse date as local time since type="date" uses local
  filters.date = event.target.value ? moment(event.target.value).toDate() : null
}

const updateSlotStartFilter = (event) => {
   // Parse datetime-local as local time
  filters.slotStart = event.target.value ? moment(event.target.value).toDate() : null;
}

// *** NEW Status Class Function ***
const getModernStatusClass = (status) => { // Renamed from getStatusClass to match usage
  const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full '
  switch (status?.toLowerCase()) { // Added optional chaining and toLowerCase for safety
    // Initial stages
    case 'pending': return baseClasses + 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    case 'quoting': return baseClasses + 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200'
    case 'quoted': return baseClasses + 'bg-blue-800 text-white dark:bg-blue-800 dark:text-blue-100'
    case 'accepted': return baseClasses + 'bg-indigo-300 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100'

    // Scheduling and progress
    case 'scheduled': return baseClasses + 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-200'
    case 'in progress': return baseClasses + 'bg-yellow-300 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100'
    case 'follow-up': return baseClasses + 'bg-orange-300 text-orange-800 dark:bg-orange-600 dark:text-orange-100'

    // Completion stages
    case 'completed': return baseClasses + 'bg-green-300 text-green-800 dark:bg-green-600 dark:text-green-100'
    case 'done': return baseClasses + 'bg-green-400 text-green-800 dark:bg-green-500 dark:text-green-100'
    case 'invoiced': return baseClasses + 'bg-green-900 text-white dark:bg-green-900 dark:text-green-100'
    case 'paid': return baseClasses + 'bg-green-500 text-white dark:bg-green-700 dark:text-green-100'

    // Parts-related statuses
    case 'no parts': return baseClasses + 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200'
    case 'to order parts': return baseClasses + 'bg-yellow-300 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100'
    case 'parts ordered': return baseClasses + 'bg-yellow-400 text-yellow-800 dark:bg-yellow-500 dark:text-yellow-100'
    case 'parts arrived': return baseClasses + 'bg-yellow-600 text-white dark:bg-yellow-800 dark:text-yellow-100'
    case 'parts installed': return baseClasses + 'bg-green-300 text-green-800 dark:bg-green-600 dark:text-green-100'
    case 'parts paid': return baseClasses + 'bg-green-400 text-green-800 dark:bg-green-500 dark:text-green-100'

    // Negative parts statuses
    case 'parts not paid': return baseClasses + 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200'
    case 'parts not installed': return baseClasses + 'bg-red-300 text-red-800 dark:bg-red-600 dark:text-red-100'
    case 'parts not ordered': return baseClasses + 'bg-red-400 text-white dark:bg-red-500 dark:text-red-100'
    case 'parts not available': return baseClasses + 'bg-red-500 text-white dark:bg-red-600 dark:text-red-100'
    case 'parts not needed': return baseClasses + 'bg-orange-400 text-white dark:bg-orange-500 dark:text-orange-100'
    case 'parts not found': return baseClasses + 'bg-red-600 text-white dark:bg-red-700 dark:text-red-100'

    // Waiting statuses
    case 'waiting for price': return baseClasses + 'bg-cyan-300 text-cyan-800 dark:bg-cyan-600 dark:text-cyan-100'
    case 'waiting for parts': return baseClasses + 'bg-amber-300 text-amber-800 dark:bg-amber-600 dark:text-amber-100'
    case 'waiting for customer': return baseClasses + 'bg-indigo-300 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100'
    case 'waiting for payment': return baseClasses + 'bg-violet-300 text-violet-800 dark:bg-violet-600 dark:text-violet-100'

    // Cancelled
    case 'cancelled': return baseClasses + 'bg-red-300 text-red-800 dark:bg-red-600 dark:text-red-100'

    // Default
    default: return baseClasses + 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
}

const toggleIssue = (job) => {
  // Find the job in the main jobs array to ensure reactivity
  const jobRef = jobs.value.find(j => j.id === job.id);
  if (jobRef) {
    jobRef.showFullIssue = !jobRef.showFullIssue;
  }
}
// Chart.register(annotationPlugin); // Moved inside createCharts
const createCharts = () => {
  if (!jobBookingTrendChart.value) return; // Ensure canvas element exists
  Chart.register(annotationPlugin); // Register plugin here, just before use

  // Destroy previous chart instance if it exists
  // Destroy previous chart instance if it exists
  const existingChart = Chart.getChart(jobBookingTrendChart.value);
  if (existingChart) {
    existingChart.destroy();
  }

  // Keep chart creation logic, maybe update colors/fonts
  const ctx = jobBookingTrendChart.value.getContext('2d');
  // ... (rest of chart creation logic - adjust colors/fonts if needed) ...
  const currentYearData = processBookingData(jobs.value, 0);
  const lastYearData = processBookingData(jobs.value, 1); // Maybe remove last year?
  const movingAverageData = calculateMovingAverage(currentYearData.data, 30);

  const startDate = moment().subtract(1, 'year').startOf('year'); // Keep for data processing range if needed, but not for labels
  const endDate = moment().endOf('month');
  // Use month names for labels
  const monthLabels = moment.monthsShort(); // ['Jan', 'Feb', ..., 'Dec']

  new Chart(jobBookingTrendChart.value, {
    type: 'line',
    data: {
      labels: monthLabels, // Use month names for the x-axis labels
      datasets: [
        {
          label: 'Monthly Bookings', // Simplified label
          data: currentYearData.data,
          borderColor: 'rgb(79, 70, 229)', // Indigo
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(79, 70, 229)',
        },
        { // Added Last Year comparison
          label: 'Last Year Bookings',
          data: lastYearData.data,
          borderColor: 'rgb(156, 163, 175)', // Gray
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          fill: true,
          tension: 0.4,
          pointStyle: 'dash', // Differentiate points
          pointBackgroundColor: 'rgb(156, 163, 175)',
        },
        // { // Optional: Moving Average
        //   label: '30-Day Moving Average',
        //   data: movingAverageData,
        //   borderColor: 'rgb(34, 197, 94)', // Green
        //   borderDash: [5, 5],
        //   fill: false,
        //   tension: 0.4,
        //   pointRadius: 0,
        // }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow height constraint to work
      scales: {
        x: {
          type: 'category', // Change axis type to category for months
          // Remove time, min, max settings
          grid: { display: false }, // Cleaner look
          ticks: { color: isDarkMode.value ? '#9ca3af' : '#6b7280', maxRotation: 0, autoSkip: false }, // Use isDarkMode from store
        },
        y: {
          beginAtZero: true,
          grid: { color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }, // Use isDarkMode from store
          ticks: { color: isDarkMode.value ? '#9ca3af' : '#6b7280', precision: 0, stepSize: 5 }, // Use isDarkMode from store
        }
      },
      plugins: {
        legend: { display: false }, // Simpler, maybe add label in title
        tooltip: {
          mode: 'index', intersect: false,
          backgroundColor: isDarkMode.value ? '#1f2937' : '#ffffff', // Use isDarkMode from store
          titleColor: isDarkMode.value ? '#f3f4f6' : '#111827', // Use isDarkMode from store
          bodyColor: isDarkMode.value ? '#d1d5db' : '#374151', // Use isDarkMode from store
          borderColor: isDarkMode.value ? '#374151' : '#e5e7eb', // Use isDarkMode from store
          borderWidth: 1,
          padding: 10,
          callbacks: {
            // Use the label (month name) directly for the title on category axis
            title: (tooltipItems) => tooltipItems[0].label
          }
        }
      },
      interaction: { intersect: false, mode: 'index' },
    }
  });
};

const calculateMovingAverage = (data, windowSize) => {
  // Keep this function
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else {
      const windowSlice = data.slice(Math.max(0, i - windowSize + 1), i + 1);
      const validNumbers = windowSlice.filter(num => num !== null);
      if (validNumbers.length === 0) {
        result.push(null);
      } else {
        const windowSum = validNumbers.reduce((sum, num) => sum + num, 0);
        result.push(windowSum / validNumbers.length);
      }
    }
  }
  return result;
};

const processBookingData = (jobs, yearOffset = 0) => {
  const targetYear = moment().subtract(yearOffset, 'years').year();
  const monthlyCounts = Array(12).fill(0); // Initialize array for 12 months with 0 counts

  jobs
    .filter(job => moment(job.createdAt).year() === targetYear) // Filter by target year
    .forEach(job => {
      const monthIndex = moment(job.createdAt).month(); // Get month index (0-11)
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyCounts[monthIndex]++; // Increment count for that month
      }
    });

  // For the current year, set future months' data to null to avoid plotting zeros
  if (yearOffset === 0) {
      const currentMonthIndex = moment().month();
      for (let i = currentMonthIndex + 1; i < 12; i++) {
          monthlyCounts[i] = null;
      }
  }

  return { data: monthlyCounts }; // Return the array of 12 monthly counts
}


const reloadJobs = async () => {
  try {
    loading.value = true;
    await fetchJobs();
    // Ensure chart is created/updated after data is fetched
    if (jobs.value.length > 0) {
       createCharts();
    }
    toast.success('Jobs reloaded successfully');
  } catch (error) {
    console.error('Error reloading jobs:', error);
    toast.error('Error reloading jobs');
  } finally {
    loading.value = false;
  }
}

// Keep onMounted and watchEffect, ensure createCharts is called safely
onMounted(() => {
  // Apply dark mode class on initial load

  if (currentWebsite.value) {
    fetchJobs().then(() => {
      if (jobs.value.length > 0) createCharts()
    })
    fetchCustomers()
    fetchTechnicians()
  }
})

watchEffect(() => {
  if (currentWebsite.value) {
    // Reset pagination when website changes
    currentPage.value = 1;
    fetchJobs().then(() => {
      if (jobs.value.length > 0) createCharts()
    })
    fetchCustomers()
    fetchTechnicians()
  }
})

// Watch for customer selection in modal to autofill form
watch(selectedCustomerIdInModal, (newCustomerId) => {
  if (newCustomerId && !editingJob.value) { // Only autofill if adding new job and a customer is selected
    const customer = allCustomers.value.find(c => c.id === newCustomerId);
    if (customer) {
      jobForm.name = customer.name || '';
      jobForm.phone = customer.phone || '';
      jobForm.address = customer.address || '';
      // Autofill location and issue as well
      jobForm.location = customer.location || ''; // Assuming customer object has location
      jobForm.issue = customer.message || ''; // Assuming customer object has message for issue
    }
  } else if (!newCustomerId && !editingJob.value) {
    // Optional: Clear fields if "-- Select --" is chosen again while adding
    // jobForm.name = '';
    // jobForm.phone = '';
    // jobForm.address = '';
  }
});

</script>

<style scoped>
/* Import base styles or define fonts in tailwind.config.js */
/* @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); */
/* body { font-family: 'Inter', sans-serif; } */

/* Minimalist Input Styles */
.input-modern {
  /* Removed px-3, will apply specific padding per input type */
  @apply block w-full py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
/* Add text-indent for inputs with left icons */
.input-icon-left {
  text-indent: 1.75rem; /* Adjust as needed (28px) */
}
.input-modern--select {
  @apply pr-8 appearance-none; /* Remove default arrow */
}
.label-modern {
  @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}

/* Modern Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out;
}
.btn-secondary-modern {
  @apply inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out;
}
.btn-ghost-modern {
  @apply inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 rounded;
  @apply hover:bg-indigo-100 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out;
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out;
}
.btn-pagination-modern {
  @apply inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-150 ease-in-out;
}

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 p-4;
}

/* Table Styles */
.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.td-modern {
  @apply px-4 py-3 text-sm; /* Adjust padding as needed */
}

/* Status Badge Styles */
.status-badge-modern {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap;
}
.status-badge--positive { @apply bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300; }
.status-badge--active { @apply bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300; }
.status-badge--attention { @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300; }
.status-badge--negative { @apply bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300; }
.status-badge--default { @apply bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300; }


/* Modal Styles */
.modal-content-modern {
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:w-full p-6 sm:p-8;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content-modern,
.modal-fade-leave-active .modal-content-modern {
  transition: all 0.3s ease;
}
.modal-fade-enter-from .modal-content-modern,
.modal-fade-leave-to .modal-content-modern {
  /* Optional: Add scale or translate effect */
   transform: translateY(20px) scale(0.98);
   opacity: 0;
}

/* Custom scrollbar styles (optional) */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }

/* Ensure date/time inputs are stylable */
input[type="date"],
input[type="datetime-local"] {
  @apply appearance-none;
}
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  @apply filter dark:invert opacity-50 cursor-pointer;
}
</style>