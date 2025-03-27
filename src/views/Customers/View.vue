<script setup>
import axios from "axios";
import { uuid } from 'vue-uuid';
import { onMounted, ref, computed, watchEffect, nextTick } from "vue"; // Added nextTick
import { useToast } from 'vue-toast-notification';
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/UserStore"
import { tooltips, noteModal, whatsappModal } from '../../helpers';
import JobVue from '@/components/jobs/Job.vue' // Keep for related items
import TipTapEditor from '@/components/editor/TipTapEditor.vue';
import ItemVue from '@/components/line-items/item.vue' // Keep for related items
import EstimateVue from '@/components/estimates/Estimate.vue' // Keep for related items
import InsuranceVue from '@/components/insurance/Insurance.vue' // Keep for related items
import InvoiceVue from '@/components/invoices/Invoice.vue' // Keep for related items
import PaymentVue from '@/components/payments/Payment.vue' // Keep for related items
import ExpenseVue from '@/components/expenses/Expense.vue' // Keep for related items
// Accordions might be used for related items in the new design
import accordionPayment from '@/components/payments/PaymentAccordion.vue'
import accordionJob from '@/components/jobs/accordion.vue'
import accordionCustomer from '@/components/customers/accordion.vue'
import accordionView from '@/components/analytics/accordionView.vue'
import accordionClick from '@/components/analytics/accordionClick.vue'
import accordionForm from '@/components/analytics/accordionForm.vue'
import accordionLineitem from '@/components/line-items/accordion.vue'
import accordion from '@/components/whatsapp/accordion.vue'
import accordionEmail from '@/components/email/accordion.vue'
import accordionNotes from '@/components/notes/accordion.vue'
import accordionInvoice from '@/components/invoices/accordion.vue'
import accordionEstimate from '@/components/estimates/accordion.vue'
import accordionInsurance from '@/components/insurance/accordion.vue'
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { TabGroup, TabList, Tab, TabPanels, TabPanel, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue' // Added Disclosure
// Removed CustomerCard, CustomerInfoForm, CustomerActivityTabs imports as they will be integrated directly or refactored
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, faMoneyBillWave, faShieldAlt, faListOl, faSync // Added icons
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons' // Added WhatsApp brand icon

library.add(
  faArrowLeft, faEdit, faStickyNote, faPaperPlane, faPlus, faChevronDown, faChevronUp, faExternalLinkAlt, faPhone, faEnvelope, faMapMarkerAlt, faUser, faBuilding, faLink, faInfoCircle, faBriefcase, faFileInvoiceDollar, faReceipt, faMoneyBillWave, faShieldAlt, faListOl, faWhatsapp, faSync
)

// --- State ---
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Add dark mode state
const isFetchingCustomer = ref(false);
const isUpdatingCustomer = ref(false);
const isBookingJob = ref(false); // Keep AI booking state if needed
const isEditingInfo = ref(false); // State to toggle edit mode for customer info

const lineItems = ref([])
const notes = ref('') // Model for note modal
const whatsapp = ref('') // Model for whatsapp modal
const customer = ref({
  id: '', name: '', phone: '', email: '', channel: '', address: '', message: '', hubspotLink: '', foreignID: '', portal: '', jobs: [], estimate: [], invoice: [], employeeId: '', createdAt: '', updatedAt: '', activities: [], payments: [], expenses: [], insurance: []
})
const editableCustomer = ref({}); // For editing form

const toast = useToast()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const wkey = ref(0) // Keep for potential accordion re-renders
const nkey = ref(0) // Keep for potential accordion re-renders
const noteModalInstance = ref(null);
const whatsappModalInstance = ref(null);

// --- Computed ---
const isLoading = computed(() => isFetchingCustomer.value || isUpdatingCustomer.value || isBookingJob.value);

const relatedItems = computed(() => {
  // Add safety checks for customer.value and its properties
  const jobs = customer.value?.jobs || [];
  const estimates = customer.value?.estimate || [];
  const invoices = customer.value?.invoice || [];
  const payments = customer.value?.payments || [];
  const expenses = customer.value?.expenses || [];
  const insurance = customer.value?.insurance || [];
  const currentLineItems = lineItems.value || []; // Assuming lineItems is already handled

  return [
    { name: 'Jobs', icon: faBriefcase, data: jobs, component: JobVue, addRoute: 'add-job', queryKey: 'contact_id', itemKey: 'job' },
    { name: 'Estimates', icon: faFileInvoiceDollar, data: estimates, component: EstimateVue, addRoute: 'add-estimate', queryKey: 'contact_id', itemKey: 'estimate' },
    { name: 'Invoices', icon: faReceipt, data: invoices, component: InvoiceVue, addRoute: 'add-invoice', queryKey: 'contact_id', itemKey: 'invoice' },
    { name: 'Payments', icon: faMoneyBillWave, data: payments, component: PaymentVue, addRoute: 'add-payment', queryKey: 'customer_id', itemKey: 'payment' },
    { name: 'Expenses', icon: faMoneyBillWave, data: expenses, component: ExpenseVue, addRoute: 'add-expense', queryKey: 'customer_id', itemKey: 'expense' },
    { name: 'Insurance', icon: faShieldAlt, data: insurance, component: InsuranceVue, addRoute: 'add-insurance-report', queryKey: 'contact_id', itemKey: 'insurance' },
    { name: 'Line Items', icon: faListOl, data: currentLineItems, component: ItemVue, addRoute: null, itemKey: 'item' }
  ];
});

const activityTabs = computed(() => [
  { name: 'All', component: null, type: 'all' }, // Added type for consistency
  { name: 'Notes', component: accordionNotes, type: 'note' },
  { name: 'Whatsapp', component: accordion, type: 'whatsapp' },
  { name: 'Email', component: accordionEmail, type: 'email' },
  { name: 'Views', component: accordionView, type: 'view' },
  { name: 'Clicks', component: accordionClick, type: 'click' },
  { name: 'Forms', component: accordionForm, type: 'form' },
]);

// --- Methods ---
async function fetchContacts() {
  isFetchingCustomer.value = true;
  try {
    const response = await axios.get(
      `customer?id=${userStore.currentWebsite}&custId=${route.query.customer_id}`
    );
    customer.value = response.data.customer || customer.value; // Ensure fallback

    // Process activities
    if (customer.value?.activities) {
      customer.value.activities.forEach((a) => { a.uid = uuid.v1() });
    }

    // Process line items
    let items = [];
    if (Array.isArray(customer.value?.estimate) && customer.value.estimate?.length && !customer.value.invoice?.length) {
      for (const item of customer.value.estimate) { items = [...items, ...(item.lineItem || [])]; }
    }
    if (Array.isArray(customer.value?.invoice) && customer.value.invoice?.length) {
      for (const item of customer.value.invoice) { items = [...items, ...(item.lineItem || [])]; }
    }
    lineItems.value = items;

    // Ensure related arrays exist
    customer.value.payments = customer.value.payments || [];
    customer.value.expenses = customer.value.expenses || [];
    customer.value.insurance = customer.value.insurance || [];
    customer.value.jobs = customer.value.jobs || [];
    customer.value.estimate = customer.value.estimate || [];
    customer.value.invoice = customer.value.invoice || [];
    customer.value.activities = customer.value.activities || []; // Ensure activities array exists

    // Initialize editable form data
    resetEditableCustomer();

    // Initialize Modals (assuming helpers return instances)
    // Ensure modal helpers are robust against re-initialization or handle it gracefully
    if (whatsappModalInstance.value?.destroy) whatsappModalInstance.value.destroy();
    if (noteModalInstance.value?.destroy) noteModalInstance.value.destroy();
    whatsappModalInstance.value = await whatsappModal(whatsapp, userStore.currentWebsite, customer.value.phone);
    noteModalInstance.value = await noteModal(notes, userStore.currentWebsite, customer.value.id, reloadTimeline);

  } catch (error) {
    console.error("Error fetching customer data:", error);
    toast.error("Error fetching customer data. Please try again.");
  } finally {
    isFetchingCustomer.value = false;
    // Ensure tooltips are initialized/re-initialized after potential DOM updates
    await nextTick(); // Wait for DOM updates
    tooltips();
  }
}

function reloadTimeline() {
  fetchContacts();
  wkey.value += 1;
  nkey.value += 1;
}

function resetEditableCustomer() {
  editableCustomer.value = {
    name: customer.value.name || '',
    phone: customer.value.phone || '',
    email: customer.value.email || '',
    channel: customer.value.channel || '',
    address: customer.value.address || '',
    message: customer.value.message || '', // Assuming 'message' is the field for 'Lead Source / Details'
    portal: customer.value.portal || '',
    foreignID: customer.value.foreignID || ''
  };
}

async function updateCustomer() {
  isUpdatingCustomer.value = true;
  try {
    const backendData = {
      name: editableCustomer.value.name,
      Phone: editableCustomer.value.phone,
      Email: editableCustomer.value.email,
      Reply: editableCustomer.value.channel, // Map channel -> Reply
      address: editableCustomer.value.address,
      Message: editableCustomer.value.message, // Map message -> Message
      portal: editableCustomer.value.portal,
      foreignID: editableCustomer.value.foreignID,
      // Include customer ID for update identification by backend
      vid: customer.value.id // Assuming 'vid' or similar is used by backend
    };

    await axios.post('add-customer?id=' + userStore.currentWebsite, { data: backendData });
    toast.success("Customer updated successfully");
    isEditingInfo.value = false; // Exit edit mode
    reloadTimeline(); // Call reloadTimeline to refresh data consistently
  } catch (error) {
    console.error("Error updating customer:", error);
    toast.error(`Error updating customer: ${error.response?.data?.message || error.message}`);
  } finally {
    isUpdatingCustomer.value = false;
  }
}

async function aiBookJob(customerId) {
  // Keep this function if AI booking is still relevant
  isBookingJob.value = true;
  try {
    await axios.post('ai-booking?id=' + userStore.currentWebsite, { data: customerId });
    toast.success("Customer job booked successfully");
    reloadTimeline();
  } catch (error) {
    console.error("Error booking job via AI:", error);
    toast.error("Error booking job via AI. Please try again.");
  } finally {
    isBookingJob.value = false;
  }
}

function handleNavigateBack() {
  router.back();
}

function handleOpenNoteModal() {
  notes.value = ''; // Clear previous content
  noteModalInstance.value?.show();
}

function handleOpenWhatsappModal() {
  whatsapp.value = ''; // Clear previous content
  whatsappModalInstance.value?.show();
}

function handleEditInfo() {
  resetEditableCustomer(); // Ensure form starts with current data
  isEditingInfo.value = true;
}

function handleCancelEdit() {
  isEditingInfo.value = false;
  resetEditableCustomer(); // Reset any changes made in the form
}

function handleAddRelatedItem(routeName, queryKey) {
    const query = {};
    // Special handling for estimate/invoice to potentially link to the latest job
    if ((routeName === 'add-estimate' || routeName === 'add-invoice') && customer.value?.jobs?.length) {
        query['job_id'] = customer.value.jobs[customer.value.jobs.length - 1]?.id;
    }
    // Always add contact/customer id
    query[queryKey] = customer.value?.id;

    if (routeName) {
        router.push({ name: routeName, query });
    }
}

// --- Lifecycle ---
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  fetchContacts();
  // tooltips(); // Moved to finally block of fetchContacts
});

// Watch dark mode changes
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  // Potentially update chart colors or other theme-dependent elements here if needed
});

</script>

<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <div class="flex items-center space-x-3">
          <button @click="handleNavigateBack" class="btn-icon-modern" title="Go Back">
            <font-awesome-icon icon="arrow-left" />
          </button>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
              {{ customer.name || 'Loading Customer...' }}
              <a v-if="customer.hubspotLink" :href="customer.hubspotLink" target="_blank" class="ml-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400" title="View on HubSpot">
                <font-awesome-icon icon="external-link-alt" class="h-4 w-4" />
              </a>
            </h1>
            <p v-if="customer.createdAt" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Customer since {{ new Date(customer.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
           <button @click="reloadTimeline" class="btn-icon-modern" title="Refresh Data">
             <font-awesome-icon icon="sync" :class="{ 'fa-spin': isFetchingCustomer }" />
           </button>
          <button data-modal-toggle="noteModal" type="button" class="btn-secondary-modern" title="Add Note">
            <font-awesome-icon icon="sticky-note" class="mr-1.5 h-4 w-4" /> Note
          </button>
          <button data-modal-toggle="whatsappModal" type="button" class="btn-secondary-modern" title="Send WhatsApp">
            <font-awesome-icon :icon="['fab', 'whatsapp']" class="mr-1.5 h-4 w-4" /> WhatsApp
          </button>
          <!-- Add Job Button (Example using primary style) -->
           <button @click="handleAddRelatedItem('add-job', 'contact_id')" class="btn-primary-modern" title="Add New Job">
             <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Job
           </button>
        </div>
      </header>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <!-- Left Column: Customer Info & Related Items -->
        <div class="lg:col-span-4 space-y-6 lg:space-y-8">

          <!-- Customer Information Card -->
          <section class="card-modern p-5 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h2>
              <button v-if="!isEditingInfo" @click="handleEditInfo" class="btn-ghost-modern text-xs">
                <font-awesome-icon icon="edit" class="mr-1" /> Edit
              </button>
            </div>

            <!-- Display Mode -->
            <div v-if="!isEditingInfo" class="space-y-3 text-sm">
              <div v-if="customer.phone" class="flex items-center">
                <font-awesome-icon icon="phone" class="w-4 h-4 mr-2.5 text-gray-400" />
                <a :href="'tel:'+customer.phone" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">{{ customer.phone }}</a>
              </div>
              <div v-if="customer.email" class="flex items-center">
                <font-awesome-icon icon="envelope" class="w-4 h-4 mr-2.5 text-gray-400" />
                <a :href="'mailto:'+customer.email" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">{{ customer.email }}</a>
              </div>
              <div v-if="customer.address" class="flex items-start">
                <font-awesome-icon icon="map-marker-alt" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span class="text-gray-700 dark:text-gray-300">{{ customer.address }}</span>
              </div>
              <div v-if="customer.channel" class="flex items-center">
                 <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Channel: {{ customer.channel }}</span>
              </div>
               <div v-if="customer.message" class="flex items-start">
                 <font-awesome-icon icon="info-circle" class="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
                 <span class="text-gray-700 dark:text-gray-300">Details: {{ customer.message }}</span>
               </div>
              <div v-if="customer.portal" class="flex items-center">
                 <font-awesome-icon icon="building" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Portal: {{ customer.portal }}</span>
              </div>
              <div v-if="customer.foreignID" class="flex items-center">
                 <font-awesome-icon icon="link" class="w-4 h-4 mr-2.5 text-gray-400" />
                 <span class="text-gray-700 dark:text-gray-300">Foreign ID: {{ customer.foreignID }}</span>
              </div>
            </div>

            <!-- Edit Mode Form -->
            <form v-else @submit.prevent="updateCustomer" class="space-y-4">
              <div>
                <label for="edit-name" class="label-modern">Name</label>
                <input type="text" id="edit-name" v-model="editableCustomer.name" required class="input-modern" />
              </div>
              <div>
                <label for="edit-phone" class="label-modern">Phone</label>
                <input type="tel" id="edit-phone" v-model="editableCustomer.phone" class="input-modern" />
              </div>
              <div>
                <label for="edit-email" class="label-modern">Email</label>
                <input type="email" id="edit-email" v-model="editableCustomer.email" class="input-modern" />
              </div>
              <div>
                <label for="edit-address" class="label-modern">Address</label>
                <textarea id="edit-address" v-model="editableCustomer.address" rows="2" class="input-modern"></textarea>
              </div>
               <div>
                 <label for="edit-channel" class="label-modern">Channel</label>
                 <input type="text" id="edit-channel" v-model="editableCustomer.channel" class="input-modern" />
               </div>
               <div>
                 <label for="edit-message" class="label-modern">Lead Source / Details</label>
                 <textarea id="edit-message" v-model="editableCustomer.message" rows="2" class="input-modern"></textarea>
               </div>
               <div>
                 <label for="edit-portal" class="label-modern">Portal</label>
                 <input type="text" id="edit-portal" v-model="editableCustomer.portal" class="input-modern" />
               </div>
               <div>
                 <label for="edit-foreignID" class="label-modern">Foreign ID</label>
                 <input type="text" id="edit-foreignID" v-model="editableCustomer.foreignID" class="input-modern" />
               </div>
              <div class="flex justify-end space-x-3 pt-2">
                <button type="button" @click="handleCancelEdit" class="btn-secondary-modern">Cancel</button>
                <button type="submit" class="btn-primary-modern" :disabled="isUpdatingCustomer">
                  {{ isUpdatingCustomer ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </section>

          <!-- Related Items Accordion -->
          <section class="space-y-3">
             <h2 class="text-lg font-semibold text-gray-900 dark:text-white px-1">Related Records</h2>
             <Disclosure v-for="itemGroup in relatedItems" :key="itemGroup.name" v-slot="{ open }">
               <div class="card-modern p-0 overflow-hidden">
                 <DisclosureButton class="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 transition-colors">
                   <div class="flex items-center">
                     <font-awesome-icon :icon="itemGroup.icon" class="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                     <span>{{ itemGroup.name }}</span>
                     <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ itemGroup.data?.length || 0 }})</span>
                   </div>
                   <div class="flex items-center space-x-2">
                      <button v-if="itemGroup.addRoute" @click.stop="handleAddRelatedItem(itemGroup.addRoute, itemGroup.queryKey)" class="btn-ghost-modern p-1 h-6 w-6" :title="'Add ' + itemGroup.name">
                         <font-awesome-icon icon="plus" class="h-3 w-3" />
                      </button>
                      <font-awesome-icon :icon="open ? 'chevron-up' : 'chevron-down'" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                   </div>
                 </DisclosureButton>
                 <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-out"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                     <DisclosurePanel class="px-4 pt-2 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/50 max-h-96 overflow-y-auto bg-gray-900 dark:bg-gray-200">
                     <div v-if="itemGroup.data && itemGroup.data.length > 0" class="space-y-3 mt-3">
                       <!-- Render the specific component for each item -->
                       <component
                         v-for="item in itemGroup.data"
                         :is="itemGroup.component"
                         :[itemGroup.itemKey]="item"
                         :key="item.id || item.uid || JSON.stringify(item)"
                         @reload-timeline="reloadTimeline"
                         class="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 bg-[#ffffff]"
                       />
                     </div>
                     <p v-else class="mt-3 text-center text-gray-500">No {{ itemGroup.name.toLowerCase() }} found.</p>
                   </DisclosurePanel>
                 </transition>
               </div>
             </Disclosure>
          </section>

        </div>

        <!-- Right Column: Activity Timeline / Tabs -->
        <div class="lg:col-span-8">
          <section class="card-modern p-0 overflow-hidden min-h-[60vh] lg:min-h-[75vh] flex flex-col"> 
             <TabGroup>
               <TabList class="flex-shrink-0 flex space-x-1 rounded-t-lg bg-gray-100 dark:bg-gray-900/50 p-1 border-b border-gray-200 dark:border-gray-700/50"> 
                 <Tab
                   v-for="tab in activityTabs"
                   :key="tab.name"
                   v-slot="{ selected }"
                   as="template"
                 >
                   <button
                     :class="[
                       'w-full rounded-md py-2 px-3 text-sm font-medium leading-5',
                       'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 dark:ring-offset-gray-800 ring-white ring-opacity-60',
                       selected
                         ? 'bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300'
                         : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.30] dark:hover:bg-black/[0.15] hover:text-gray-800 dark:hover:text-gray-200',
                       'transition-colors duration-150'
                     ]"
                   >
                     {{ tab.name }}
                   </button>
                 </Tab>
               </TabList>

              <TabPanels class="flex-grow p-6 sm:p-6 overflow-y-auto ml-5 relative min-h-[200px]">
                <!-- Loading Indicator -->
                <div v-if="isFetchingCustomer" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                  <p class="text-gray-500 dark:text-gray-400 mr-2">Loading activities...</p>
                  <scale-loader :loading="true" color="#4f46e5" height="25px" width="4px" />
                </div>

                <!-- Actual Tab Content (rendered only when not fetching) -->
                <template v-else>
                  <TabPanel
                    v-for="(tab, idx) in activityTabs"
                    :key="idx"
                   :class="['focus:outline-none h-full']" 
                 >
                   <!-- Render 'All' Activities (simplified) -->
                   <div v-if="tab.name === 'All'" class="space-y-4 h-full"> 
                      <p v-if="!customer.activities || customer.activities.length === 0" class="text-center text-gray-500 py-8">No activities recorded yet.</p>
                      <template v-else>
                         <!-- Loop through all activities and try to determine type -->
                         <div v-for="activity in customer.activities" :key="activity.uid" class="activity-item">
                            <!-- Basic display - ideally, use specific accordion components -->
                            <component
                              :is="accordionNotes"
                              v-if="activity.type === 'note'"
                              :note="activity"
                              class="mb-3"
                            />
                            <template v-else-if="activity.type === 'whatsapp'">                              
                              <component
                                :is="accordion"
                                :whatsapp="activity"
                                class="mb-3"
                              />
                            </template>
                             <component
                               :is="accordionEmail"
                               v-else-if="activity.type === 'email'"
                               :email="activity"
                               class="mb-3"
                             />
                             <component
                               :is="accordionView"
                               v-else-if="activity.type === 'view'"
                               :view="activity"
                               class="mb-3"
                             />
                             <component
                               :is="accordionClick"
                               v-else-if="activity.type === 'click'"
                               :click="activity"
                               class="mb-3"
                             />
                             <component
                               :is="accordionForm"
                               v-else-if="activity.type === 'form'"
                               :form="activity"
                               class="mb-3"
                             />
                             <!-- Fallback for unknown types -->
                             <!-- <div v-else class="text-xs p-2 border dark:border-gray-700 rounded mb-3">
                                <span class="font-semibold">{{ activity.type || 'Activity' }}</span> - {{ new Date(activity.createdAt).toLocaleString() }}
                                <pre class="text-xs mt-1 whitespace-pre-wrap">{{ activity.content || JSON.stringify(activity) }}</pre>
                             </div> -->
                         </div>
                      </template>
                   </div>
                   <!-- Render Specific Activity Type using Accordions -->
                   <div v-else class="space-y-3 h-full">
                      <p v-if="!customer.activities || customer.activities.filter(a => a.type === tab.type).length === 0" class="text-center text-gray-500 py-8">No {{ tab.name.toLowerCase() }} recorded yet.</p>
                      <template v-else>
                        <template v-for="activity in customer.activities.filter(a => a.type === tab.type)" :key="(tab.name === 'Whatsapp' ? wkey : nkey) + activity.uid">
                           <!-- Add logging here -->
                           <!-- {{ tab.type === 'whatsapp' ? console.log(`WhatsApp Activity (${tab.name} Tab):`, JSON.stringify(activity)) : '' }} -->
                           <component
                             :is="tab.component"
                             :[tab.type]="activity"
                           />
                        </template>
                      </template>
                   </div>
                 </TabPanel>
                </template>
               </TabPanels>
             </TabGroup>
          </section>
        </div>

      </div>

      <!-- Modals (Keep Flowbite structure, ensure triggers use new styles) -->
      <!-- Note Modal -->
      <div id="noteModal" data-modal-placement="center" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative w-full max-w-2xl max-h-full">
          <div class="relative bg-white rounded-lg shadow dark:bg-gray-800 modal-content-modern"> 
            <div class="flex items-center justify-between p-4 sm:p-5 border-b rounded-t dark:border-gray-600">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Add Note</h3>
              <button id="noteModalClose" type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="noteModal">
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                <span class="sr-only">Close modal</span>
              </button>
            </div>
            <div class="p-4 sm:p-5 space-y-4">
              <TipTapEditor v-model="notes" placeholder="Start typing to leave a note..." class="input-modern min-h-[150px]" /> 
            </div>
            <div class="flex items-center p-4 sm:p-5 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
              <button id="noteModalSave" data-modal-hide="noteModal" type="button" class="btn-primary-modern">Save Note</button>
              <button data-modal-hide="noteModal" type="button" class="btn-secondary-modern">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Whatsapp Modal -->
       <div id="whatsappModal" data-modal-placement="center" tabindex="-1" class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
         <div class="relative w-full max-w-2xl max-h-full">
           <div class="relative bg-white rounded-lg shadow dark:bg-gray-800 modal-content-modern"> 
             <div class="flex items-center justify-between p-4 sm:p-5 border-b rounded-t dark:border-gray-600">
               <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Send WhatsApp</h3>
               <button id="whatsappModalClose" type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="whatsappModal">
                 <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                 <span class="sr-only">Close modal</span>
               </button>
             </div>
             <div class="p-4 sm:p-5 space-y-4">
               <TipTapEditor v-model="whatsapp" placeholder="Start typing to send a whatsapp message..." class="input-modern min-h-[150px]" /> 
             </div>
             <div class="flex items-center p-4 sm:p-5 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
               <button id="whatsappModalSave" data-modal-hide="whatsappModal" type="button" class="btn-primary-modern">Send WhatsApp</button>
               <button data-modal-hide="whatsappModal" type="button" class="btn-secondary-modern">Cancel</button>
             </div>
           </div>
         </div>
       </div>

    </div> <!-- End container -->

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
       <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
    </div>
  </div> <!-- End main div -->
</template>

<style>
/* Import modern styles used in Jobs.vue - Assuming these are globally available or defined in a main CSS file */
/* If not global, copy the necessary .input-modern, .btn-*, .card-modern, .label-modern etc. styles here or import them */

/* Minimalist Input Styles (Copied from Jobs.vue for completeness) */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat bg-right;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

.label-modern {
  @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}

/* Modern Button Styles */
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}
.btn-ghost-modern {
  @apply inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 rounded;
  @apply hover:bg-indigo-100 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed; /* Added disabled styles */
}

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm; /* Added backdrop-blur */
}

/* Modal Styles */
.modal-content-modern {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl; /* Simplified base */
}

/* Custom scrollbar styles (optional) */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; } /* Adjusted track */
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

/* TipTap Editor basic styling */
.ProseMirror {
  @apply min-h-[100px] p-2 focus:outline-none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  @apply text-gray-400 dark:text-gray-500 pointer-events-none h-0;
}

/* Activity Item basic styling */
.activity-item {
  /* Add specific styling for different activity types if needed */
}

/* Ensure DisclosurePanel content doesn't overflow card */
.card-modern .overflow-y-auto {
  scrollbar-gutter: stable; /* Prevent layout shift when scrollbar appears */
}

</style>