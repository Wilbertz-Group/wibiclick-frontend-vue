// wibiclick-frontend-vue/src/views/Visitors/View.vue
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useToast } from "vue-toast-notification";
import { useUserStore } from "@/stores/UserStore";
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import EnhancedVisitorAttribution from "@/components/Visitors/View/EnhancedVisitorAttribution.vue";
import AttributionFlowChart from "@/components/Visitors/View/AttributionFlowChart.vue";
import VisitorJourneyTimeline from "@/components/Visitors/View/VisitorJourneyTimeline.vue";
import SessionHistoryList from "@/components/Visitors/View/SessionHistoryList.vue";
import GeographicVisualization from "@/components/Visitors/View/GeographicVisualization.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const userStore = useUserStore();

const visitorId = computed(() => route.params.visitorId || route.query.visitor_id);
const isLoading = ref(false);
const isAssociatingCustomer = ref(false);
const visitor = ref(null);
const allVisitors = ref([]);
const currentIndex = ref(-1);
const selectedCustomer = ref(null);

const customerSearchTerm = ref('');
const customerSearchResults = ref([]);
const isSearchingCustomers = ref(false);

// Rest of your existing functions remain the same...
async function fetchVisitor() {
  if (!visitorId.value) return;
  try {
    const res = await axios.get(`/api/analytics/visitors/${visitorId.value}/history`);
    // Flatten the visitor object so the template works as expected
    if (res.data && res.data.visitor) {
      visitor.value = {
        ...res.data.visitor,
        sessions: res.data.sessions || [],
        clicks: res.data.clicks || [],
        customer: res.data.customer || null,
        communications: res.data.communications || [],
        possibleContactSuggestions: res.data.possibleContactSuggestions || []
      };
    } else {
      visitor.value = null;
    }
  } catch (err) {
    toast.error("Failed to load visitor details.");
  } finally {
    isLoading.value = false;
  }
}

async function fetchAllVisitors() {
  try {
    const res = await axios.get(`/visitors?id=${userStore.currentWebsite}&limit=1500&offset=0`);
    allVisitors.value = res.data.visitors || [];
    currentIndex.value = allVisitors.value.findIndex(v => v.id === visitorId.value);
  } catch (err) {
    allVisitors.value = [];
    currentIndex.value = -1;
  }
}

function goToPrevVisitor() {
  if (currentIndex.value > 0) {
    const prevId = allVisitors.value[currentIndex.value - 1].id;
    router.push({ name: "VisitorView", params: { visitorId: prevId } });
  }
}
function goToNextVisitor() {
  if (currentIndex.value < allVisitors.value.length - 1) {
    const nextId = allVisitors.value[currentIndex.value + 1].id;
    router.push({ name: "VisitorView", params: { visitorId: nextId } });
  }
}

// Reload all visitor information
async function reloadVisitorData() {
  isLoading.value = true;
  try {
    await fetchAllVisitors();
    await fetchVisitor();
  } finally {
    isLoading.value = false;
  }
}
// navigate in a new tab to the customer page with url like /contact?customer_id={customerId}
function goToCustomer() {
  if (visitor.value.customer && visitor.value.customer.id) {
    const customerId = visitor.value.customer.id;
    window.open(`/contact?customer_id=${customerId}`, "_blank");
  }
}

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchAllVisitors();
    await fetchVisitor();
  } finally {
    isLoading.value = false;
  }
});
function dateFormatter(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const now = new Date();
  // Check if today
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) {
    // Show only time
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }
  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    const formattedTime = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `Yesterday at ${formattedTime}`;
  }
  // Otherwise, show full date and time
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// Returns e.g. "2 hours ago", "just now", "3 days ago"
function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return "just now";
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 }
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return count + " " + interval.label + (count > 1 ? "s" : "") + " ago";
    }
  }
  return "";
}
async function associateContact(contactToAssociate) {
  if (!contactToAssociate || !contactToAssociate.id) {
    console.error("Invalid contact provided for association");
    return;
  }

  isAssociatingCustomer.value = true;

  try {
    const url = `/api/analytics/visitors/${visitorId.value}/associate`;
    const body = { customerId: contactToAssociate.id };
    const response = await axios.post(url, body);
    console.log('Association successful:', response.data); // Or show a success toast
    // toast.success('Association successful!');
    await fetchVisitor();
  } catch (error) {
    console.error('Association failed:', error); // Or show an error toast
    // toast.error('Association failed.');
  } finally {
    isAssociatingCustomer.value = false;
  }
}

async function searchCustomers() {
  if (customerSearchTerm.value.trim() === '') {
    customerSearchResults.value = [];
    return;
  }
  isSearchingCustomers.value = true;
  try {
    const response = await axios.get(`/api/customers/search?q=${customerSearchTerm.value}`);
    customerSearchResults.value = response.data;
  } catch (error) {
    console.error('Customer search failed:', error);
    customerSearchResults.value = [];
  } finally {
    isSearchingCustomers.value = false;
  }
}

let searchTimeout = null;
watch(customerSearchTerm, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchCustomers();
  }, 300);
});

function handleCustomerSelected(customer) {
  selectedCustomer.value = customer;
  customerSearchTerm.value = '';
  customerSearchResults.value = [];
}

async function associateVisitorWithCustomer() {
  if (!selectedCustomer.value || !selectedCustomer.value.id) {
    console.error("No customer selected for association");
    return;
  }

  isAssociatingCustomer.value = true;

  try {
    await axios.post(`/api/analytics/visitors/${visitorId.value}/associate`, { customerId: selectedCustomer.value.id });
    fetchVisitor();
    toast.success('Customer associated successfully!');
    selectedCustomer.value = null;
  } catch (error) {
    console.error('Association failed:', error);
    toast.error('Association failed.');
  } finally {
    isAssociatingCustomer.value = false;
  }
}

async function disassociateCustomer() {
  if (!confirm('Are you sure you want to disassociate this customer?')) {
    return;
  }

  isAssociatingCustomer.value = true;

  try {
    const url = `/api/analytics/visitors/${visitorId.value}/associate`;
    await axios.delete(url);
    console.log('Disassociation successful'); // Or show a success toast
    // toast.success('Disassociation successful!');
    await fetchVisitor();
  } catch (error) {
    console.error('Disassociation failed:', error); // Or show an error toast
    // toast.error('Disassociation failed.');
  } finally {
    isAssociatingCustomer.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <header class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-3">
          <button @click="router.back()" class="btn-icon-modern" title="Go Back">
            ←
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Visitor Details
          </h1>
        </div>
        <div class="flex items-center space-x-2">
          <button @click="goToPrevVisitor" :disabled="currentIndex <= 0" class="btn-secondary-modern">Prev</button>
          <button @click="goToNextVisitor" :disabled="currentIndex >= allVisitors.length - 1" class="btn-secondary-modern">Next</button>
          <button
            @click="reloadVisitorData"
            :disabled="isLoading"
            class="btn-icon-modern"
            title="Refresh Data"
            aria-label="Refresh visitor data"
          >
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': isLoading }" />
          </button>
        </div>
      </header>
      
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <ScaleLoader :loading="true" color="#4f46e5" height="40px" width="5px" />
      </div>
      
      <div v-else-if="visitor" class="space-y-8">
        <!-- Enhanced Visitor Attribution with Tabs -->
        <div class="w-full">
          <EnhancedVisitorAttribution :visitor-id="visitorId" />
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <!-- Left Column -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Customer Association Section -->
            <section class="card-modern p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ visitor.customer ? 'Update Associated Customer' : 'Associate with Customer' }}
              </h2>
              <div class="mb-3">
                <label class="label-modern" for="customer-search">Search Customer</label>
                <input
                  id="customer-search"
                  v-model="customerSearchTerm"
                  class="input-modern"
                  placeholder="Type name, email, or phone..."
                  autocomplete="off"
                  :disabled="isAssociatingCustomer"
                />
                <div v-if="isSearchingCustomers" class="text-xs text-gray-500 mt-1">Searching...</div>
                <ul v-if="Array.isArray(customerSearchResults) && customerSearchResults.length > 0" class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded mt-1 max-h-48 overflow-y-auto shadow z-10">
                  <li
                    v-for="customer in customerSearchResults"
                    :key="customer.id"
                    @click="handleCustomerSelected(customer)"
                    class="px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800"
                  >
                    <span class="font-medium">{{ customer.name }}</span>
                    <span v-if="customer.email" class="ml-2 text-xs text-gray-500">{{ customer.email }}</span>
                    <span v-if="customer.phone" class="ml-2 text-xs text-gray-400">{{ customer.phone }}</span>
                    <span v-if="customer.address" class="ml-2 text-xs text-gray-400 italic">{{ customer.address }}</span>
                  </li>
                </ul>
                <div v-if="customerSearchTerm && !isSearchingCustomers && customerSearchResults.length === 0" class="text-xs text-gray-400 mt-1">
                  No customers found.
                </div>
              </div>
              <div v-if="selectedCustomer" class="mb-3 p-2 rounded bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 flex items-center justify-between">
                <div>
                  <span class="font-semibold">{{ selectedCustomer.name }}</span>
                  <span v-if="selectedCustomer.email" class="ml-2 text-xs text-gray-500">{{ selectedCustomer.email }}</span>
                  <span v-if="selectedCustomer.phone" class="ml-2 text-xs text-gray-400">{{ selectedCustomer.phone }}</span>
                </div>
                <button class="btn-ghost-modern ml-2" @click="selectedCustomer = null" :disabled="isAssociatingCustomer">Clear</button>
              </div>
              <button
                class="btn-primary-modern"
                :disabled="!selectedCustomer || isAssociatingCustomer"
                @click="associateVisitorWithCustomer"
              >
                {{ visitor.customer ? 'Update Association' : 'Associate Customer' }}
              </button>
            </section>

            <!-- Customer Details -->
            <section v-if="visitor.customer" class="card-modern p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Associated Customer</h2>
                <button @click="goToCustomer" class="btn-primary-modern text-xs">View Customer <font-awesome-icon icon="external-link-alt" class="ml-1 text-xs" /></button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Customer Name:</p>
                  <p class="flex items-center">
                    <span>{{ visitor.customer.name || '-' }}</span>
                    <button
                      @click="disassociateCustomer"
                      :disabled="isAssociatingCustomer"
                      class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded ml-3"
                    >
                      Disassociate
                    </button>
                  </p>
                </div>
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Email:</p>
                  <p>{{ visitor.customer.email || '-' }}</p>
                </div>
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Phone:</p>
                  <p>{{ visitor.customer.phone || '-' }}</p>
                </div>
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Address:</p>
                  <p>{{ visitor.customer.address || '-' }}</p>
                </div>
                <div>
                  <p class="font-medium text-gray-600 dark:text-gray-400">Customer Since:</p>
                  <p>{{ dateFormatter(visitor.customer.createdAt) }}</p>
                </div>
              </div>
            </section>

            <!-- Geographic Visualization -->
            <GeographicVisualization :website-id="userStore.currentWebsite" />
          </div>

          <!-- Right Column -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Attribution Flow Chart -->
            <AttributionFlowChart v-if="visitor.sourceAttribution" :attribution="visitor.sourceAttribution" />

            <!-- Visitor Journey Timeline -->
            <VisitorJourneyTimeline :visitor-id="visitorId" />

            <!-- Session History -->
            <SessionHistoryList :sessions="visitor.sessions" />

            <!-- Clicks Section -->
            <section v-if="Array.isArray(visitor.clicks) && visitor.clicks.length > 0" class="card-modern p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clicks</h2>
              <div class="space-y-2">
                <div v-for="click in visitor.clicks" :key="click.id" class="border-l-2 border-blue-300 dark:border-blue-700 pl-4">
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Date:</span> {{ dateFormatter(click.clicksDate) }}
                    <span v-if="click.button"> | <span class="font-medium">Button:</span> {{ click.button }}</span>
                    <span v-if="click.page?.url"> | <span class="font-medium">Page:</span>
                      <a :href="click.page.url" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ click.page.url }}</a>
                    </span>
                  </p>
                </div>
              </div>
              <div v-if="visitor.clicks.length === 0" class="text-xs text-gray-500 mt-2">No clicks found.</div>
            </section>

            <!-- Communications Section -->
            <section v-if="Array.isArray(visitor.communications) && visitor.communications.length > 0" class="card-modern p-6">
              <h2 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Recent Communications</h2>
              <div class="space-y-2">
                <div v-for="comm in visitor.communications" :key="comm.id" class="border-l-2 border-purple-300 dark:border-purple-700 pl-4">
                  <p v-if="comm.summary" class="text-xs text-gray-600 dark:text-gray-400">
                    <span class="font-medium">{{ comm.displayDate }}:</span>
                    <span> {{ comm.summary }}</span>
                  </p>
                </div>
              </div>
              <div v-if="visitor.communications.length === 0" class="text-xs text-gray-500 mt-2">No communications found.</div>
            </section>
          </div>
        </div>

        <!-- Possible Contacts to Merge Section -->
        <section v-if="visitor.possibleContactSuggestions && visitor.possibleContactSuggestions.length > 0" class="card-modern p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Possible Contacts to Merge</h2>
          <div class="space-y-4">
            <div v-for="(suggestion, idx) in visitor.possibleContactSuggestions" :key="suggestion.candidate.id + '-' + idx" class="border-l-4 border-yellow-400 dark:border-yellow-600 pl-4 pb-2">
              <div class="mb-2">
                <span class="font-medium text-gray-700 dark:text-gray-200">Contact:</span>
                <a :href="'/contact?customer_id=' + suggestion.candidate.id" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline">
                  <span class="ml-1">{{ suggestion.candidate.name || 'No Name' }}</span>
                </a>
                <span v-if="suggestion.candidate.phone" class="ml-2 text-xs text-gray-500">({{ suggestion.candidate.phone }})</span>
                <span v-if="suggestion.candidate.email" class="ml-2 text-xs text-gray-500">({{ suggestion.candidate.email }})</span>
                <span class="ml-2 text-xs text-gray-400">Created: {{ dateFormatter(suggestion.candidate.createdAt) }}</span>
              </div>
              <div class="mb-2">
                <span class="font-medium text-gray-700 dark:text-gray-200">Matched WhatsApp Click:</span>
                <span class="ml-1">{{ suggestion.click.button || 'WhatsApp' }}</span>
                <span v-if="suggestion.click.pageUrl" class="ml-2 text-xs text-gray-500">on <a :href="suggestion.click.pageUrl" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ suggestion.click.pageUrl }}</a></span>
                <span class="ml-2 text-xs text-gray-400">at {{ dateFormatter(suggestion.click.clicksDate) }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-200">First 3 WhatsApp Messages:</span>
                <ul class="list-disc ml-6 mt-1">
                  <li v-for="msg in suggestion.messages" :key="msg.id" class="text-xs text-gray-600 dark:text-gray-400">
                    <span v-if="msg.fromMe" class="font-semibold text-green-600 dark:text-green-400">From Us:</span>
                    <span v-else class="font-semibold text-blue-600 dark:text-blue-400">From Customer:</span>
                    <span class="ml-1">{{ msg.text }}</span>
                    <span class="ml-2 text-gray-400">({{ dateFormatter(msg.createdAt) }})</span>
                  </li>
                  <li v-if="!suggestion.messages || suggestion.messages.length === 0" class="text-xs text-gray-400">No WhatsApp messages found.</li>
                </ul>
              </div>
              <!-- Placeholder for associate action -->
              <div class="mt-2">
                <button class="btn-primary-modern text-xs" title="Association action not implemented yet" @click="associateContact(suggestion.candidate)" :disabled="isAssociatingCustomer">Associate this Contact</button>
              </div>
            </div>
          </div>
          <div v-if="visitor.possibleContactSuggestions.length === 0" class="text-xs text-gray-500 mt-2">No possible contacts found to merge.</div>
        </section>
      </div>

      <div v-else class="text-center py-20 text-gray-500">
        Visitor not found.
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-icon-modern {
  @apply inline-flex items-center justify-center p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-ghost-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.card-modern {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  @apply transition-all duration-150 ease-in-out;
}

.input-modern {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100;
  @apply shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
}

.label-modern {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}
</style>